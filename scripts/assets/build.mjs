// 使い方: npm run assets:build（assets:fetch を先に実行する）
// assets-src/quaternius/ の元データ → public/assets/ のゲーム用 glb へ変換する。
//   characters/<name>.glb : スキン付きキャラクター（テクスチャ縮小・WebP、メッシュ簡略化・量子化・meshopt）
//   animations.glb        : 選定したクリップだけを 1 ファイルにまとめたもの（Quaternius 共通リグ用）
//   props.glb             : 剣・盾（自作）
//   equipment.glb         : 亡者・ボス用の簡易装備メッシュ（自作。build-equipment.mjs が追記する）
//   manifest.json         : 出力ファイルのサイズ・三角形数・クリップ一覧
//
// 元データは信頼できない外部データ。glTF / 画像としてパースするだけで、実行はしない。
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import {
  EXTMeshoptCompression,
  EXTTextureWebP,
  KHRMaterialsEmissiveStrength,
  KHRMeshQuantization,
  KHRTextureTransform,
} from '@gltf-transform/extensions';
import {
  dedup,
  meshopt,
  prune,
  quantize,
  reorder,
  resample,
  simplifyPrimitive,
  weld,
} from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { CHARACTERS, CLIPS, OUT_DIR, ROOT, SRC_DIR, TEXTURE_MAX, WEBP_QUALITY } from './config.mjs';
import { buildPropsDocument } from './props.mjs';

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions([
    EXTMeshoptCompression,
    EXTTextureWebP,
    KHRMeshQuantization,
    KHRTextureTransform,
    KHRMaterialsEmissiveStrength,
  ])
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
    'meshopt.decoder': MeshoptDecoder,
  });

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

function countTriangles(doc) {
  let tris = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      tris += (idx ? idx.getCount() : prim.getAttribute('POSITION').getCount()) / 3;
    }
  }
  return tris;
}

// ---------------------------------------------------------------- キャラクター

/** スロット名 → [取得関数, 最大辺, 品質]。 */
const TEXTURE_SLOTS = [
  ['baseColor', (m) => m.getBaseColorTexture()],
  ['normal', (m) => m.getNormalTexture()],
  ['metallicRoughness', (m) => m.getMetallicRoughnessTexture()],
];

async function convertTextures(doc, adjust) {
  const done = new Set();
  const report = [];
  for (const material of doc.getRoot().listMaterials()) {
    for (const [slot, getTexture] of TEXTURE_SLOTS) {
      const texture = getTexture(material);
      if (!texture || done.has(texture)) continue;
      done.add(texture);
      const src = Buffer.from(texture.getImage());
      let img = sharp(src).resize({
        width: TEXTURE_MAX[slot],
        height: TEXTURE_MAX[slot],
        fit: 'inside',
        withoutEnlargement: true,
        kernel: 'lanczos3',
      });
      const mod = slot === 'baseColor' ? adjust[material.getName()] : undefined;
      if (mod) img = img.modulate(mod);
      const out = await img.webp({ quality: WEBP_QUALITY[slot], effort: 6 }).toBuffer({
        resolveWithObject: true,
      });
      texture.setImage(new Uint8Array(out.data)).setMimeType('image/webp');
      texture.setURI(`${material.getName()}_${slot}.webp`);
      report.push({
        material: material.getName(),
        slot,
        from: `${src.length}B`,
        size: `${out.info.width}x${out.info.height}`,
        bytes: out.data.length,
      });
    }
  }
  return report;
}

/**
 * レンジャー衣装にはフード（頭部カバー）しか無いため、Superhero 男性ボディの頭部を切り出して追加する。
 * 頂点の最大ウェイトが head.joints のボーンにある三角形だけを残し、使われる UV 範囲だけにテクスチャを切り抜く。
 */
async function addHead(doc, head) {
  const srcDoc = await io.read(join(SRC_DIR, head.source));
  const srcNode = srcDoc
    .getRoot()
    .listNodes()
    .find((n) => n.getName() === head.mesh);
  const srcPrim = srcNode?.getMesh()?.listPrimitives()[0];
  const srcSkin = srcNode?.getSkin();
  if (!srcPrim || !srcSkin) throw new Error(`head mesh not found: ${head.mesh}`);
  const dstSkin = doc.getRoot().listSkins()[0];
  const dstIndex = new Map(dstSkin.listJoints().map((j, i) => [j.getName(), i]));
  const srcNames = srcSkin.listJoints().map((j) => j.getName());
  const toDst = srcNames.map((n) => {
    const i = dstIndex.get(n);
    if (i === undefined) throw new Error(`joint missing in character skeleton: ${n}`);
    return i;
  });
  const keep = new Set(head.joints.map((n) => srcNames.indexOf(n)));

  const pos = srcPrim.getAttribute('POSITION');
  const nrm = srcPrim.getAttribute('NORMAL');
  const uv = srcPrim.getAttribute('TEXCOORD_0');
  const jnt = srcPrim.getAttribute('JOINTS_0');
  const wgt = srcPrim.getAttribute('WEIGHTS_0');
  const idx = srcPrim.getIndices().getArray();

  const j4 = [0, 0, 0, 0];
  const w4 = [0, 0, 0, 0];
  const dominant = (v) => {
    jnt.getElement(v, j4);
    wgt.getElement(v, w4);
    return j4[w4.indexOf(Math.max(...w4))];
  };
  const remap = new Map();
  const kept = [];
  const triangles = [];
  for (let t = 0; t < idx.length; t += 3) {
    const tri = [idx[t], idx[t + 1], idx[t + 2]];
    if (!tri.every((v) => keep.has(dominant(v)))) continue;
    for (const v of tri) {
      if (!remap.has(v)) {
        remap.set(v, kept.length);
        kept.push(v);
      }
    }
    triangles.push(...tri.map((v) => remap.get(v)));
  }
  if (triangles.length === 0) throw new Error('no head triangles found');

  // 使用する UV 範囲（余白 1%）
  const e = [0, 0];
  let [u0, v0, u1, v1] = [1, 1, 0, 0];
  for (const v of kept) {
    uv.getElement(v, e);
    u0 = Math.min(u0, e[0]);
    u1 = Math.max(u1, e[0]);
    v0 = Math.min(v0, e[1]);
    v1 = Math.max(v1, e[1]);
  }
  u0 = Math.max(0, u0 - 0.01);
  v0 = Math.max(0, v0 - 0.01);
  u1 = Math.min(1, u1 + 0.01);
  v1 = Math.min(1, v1 + 0.01);

  const positions = new Float32Array(kept.length * 3);
  const normals = new Float32Array(kept.length * 3);
  const uvs = new Float32Array(kept.length * 2);
  const joints = new Uint16Array(kept.length * 4);
  const weights = new Float32Array(kept.length * 4);
  const e3 = [0, 0, 0];
  kept.forEach((v, i) => {
    pos.getElement(v, e3);
    positions.set(e3, i * 3);
    nrm.getElement(v, e3);
    normals.set(e3, i * 3);
    uv.getElement(v, e);
    uvs.set([(e[0] - u0) / (u1 - u0), (e[1] - v0) / (v1 - v0)], i * 2);
    jnt.getElement(v, j4);
    wgt.getElement(v, w4);
    // ウェイトが 0 の枠は 0 番ボーンのまま（影響なし）
    joints.set(
      j4.map((j, k) => (w4[k] > 0 ? toDst[j] : 0)),
      i * 4,
    );
    weights.set(w4, i * 4);
  });

  const srcMaterial = srcPrim.getMaterial();
  const srcTexture = srcMaterial.getBaseColorTexture();
  const meta = await sharp(Buffer.from(srcTexture.getImage())).metadata();
  const crop = {
    left: Math.floor(u0 * meta.width),
    top: Math.floor(v0 * meta.height),
    width: Math.ceil((u1 - u0) * meta.width),
    height: Math.ceil((v1 - v0) * meta.height),
  };
  let image = sharp(Buffer.from(srcTexture.getImage()))
    .extract(crop)
    .resize({ width: head.textureSize, height: head.textureSize, fit: 'fill', kernel: 'lanczos3' });
  if (head.adjust) image = image.modulate(head.adjust);
  const png = await image.png().toBuffer();

  const buffer = doc.getRoot().listBuffers()[0];
  const accessor = (type, array) =>
    doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const texture = doc
    .createTexture('Head_baseColor')
    .setImage(new Uint8Array(png))
    .setMimeType('image/png');
  const material = doc
    .createMaterial('MI_Head')
    .setBaseColorTexture(texture)
    .setMetallicFactor(0)
    .setRoughnessFactor(0.75);
  const prim = doc
    .createPrimitive()
    .setMaterial(material)
    .setAttribute('POSITION', accessor('VEC3', positions))
    .setAttribute('NORMAL', accessor('VEC3', normals))
    .setAttribute('TEXCOORD_0', accessor('VEC2', uvs))
    .setAttribute('JOINTS_0', accessor('VEC4', joints))
    .setAttribute('WEIGHTS_0', accessor('VEC4', weights))
    .setIndices(accessor('SCALAR', new Uint32Array(triangles)));
  const mesh = doc.createMesh('Head').addPrimitive(prim);
  const node = doc.createNode('Head_Skin').setMesh(mesh).setSkin(dstSkin);
  doc.getRoot().listScenes()[0].addChild(node);
  return { triangles: triangles.length / 3, source: srcNames.length };
}

async function buildCharacter(name, def) {
  const doc = await io.read(join(SRC_DIR, def.source));
  doc.createExtension(EXTTextureWebP).setRequired(true);

  // 元モデルは UE 向けの余分な頂点属性（COLOR_0/1: マスク、TEXCOORD_1）を持つ。glTF の標準マテリアルでは
  // 使わず、COLOR_0 は three が頂点カラーとして乗算してしまうので削除する。
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      for (const semantic of ['COLOR_0', 'COLOR_1', 'TEXCOORD_1']) {
        prim.setAttribute(semantic, null);
      }
    }
  }

  if (def.head) await addHead(doc, def.head);

  await doc.transform(weld());
  // 重いパーツ（ブーツ・ブレーサー）を簡略化する
  const before = countTriangles(doc);
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const rule = def.simplify.find(([key]) => node.getName().includes(key));
    if (!rule) continue;
    for (const prim of mesh.listPrimitives()) {
      simplifyPrimitive(prim, {
        simplifier: MeshoptSimplifier,
        ratio: rule[1],
        error: 0.01,
        lockBorder: true,
      });
    }
  }
  const after = countTriangles(doc);

  for (const material of doc.getRoot().listMaterials()) {
    material.setDoubleSided(false);
    const tint = def.tint[material.getName()];
    if (tint) {
      const base = material.getBaseColorFactor();
      material.setBaseColorFactor(base.map((v, i) => v * tint[i]));
    }
  }
  const textures = await convertTextures(doc, def.adjust ?? {});

  await doc.transform(
    dedup(),
    prune({ keepLeaves: true }),
    reorder({ encoder: MeshoptEncoder }),
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeWeight: 8 }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );

  const file = join(OUT_DIR, 'characters', `${name}.glb`);
  mkdirSync(join(OUT_DIR, 'characters'), { recursive: true });
  await io.write(file, doc);
  const skin = doc.getRoot().listSkins()[0];
  return {
    file: relative(OUT_DIR, file),
    bytes: statSync(file).size,
    triangles: { source: before, output: after },
    joints: skin?.listJoints().length ?? 0,
    // GPU 上では WebP を非圧縮 RGBA8 に展開する。ミップマップ込み（x4/3）の概算。
    textureMemoryBytes: Math.round(
      textures.reduce((sum, t) => {
        const [w, h] = t.size.split('x').map(Number);
        return sum + (w * h * 4 * 4) / 3;
      }, 0),
    ),
    textures,
  };
}

// ---------------------------------------------------------------- アニメーション

/** ルート移動を持つトラックだけを残す（他のボーンの平行移動は長さを上書きしてしまうため捨てる）。 */
const TRANSLATED_BONES = new Set(['root', 'pelvis']);

async function buildAnimations() {
  const out = new Document();
  out.createBuffer();
  const scene = out.createScene('Animations');
  /** @type {Map<string, import('@gltf-transform/core').Node>} */
  const nodes = new Map();
  const clipMeta = [];

  const clone = (src, parent) => {
    const node = out
      .createNode(src.getName())
      .setTranslation(src.getTranslation())
      .setRotation(src.getRotation())
      .setScale(src.getScale());
    nodes.set(src.getName(), node);
    parent.addChild(node);
    // 子はボーンだけ（スキンメッシュ等は持ち込まない）
    for (const child of src.listChildren()) if (!child.getMesh()) clone(child, node);
  };

  let skeletonBuilt = false;
  for (const [file, names] of Object.entries(CLIPS)) {
    const doc = await io.read(join(SRC_DIR, file));
    const root = doc.getRoot();
    if (!skeletonBuilt) {
      const armature = root
        .listScenes()[0]
        .listChildren()
        .find((n) => !n.getMesh());
      if (!armature) throw new Error(`${file}: armature node not found`);
      clone(armature, scene);
      skeletonBuilt = true;
    }
    const byName = new Map(root.listAnimations().map((a) => [a.getName(), a]));
    for (const clipName of names) {
      const src = byName.get(clipName);
      if (!src) throw new Error(`${file}: clip not found: ${clipName}`);
      const anim = out.createAnimation(clipName);
      let duration = 0;
      for (const ch of src.listChannels()) {
        const target = ch.getTargetNode();
        const path = ch.getTargetPath();
        const node = target && nodes.get(target.getName());
        if (!node) throw new Error(`${file}/${clipName}: unknown bone ${target?.getName()}`);
        if (path === 'scale') continue;
        if (path === 'translation' && !TRANSLATED_BONES.has(node.getName())) continue;
        const sampler = ch.getSampler();
        const input = sampler.getInput();
        const output = sampler.getOutput();
        const buffer = out.getRoot().listBuffers()[0];
        const outSampler = out
          .createAnimationSampler()
          .setInterpolation(sampler.getInterpolation())
          .setInput(
            out
              .createAccessor()
              .setType('SCALAR')
              .setArray(new Float32Array(input.getArray()))
              .setBuffer(buffer),
          )
          .setOutput(
            out
              .createAccessor()
              .setType(output.getType())
              .setArray(new Float32Array(output.getArray()))
              .setBuffer(buffer),
          );
        anim.addSampler(outSampler);
        anim.addChannel(
          out
            .createAnimationChannel()
            .setTargetNode(node)
            .setTargetPath(path)
            .setSampler(outSampler),
        );
        const arr = input.getArray();
        duration = Math.max(duration, arr[arr.length - 1]);
      }
      clipMeta.push({ name: clipName, source: file, duration: +duration.toFixed(3) });
    }
  }

  await out.transform(
    resample({ tolerance: 1e-4 }),
    dedup(),
    prune({ keepLeaves: true }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  const file = join(OUT_DIR, 'animations.glb');
  await io.write(file, out);
  return { file: relative(OUT_DIR, file), bytes: statSync(file).size, clips: clipMeta };
}

// ---------------------------------------------------------------- 小物

async function buildProps() {
  const { document: doc, triangles } = buildPropsDocument();
  await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const file = join(OUT_DIR, 'props.glb');
  await io.write(file, doc);
  return { file: relative(OUT_DIR, file), bytes: statSync(file).size, triangles };
}

// ---------------------------------------------------------------- 実行

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const manifest = { characters: {}, animations: undefined, props: undefined };
for (const [name, def] of Object.entries(CHARACTERS)) {
  manifest.characters[name] = await buildCharacter(name, def);
  const c = manifest.characters[name];
  console.log(
    `characters/${name}.glb ${kb(c.bytes)} tris ${c.triangles.source} -> ${c.triangles.output} joints ${c.joints} texture memory ${(c.textureMemoryBytes / 1048576).toFixed(1)}MB`,
  );
  for (const t of c.textures) console.log(`  ${t.material} ${t.slot} ${t.size} ${kb(t.bytes)}`);
}
manifest.animations = await buildAnimations();
console.log(
  `animations.glb ${kb(manifest.animations.bytes)} clips ${manifest.animations.clips.length}`,
);
manifest.props = await buildProps();
console.log(`props.glb ${kb(manifest.props.bytes)} tris ${manifest.props.triangles}`);

const total =
  Object.values(manifest.characters).reduce((s, c) => s + c.bytes, 0) +
  manifest.animations.bytes +
  manifest.props.bytes;
manifest.totalBytes = total;
writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`total ${kb(total)} -> ${relative(ROOT, OUT_DIR)}`);

// 簡易装備メッシュ（knight.glb の bind pose からソケットを計算するので最後に作る）
await import('./build-equipment.mjs');
// 探索用の簡易メッシュ（同じく knight.glb の bind pose を使う）
await import('./build-exploration.mjs');
// プレイヤー（旅の騎士）の装備
await import('./build-player.mjs');

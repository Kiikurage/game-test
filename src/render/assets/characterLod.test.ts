import {
  Bone,
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
} from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { SHADOW_PROXY_LAYER } from '../layers';
import { CharacterLod, CharacterLodBuilder } from './characterLod';

const N = 24;

/** 高さ 2m の格子状の面（N x N マス）。y < 1 は根元の骨、y >= 1 は先の骨に重みを付ける（境界で混ぜる）。 */
function gridGeometry(scale: number): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const skinIndex: number[] = [];
  const skinWeight: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * 0.6 - 0.3;
      const y = (j / N) * 2;
      // 少しうねらせて、間引きで形が変わるようにする
      const z = Math.sin(i * 0.7) * 0.05 + Math.cos(j * 0.5) * 0.05;
      positions.push(x / scale, y / scale, z / scale);
      normals.push(0, 0, 1);
      const t = Math.min(1, Math.max(0, y - 0.5));
      skinIndex.push(0, 1, 0, 0);
      skinWeight.push(1 - t, t, 0, 0);
    }
  }
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i;
      indices.push(a, a + 1, a + N + 1, a + 1, a + N + 2, a + N + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  g.setAttribute(
    'uv',
    new Float32BufferAttribute(new Array<number>((N + 1) * (N + 1) * 2).fill(0), 2),
  );
  g.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndex, 4));
  g.setAttribute('skinWeight', new Float32BufferAttribute(skinWeight, 4));
  g.setIndex(new Uint32BufferAttribute(indices, 1));
  return g;
}

/**
 * 2 パーツ（A: メートル単位 / B: 0.5 倍に量子化し、その逆変換を boneInverses に畳み込んだもの）を持つキャラクター。
 * glTF の量子化頂点（パーツごとに boneInverses が違う）の再現。
 */
function makeCharacter(): { root: Group; tip: Bone; parts: SkinnedMesh[] } {
  const root = new Group();
  const armature = new Group();
  const base = new Bone();
  const tip = new Bone();
  tip.position.set(0, 1, 0);
  base.add(tip);
  armature.add(base);
  root.add(armature);
  root.updateMatrixWorld(true);
  const parts: SkinnedMesh[] = [];
  for (const scale of [1, 0.5]) {
    const mesh = new SkinnedMesh(gridGeometry(scale), new MeshBasicMaterial());
    const inverses = [base, tip].map((b) =>
      b.matrixWorld
        .clone()
        .invert()
        .multiply(new Matrix4().makeScale(scale, scale, scale)),
    );
    armature.add(mesh);
    mesh.bind(new Skeleton([base, tip], inverses), new Matrix4());
    parts.push(mesh);
  }
  return { root, tip, parts };
}

describe('CharacterLodBuilder', () => {
  it('merges parts into one lighter skinned mesh that deforms like the originals', async () => {
    const builder = await CharacterLodBuilder.create();
    const { root, tip, parts } = makeCharacter();
    const lod = builder.create(root, new MeshBasicMaterial());
    expect(lod).not.toBeNull();
    if (!lod) return;

    const originalTris = parts.reduce((s, m) => s + (m.geometry.getIndex()?.count ?? 0) / 3, 0);
    expect(lod.proxyTriangles).toBeGreaterThan(0);
    expect(lod.proxyTriangles).toBeLessThan(originalTris * 0.5);

    // ポーズを変える（先の骨を回す）。簡略メッシュの頂点は、元メッシュのいずれかの頂点と同じ位置に来る
    tip.rotation.z = 0.8;
    root.position.set(3, 0, -2);
    root.updateMatrixWorld(true);
    for (const m of [...parts, lod.proxy]) m.skeleton.update();
    const originals: Vector3[] = [];
    for (const mesh of parts) {
      for (let i = 0; i < mesh.geometry.getAttribute('position').count; i++) {
        originals.push(mesh.getVertexPosition(i, new Vector3()).applyMatrix4(mesh.matrixWorld));
      }
    }
    const v = new Vector3();
    let worst = 0;
    for (let i = 0; i < lod.proxy.geometry.getAttribute('position').count; i++) {
      lod.proxy.getVertexPosition(i, v).applyMatrix4(lod.proxy.matrixWorld);
      let nearest = Infinity;
      for (const o of originals) nearest = Math.min(nearest, o.distanceTo(v));
      worst = Math.max(worst, nearest);
    }
    expect(worst).toBeLessThan(1e-4);
  });

  it('makes the original meshes stop casting shadows and the proxy cast them on the shadow layer only', async () => {
    const builder = await CharacterLodBuilder.create();
    const { root, parts } = makeCharacter();
    for (const m of parts) m.castShadow = true;
    const lod = builder.create(root, new MeshBasicMaterial());
    expect(lod).not.toBeNull();
    if (!lod) return;
    expect(parts.every((m) => !m.castShadow)).toBe(true);
    expect(lod.proxy.castShadow).toBe(true);
    const camera = new PerspectiveCamera();
    // 近距離: 詳細メッシュを描き、簡略メッシュは影のレイヤーだけ（メインカメラには映らない）
    expect(lod.proxy.layers.test(camera.layers)).toBe(false);
    expect(lod.proxy.layers.isEnabled(SHADOW_PROXY_LAYER)).toBe(true);
  });

  it('skips parts that are hidden', async () => {
    const builder = await CharacterLodBuilder.create();
    const { root, parts } = makeCharacter();
    const hidden = parts[1];
    if (hidden) hidden.visible = false;
    const lod = builder.create(root, new MeshBasicMaterial());
    const visibleTris = lod?.proxyTriangles ?? 0;
    const both = makeCharacter();
    const all = builder.create(both.root, new MeshBasicMaterial());
    expect(visibleTris).toBeLessThan(all?.proxyTriangles ?? 0);
  });

  it('returns null when there is nothing skinned', async () => {
    const builder = await CharacterLodBuilder.create();
    const root = new Group();
    root.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
    expect(builder.create(root, new MeshBasicMaterial())).toBeNull();
  });
});

describe('CharacterLod.apply', () => {
  function setup(): { lod: CharacterLod; hi: Mesh[]; camera: PerspectiveCamera } {
    const hi = [new Mesh(new BoxGeometry(), new MeshBasicMaterial()), new Mesh()];
    const hiddenByDesign = hi[1];
    if (hiddenByDesign) hiddenByDesign.visible = false;
    const proxy = new SkinnedMesh(new BufferGeometry(), new MeshBasicMaterial());
    return { lod: new CharacterLod(hi, proxy), hi, camera: new PerspectiveCamera() };
  }

  it('near: shows the detailed meshes, proxy only for shadows', () => {
    const { lod, hi, camera } = setup();
    lod.apply('near', true);
    expect(hi[0]?.visible).toBe(true);
    expect(lod.proxy.visible).toBe(true);
    expect(lod.proxy.layers.test(camera.layers)).toBe(false);
    lod.apply('near', false);
    expect(lod.proxy.visible).toBe(false);
  });

  it('far: hides the detailed meshes and draws the proxy in the main pass (and the shadow pass when asked)', () => {
    const { lod, hi, camera } = setup();
    lod.apply('far', false);
    expect(hi.every((m) => !m.visible)).toBe(true);
    expect(lod.proxy.visible).toBe(true);
    expect(lod.proxy.layers.test(camera.layers)).toBe(true);
    expect(lod.proxy.layers.isEnabled(SHADOW_PROXY_LAYER)).toBe(false);
    lod.apply('far', true);
    expect(lod.proxy.layers.isEnabled(SHADOW_PROXY_LAYER)).toBe(true);
  });

  it('restores meshes that were hidden on purpose only as they were', () => {
    const { lod, hi } = setup();
    lod.apply('far', true);
    lod.apply('near', true);
    expect(hi[0]?.visible).toBe(true);
    expect(hi[1]?.visible).toBe(false);
  });

  it('none: draws nothing; idle only when the shadow is off too', () => {
    const { lod, hi } = setup();
    lod.apply('none', true);
    expect(hi.every((m) => !m.visible)).toBe(true);
    expect(lod.isIdle).toBe(false);
    lod.apply('none', false);
    expect(lod.proxy.visible).toBe(false);
    expect(lod.isIdle).toBe(true);
  });
});

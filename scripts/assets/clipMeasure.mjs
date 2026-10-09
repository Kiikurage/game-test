// animations.glb（meshopt 圧縮）を読み、各クリップの実際の長さと「当たり」「足の接地」を実測する。
// イベントマーカー表（src/game/anim/data/*.json）の clipRange / clipHitFrame / 足音位相の根拠に使う。
// 使い方: node scripts/assets/clipMeasure.mjs [animations.glb のパス]   （表を標準出力へ）
//         テスト（src/render/assets/clipTimings.test.ts）は loadClipMeasure() を使って表の値を検証する。
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Matrix4, Quaternion, Vector3 } from 'three';

export const DEFAULT_GLB = fileURLToPath(
  new URL('../../public/assets/animations.glb', import.meta.url),
);

/** UAL のキーフレームレート（全クリップ 30fps。duration × 30 が整数になることを loadClipMeasure で確認する）。 */
export const CLIP_FPS = 30;

/**
 * @param {string} [path]
 * @returns {Promise<{
 *   clips: Map<string, { duration: number, frames: number, fps: number }>,
 *   bonePosition: (clip: string, bone: string, time: number, target?: Vector3) => Vector3,
 * }>}
 */
export async function loadClipMeasure(path = DEFAULT_GLB) {
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(path);
  const root = doc.getRoot();

  const nodes = new Map(root.listNodes().map((n) => [n.getName(), n]));
  const parentOf = new Map();
  for (const n of root.listNodes()) for (const c of n.listChildren()) parentOf.set(c, n);

  /** @type {Map<string, { duration: number, frames: number, fps: number }>} */
  const clips = new Map();
  /** @type {Map<string, Map<object, { translation?: any, rotation?: any, scale?: any }>>} */
  const tracks = new Map();
  for (const anim of root.listAnimations()) {
    let duration = 0;
    const perNode = new Map();
    for (const ch of anim.listChannels()) {
      const sampler = ch.getSampler();
      const times = sampler.getInput().getArray();
      duration = Math.max(duration, times[times.length - 1]);
      const target = ch.getTargetNode();
      const path = ch.getTargetPath();
      if (!target || !path) continue;
      const entry = perNode.get(target) ?? {};
      entry[path] = { times, values: sampler.getOutput().getArray() };
      perNode.set(target, entry);
    }
    const frames = Math.round(duration * CLIP_FPS);
    if (Math.abs(frames - duration * CLIP_FPS) > 0.05) {
      throw new Error(
        `${anim.getName()}: 長さ ${duration}s が ${CLIP_FPS}fps の整数フレームではありません`,
      );
    }
    clips.set(anim.getName(), { duration, frames, fps: CLIP_FPS });
    tracks.set(anim.getName(), perNode);
  }

  const qa = new Quaternion();
  const qb = new Quaternion();
  const va = new Vector3();
  const vb = new Vector3();
  const local = new Matrix4();
  const world = new Matrix4();

  /** トラックを時刻 t で補間する（線形 / 球面線形）。 */
  function sample(track, t, size, out, slerp) {
    const { times, values } = track;
    const n = times.length;
    let i = 0;
    while (i < n - 1 && times[i + 1] <= t) i++;
    const j = Math.min(n - 1, i + 1);
    const span = times[j] - times[i];
    const k = span > 1e-9 ? Math.min(1, Math.max(0, (t - times[i]) / span)) : 0;
    if (slerp) {
      qa.fromArray(values, i * 4);
      qb.fromArray(values, j * 4);
      out.copy(qa).slerp(qb, k);
    } else {
      va.fromArray(values, i * size);
      vb.fromArray(values, j * size);
      out.copy(va).lerp(vb, k);
    }
  }

  const tmpT = new Vector3();
  const tmpS = new Vector3();
  const tmpQ = new Quaternion();

  function localMatrix(clip, node, t, target) {
    const tr = tracks.get(clip)?.get(node) ?? {};
    if (tr.translation) sample(tr.translation, t, 3, tmpT, false);
    else tmpT.fromArray(node.getTranslation());
    if (tr.rotation) sample(tr.rotation, t, 4, tmpQ, true);
    else tmpQ.fromArray(node.getRotation());
    if (tr.scale) sample(tr.scale, t, 3, tmpS, false);
    else tmpS.fromArray(node.getScale());
    return target.compose(tmpT, tmpQ, tmpS);
  }

  return {
    clips,
    /** ボーンのワールド座標（Armature の親を原点とする。キャラクターは +Z 向き）。 */
    bonePosition(clip, bone, time, target = new Vector3()) {
      const node = nodes.get(bone);
      if (!node) throw new Error(`bone not found: ${bone}`);
      world.identity();
      /** @type {any[]} */
      const chain = [];
      for (let n = node; n; n = parentOf.get(n)) chain.push(n);
      for (let i = chain.length - 1; i >= 0; i--) {
        world.multiply(localMatrix(clip, chain[i], time, local));
      }
      return target.setFromMatrixPosition(world);
    },
  };
}

/**
 * 手（剣）の速さが最大になるクリップ内フレーム = 振り抜き（当たり）。
 * `range` 内の各フレームで手の位置を取り、前フレームとの距離が最大の区間の終端を返す。
 */
export function peakSpeedFrame(measure, clip, bone, range) {
  const prev = new Vector3();
  const cur = new Vector3();
  let best = range[0] + 1;
  let bestSpeed = -1;
  measure.bonePosition(clip, bone, range[0] / CLIP_FPS, prev);
  for (let f = range[0] + 1; f <= range[1]; f++) {
    measure.bonePosition(clip, bone, f / CLIP_FPS, cur);
    const speed = cur.distanceTo(prev);
    if (speed > bestSpeed) {
      bestSpeed = speed;
      best = f;
    }
    prev.copy(cur);
  }
  return best;
}

/**
 * 歩行系ループで、足が最も前に出る位相（0..1）。左足 foot_l → 接地（かかと）の位相。
 * 右足は約 0.5 ずれる。
 */
export function footForwardPhase(measure, clip, bone) {
  const info = measure.clips.get(clip);
  if (!info) throw new Error(`clip not found: ${clip}`);
  const steps = info.frames * 4;
  const p = new Vector3();
  let best = 0;
  let bestZ = -Infinity;
  for (let i = 0; i < steps; i++) {
    measure.bonePosition(clip, bone, (i / steps) * info.duration, p);
    if (p.z > bestZ) {
      bestZ = p.z;
      best = i / steps;
    }
  }
  return best;
}

// ---- CLI ----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const measure = await loadClipMeasure(process.argv[2]);
  console.log('clip\tframes@30\tduration');
  for (const [name, c] of measure.clips)
    console.log(`${name}\t${c.frames}\t${c.duration.toFixed(4)}`);
  console.log('\n当たり（hand_r の速さが最大のフレーム）');
  for (const [clip, range] of [
    ['Sword_Regular_A', [0, 13]],
    ['Sword_Regular_B', [0, 16]],
    ['Sword_Regular_C', [0, 60]],
    ['Sword_Heavy_Combo', [0, 130]],
    ['Shield_Dash', [0, 33]],
    ['Melee_Hook', [0, 14]],
  ]) {
    const info = measure.clips.get(clip);
    const r = [range[0], Math.min(range[1], info.frames)];
    console.log(
      `${clip}\thitFrame=${peakSpeedFrame(measure, clip, 'hand_r', r)} (range ${r.join('-')})`,
    );
  }
  console.log('\n足が最も前に出る位相');
  for (const clip of ['Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop']) {
    console.log(
      `${clip}\tfoot_l=${footForwardPhase(measure, clip, 'foot_l').toFixed(3)}\tfoot_r=${footForwardPhase(measure, clip, 'foot_r').toFixed(3)}`,
    );
  }
}

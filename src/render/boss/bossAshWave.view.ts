import type { BufferGeometry } from 'three/webgpu';
import {
  ConeGeometry,
  Euler,
  InstancedMesh,
  MeshStandardNodeMaterial,
  Object3D,
  Vector3,
} from 'three/webgpu';
import { atan, float, mix, positionGeometry, pow, sin, smoothstep, vec3 } from 'three/tsl';
import { bossSystemOf } from '../../game/boss/boss.system';
import {
  ASH_LENGTH,
  ASH_LINE_ANGLES_DEG,
  ASH_WIDTH,
  ashLineStart,
  ASH_TELEGRAPH_FRAME,
  ashLineYaw,
  ashTelegraphVisible,
  ashWaveStateOf,
} from '../../game/boss/moves/ashWave.move';
import { createRng } from '../particles/layer';
import type { Telegraph } from '../telegraph';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 灰の波（技 7）の描画。ゲーム側の状態（`ashWaveStateOf`）を毎フレーム読むだけで、状態は持たない（演出の内部状態を除く）。
 *
 * - **予告**: 発生 F18 から 3 本の地面予告線（E5-0 の `GroundTelegraphs`。赤橙 + 点滅）。ボスの向きが固定されるまで置き直し、
 *   各本は走り終えたら消す。
 * - **棘**: 地面から突き出す欠けた棘（頂点をずらした 5 角錐。`InstancedMesh` 1 ドローコール）。1m ごとに 3 本 1 組を、高さ・太さ・傾きを
 *   ばらして先端が通った瞬間に 3F で突き出し、保持してから素早く崩れる。先は炭のように黒く、根元と割れ目が熾火色に光る（TSL）。
 * - **灰**: 突き出す瞬間（3 組ごと）に灰（`deathAsh`）・塵・火花、崩れ始めに灰を散らす（縮むだけにしない）。
 */

const STEP = 1; // 棘の組の間隔（m）
const STEPS = Math.round(ASH_LENGTH / STEP);
const PER_STEP = 3;
const LINES = ASH_LINE_ANGLES_DEG.length;
const COUNT = LINES * STEPS * PER_STEP;
/** 突き出す・保持・沈むの長さ（F）。 */
const RISE_FRAMES = 3;
const HOLD_FRAMES = 12;
/** 沈む（灰になって崩れる）長さ。縮むだけにせず、崩れ始めに灰を散らす。 */
const SINK_FRAMES = 9;
/** 崩れ始めの灰を出す間隔（組ごと）。 */
const CRUMBLE_EVERY = 3;

interface Spike {
  /** 線上の位置（m）と横ずれ（m）。 */
  readonly d: number;
  readonly side: number;
  readonly height: number;
  readonly radius: number;
  /** 傾き（rad）と、傾ける水平方向（rad）。 */
  readonly lean: number;
  readonly leanDir: number;
  readonly twist: number;
}

function buildSpikes(): Spike[] {
  const rng = createRng(7077);
  const spikes: Spike[] = [];
  for (let line = 0; line < LINES; line++) {
    for (let k = 0; k < STEPS; k++) {
      const d = (k + 0.5) * STEP;
      // 組ごとに高さ・太さ・傾きを大きくばらす。中央の 1 本は高く、脇は低く細く外へ傾く
      const tall = 1.1 + rng() * 1.6;
      spikes.push({
        d: d + (rng() - 0.5) * 0.4,
        side: (rng() - 0.5) * 0.3,
        height: tall,
        radius: 0.16 + rng() * 0.3,
        lean: (rng() - 0.5) * 0.5,
        leanDir: rng() * 6.28,
        twist: rng() * 6.28,
      });
      for (const s of [-1, 1]) {
        spikes.push({
          d: d + (rng() - 0.5) * 0.7,
          side: s * (ASH_WIDTH * 0.24 + rng() * 0.14),
          height: tall * (0.3 + rng() * 0.5),
          radius: 0.1 + rng() * 0.22,
          lean: 0.2 + rng() * 0.45,
          leanDir: (s > 0 ? 0 : Math.PI) + (rng() - 0.5) * 1.2,
          twist: rng() * 6.28,
        });
      }
    }
  }
  return spikes;
}

/** 欠けた先の尖った棘（5 角錐を 4 段に割り、頂点をずらして曲げる。毎回同じ形）。 */
function jaggedSpikeGeometry(): BufferGeometry {
  const g = new ConeGeometry(1, 1, 5, 4, true);
  g.translate(0, 0.5, 0);
  const pos = g.getAttribute('position');
  const hash = (x: number, y: number, z: number): number => {
    const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return v - Math.floor(v);
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = Math.min(1, Math.max(0, y));
    const j = 0.82 + 0.4 * hash(Math.round(x * 10), Math.round(y * 10), Math.round(z * 10));
    // 同じ高さの頂点は同じ乱数（輪が割れない）。曲がりは上ほど大きい
    pos.setXYZ(i, x * j + 0.2 * t * t, y, z * j - 0.12 * t * t);
  }
  g.computeVertexNormals();
  return g;
}

const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

/** 先端が通ってから `age` F の棘の伸び（0〜1）。通る前は 0。崩れ始め（保持の後）に素早く沈む。 */
export function spikeGrowth(age: number): number {
  if (age <= 0) return 0;
  if (age < RISE_FRAMES) return easeOut(age / RISE_FRAMES);
  const sink = (age - RISE_FRAMES - HOLD_FRAMES) / SINK_FRAMES;
  if (sink <= 0) return 1;
  if (sink >= 1) return 0;
  return 1 - sink * sink * sink;
}

registerViewPlugin('boss-ash-wave', ({ game, view }) => {
  const spikes = buildSpikes();
  const geometry = jaggedSpikeGeometry();
  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0, flatShading: true });
  const h = positionGeometry.y.clamp(0, 1);
  // 根元は灰色、先は炭のように黒く焦げている。根元と割れ目に熾火が灯る
  material.colorNode = mix(
    vec3(0.05, 0.047, 0.045),
    vec3(0.004, 0.003, 0.003),
    smoothstep(0.25, 0.85, h),
  );
  const around = atan(positionGeometry.x, positionGeometry.z);
  const crack = smoothstep(0.965, 1.0, sin(around.mul(3).add(h.mul(10)))).mul(
    float(1).sub(smoothstep(0.35, 0.85, h)),
  );
  const baseGlow = pow(float(1).sub(h), 24).mul(0.9);
  material.emissiveNode = vec3(1.0, 0.3, 0.05).mul(baseGlow.add(crack.mul(1.4)));
  const mesh = new InstancedMesh(geometry, material, COUNT);
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.visible = false;
  view.scene.add(mesh);

  const dummy = new Object3D();
  const euler = new Euler();
  const up = new Vector3(0, 1, 0);
  const axis = new Vector3();
  const feet = new Vector3();
  const grow = new Float32Array(COUNT);

  // 予告の線（3 本）
  const lines: (Telegraph | null)[] = new Array<Telegraph | null>(LINES).fill(null);
  let placedLocked = false;

  // 演出の内部状態: 段の F を描画フレームの間で補間する
  let lastFrame = -1;
  let sub = 0;
  let prevF = -1;

  const hide = () => {
    mesh.visible = false;
    lastFrame = -1;
    prevF = -1;
    placedLocked = false;
    for (let i = 0; i < LINES; i++) {
      const t = lines[i];
      if (t) view.telegraphs.release(t);
      lines[i] = null;
    }
  };

  return {
    update(dt) {
      const boss = bossSystemOf(game).boss;
      const state = boss?.alive ? ashWaveStateOf(boss) : undefined;
      if (!state) {
        if (mesh.visible || lines.some((t) => t !== null)) hide();
        return;
      }
      if (state.frame !== lastFrame) {
        lastFrame = state.frame;
        sub = 0;
      } else {
        sub = Math.min(1, sub + dt * 60);
      }
      const f = state.frame + sub;
      const { origin } = state;

      // 予告線: 発生 F18 から。向きが固定されるまでは置き直し、各本は走り終えたら消す
      for (let i = 0; i < LINES; i++) {
        const visible = ashTelegraphVisible(state.frame, i);
        const yaw = ashLineYaw(i, state.yaw);
        let t = lines[i] ?? null;
        if (visible && !t) {
          t = view.telegraphs.line(origin.x, origin.z, yaw, ASH_LENGTH, ASH_WIDTH);
          t.show();
          lines[i] = t;
        } else if (visible && t && (!state.locked || !placedLocked)) {
          t.placeLine(origin.x, origin.z, yaw, ASH_LENGTH, ASH_WIDTH);
        }
        // 亀裂の先端は予告の開始から棘が出る少し前まで、根元から先へ伸びる（見た目のみ）
        if (t && visible) {
          const span = Math.max(1, ashLineStart(i) - 4 - ASH_TELEGRAPH_FRAME);
          const p = Math.min(1, Math.max(0, (state.frame + sub - ASH_TELEGRAPH_FRAME) / span));
          t.setGrow(1 - (1 - p) * (1 - p));
        }
        if (!visible && t && state.frame > ashLineStart(i)) {
          view.telegraphs.release(t);
          lines[i] = null;
        }
      }
      if (state.locked) placedLocked = true;

      // 棘
      let any = false;
      for (let line = 0; line < LINES; line++) {
        const yaw = ashLineYaw(line, state.yaw);
        const sx = Math.sin(yaw);
        const sz = Math.cos(yaw);
        const start = ashLineStart(line);
        for (let k = 0; k < STEPS * PER_STEP; k++) {
          const i = line * STEPS * PER_STEP + k;
          const sp = spikes[i];
          if (!sp) continue;
          // 先端が `d` に着く F（1 m/F）からの経過
          const age = f - (start + sp.d);
          const g = spikeGrowth(age);
          grow[i] = g;
          if (g <= 0) {
            dummy.position.set(0, -10, 0);
            dummy.scale.setScalar(0);
          } else {
            any = true;
            const px = origin.x + sx * sp.d + sz * sp.side;
            const pz = origin.z + sz * sp.d - sx * sp.side;
            dummy.position.set(px, origin.y - 0.05, pz);
            // 水平方向 `leanDir` へ `lean` だけ傾ける
            euler.set(0, sp.twist, 0);
            dummy.quaternion.setFromEuler(euler);
            dummy.rotateOnAxis(
              axis.set(Math.cos(sp.leanDir + yaw), 0, Math.sin(sp.leanDir + yaw)),
              sp.lean,
            );
            const w = 0.55 + 0.45 * Math.min(1, g * 2);
            dummy.scale.set(sp.radius * w, sp.height * g, sp.radius * w);
          }
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = any;

      // 灰・火花: 突き出す瞬間（3 組ごと）に灰・塵・火花、崩れ始めに灰を散らす
      if (prevF >= 0 && f > prevF) {
        const crumbleAt = RISE_FRAMES + HOLD_FRAMES;
        for (let line = 0; line < LINES; line++) {
          const yaw = ashLineYaw(line, state.yaw);
          const start = ashLineStart(line);
          for (let k = 1; k < STEPS; k += CRUMBLE_EVERY) {
            const d = (k + 0.5) * STEP;
            const rose = prevF - start < d && f - start >= d;
            const crumbled = prevF - start - crumbleAt < d && f - start - crumbleAt >= d;
            if (!rose && !crumbled) continue;
            feet.set(origin.x + Math.sin(yaw) * d, origin.y + 0.1, origin.z + Math.cos(yaw) * d);
            if (rose) {
              view.particles.deathAsh(feet, 0.5, 0.7, 1.6);
              view.particles.hit(feet, up, 0.45);
            } else {
              view.particles.deathAsh(feet, 0.45, 1.2, 0.9);
            }
          }
        }
      }
      prevF = f;
    },
  };
});

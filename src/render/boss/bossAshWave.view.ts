import {
  ConeGeometry,
  Euler,
  InstancedMesh,
  MeshStandardNodeMaterial,
  Object3D,
  Vector3,
} from 'three/webgpu';
import { float, mix, positionGeometry, pow, vec3 } from 'three/tsl';
import { bossSystemOf } from '../../game/boss/boss.system';
import {
  ASH_LENGTH,
  ASH_LINE_ANGLES_DEG,
  ASH_WIDTH,
  ashLineStart,
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
 * - **棘**: 地面から突き出す灰色の円錐（`InstancedMesh` 1 ドローコール）。1m ごとに 3 本 1 組（中央が高く、両脇は外へ傾く）を
 *   本の先端が通った瞬間に 3F で突き出し、保持してから沈む。根元は熾火色に光る（TSL）。
 * - **灰**: 先端が通ったところ（4m ごと）から灰（`deathAsh`）と火花を舞い上げる。
 */

const STEP = 1; // 棘の組の間隔（m）
const STEPS = Math.round(ASH_LENGTH / STEP);
const PER_STEP = 3;
const LINES = ASH_LINE_ANGLES_DEG.length;
const COUNT = LINES * STEPS * PER_STEP;
/** 灰を出す間隔（組ごと）。 */
const ASH_EVERY = 4;
/** 突き出す・保持・沈むの長さ（F）。 */
const RISE_FRAMES = 3;
const HOLD_FRAMES = 12;
const SINK_FRAMES = 14;

interface Spike {
  /** 線上の位置（m）と横ずれ（m）。 */
  readonly d: number;
  readonly side: number;
  readonly height: number;
  readonly radius: number;
  /** 外へ傾く角（rad。横ずれの向きに倒す）。 */
  readonly lean: number;
  readonly twist: number;
}

function buildSpikes(): Spike[] {
  const rng = createRng(7077);
  const spikes: Spike[] = [];
  for (let line = 0; line < LINES; line++) {
    for (let k = 0; k < STEPS; k++) {
      const d = (k + 0.5) * STEP;
      // 中央・左・右の 3 本。中央が高く、脇は低く細く、外へ傾く
      const tall = 1.7 + rng() * 0.7;
      spikes.push({
        d: d + (rng() - 0.5) * 0.3,
        side: (rng() - 0.5) * 0.2,
        height: tall,
        radius: 0.3 + rng() * 0.08,
        lean: (rng() - 0.5) * 0.12,
        twist: rng() * 6.28,
      });
      for (const s of [-1, 1]) {
        spikes.push({
          d: d + (rng() - 0.5) * 0.5,
          side: s * (ASH_WIDTH * 0.26 + rng() * 0.1),
          height: tall * (0.45 + rng() * 0.25),
          radius: 0.2 + rng() * 0.06,
          lean: s * (0.22 + rng() * 0.16),
          twist: rng() * 6.28,
        });
      }
    }
  }
  return spikes;
}

const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

/** 先端が通ってから `age` F の棘の伸び（0〜1）。通る前は 0。 */
export function spikeGrowth(age: number): number {
  if (age <= 0) return 0;
  if (age < RISE_FRAMES) return easeOut(age / RISE_FRAMES);
  const sink = (age - RISE_FRAMES - HOLD_FRAMES) / SINK_FRAMES;
  if (sink <= 0) return 1;
  if (sink >= 1) return 0;
  return 1 - sink * sink;
}

registerViewPlugin('boss-ash-wave', ({ game, view }) => {
  const spikes = buildSpikes();
  const geometry = new ConeGeometry(1, 1, 6, 1);
  geometry.translate(0, 0.5, 0);
  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0 });
  const h = positionGeometry.y.clamp(0, 1);
  // 根元は暗い灰、先端は少し明るい灰。根元の割れ目から熾火の光が漏れる
  material.colorNode = mix(vec3(0.018, 0.017, 0.018), vec3(0.13, 0.125, 0.125), pow(h, 0.9));
  material.emissiveNode = vec3(1.0, 0.3, 0.05).mul(pow(float(1).sub(h), 5).mul(1.1));
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
        } else if (!visible && t && state.frame > ashLineStart(i)) {
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
            // 外（横ずれの向き）へ傾ける。傾きの軸は線の方向
            euler.set(0, yaw, 0);
            dummy.quaternion.setFromEuler(euler);
            dummy.rotateOnAxis(axis.set(sx, 0, sz), -sp.lean);
            dummy.rotateOnAxis(up, sp.twist);
            const w = 0.55 + 0.45 * g;
            dummy.scale.set(sp.radius * w, sp.height * g, sp.radius * w);
          }
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = any;

      // 灰・火花: 先端が `ASH_EVERY` 組ごとの位置を通った瞬間
      if (prevF >= 0 && f > prevF) {
        for (let line = 0; line < LINES; line++) {
          const yaw = ashLineYaw(line, state.yaw);
          const start = ashLineStart(line);
          for (let k = 1; k < STEPS; k += ASH_EVERY) {
            const d = (k + 0.5) * STEP;
            if (prevF - start < d && f - start >= d) {
              feet.set(origin.x + Math.sin(yaw) * d, origin.y + 0.1, origin.z + Math.cos(yaw) * d);
              view.particles.deathAsh(feet, 0.55, 0.9, 1.5);
              view.particles.hit(feet, up, 0.5);
            }
          }
        }
      }
      prevF = f;
    },
  };
});

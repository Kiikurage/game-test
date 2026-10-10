import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  Euler,
  Group,
  Matrix4,
  Mesh,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
} from 'three/webgpu';
import { float, length, positionLocal, smoothstep, time, uniform, vec3 } from 'three/tsl';
import { bonfiresOf } from '../../game/bonfire/bonfire';
import { ARENA_BONFIRE_ID } from '../../game/data/bonfire';
import { arenaOf } from '../../game/world/arena';
import { bossDefeatOf } from '../../game/boss/bossDefeat.system';
import { mergeAll } from './arenaGeometry';
import type { Bonfire } from '../particles';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 闘技場の台座の篝火（#86 / 8.4 節）。ボス撃破の F300 に灯る（`bonfiresOf(game)` に `ARENA_BONFIRE_ID` が現れる）。
 * 見た目は広場の篝火と同じ構成: 灰の山・石の輪・突き立つ剣・炎と火の粉と光（`Bonfire` エミッタ）。
 *
 * 点火演出（撃破から現れたとき）: 灰の山の熾火が 0.9 秒かけて赤く燃え上がり、小さな火の粉が昇る →
 * 炎が立ち（光が閃き）、台座の縁へ熾火の輪が広がり、続いて闘技場の床へ大きな輪が走る。
 * 撃破済みのセーブから始めたときは演出なしで最初から灯っている。
 */

/** 現れてから炎が立つまで（秒）。 */
const KINDLE = 0.9;
/** 台座の縁へ広がる輪・床へ走る輪の長さ（秒）と最大半径（m）。 */
const RING_NEAR = { seconds: 0.55, radius: 1.75 } as const;
const RING_FAR = { seconds: 1.4, radius: 7.5 } as const;
/** 点火の閃光（光の倍率）の長さ（秒）。 */
const FLASH_SECONDS = 1.3;

const SCRATCH_M = new Matrix4();
const SCRATCH_Q = new Quaternion();
const SCRATCH_E = new Euler();
const SCRATCH_V = new Vector3();
const SCRATCH_S = new Vector3();

/** 決定的な疑似乱数（石の配置を毎回同じにする）。 */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function box(
  w: number,
  h: number,
  d: number,
  at: readonly [number, number, number],
  rot: readonly [number, number, number] = [0, 0, 0],
): BufferGeometry {
  const g = new BoxGeometry(w, h, d);
  SCRATCH_Q.setFromEuler(SCRATCH_E.set(rot[0], rot[1], rot[2]));
  SCRATCH_M.compose(SCRATCH_V.set(at[0], at[1], at[2]), SCRATCH_Q, SCRATCH_S.set(1, 1, 1));
  g.applyMatrix4(SCRATCH_M);
  return g;
}

/** 石の輪（崩れかけた石 11 個）。 */
function createStoneRing(): BufferGeometry {
  const rnd = lcg(86);
  const parts: BufferGeometry[] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.25;
    const r = 0.74 + (rnd() - 0.5) * 0.12;
    const w = 0.26 + rnd() * 0.16;
    const h = 0.16 + rnd() * 0.16;
    const d = 0.2 + rnd() * 0.1;
    parts.push(
      box(
        w,
        h,
        d,
        [Math.sin(a) * r, h / 2 - 0.02, Math.cos(a) * r],
        [(rnd() - 0.5) * 0.35, a + (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.3],
      ),
    );
  }
  return mergeAll(parts);
}

/** 突き立つ剣（少し傾いた、錆びた直剣）。 */
function createSword(): BufferGeometry {
  const tilt: [number, number, number] = [0.07, 0.4, -0.1];
  const place = (g: BufferGeometry): BufferGeometry => {
    SCRATCH_Q.setFromEuler(SCRATCH_E.set(tilt[0], tilt[1], tilt[2]));
    SCRATCH_M.compose(SCRATCH_V.set(0.02, 0, -0.03), SCRATCH_Q, SCRATCH_S.set(1, 1, 1));
    g.applyMatrix4(SCRATCH_M);
    return g;
  };
  return mergeAll([
    place(box(0.085, 1.08, 0.02, [0, 0.54, 0])), // 刃
    place(box(0.036, 0.16, 0.026, [0, 1.16, 0])), // 切っ先寄りの欠け（刃の先の細り）
    place(box(0.42, 0.045, 0.06, [0, 1.1, 0])), // 鍔
    place(box(0.04, 0.3, 0.04, [0, 1.28, 0])), // 柄
    place(box(0.085, 0.085, 0.085, [0, 1.46, 0])), // 柄頭
  ]);
}

/** 平らな円盤（半径 1）。TSL で輪・光だまりを描く（加算合成）。 */
function createGlowDisc(): {
  mesh: Mesh;
  ring: ReturnType<typeof uniform>;
  alpha: ReturnType<typeof uniform>;
} {
  const ring = uniform(0);
  const alpha = uniform(0);
  const geometry = new CircleGeometry(1, 64);
  geometry.rotateX(-Math.PI / 2);
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const r = length(positionLocal.xz);
  // 輪: 外縁へ向かって強く、内側へ尾を引く
  const head = smoothstep(ring.sub(0.34), ring, r).mul(
    float(1).sub(smoothstep(ring, ring.add(0.035), r)),
  );
  const body = float(1)
    .sub(smoothstep(0, ring, r))
    .mul(0.18);
  material.colorNode = vec3(3.4, 1.15, 0.22).mul(head.add(body));
  material.opacityNode = alpha.mul(float(1).sub(smoothstep(0.82, 1, r)));
  const mesh = new Mesh(geometry, material);
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  return { mesh, ring, alpha };
}

const smooth01 = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

registerViewPlugin('arena-bonfire', ({ game, view, level }) => {
  const def = level ? arenaOf(level) : null;
  if (!def) return {};
  const slot = def.bonfireSlot;
  const bonfires = bonfiresOf(game);

  const root = new Group();
  root.name = 'arena:bonfire';
  root.position.set(slot.x, slot.y, slot.z);
  root.visible = false;
  view.scene.add(root);

  // 灰の山（熾火の発光 = kindle）。潰れた半球
  const kindle = uniform(0);
  const moundMaterial = new MeshStandardNodeMaterial({ color: 0x1c1a19, roughness: 1 });
  const flicker = time.mul(7.3).sin().mul(0.2).add(time.mul(13.1).add(1.7).sin().mul(0.1)).add(0.8);
  moundMaterial.emissiveNode = vec3(2.6, 0.55, 0.08).mul(kindle).mul(flicker);
  const mound = new Mesh(
    new SphereGeometry(0.62, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    moundMaterial,
  );
  mound.scale.set(1, 0.34, 1);
  mound.receiveShadow = true;
  const stones = new Mesh(
    createStoneRing(),
    new MeshStandardNodeMaterial({ color: 0x4a463f, roughness: 0.95 }),
  );
  stones.castShadow = true;
  stones.receiveShadow = true;
  const sword = new Mesh(
    createSword(),
    new MeshStandardNodeMaterial({ color: 0x6b5f52, roughness: 0.62, metalness: 0.7 }),
  );
  sword.castShadow = true;
  root.add(mound, stones, sword);

  // 点火の輪（台座の縁 / 闘技場の床）
  const near = createGlowDisc();
  near.mesh.position.set(slot.x, slot.y + 0.04, slot.z);
  const far = createGlowDisc();
  far.mesh.position.set(slot.x, def.floorY + 0.05, slot.z);
  view.scene.add(near.mesh, far.mesh);

  // 炎・火の粉（パーティクルのエミッタ）。光源はシーン全体で 1 灯だけで、最も近い灯っている篝火へ付け替わる
  const emitter: Bonfire = view.particles.acquireBonfire(slot.x, slot.y + 0.12, slot.z);
  emitter.setLit(false);

  const up = new Vector3(0, 1, 0);
  const at = new Vector3(slot.x, slot.y + 0.2, slot.z);
  let revealedAt = -1;
  let ignited = false;
  let clock = 0;
  let nextSpark = 0;
  let wasRevealed = false;

  const ignite = (): void => {
    ignited = true;
    emitter.setLit(true);
    emitter.boost = 3.2;
    view.particles.hit(at, up, 1.8);
    view.particles.hit(at, up, 1.4);
    view.particles.deathAsh(SCRATCH_V.set(slot.x, slot.y, slot.z), 0.55, 0.5, 2.6);
  };

  return {
    update: (dt) => {
      const revealed = bonfires.ids.includes(ARENA_BONFIRE_ID);
      if (!revealed) {
        if (wasRevealed) {
          // 撃破前の状態へ戻った（ゲームの作り直し）
          wasRevealed = false;
          ignited = false;
          emitter.setLit(false);
          root.visible = false;
        }
        return;
      }
      clock += Math.min(dt, 0.1);
      root.visible = true;
      if (!wasRevealed) {
        wasRevealed = true;
        // 撃破の演出の最中に現れたら点火演出、そうでなければ（セーブからの再開）最初から灯っている
        const live = bossDefeatOf(game).frame >= 0;
        revealedAt = live ? clock : clock - KINDLE - 10;
        if (!live) {
          kindle.value = 0.35;
          emitter.setLit(true);
          ignited = true;
        }
      }
      const t = clock - revealedAt;
      if (!ignited) {
        // 熾火が燃え上がる。小さな火の粉が昇る
        kindle.value = 0.1 + 0.9 * smooth01(t / KINDLE);
        if (clock >= nextSpark) {
          nextSpark = clock + 0.16;
          view.particles.chargeGlint(at, 0.8 + 0.6 * smooth01(t / KINDLE));
        }
        if (t >= KINDLE) ignite();
      } else if (t >= KINDLE) {
        const s = t - KINDLE;
        // 点火後: 熾火は炎の足元で落ち着く。光の閃きは減衰、輪が走る
        kindle.value = 0.35 + 0.65 * (1 - smooth01(s / 1.6));
        emitter.boost = 1 + 2.2 * (1 - smooth01(s / FLASH_SECONDS));
        const k0 = s / RING_NEAR.seconds;
        near.mesh.visible = k0 < 1;
        near.mesh.scale.setScalar(RING_NEAR.radius);
        near.ring.value = Math.min(1, k0);
        near.alpha.value = 1.4 * (1 - smooth01(k0 - 0.4));
        const k1 = (s - 0.15) / RING_FAR.seconds;
        far.mesh.visible = k1 > 0 && k1 < 1;
        far.mesh.scale.setScalar(RING_FAR.radius);
        far.ring.value = Math.min(1, Math.max(0, k1));
        far.alpha.value = 0.9 * (1 - smooth01(k1 - 0.2));
      }
    },
  };
});

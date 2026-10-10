import { circleShape } from '../../combat';
import { registerBossMove, type BossMoveContext, type BossStageDef } from '../bossMove';

/**
 * 技 5 跳躍叩きつけ（仕様書 6.3 節）。遠距離（8m 超）で距離を詰める技。
 *
 * 発生 72 = 跳び上がり 42 + 滞空 30（滞空 F は段の F − 42）・持続 6（着地時）・硬直 56（P2: 46）・
 * ダメージ 120（P2: 130）・強靭度 70・ガード時スタミナ 62・着地点を中心に半径 3.5m の円。
 *
 * - **着地点**: 滞空 F20（段 F62）まで対象の足元に追従し、その後は固定する（`LEAP_LOCK_FRAME`）。
 *   ボスは滞空の間に位置から着地点へ飛ぶ（水平は着地に間に合うよう毎ステップ残りを等分）。
 *   遠すぎる相手には届く範囲（`LEAP_MAX_DISTANCE`）で着地点を切り詰める。
 * - **回避**: ロール（無敵 F4–F15）で着地の持続（段 F73–F78）を覆うので、入力は滞空 F22〜F28（段 F64–F70）。
 *   F29 以降は無敵が間に合わず当たる。ロールの移動 3.2m は半径 3.5m の円を出られないので、無敵頼みの回避になる。
 *   円の外へ大きく離れる（走る）のも有効。
 * - **予告**: 地面の予告円（E5-0 の `GroundTelegraphs`）を発生 F18（`LEAP_TELEGRAPH_FRAME`）から出す。
 *   円は着地点に追従し、固定されたら動かない。滞空に入ったら影の円（progress 0 → 1）も重ねる。描画は
 *   `render/boss/bossLeap.view.ts` が `leapStateOf(boss)` を毎フレーム読んで行う。
 * - 向きは跳び上がり前（F42 まで）に対象へ追う。滞空中は固定。
 * - 判定: 着地点中心の全周円。ハートボックス（半径 0.35m）に触れたら当たる（中心距離 3.85m まで）。
 *
 * テレグラフ: `heavy`（強攻撃。ガードは可能なので `unblockable` ではない）。
 * クリップ: `Jump_Start` / `Jump_Loop` / `Jump_Land` の流用（マーカー表: `anim/data/bossClips.json`）。
 */

/** 跳び上がり（地上の溜め）の長さ（F）。この次のフレームから滞空。 */
export const LEAP_CROUCH_FRAMES = 42;
/** 滞空の長さ（F）。 */
export const LEAP_AIR_FRAMES = 30;
/** 着地点の追従を止める F（滞空 F20）。 */
export const LEAP_LOCK_FRAME = LEAP_CROUCH_FRAMES + 20;
/** 地面予告を出し始める F（発生 F18）。 */
export const LEAP_TELEGRAPH_FRAME = 18;
/** 着地の円の半径（m）。 */
export const LEAP_RADIUS = 3.5;
/** 跳べる最大の水平距離（m）。これを超える相手には届く範囲で着地する。 */
export const LEAP_MAX_DISTANCE = 18;
/** 滞空の最高点（m。足元から）。見た目用。 */
export const LEAP_PEAK_HEIGHT = 5;

const COMMON = {
  id: 'leap.1',
  startup: LEAP_CROUCH_FRAMES + LEAP_AIR_FRAMES,
  active: 6,
  poiseDamage: 70,
  guardStaminaCost: 62,
  moveDistance: 0,
  arcDeg: 360,
  range: LEAP_RADIUS,
  heavy: true,
  telegraph: 'heavy',
  // 向きは跳び上がり前まで追う（着地点の追従は別。`LEAP_LOCK_FRAME`）
  trackEndFrame: LEAP_CROUCH_FRAMES,
} as const satisfies Partial<BossStageDef>;

const LEAP_P1: BossStageDef = { ...COMMON, recovery: 56, damage: 120 };
const LEAP_P2: BossStageDef = { ...COMMON, recovery: 46, damage: 130 };

/** 跳躍の状態（描画が読む。技の実行中だけ `leapStateOf` で引ける）。 */
export interface LeapState {
  /** 跳び上がった位置（足元）。 */
  readonly origin: { readonly x: number; readonly z: number };
  /** 着地点（固定されるまで対象に追従）。 */
  landing: { x: number; z: number };
  /** 着地点が固定された（滞空 F20 以降）。 */
  locked: boolean;
  /** 段の F（描画が予告の出し始め・影の濃さを決める）。 */
  frame: number;
  /** 滞空中か（F43〜F72）。 */
  airborne: boolean;
  /** 足元からの高さ（m。見た目用）。 */
  height: number;
  /** 着地した（持続に入った）。 */
  landed: boolean;
}

const states = new WeakMap<object, LeapState>();

/** `boss` の跳躍の状態（跳躍中でなければ undefined）。 */
export function leapStateOf(boss: object): Readonly<LeapState> | undefined {
  return states.get(boss);
}

/** 地面予告の円を出しているか（発生 F18 から着地まで。それ以前は出さない）。 */
export function leapTelegraphVisible(state: Pick<LeapState, 'frame' | 'landed'>): boolean {
  return state.frame >= LEAP_TELEGRAPH_FRAME && !state.landed;
}

/** 滞空の高さ（m）: 放物線。`airFrame` は滞空 F（1〜`LEAP_AIR_FRAMES`）。 */
export function leapHeight(airFrame: number): number {
  const t = Math.min(1, Math.max(0, airFrame / LEAP_AIR_FRAMES));
  return 4 * LEAP_PEAK_HEIGHT * t * (1 - t);
}

/** 届く範囲に切り詰めた着地点。 */
export function clampLanding(
  from: { readonly x: number; readonly z: number },
  to: { readonly x: number; readonly z: number },
): { x: number; z: number } {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const d = Math.hypot(dx, dz);
  if (d <= LEAP_MAX_DISTANCE) return { x: to.x, z: to.z };
  const k = LEAP_MAX_DISTANCE / d;
  return { x: from.x + dx * k, z: from.z + dz * k };
}

registerBossMove({
  id: 'leap',
  name: '跳躍叩きつけ',
  phases: [1, 2],
  stages: [LEAP_P1],
  phase2Stages: [LEAP_P2],
  // 接近しない（その場から跳ぶ。距離を詰めること自体が技）
  hooks: {
    onStageStart(ctx) {
      const { boss, target } = ctx;
      const origin = { x: boss.position.x, z: boss.position.z };
      states.set(boss, {
        origin,
        landing: clampLanding(origin, target),
        locked: false,
        frame: 0,
        airborne: false,
        height: 0,
        landed: false,
      });
    },
    onStep(ctx) {
      const state = states.get(ctx.boss);
      if (!state) return;
      const { boss, target, frame: f } = ctx;
      state.frame = f;
      // 着地点: 滞空 F20 まで追従し、以降は固定
      if (f <= LEAP_LOCK_FRAME) state.landing = clampLanding(state.origin, target);
      else state.locked = true;
      // 滞空: 残りの距離を残りのフレームで等分して、着地（段 F72）に間に合わせる
      state.airborne = f > LEAP_CROUCH_FRAMES && f <= COMMON.startup;
      if (state.airborne) {
        const remaining = COMMON.startup - f + 1;
        boss.moveBy(
          (state.landing.x - boss.position.x) / remaining,
          (state.landing.z - boss.position.z) / remaining,
        );
        state.height = leapHeight(f - LEAP_CROUCH_FRAMES);
      } else {
        state.height = 0;
      }
      state.landed = f > COMMON.startup;
    },
    onEnd(ctx) {
      states.delete(ctx.boss);
    },
    shape: (ctx: BossMoveContext) => {
      const landing = states.get(ctx.boss)?.landing ?? ctx.boss.position;
      return circleShape({ x: landing.x, y: ctx.boss.position.y, z: landing.z }, LEAP_RADIUS);
    },
  },
});

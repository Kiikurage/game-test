import { circleShape } from '../../combat';
import { registerBossMove, type BossMoveContext, type BossStageDef } from '../bossMove';

/**
 * 技 6 回転斬り（フェーズ 2 のみ。仕様書 6.3 節）。近・中距離の全周攻撃。
 *
 * | 回転 | 発生 | 持続 | 回転間 / 硬直 | ダメージ | 強靭度 | ガード時スタミナ | 判定 |
 * | 1 回転目 | 36 | 10 | 回転間 12F | 85 | 55 | 48 | 全周 360°・射程 4.8m |
 * | 2 回転目 | 12（回転間の隙） | 10 | 硬直 60 | 85 | 55 | 48 | 同上 |
 *
 * - 2 回転は 2 段の技（2 段目は `followUp` + `chained`）として表す。1 段目の硬直 0・2 段目の発生 12 で、1 回転目の判定の終わり
 *   （段 F46）から 2 回転目の判定の始まり（2 段目 F13）までが**ちょうど 12F の隙**になる。
 * - スーパーアーマー: 予備動作〜持続（各段）。通常攻撃では崩れない。
 * - 向きの追尾は 1 段目の F24 まで（向き固定の猶予 12F）。2 段目は追わない（全周なので向きは意味を持たないが、回転の見た目の基準）。
 * - 判定は足元から −0.3〜2.5m の高さの全周円（ハートボックスに触れたら当たる。中心距離 5.15m まで）。
 *
 * 回避: 1 回転目の判定（段 F37〜F46）にロールの無敵（F4〜F15）を重ねて、2 回転目の前（隙の 12F）に円（5.15m）の外へ出る。
 * または、ガードで 1 回目を受けて 2 回転目をロールで躱す。ボスに接近して離れないと当たる。
 *
 * 見た目: ボスのモデルは `spinStateOf(boss).angle`（ヨーへの加算。予備動作は逆向きに捻り、持続で 1 回転）で回す。
 * ルートの回転は手続き（クリップ `Sword_Regular_B` + 回転。マーカー表: `anim/data/bossClips.json`）。
 *
 * テレグラフ: 両段とも `heavy`（広範囲の強攻撃。ガードは可能なので `unblockable` ではない）。
 */

/** 判定の半径（射程。m）。 */
export const SPIN_RADIUS = 4.8;
/** 判定の高さ（足元から。m）。 */
export const SPIN_HEIGHT = { min: -0.3, max: 2.5 } as const;
/** 回転間の隙（F）: 1 回転目の判定の終わりから 2 回転目の判定の始まりの前まで。 */
export const SPIN_GAP = 12;
/** 1 回転目の発生。 */
export const SPIN_STARTUP = 36;
/** 各回転の持続（F）。 */
export const SPIN_ACTIVE = 10;
/** 予備動作で逆向きに捻る角（rad）。1 回転目 / 2 回転目。 */
export const SPIN_WINDUP = [1.0, 0.5] as const;

const COMMON = {
  damage: 85,
  poiseDamage: 55,
  guardStaminaCost: 48,
  moveDistance: 0,
  arcDeg: 360,
  range: SPIN_RADIUS,
  telegraph: 'heavy',
} as const satisfies Partial<BossStageDef>;

const SPIN_1: BossStageDef = {
  ...COMMON,
  id: 'spin.1',
  startup: SPIN_STARTUP,
  active: SPIN_ACTIVE,
  // 1 回転目の判定の終わり = 段の終わり。隙は 2 段目の発生（`SPIN_GAP`）
  recovery: 0,
  heavy: true,
  // 追尾は発生の 12F 前まで（向き固定の猶予）
  trackEndFrame: SPIN_STARTUP - 12,
  trackRate: 1,
  superArmor: { start: 1, end: SPIN_STARTUP + SPIN_ACTIVE },
};

const SPIN_2: BossStageDef = {
  ...COMMON,
  id: 'spin.2',
  startup: SPIN_GAP,
  active: SPIN_ACTIVE,
  recovery: 60,
  followUp: true,
  chained: true,
  trackEndFrame: 0,
  superArmor: { start: 1, end: SPIN_GAP + SPIN_ACTIVE },
};

/** 回転斬りの状態（描画・演出が読む。技の実行中だけ `spinStateOf` で引ける）。 */
export interface SpinState {
  /** 何回転目か（1 / 2）。 */
  rotation: 1 | 2;
  /** 段の F。 */
  frame: number;
  /** モデルのヨーへの加算（rad）。予備動作は逆向きに捻り、持続の間に 1 回転して 2π で終わる。 */
  angle: number;
  /** いまが判定の持続か。 */
  hitting: boolean;
  /** 判定が始まった回転の数（0〜2。SE・演出の起点に使う）。 */
  swings: number;
}

const states = new WeakMap<object, SpinState>();

/** `boss` の回転斬りの状態（実行中でなければ undefined）。 */
export function spinStateOf(boss: object): Readonly<SpinState> | undefined {
  return states.get(boss);
}

const smooth = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/**
 * モデルのヨーへの加算（rad）。`rotation` 回転目の段の F `frame`（F1 起点）。
 * 予備動作: 逆向きに `SPIN_WINDUP` まで捻る → 持続: 捻りから 2π まで急に回る（後半ほど遅い）→ 硬直: 0。
 */
export function spinAngle(rotation: 1 | 2, frame: number): number {
  const stage = rotation === 1 ? SPIN_1 : SPIN_2;
  const windup = SPIN_WINDUP[rotation - 1] ?? 0;
  if (frame <= stage.startup) return -windup * smooth(frame / stage.startup);
  if (frame <= stage.startup + stage.active) {
    const u = (frame - stage.startup) / stage.active;
    return -windup + (Math.PI * 2 + windup) * (1 - (1 - u) * (1 - u));
  }
  return 0;
}

registerBossMove({
  id: 'spin',
  name: '回転斬り',
  phases: [2],
  stages: [SPIN_1, SPIN_2],
  // 近・中距離。ボスに接近して離れないと当たる技なので、走って詰める
  approach: { speed: 'run', stopRange: 3.0 },
  hooks: {
    onStart(ctx) {
      states.set(ctx.boss, { rotation: 1, frame: 0, angle: 0, hitting: false, swings: 0 });
    },
    onStep(ctx) {
      const state = states.get(ctx.boss);
      if (!state) return;
      const rotation = ctx.stageIndex === 0 ? 1 : 2;
      const stage = rotation === 1 ? SPIN_1 : SPIN_2;
      const hitting = ctx.frame > stage.startup && ctx.frame <= stage.startup + stage.active;
      if (hitting && ctx.frame === stage.startup + 1) state.swings++;
      state.rotation = rotation;
      state.frame = ctx.frame;
      state.hitting = hitting;
      state.angle = spinAngle(rotation, ctx.frame);
    },
    onEnd(ctx) {
      states.delete(ctx.boss);
    },
    // 柱に触れたら `bossPillarHit`（破片の演出のフック）
    impactCircle: (ctx: BossMoveContext) => ({
      x: ctx.boss.position.x,
      z: ctx.boss.position.z,
      radius: SPIN_RADIUS,
    }),
    shape: (ctx: BossMoveContext) =>
      circleShape(ctx.boss.position, SPIN_RADIUS, SPIN_HEIGHT.min, SPIN_HEIGHT.max),
  },
});

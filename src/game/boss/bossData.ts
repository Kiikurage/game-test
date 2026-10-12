import { POISE } from '../data';
import { BOSS_AI_DATA as D, BOSS_MOVE_IDS, type BossMoveId } from '../data/bossAi';

export { BOSS_MOVE_IDS, type BossMoveId };

/**
 * ボス「門番の骸 オルグ」の数値（仕様書 6.2 / 6.3 / 6.4 節）。値と各項目の説明は `data/bossAi.json` / `data/bossAi.ts`、
 * 技ごとの数値は `data/bossMoves.json`。ここはゲーム側の公開名と派生値だけを置く。
 */

export type BossPhase = 1 | 2;

/** 距離帯: 近 < 3.5m / 中 3.5〜8m / 遠 > 8m。 */
export type DistanceBand = 'close' | 'mid' | 'far';

export const BOSS_STATS = { ...D.stats, poise: POISE.boss.max };

/** 距離帯の境界（m）。ちょうど 3.5m は中、ちょうど 8m も中。 */
export const BOSS_BANDS = D.bands;

export const BOSS_AI = D.ai;

/** プレイヤー状態による補正（6.4 節）。 */
export const BOSS_CORRECTION = D.correction;

/** スーパーアーマー区間の強靭度加算（実質、通常攻撃では削り切れない）。 */
export const BOSS_SUPER_ARMOR_BONUS = D.superArmorBonus;

export type WeightTable = Readonly<Partial<Record<BossMoveId, number>>>;

/**
 * 重み表（6.4 節）。`—`（その技を使えないフェーズ）は項目なし = 0。
 * 技が未登録（E5-3〜E5-5 で追加）のときは、その技を除いて残りで選ぶ。
 */
export const BOSS_WEIGHTS: Readonly<
  Record<BossPhase, Readonly<Record<DistanceBand, WeightTable>>>
> = D.weights;

/** ボス戦のルール（6.2 / 6.5 / 6.6 節）。 */
export const BOSS_BATTLE = {
  /** フェーズ 2 へ移る HP（以下になったあとの最初の硬直で移行）。フェーズ境界 = HP バーの目盛り。 */
  phase2Hp: BOSS_STATS.hp / 2,
  /** フェーズ移行の長さ（F1〜F120。この間ボスは無敵で行動しない。演出の実行は E5-6）。 */
  transitionFrames: D.battle.transitionFrames,
} as const;

/** 壁際の位置取り（6.6 節）。 */
export const BOSS_WALL = D.wall;

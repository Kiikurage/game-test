/**
 * ボス「門番の骸 オルグ」の AI 全体の数値と重み表（仕様書 6.2 / 6.4 / 6.5 / 6.6 節）。値は `bossAi.json`。
 * 技ごとの数値は `bossMoves.json`。ゲーム側の公開名（`BOSS_STATS` など）は `boss/bossData.ts`。
 */
import { s, type Infer, type Schema } from '../../core/schema';
import json from './bossAi.json';
import { loadData } from './loadData';

/** 技 ID（6.3 節の # 1〜7）。重み表・技表のキー。 */
export const BOSS_MOVE_IDS = [
  'overhead', // 1 大上段斬り
  'sweep', // 2 薙ぎ払い
  'combo3', // 3 三連撃
  'shieldBash', // 4 盾打ち → 斬り下ろし（P1 のみ）
  'leap', // 5 跳躍叩きつけ
  'spin', // 6 回転斬り（P2 のみ）
  'ashWave', // 7 灰の波（P2 のみ）
] as const;
export type BossMoveId = (typeof BOSS_MOVE_IDS)[number];

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });
const perPhase = <T>(v: Schema<T>) => s.object({ '1': v, '2': v });
const frameRange = s.refine(s.tuple(frames, frames), ([a, b]) =>
  a > b ? `${a} > ${b}` : undefined,
);

/** 重み表の 1 行。`—`（その技を使えないフェーズ）は項目なし = 0。 */
const WeightTableSchema = s.object(
  Object.fromEntries(BOSS_MOVE_IDS.map((id) => [id, s.optional(pos)])) as Record<
    BossMoveId,
    Schema<number> & { readonly optional: true }
  >,
);

export const BossAiDataSchema = s.object({
  /** hp / height・radius: 身長と被弾判定のカプセル / walkSpeed: 歩き（接近）/ runSpeed・turnDegPerSecond: フェーズごと。 */
  stats: s.object({
    hp: s.number({ min: 1 }),
    height: pos,
    radius: pos,
    walkSpeed: pos,
    runSpeed: perPhase(pos),
    turnDegPerSecond: perPhase(pos),
  }),
  /** 距離帯の境界（m）。近 < closeBelow、遠 > farAbove、ちょうど境界は中。 */
  bands: s.refine(s.object({ closeBelow: pos, farAbove: pos }), (b) =>
    b.closeBelow > b.farAbove ? 'closeBelow > farAbove' : undefined,
  ),
  /**
   * beatFrames: 技の硬直後の睨み合い [最小, 最大] F（両端含む）/ maxConsecutive: 同じ技を連続で選べる最大回数 /
   * repeatWeightFactor: 直前と同じ技の重み倍率 / repositionFrames: 選べる技がないとき対象へ歩み寄る長さ /
   * approachMaxFrames: 接近の打ち切り（技が指定しなければ）/ turnResponse: 向きの合わせ込みの強さ /
   * historyLength: 履歴に残す技の数。
   */
  ai: s.object({
    beatFrames: perPhase(frameRange),
    maxConsecutive: frames,
    repeatWeightFactor: pos,
    repositionFrames: frames,
    approachMaxFrames: frames,
    turnResponse: pos,
    historyLength: frames,
  }),
  /**
   * プレイヤー状態による補正（6.4 節）。behindHalfDeg・behindFrames: 背後（真後ろから ±deg）に居続けて補正がかかるまで /
   * behindWeightFactor: そのときの回転斬り（P2）・薙ぎ払いの重み倍率 / healTrackRate: 回復中に近距離のときの追尾率の倍率 /
   * rollStreak・rollStreakGapFrames: ロール連打とみなす回数と間隔の上限 / comboBonus: そのときの三連撃の確率の加算 /
   * retreatWindowFrames・retreatDistance・retreatLeapWeight: 近距離から後退されたときの跳躍の重みの下限（6.3 節 技 5）/
   * comboMinStartup: 補正で三連撃を選んだときも保つ 1 技目の発生の下限。
   */
  correction: s.object({
    behindHalfDeg: pos,
    behindFrames: frames,
    behindWeightFactor: pos,
    healTrackRate: pos,
    rollStreak: frames,
    rollStreakGapFrames: frames,
    comboBonus: s.number({ min: 0, max: 1 }),
    retreatWindowFrames: frames,
    retreatDistance: pos,
    retreatLeapWeight: pos,
    comboMinStartup: frames,
  }),
  /** スーパーアーマー区間の強靭度加算（実質、通常攻撃では削り切れない）。 */
  superArmorBonus: pos,
  /** 重み表（6.4 節）。フェーズ → 距離帯 → 技。 */
  weights: perPhase(
    s.object({ close: WeightTableSchema, mid: WeightTableSchema, far: WeightTableSchema }),
  ),
  /** フェーズ移行の長さ（この間ボスは無敵で行動しない）。 */
  battle: s.object({ transitionFrames: frames }),
  /** 壁際の位置取り（6.6 節）。プレイヤーが壁から playerWallGap 以内なら、近距離技の前に stepBackDistance 下がる。 */
  wall: s.object({ playerWallGap: pos, stepBackDistance: pos, stepBackFrames: frames }),
});
export type BossAiData = Infer<typeof BossAiDataSchema>;

export const BOSS_AI_DATA = loadData(BossAiDataSchema, json, 'bossAi.json');

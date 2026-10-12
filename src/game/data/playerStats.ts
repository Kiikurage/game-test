/**
 * プレイヤーのステータス・スタミナ・移動・入力バッファ（仕様書 2.1 / 2.2 / 2.4 節）。
 * 値は `playerStats.json`（スキーマは下、読み込みは `loadData.ts`）。
 */
import { s, type Infer } from '../../core/schema';
import { loadData } from './loadData';
import json from './playerStats.json';

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });

export const PlayerStatsDataSchema = s.object({
  player: s.object({
    hp: s.number({ min: 1 }),
    stamina: pos,
    /** 武器（直剣）の基本攻撃力。ダメージ = 基本攻撃力 × モーション倍率（四捨五入）。 */
    attackPower: pos,
    /** 強靭度（ポイズ）。 */
    poise: pos,
    /** 身長（m）と被弾判定カプセル。 */
    height: pos,
    hurtCapsule: s.object({ radius: pos, height: pos }),
    /** 回復瓶: 初期数、礼拝堂のアイテムで増える最大数。篝火で最大数まで補充。 */
    flask: s.refine(s.object({ initial: frames, max: frames }), (f) =>
      f.initial > f.max ? `initial (${f.initial}) > max (${f.max})` : undefined,
    ),
  }),
  /** スタミナ回復（2.1 節）。1F あたりの回復量は `perSecond / 60`（40 → 0.667/F）。 */
  stamina: s.object({
    /** 最後の消費から回復開始までの待ち（F）。 */
    regenDelayFrames: frames,
    /** 0 になった瞬間の回復開始までの待ち（F）。 */
    depletedDelayFrames: frames,
    regenPerSecond: pos,
    /** ガード中の回復（毎秒）。 */
    guardRegenPerSecond: pos,
    /** ダッシュの消費（毎秒）。走り・ダッシュ中は回復しない。 */
    dashCostPerSecond: pos,
  }),
  /** 移動速度（m/s）と加減速（2.2 節）。 */
  movement: s.object({
    walk: pos,
    run: pos,
    dash: pos,
    lockOn: s.object({ side: pos, back: pos, dash: pos }),
    guard: pos,
    guardLockOn: pos,
    heal: pos,
    /** 静止 → 走り最高速までのF、停止までのF。 */
    accelFrames: frames,
    stopFrames: frames,
    /** フリー時の旋回（度/秒）。 */
    turnDegPerSecond: pos,
    /** 登れる傾斜（度）と自動で乗り越える段差（m）。 */
    maxSlopeDeg: s.number({ min: 0, max: 90 }),
    stepHeight: pos,
  }),
  /** 先行入力（Buffer）の保持フレーム数（2.4 節）。ガードは保持入力なので常時。 */
  inputBufferFrames: s.object({ attack: frames, roll: frames, heal: frames }),
});
export type PlayerStatsData = Infer<typeof PlayerStatsDataSchema>;

const data = loadData(PlayerStatsDataSchema, json, 'playerStats.json');

export const PLAYER_STATS = data.player;
export const STAMINA = data.stamina;
export const MOVEMENT = data.movement;
export const INPUT_BUFFER_FRAMES = data.inputBufferFrames;

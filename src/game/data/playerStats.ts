/** プレイヤーのステータス・スタミナ・移動・入力バッファ（仕様書 2.1 / 2.2 / 2.4 節）。初期値で調整対象。 */

export const PLAYER_STATS = {
  hp: 300,
  stamina: 100,
  /** 武器（直剣）の基本攻撃力。ダメージ = 基本攻撃力 × モーション倍率（四捨五入）。 */
  attackPower: 40,
  /** 強靭度（ポイズ）。 */
  poise: 40,
  /** 身長（m）と被弾判定カプセル。 */
  height: 1.8,
  hurtCapsule: { radius: 0.35, height: 1.8 },
  /** 回復瓶: 初期数、礼拝堂のアイテムで増える最大数。篝火で最大数まで補充。 */
  flask: { initial: 3, max: 4 },
} as const;

/** スタミナ回復（2.1 節）。1F あたりの回復量は `perSecond / 60`（40 → 0.667/F）。 */
export const STAMINA = {
  /** 最後の消費から回復開始までの待ち（F）。 */
  regenDelayFrames: 45,
  /** 0 になった瞬間の回復開始までの待ち（F）。 */
  depletedDelayFrames: 60,
  regenPerSecond: 40,
  /** ガード中の回復（毎秒）。 */
  guardRegenPerSecond: 20,
  /** ダッシュの消費（毎秒）。走り・ダッシュ中は回復しない。 */
  dashCostPerSecond: 10,
} as const;

/** 移動速度（m/s）と加減速（2.2 節）。 */
export const MOVEMENT = {
  walk: 1.8,
  run: 4.5,
  dash: 6.5,
  lockOn: { side: 3.8, back: 2.6, dash: 5.5 },
  guard: 1.8,
  guardLockOn: 1.4,
  heal: 1.0,
  /** 静止 → 走り最高速までのF、停止までのF。 */
  accelFrames: 8,
  stopFrames: 6,
  /** フリー時の旋回（度/秒）。 */
  turnDegPerSecond: 720,
  /** 登れる傾斜（度）と自動で乗り越える段差（m）。 */
  maxSlopeDeg: 40,
  stepHeight: 0.35,
} as const;

/** 先行入力（Buffer）の保持フレーム数（2.4 節）。ガードは保持入力なので常時。 */
export const INPUT_BUFFER_FRAMES = {
  attack: 10,
  roll: 8,
  heal: 6,
} as const;

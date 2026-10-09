/** 入力まわりの調整値。感度・時間・しきい値はここに集約する。 */

/** 先行入力バッファの保持時間（秒）。 */
export const INPUT_BUFFER_SECONDS = 0.15;
/** 先行入力バッファの対象にするアクション（ガード・ロックオンは状態系なので対象外）。 */
export const BUFFERED_ACTIONS = [
  'lightAttack',
  'heavyAttack',
  'dodge',
  'item',
  'interact',
] as const;

/** 回避ボタンをこの時間（実時間）以上押し続けるとダッシュ扱い、それ未満で離すと回避（秒）。 */
export const DODGE_HOLD_SECONDS = 0.25;

/** カメラ感度。 */
export const LOOK_SENSITIVITY = {
  /** マウス: rad / px */
  mouse: 0.0022,
  /** タッチドラッグ: rad / CSS px */
  touch: 0.0055,
  /** ゲームパッド: 最大傾き時の角速度 rad / 秒 */
  gamepad: 3.2,
} as const;

/** true にすると上下を反転する（操作が逆に感じる人向けの設定）。 */
export const INVERT_LOOK_Y: boolean = false;

export const GAMEPAD = {
  moveDeadzone: 0.18,
  lookDeadzone: 0.12,
  /** カメラ用スティックの応答カーブ指数（1 で線形、>1 で中央付近を繊細に）。 */
  lookCurve: 1.6,
  /** アナログトリガーを押下とみなす値。 */
  triggerThreshold: 0.5,
} as const;

export const KEYBOARD_MOUSE = {
  /** ホイールでのターゲット切替の連続入力を抑える間隔（ミリ秒）。 */
  wheelCooldownMs: 220,
} as const;

export const TOUCH = {
  /** フローティングスティックの半径（CSS px）。 */
  stickRadius: 56,
  /** タッチスティックのデッドゾーン（0..1 に正規化後）。 */
  stickDeadzone: 0.1,
  /** 右側フリック（ターゲット切替）の判定。 */
  flick: {
    maxDurationMs: 260,
    minDistance: 56,
    /** 横移動が縦移動の何倍以上か。 */
    horizontalRatio: 1.8,
  },
  /** 押下時の触覚フィードバック（ms）。0 で無効。対応端末のみ。 */
  vibrateMs: 6 as number,
} as const;

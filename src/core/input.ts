/**
 * ゲームロジックが読む入力の型（デバイス非依存）。DOM / three に依存しない。
 * 実装は `src/input/`（InputSystem）。game 層はこの型だけを知ればよい。
 */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** ボタン系アクション。 */
export const ACTIONS = [
  'lightAttack',
  'heavyAttack',
  'dodge',
  'guard',
  'lockOn',
  'item',
  'interact',
] as const;

export type Action = (typeof ACTIONS)[number];

/** 最後に操作された入力デバイスの種別。 */
export type InputDevice = 'kbm' | 'gamepad' | 'touch';

/**
 * 1 シミュレーションステップ分のボタン状態。
 * - pressed: このステップ中に押下された（押下→即離しでも取りこぼさない）
 * - held: ステップ終了時点で押されている
 * - released: このステップ中に離された
 *
 * `dodge` だけは特別で、pressed = 「回避が確定した（短押しして離した）」、
 * held / released = 物理ボタンの状態。長押し（ダッシュ）は `InputSnapshot.sprint` を使う。
 */
export interface ButtonState {
  readonly pressed: boolean;
  readonly held: boolean;
  readonly released: boolean;
}

export interface InputSnapshot {
  /**
   * 移動入力。x: 右が正, y: 前が正。長さは 0..1（デッドゾーン処理・スケーリング済み）。
   * カメラ基準の向きへの変換は game 側で行う。
   */
  readonly move: Vec2;
  /**
   * 前ステップからのカメラ回転量[rad]（感度適用済み）。x: 右を向くのが正, y: 上を向くのが正。
   * マウス/タッチは移動量、ゲームパッドはスティック傾き×角速度×dt。
   * ステップ間隔に依存しない「量」なので、そのままカメラ角に加算すればよい。
   */
  readonly look: Vec2;
  /** 回避ボタンの長押し（ダッシュ）中か。 */
  readonly sprint: boolean;
  /** ロックオン対象の切替要求。-1: 左, 1: 右, 0: なし。 */
  readonly targetSwitch: -1 | 0 | 1;
  readonly buttons: Readonly<Record<Action, ButtonState>>;
  readonly device: InputDevice;
}

/** ゲームロジックが毎ステップ読む入力インターフェース。 */
export interface InputReader {
  /** 最新ステップの入力スナップショット。 */
  readonly snapshot: InputSnapshot;
  /**
   * 先行入力バッファから `action` を消費する。
   * 直近 `INPUT_BUFFER_SECONDS` 以内に押下（回避は確定）されていて未消費なら true を返し、バッファを空にする。
   * 「行動可能になったフレームで消費する」使い方を想定。
   */
  consumeBuffered(action: Action): boolean;
  /** 消費せずに、バッファされた入力があるかだけ調べる。 */
  hasBuffered(action: Action): boolean;
  /** バッファを破棄する（行動不能になった等）。省略時は全アクション。 */
  clearBuffer(action?: Action): void;
  /**
   * 1 ステップ分、先行入力バッファの経過時間を止める（ヒットストップ中に呼ぶ。仕様書 4.1 節）。
   * 保持中の入力の期限を `dt` 秒延ばすので、凍結したステップ数だけ期限が延びる。
   */
  holdBuffer?(dt: number): void;
}

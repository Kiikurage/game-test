// 操作ヒント・通知のデータ（E6-2b）。文言はデバイス別。操作割当は docs/controls.md。
import type { Action, InputDevice } from '../../core/input';

export type HintText = Readonly<Record<InputDevice, string>>;

/** ヒントを達成とみなす条件。 */
export type HintGoal =
  /** 移動入力（0..1 の大きさが `threshold` 以上）を合計 `seconds` 秒続けた。 */
  | { readonly type: 'move'; readonly seconds: number; readonly threshold: number }
  /** カメラの回転量（rad）の合計が `radians` に達した。 */
  | { readonly type: 'look'; readonly radians: number }
  /** そのボタンが押された。 */
  | { readonly type: 'press'; readonly action: Action }
  /** ロックオンした（ボタンまたは対象が付いた）。 */
  | { readonly type: 'lockOn' };

export interface HintDef {
  readonly id: string;
  /** 'opening': 開始時、順番に。'combat': 敵が近いとき（opening より優先）、順番に。 */
  readonly group: 'opening' | 'combat';
  readonly text: HintText;
  readonly goal: HintGoal;
}

/** 配列の順が各グループ内の表示順（実行すると次へ）。 */
export const HINTS: readonly HintDef[] = [
  {
    id: 'move',
    group: 'opening',
    text: { kbm: 'WASD で移動', gamepad: '左スティックで移動', touch: '左側をなぞって移動' },
    goal: { type: 'move', seconds: 0.4, threshold: 0.3 },
  },
  {
    id: 'camera',
    group: 'opening',
    text: {
      kbm: 'マウスでカメラを回す',
      gamepad: '右スティックでカメラを回す',
      touch: '右側をなぞってカメラを回す',
    },
    goal: { type: 'look', radians: 0.8 },
  },
  {
    id: 'roll',
    group: 'opening',
    text: { kbm: 'Space でロール', gamepad: 'B でロール', touch: '「回避」でロール' },
    goal: { type: 'press', action: 'dodge' },
  },
  {
    id: 'lockOn',
    group: 'combat',
    text: {
      kbm: 'Q でロックオン',
      gamepad: '右スティック押し込みでロックオン',
      touch: '「固定」でロックオン',
    },
    goal: { type: 'lockOn' },
  },
  {
    id: 'lightAttack',
    group: 'combat',
    text: { kbm: '左クリックで攻撃', gamepad: 'RB で攻撃', touch: '「弱」で攻撃' },
    goal: { type: 'press', action: 'lightAttack' },
  },
];

export const GUIDE = {
  /** 「初めての敵」ヒントを出す、生きている敵との距離（m）。 */
  enemyNearM: 22,
  /** 開始から最初のヒントを出すまでの猶予（秒）。 */
  openingDelaySeconds: 1,
} as const;

export const NOTICE = {
  /** 通知の表示時間（秒）。アイテムは `itemPicked.noticeSeconds` を優先する。 */
  seconds: 3,
  /** 続けて出す通知の間（秒）。 */
  gapSeconds: 0.3,
  /** 待ち行列の上限（超えたら古い待ちから捨てる）。 */
  maxQueue: 4,
  shortcutOpened: '近道が開いた',
} as const;

// 操作表記（状況ボタン・操作ヒントの文言）のデバイス別の部品。実際の割当は docs/controls.md。
import type { InputDevice } from './input';

/** インタラクト（状況アクション）のキー表記。PC は E、パッドは A、タッチはタップ。 */
export const INTERACT_KEY_LABEL: Readonly<Record<InputDevice, string>> = {
  kbm: 'E',
  gamepad: 'A',
  touch: 'タップ',
};

/** 状況ボタンの文言。PC「E 休む」/ パッド「A 休む」/ モバイル「タップ：休む」。 */
export function interactPromptText(device: InputDevice, label: string): string {
  return device === 'touch' ? `タップ：${label}` : `${INTERACT_KEY_LABEL[device]} ${label}`;
}

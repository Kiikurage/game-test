import type { Action, InputReader, InputSnapshot } from '../../core/input';
import { ACTIONS } from '../../core/input';

const IDLE_BUTTON = { pressed: false, held: false, released: false } as const;
const IDLE_BUTTONS = Object.fromEntries(ACTIONS.map((a) => [a, IDLE_BUTTON])) as Record<
  Action,
  typeof IDLE_BUTTON
>;

/** 強制歩行の移動入力の強さ（0.25..0.55 は歩き）。 */
export const FORCED_WALK_INPUT = 0.4;

/**
 * 演出で「入力を奪って歩かせる」ための入力（霧の門の入場など）。ボタンはすべて離した状態で、移動入力だけが
 * 指定のワールド方向（ヨー）へ向く。実際の入力は読まず、先行入力バッファも持たない。
 */
export class ForcedWalkInput implements InputReader {
  private readonly move = { x: 0, y: 0 };
  private readonly state: InputSnapshot = {
    move: this.move,
    look: { x: 0, y: 0 },
    sprint: false,
    targetSwitch: 0,
    buttons: IDLE_BUTTONS,
    device: 'kbm',
  };

  /** `worldYaw` へ歩く入力に設定する（カメラのヨーから見た前後左右へ変換する）。 */
  aim(worldYaw: number, cameraYaw: number): this {
    // 前 = (sin c, cos c)、右 = (-cos c, sin c) のカメラ基準（movement.cameraRelativeMove の逆）
    const d = worldYaw - cameraYaw;
    this.move.x = -Math.sin(d) * FORCED_WALK_INPUT;
    this.move.y = Math.cos(d) * FORCED_WALK_INPUT;
    return this;
  }

  get snapshot(): InputSnapshot {
    return this.state;
  }

  consumeBuffered(): boolean {
    return false;
  }

  hasBuffered(): boolean {
    return false;
  }

  clearBuffer(): void {}

  holdBuffer(): void {}
}

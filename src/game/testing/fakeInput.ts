import {
  ACTIONS,
  type Action,
  type ButtonState,
  type InputReader,
  type InputSnapshot,
} from '../../core/input';

const IDLE: ButtonState = { pressed: false, held: false, released: false };

/**
 * テスト用の InputReader。`set*` で次のステップの入力を書き換え、`endStep` で押下・離上を消す
 * （実際の InputSystem と同様に、バッファは 9F = 0.15 秒保持する）。
 */
export class FakeInput implements InputReader {
  private move = { x: 0, y: 0 };
  private look = { x: 0, y: 0 };
  private sprint = false;
  private targetSwitch: -1 | 0 | 1 = 0;
  private readonly buttons = Object.fromEntries(ACTIONS.map((a) => [a, IDLE])) as Record<
    Action,
    ButtonState
  >;
  private readonly bufferedAt = new Map<Action, number>();
  private step = 0;
  /** バッファの保持ステップ数（INPUT_BUFFER_SECONDS = 0.15s）。 */
  private readonly bufferSteps = 9;

  get snapshot(): InputSnapshot {
    return {
      move: this.move,
      look: this.look,
      sprint: this.sprint,
      targetSwitch: this.targetSwitch,
      buttons: this.buttons,
      device: 'kbm',
    };
  }

  setMove(x: number, y: number): void {
    this.move = { x, y };
  }

  setLook(x: number, y: number): void {
    this.look = { x, y };
  }

  setSprint(on: boolean): void {
    this.sprint = on;
  }

  switchTarget(dir: -1 | 1): void {
    this.targetSwitch = dir;
  }

  /** 次のステップで押下（pressed）にする。バッファ対象ならバッファにも積む。 */
  press(action: Action): void {
    this.buttons[action] = { pressed: true, held: true, released: false };
    this.bufferedAt.set(action, this.step);
  }

  release(action: Action): void {
    this.buttons[action] = { pressed: false, held: false, released: true };
  }

  hold(action: Action, held: boolean): void {
    this.buttons[action] = { pressed: false, held, released: false };
  }

  /** ステップを 1 つ進めたあとに呼ぶ（押下・離上・切替・回転量を消す）。 */
  endStep(): void {
    this.step++;
    for (const action of ACTIONS) {
      const b = this.buttons[action];
      if (b.pressed || b.released)
        this.buttons[action] = { pressed: false, held: b.held, released: false };
    }
    this.targetSwitch = 0;
    this.look = { x: 0, y: 0 };
  }

  consumeBuffered(action: Action): boolean {
    if (!this.hasBuffered(action)) return false;
    this.bufferedAt.delete(action);
    return true;
  }

  hasBuffered(action: Action): boolean {
    const at = this.bufferedAt.get(action);
    return at !== undefined && this.step - at <= this.bufferSteps;
  }

  clearBuffer(action?: Action): void {
    if (action) this.bufferedAt.delete(action);
    else this.bufferedAt.clear();
  }
}

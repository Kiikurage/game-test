// 入力層（キーボード / マウス / ゲームパッド / タッチ）。
// 方針: DOM イベントはこの層で受け、シミュレーションには「固定ステップごとの入力スナップショット」
// だけを渡す（game 層はデバイスを知らない。型は core/input.ts）。
import {
  ACTIONS,
  type Action,
  type ButtonState,
  type InputDevice,
  type InputReader,
  type InputSnapshot,
} from '../core/input';
import {
  BUFFERED_ACTIONS,
  DODGE_HOLD_SECONDS,
  INPUT_BUFFER_SECONDS,
  INPUT_BUFFER_SECONDS_BY_ACTION,
  LOOK_SENSITIVITY,
} from './config';
import { DodgeButton } from './dodgeButton';
import { GamepadInput } from './gamepad';
import { InputBuffer } from './inputBuffer';
import { InputCollector } from './inputCollector';
import { KeyboardMouseInput } from './keyboardMouse';
import { TouchControls } from './touch/touchControls';

export { INPUT_BUFFER_SECONDS } from './config';

const IDLE_BUTTON: ButtonState = { pressed: false, held: false, released: false };

function idleButtons(): Record<Action, ButtonState> {
  return Object.fromEntries(ACTIONS.map((a) => [a, IDLE_BUTTON])) as Record<Action, ButtonState>;
}

/** E2E / デバッグ用に公開する入力の観測値。 */
export interface InputDebugState {
  readonly device: InputDevice;
  readonly move: { x: number; y: number };
  readonly sprint: boolean;
  /** 現在押されているアクション。 */
  readonly held: readonly Action[];
  /** 起動からの押下回数（dodge は回避確定の回数）。 */
  readonly pressCounts: Readonly<Record<Action, number>>;
  /** 起動からのカメラ回転量の累計 [rad]。 */
  readonly lookTotal: { x: number; y: number };
  /** ターゲット切替要求の累計回数（左 / 右）。 */
  readonly targetSwitches: { left: number; right: number };
}

/**
 * 入力システム。デバイスからの入力を集約し、毎シミュレーションステップ `step(dt)` で
 * スナップショットを確定する。ゲームロジックは `InputReader` として読む。
 */
export class InputSystem implements InputReader {
  private readonly collector = new InputCollector();
  private readonly buffer = new InputBuffer(INPUT_BUFFER_SECONDS, INPUT_BUFFER_SECONDS_BY_ACTION);
  private readonly dodge = new DodgeButton(DODGE_HOLD_SECONDS * 1000);
  private readonly keyboardMouse: KeyboardMouseInput;
  private readonly gamepad: GamepadInput;
  private readonly touch: TouchControls;

  private device: InputDevice;
  private clock = 0;
  private current: InputSnapshot;

  private readonly pressCounts = Object.fromEntries(ACTIONS.map((a) => [a, 0])) as Record<
    Action,
    number
  >;
  private readonly lookTotal = { x: 0, y: 0 };
  private readonly targetSwitches = { left: 0, right: 0 };

  /**
   * @param root キーボード/マウス入力を受けるキャンバスの親要素（Pointer Lock の対象）。
   *   タッチ UI は `document.body` に追加する。
   */
  constructor(root: HTMLElement) {
    this.device = detectInitialDevice();
    this.applyDevice();
    this.current = {
      move: { x: 0, y: 0 },
      look: { x: 0, y: 0 },
      sprint: false,
      targetSwitch: 0,
      buttons: idleButtons(),
      device: this.device,
    };

    this.keyboardMouse = new KeyboardMouseInput(this.collector, root, () => {
      this.setDevice('kbm');
    });
    this.keyboardMouse.attach();
    this.gamepad = new GamepadInput(this.collector, LOOK_SENSITIVITY.gamepad, () => {
      this.setDevice('gamepad');
    });
    this.touch = new TouchControls(this.collector, () => {
      this.setDevice('touch');
    });
    document.body.appendChild(this.touch.element);

    // 非表示中のタッチ UI は入力を受けないため、最初のタッチはここで検出して UI を出す。
    window.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'touch') this.setDevice('touch');
      },
      { capture: true, passive: true },
    );
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetAll();
    });
    window.addEventListener('blur', () => {
      this.resetAll();
    });
  }

  get snapshot(): InputSnapshot {
    return this.current;
  }

  consumeBuffered(action: Action): boolean {
    return this.buffer.consume(action, this.clock);
  }

  hasBuffered(action: Action): boolean {
    return this.buffer.has(action, this.clock);
  }

  clearBuffer(action?: Action): void {
    this.buffer.clear(action);
  }

  /**
   * 1 シミュレーションステップ分の入力を確定する。`Game.update` の直前に毎ステップ呼ぶ。
   * @param dt ステップ長（秒）
   */
  step(dt: number): InputSnapshot {
    this.clock += dt;
    this.gamepad.poll(dt);
    const raw = this.collector.drain();

    const dodgeRaw = raw.buttons.dodge;
    const rolled = this.dodge.update(performance.now(), dodgeRaw);

    const buttons = {} as Record<Action, ButtonState>;
    for (const action of ACTIONS) {
      const b = raw.buttons[action];
      buttons[action] = action === 'dodge' ? { ...b, pressed: rolled } : b;
      if (buttons[action].pressed) {
        this.pressCounts[action]++;
        if ((BUFFERED_ACTIONS as readonly Action[]).includes(action)) {
          this.buffer.push(action, this.clock);
        }
      }
    }

    this.lookTotal.x += raw.look.x;
    this.lookTotal.y += raw.look.y;
    if (raw.targetSwitch < 0) this.targetSwitches.left++;
    if (raw.targetSwitch > 0) this.targetSwitches.right++;

    this.current = {
      move: raw.move,
      look: raw.look,
      sprint: this.dodge.sprint,
      targetSwitch: raw.targetSwitch,
      buttons,
      device: this.device,
    };
    return this.current;
  }

  get debugState(): InputDebugState {
    const s = this.current;
    return {
      device: this.device,
      move: { ...s.move },
      sprint: s.sprint,
      held: ACTIONS.filter((a) => s.buttons[a].held),
      pressCounts: { ...this.pressCounts },
      lookTotal: { ...this.lookTotal },
      targetSwitches: { ...this.targetSwitches },
    };
  }

  private setDevice(device: InputDevice): void {
    if (device === this.device) return;
    const prev = this.device;
    this.device = device;
    this.applyDevice();
    // 離れたデバイスの押しっぱなしを解除する（タッチ UI が消えて指を離せなくなる等の防止）
    if (prev === 'touch') this.touch.reset();
  }

  private applyDevice(): void {
    document.documentElement.dataset.inputDevice = this.device;
  }

  private resetAll(): void {
    this.keyboardMouse.reset();
    this.gamepad.reset();
    this.touch.reset();
    this.dodge.reset();
    this.buffer.clear();
  }
}

/** 起動直後の入力デバイス。タッチが主入力（coarse pointer）の端末ならタッチ UI から始める。 */
function detectInitialDevice(): InputDevice {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return coarse && navigator.maxTouchPoints > 0 ? 'touch' : 'kbm';
}

import type { Action, Vec2 } from '../core/input';
import { GAMEPAD, INVERT_LOOK_Y } from './config';
import { applyRadialDeadzone, applyResponseCurve } from './deadzone';
import type { InputCollector } from './inputCollector';

/** Gamepad API の読み取りに必要な最小限の形（テスト用に差し替え可能）。 */
export interface GamepadLike {
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
}

/** 標準マッピング（https://w3c.github.io/gamepad/#remapping）のボタン番号。 */
export const PAD_BUTTON = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  lb: 4,
  rb: 5,
  lt: 6,
  rt: 7,
  l3: 10,
  r3: 11,
  dpadLeft: 14,
  dpadRight: 15,
} as const;

/** ボタン割当（標準マッピング）。 */
export const PAD_ACTION_BUTTON: Readonly<Record<Action, number>> = {
  lightAttack: PAD_BUTTON.rb,
  heavyAttack: PAD_BUTTON.rt,
  guard: PAD_BUTTON.lb,
  dodge: PAD_BUTTON.b,
  lockOn: PAD_BUTTON.r3,
  item: PAD_BUTTON.x,
  interact: PAD_BUTTON.a,
};

export interface GamepadReading {
  /** 左スティック（デッドゾーン処理済み、y は前が正）。 */
  move: Vec2;
  /** 右スティック（デッドゾーン + 応答カーブ処理済み、-1..1。x: 右が正, y: 上が正）。 */
  look: Vec2;
  buttons: Record<Action, boolean>;
  dpadLeft: boolean;
  dpadRight: boolean;
}

/** アナログ値では判定しない（pressed のみ）。 */
const DIGITAL = Number.POSITIVE_INFINITY;

function isDown(pad: GamepadLike, index: number, analogThreshold: number): boolean {
  const b = pad.buttons[index];
  if (!b) return false;
  // アナログトリガーは value で判定する（pressed が立つ前に反応させる）
  return b.pressed || b.value >= analogThreshold;
}

/** パッドの 1 回分の状態を、デバイス非依存の値へ変換する（純粋関数）。 */
export function readGamepad(pad: GamepadLike): GamepadReading {
  const lx = pad.axes[0] ?? 0;
  const ly = pad.axes[1] ?? 0;
  const rx = pad.axes[2] ?? 0;
  const ry = pad.axes[3] ?? 0;
  const lm = applyRadialDeadzone(lx, -ly, GAMEPAD.moveDeadzone);
  const rl = applyResponseCurve(
    applyRadialDeadzone(rx, -ry, GAMEPAD.lookDeadzone),
    GAMEPAD.lookCurve,
  );
  const t = GAMEPAD.triggerThreshold;
  return {
    move: lm,
    look: { x: rl.x, y: INVERT_LOOK_Y ? -rl.y : rl.y },
    buttons: {
      lightAttack: isDown(pad, PAD_ACTION_BUTTON.lightAttack, DIGITAL),
      heavyAttack: isDown(pad, PAD_ACTION_BUTTON.heavyAttack, t),
      guard: isDown(pad, PAD_ACTION_BUTTON.guard, DIGITAL),
      dodge: isDown(pad, PAD_ACTION_BUTTON.dodge, DIGITAL),
      lockOn: isDown(pad, PAD_ACTION_BUTTON.lockOn, DIGITAL),
      item: isDown(pad, PAD_ACTION_BUTTON.item, DIGITAL),
      interact: isDown(pad, PAD_ACTION_BUTTON.interact, DIGITAL),
    },
    dpadLeft: isDown(pad, PAD_BUTTON.dpadLeft, DIGITAL),
    dpadRight: isDown(pad, PAD_BUTTON.dpadRight, DIGITAL),
  };
}

function hasActivity(r: GamepadReading): boolean {
  return (
    r.move.x !== 0 ||
    r.move.y !== 0 ||
    r.look.x !== 0 ||
    r.look.y !== 0 ||
    r.dpadLeft ||
    r.dpadRight ||
    Object.values(r.buttons).some(Boolean)
  );
}

/** Gamepad API のポーリング。毎シミュレーションステップ前に `poll` を呼ぶ。 */
export class GamepadInput {
  private prevLeft = false;
  private prevRight = false;
  private wasConnected = false;

  constructor(
    private readonly collector: InputCollector,
    private readonly lookRadPerSecond: number,
    /** 入力があったとき（デバイス切替の判定用）。 */
    private readonly onActivity: () => void,
    private readonly getPads: () => readonly (GamepadLike | null)[] = () =>
      typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [],
  ) {}

  poll(dt: number): void {
    const pad = this.pickPad();
    if (!pad) {
      if (this.wasConnected) this.reset();
      return;
    }
    this.wasConnected = true;
    const r = readGamepad(pad);
    if (hasActivity(r)) this.onActivity();

    this.collector.setMove('gamepad', r.move.x, r.move.y);
    this.collector.addLook(
      r.look.x * this.lookRadPerSecond * dt,
      r.look.y * this.lookRadPerSecond * dt,
    );
    for (const action of Object.keys(r.buttons) as Action[]) {
      this.collector.setButton('gamepad', action, r.buttons[action]);
    }
    if (r.dpadLeft && !this.prevLeft) this.collector.requestTargetSwitch(-1);
    if (r.dpadRight && !this.prevRight) this.collector.requestTargetSwitch(1);
    this.prevLeft = r.dpadLeft;
    this.prevRight = r.dpadRight;
  }

  reset(): void {
    this.collector.releaseSource('gamepad');
    this.prevLeft = false;
    this.prevRight = false;
    this.wasConnected = false;
  }

  /** 標準的なレイアウト（軸 4 本以上）の最初の接続済みパッド。 */
  private pickPad(): GamepadLike | null {
    for (const p of this.getPads()) {
      if (p && p.axes.length >= 4 && p.buttons.length >= 12) return p;
    }
    return null;
  }
}

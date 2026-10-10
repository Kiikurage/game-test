import type { Action } from '../core/input';
import { INVERT_LOOK_Y, KEYBOARD_MOUSE, LOOK_SENSITIVITY } from './config';
import type { InputCollector } from './inputCollector';

/** キー割当（KeyboardEvent.code）。 */
export const KEY_ACTIONS: Readonly<Record<string, Action>> = {
  Space: 'dodge',
  ShiftLeft: 'guard',
  ShiftRight: 'guard',
  KeyQ: 'lockOn',
  KeyR: 'item',
  KeyE: 'interact',
};

/** 移動キー。 */
export const MOVE_KEYS = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
} as const;

/** ターゲット切替キー。 */
export const TARGET_KEYS = { left: 'ArrowLeft', right: 'ArrowRight' } as const;

/** マウスボタン割当（MouseEvent.button）。0: 左, 1: 中, 2: 右。 */
export const MOUSE_ACTIONS: Readonly<Record<number, Action>> = {
  0: 'lightAttack',
  2: 'heavyAttack',
  1: 'lockOn',
};

/** 移動キーの押下状態から移動ベクトルを作る（斜めは長さ 1 に正規化）。 */
export function keysToMove(down: ReadonlySet<string>): { x: number; y: number } {
  const x = (down.has(MOVE_KEYS.right) ? 1 : 0) - (down.has(MOVE_KEYS.left) ? 1 : 0);
  const y = (down.has(MOVE_KEYS.forward) ? 1 : 0) - (down.has(MOVE_KEYS.back) ? 1 : 0);
  if (x !== 0 && y !== 0) return { x: x * Math.SQRT1_2, y: y * Math.SQRT1_2 };
  return { x, y };
}

/** 異常値の判定を行う、ロック取得後の mousemove の数。 */
export const SPIKE_CHECK_MOVES = 5;

/** ロック取得後の最初の数回の mousemove の移動量（px）がこれを超えたら異常値として捨てる。 */
export const FIRST_MOVE_SPIKE_PX = 300;

/**
 * Pointer Lock を取得した後の最初の数回の mousemove に、直前のカーソル位置との差が巨大な値（ビューポート半分ほど）で
 * まとめて届くことがある。最初の数イベントだけを対象に、異常に大きいものを捨てる（通常のプレイ中の素早い振りは捨てない）。
 */
export function isFirstMoveSpike(movementX: number, movementY: number): boolean {
  return Math.abs(movementX) > FIRST_MOVE_SPIKE_PX || Math.abs(movementY) > FIRST_MOVE_SPIKE_PX;
}

/**
 * キーボード / マウス入力。カメラは Pointer Lock 中のみ動かす（キャンバスのクリックでロック開始）。
 * ロックを取得したクリック自体は攻撃として扱わない。
 */
export class KeyboardMouseInput {
  private readonly keys = new Set<string>();
  private lastWheelMs = Number.NEGATIVE_INFINITY;
  /** Pointer Lock を取得してから受けた mousemove の数（異常値の判定は最初の数イベントだけ）。 */
  private movesSinceLock = Number.POSITIVE_INFINITY;
  private disposers: (() => void)[] = [];

  constructor(
    private readonly collector: InputCollector,
    private readonly target: HTMLElement,
    private readonly onActivity: () => void,
  ) {}

  get pointerLocked(): boolean {
    return document.pointerLockElement === this.target;
  }

  attach(): void {
    this.listen(window, 'keydown', this.onKeyDown);
    this.listen(window, 'keyup', this.onKeyUp);
    this.listen(window, 'blur', () => {
      this.reset();
    });
    this.listen(this.target, 'pointerdown', this.onPointerDown);
    this.listen(window, 'pointerup', this.onPointerUp);
    this.listen(window, 'pointercancel', this.onPointerUp);
    this.listen(window, 'mousemove', this.onMouseMove);
    this.listen(this.target, 'wheel', this.onWheel, { passive: false });
    this.listen(this.target, 'contextmenu', (e: Event) => {
      e.preventDefault();
    });
    this.listen(document, 'pointerlockchange', () => {
      if (this.pointerLocked) this.movesSinceLock = 0;
      else this.releaseMouseButtons();
    });
  }

  dispose(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    this.reset();
  }

  reset(): void {
    this.keys.clear();
    this.collector.releaseSource('keyboard');
    this.releaseMouseButtons();
  }

  private releaseMouseButtons(): void {
    this.collector.releaseSource('mouse');
  }

  private listen(
    t: EventTarget,
    type: string,
    handler: (e: never) => void,
    options?: AddEventListenerOptions,
  ): void {
    const fn = handler as (e: Event) => void;
    t.addEventListener(type, fn, options);
    this.disposers.push(() => {
      t.removeEventListener(type, fn, options);
    });
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    const isMove = (Object.values(MOVE_KEYS) as string[]).includes(code);
    const action = KEY_ACTIONS[code];
    const isTarget = code === TARGET_KEYS.left || code === TARGET_KEYS.right;
    if (!isMove && !action && !isTarget) return;
    // ブラウザのショートカット（Ctrl+R など）は邪魔しない
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault(); // Space によるスクロール等を抑止
    this.onActivity();
    if (e.repeat) return;
    if (isMove) {
      this.keys.add(code);
      const m = keysToMove(this.keys);
      this.collector.setMove('keyboard', m.x, m.y);
    }
    if (action) {
      this.keys.add(code);
      this.collector.setButton('keyboard', action, true);
    }
    if (code === TARGET_KEYS.left) this.collector.requestTargetSwitch(-1);
    if (code === TARGET_KEYS.right) this.collector.requestTargetSwitch(1);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const code = e.code;
    if (this.keys.delete(code) && (Object.values(MOVE_KEYS) as string[]).includes(code)) {
      const m = keysToMove(this.keys);
      this.collector.setMove('keyboard', m.x, m.y);
    }
    const action = KEY_ACTIONS[code];
    if (!action) return;
    // 同じアクションに割り当てた別のキー（左右 Shift 等）がまだ押されていれば継続する
    const stillHeld = Object.entries(KEY_ACTIONS).some(
      ([k, a]) => a === action && this.keys.has(k),
    );
    if (!stillHeld) this.collector.setButton('keyboard', action, false);
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    this.onActivity();
    if (!this.pointerLocked) {
      this.requestLock();
      return; // ロック取得クリックは攻撃にしない
    }
    const action = MOUSE_ACTIONS[e.button];
    if (!action) return;
    e.preventDefault(); // 中クリックのオートスクロール抑止
    this.collector.setButton('mouse', action, true);
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    const action = MOUSE_ACTIONS[e.button];
    if (action) this.collector.setButton('mouse', action, false);
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    if (!this.pointerLocked) return;
    if (this.movesSinceLock < SPIKE_CHECK_MOVES) {
      this.movesSinceLock++;
      if (isFirstMoveSpike(e.movementX, e.movementY)) return;
    }
    this.onActivity();
    const k = LOOK_SENSITIVITY.mouse;
    this.collector.addLook(e.movementX * k, (INVERT_LOOK_Y ? 1 : -1) * e.movementY * k);
  };

  private readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (e.deltaY === 0) return;
    this.onActivity();
    const now = performance.now();
    if (now - this.lastWheelMs < KEYBOARD_MOUSE.wheelCooldownMs) return;
    this.lastWheelMs = now;
    this.collector.requestTargetSwitch(e.deltaY > 0 ? 1 : -1);
  };

  requestLock(): void {
    try {
      // 生のマウス移動量（加速なし）を使えるなら使う。非対応環境では通常のロックにフォールバック。
      const p = this.target.requestPointerLock({ unadjustedMovement: true }) as unknown as
        Promise<void> | undefined;
      void p?.catch(() => {
        try {
          void (this.target.requestPointerLock() as unknown as Promise<void> | undefined)?.catch(
            () => undefined,
          );
        } catch {
          // Pointer Lock 非対応: カメラは動かせないが他の入力は使える
        }
      });
    } catch {
      // 同上
    }
  }
}

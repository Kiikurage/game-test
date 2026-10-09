import './touch.css';
import type { Action } from '../../core/input';
import { INVERT_LOOK_Y, LOOK_SENSITIVITY, TOUCH } from '../config';
import { applyRadialDeadzone } from '../deadzone';
import { classifyFlick } from '../flick';
import type { InputCollector } from '../inputCollector';

interface ButtonSpec {
  action: Action;
  label: string;
  /** 配置・サイズ用のクラス（touch.css で定義）。 */
  className: string;
}

/** 右下の親指クラスタ。配置は touch.css。 */
const BUTTONS: readonly ButtonSpec[] = [
  { action: 'dodge', label: '回避', className: 'touch-btn--dodge' },
  { action: 'lightAttack', label: '弱', className: 'touch-btn--light' },
  { action: 'heavyAttack', label: '強', className: 'touch-btn--heavy' },
  { action: 'guard', label: '防御', className: 'touch-btn--guard' },
  { action: 'item', label: '道具', className: 'touch-btn--item' },
  { action: 'lockOn', label: '固定', className: 'touch-btn--lockon' },
  { action: 'interact', label: '調査', className: 'touch-btn--interact' },
];

/** ポインタをキャプチャする（既に離されたポインタ等で失敗しても入力処理は続ける）。 */
function capture(el: HTMLElement, pointerId: number): void {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    // キャプチャできなくても、要素上のイベントは受け取れる
  }
}

interface Point {
  x: number;
  y: number;
}

/**
 * タッチ UI（DOM/CSS）とジェスチャ処理。Pointer Events でマルチタッチに対応する。
 * - 左半分: フローティング仮想スティック（触れた位置が中心。半径を超えたら中心が追従する）
 * - 右半分: ドラッグでカメラ、素早い横スワイプでロックオン対象切替
 * - 右下: アクションボタン群（それぞれ独立して同時押し可能）
 * 表示/非表示は `<html data-input-device="touch">` の CSS で切り替える（入力ロジックは常に有効）。
 */
export class TouchControls {
  readonly element: HTMLElement;

  private readonly stickBase: HTMLElement;
  private readonly stickKnob: HTMLElement;
  private stick: { id: number; center: Point } | null = null;
  private camera: { id: number; last: Point; start: Point; startMs: number } | null = null;
  private readonly buttonPointers = new Map<number, Action>();
  private readonly buttonEls = new Map<Action, HTMLElement>();

  constructor(
    private readonly collector: InputCollector,
    private readonly onActivity: () => void,
  ) {
    const root = document.createElement('div');
    root.className = 'touch-controls';
    root.dataset.testid = 'touch-controls';

    const left = document.createElement('div');
    left.className = 'touch-zone touch-zone--left';
    const right = document.createElement('div');
    right.className = 'touch-zone touch-zone--right';

    this.stickBase = document.createElement('div');
    this.stickBase.className = 'touch-stick';
    this.stickKnob = document.createElement('div');
    this.stickKnob.className = 'touch-stick__knob';
    this.stickBase.appendChild(this.stickKnob);

    root.append(left, right, this.stickBase);
    for (const spec of BUTTONS) root.appendChild(this.createButton(spec));

    // 左右ゾーンはタッチの取得だけを担う。ボタンは別要素なのでゾーンのイベントは受け取らない。
    this.bindStickZone(left);
    this.bindCameraZone(right);

    // ロングタップのコンテキストメニュー・テキスト選択・画像ドラッグを抑止
    root.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    this.element = root;
  }

  /** 入力デバイスがタッチ以外へ切り替わった等で、押しっぱなしの状態を解除する。 */
  reset(): void {
    this.stick = null;
    this.camera = null;
    this.buttonPointers.clear();
    this.collector.releaseSource('touch');
    this.stickBase.classList.remove('is-active');
    for (const el of this.buttonEls.values()) el.classList.remove('is-pressed');
  }

  private createButton(spec: ButtonSpec): HTMLElement {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `touch-btn ${spec.className}`;
    el.dataset.action = spec.action;
    el.textContent = spec.label;
    el.setAttribute('aria-label', spec.label);
    el.tabIndex = -1;
    this.buttonEls.set(spec.action, el);

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onActivity();
      if (this.buttonPointers.has(e.pointerId)) return;
      capture(el, e.pointerId);
      this.buttonPointers.set(e.pointerId, spec.action);
      el.classList.add('is-pressed');
      this.collector.setButton('touch', spec.action, true);
      if (TOUCH.vibrateMs > 0 && typeof navigator.vibrate === 'function') {
        navigator.vibrate(TOUCH.vibrateMs);
      }
    });
    const release = (e: PointerEvent): void => {
      if (this.buttonPointers.get(e.pointerId) !== spec.action) return;
      this.buttonPointers.delete(e.pointerId);
      // 同じボタンを別の指がまだ押していなければ解除
      const stillPressed = [...this.buttonPointers.values()].includes(spec.action);
      if (!stillPressed) {
        el.classList.remove('is-pressed');
        this.collector.setButton('touch', spec.action, false);
      }
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
    return el;
  }

  private bindStickZone(zone: HTMLElement): void {
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onActivity();
      if (this.stick) return;
      capture(zone, e.pointerId);
      this.stick = { id: e.pointerId, center: { x: e.clientX, y: e.clientY } };
      this.stickBase.classList.add('is-active');
      this.placeStick(e.clientX, e.clientY, 0, 0);
      this.updateStick(e);
    });
    zone.addEventListener('pointermove', (e) => {
      if (this.stick?.id === e.pointerId) this.updateStick(e);
    });
    const end = (e: PointerEvent): void => {
      if (this.stick?.id !== e.pointerId) return;
      this.stick = null;
      this.collector.setMove('touch', 0, 0);
      this.stickBase.classList.remove('is-active');
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);
  }

  private updateStick(e: PointerEvent): void {
    const s = this.stick;
    if (!s) return;
    const r = TOUCH.stickRadius;
    let dx = e.clientX - s.center.x;
    let dy = e.clientY - s.center.y;
    const dist = Math.hypot(dx, dy);
    if (dist > r) {
      // 半径を超えた分だけ中心を指に追従させる（持ち替えなしで逆方向へ素早く切り返せる）
      const over = dist - r;
      s.center.x += (dx / dist) * over;
      s.center.y += (dy / dist) * over;
      dx = e.clientX - s.center.x;
      dy = e.clientY - s.center.y;
    }
    const v = applyRadialDeadzone(dx / r, dy / r, TOUCH.stickDeadzone);
    // 画面の下方向が +y なので、前進(+y)へ反転
    this.collector.setMove('touch', v.x, -v.y);
    this.placeStick(s.center.x, s.center.y, dx, dy);
  }

  private placeStick(cx: number, cy: number, kx: number, ky: number): void {
    this.stickBase.style.transform = `translate(${cx}px, ${cy}px)`;
    this.stickKnob.style.transform = `translate(${kx}px, ${ky}px)`;
  }

  private bindCameraZone(zone: HTMLElement): void {
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onActivity();
      if (this.camera) return;
      capture(zone, e.pointerId);
      const p = { x: e.clientX, y: e.clientY };
      this.camera = { id: e.pointerId, last: p, start: { ...p }, startMs: e.timeStamp };
    });
    zone.addEventListener('pointermove', (e) => {
      const c = this.camera;
      if (c?.id !== e.pointerId) return;
      const k = LOOK_SENSITIVITY.touch;
      const dx = e.clientX - c.last.x;
      const dy = e.clientY - c.last.y;
      c.last = { x: e.clientX, y: e.clientY };
      this.collector.addLook(dx * k, (INVERT_LOOK_Y ? 1 : -1) * dy * k);
    });
    zone.addEventListener('pointerup', (e) => {
      const c = this.camera;
      if (c?.id !== e.pointerId) return;
      this.camera = null;
      const dir = classifyFlick({
        durationMs: e.timeStamp - c.startMs,
        dx: c.last.x - c.start.x,
        dy: c.last.y - c.start.y,
      });
      if (dir !== 0) this.collector.requestTargetSwitch(dir);
    });
    const cancel = (e: PointerEvent): void => {
      if (this.camera?.id === e.pointerId) this.camera = null;
    };
    zone.addEventListener('pointercancel', cancel);
    zone.addEventListener('lostpointercapture', cancel);
  }
}

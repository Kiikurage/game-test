import './guide.css';
import type { InputDevice } from '../../core/input';
import { INTERACT_KEY_LABEL } from '../../core/controlHints';

/** 状況ボタン・操作ヒント・通知が読む表示用状態（`render/hud/guide.view.ts` が game から作る。ui は game に依存しない）。 */
export interface GuideView {
  /** 状況アクション（なければ null）。 */
  readonly prompt: { readonly id: string; readonly label: string } | null;
  /** 操作ヒント（なければ null）。文言はデバイス別。 */
  readonly hint: {
    readonly id: string;
    readonly text: Readonly<Record<InputDevice, string>>;
  } | null;
  /** 取得・開通通知（なければ null）。`id` が変わったら別の通知。 */
  readonly notice: { readonly id: number; readonly text: string } | null;
  /** 0..1。HUD 全体のフェード（休憩中など）に合わせる。 */
  readonly opacity: number;
}

export interface GuideHandle {
  readonly element: HTMLElement;
  /** 毎フレーム呼ぶ。値が変わったときだけ DOM を書く。 */
  update(): void;
  dispose(): void;
}

/**
 * 入力デバイス（`<html data-input-device>`。InputSystem が最後に操作したデバイスへ切り替える。パッド接続検知を含む）。
 * 変化を購読する。戻り値は解除。
 */
export function observeInputDevice(
  onChange: (device: InputDevice) => void,
  root: HTMLElement = document.documentElement,
): () => void {
  const read = (): InputDevice => {
    const d = root.dataset.inputDevice;
    return d === 'gamepad' || d === 'touch' ? d : 'kbm';
  };
  const mo = new MutationObserver(() => {
    onChange(read());
  });
  mo.observe(root, { attributes: true, attributeFilter: ['data-input-device'] });
  onChange(read());
  return () => {
    mo.disconnect();
  };
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  parent?: HTMLElement,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  parent?.appendChild(e);
  return e;
}

/**
 * 状況ボタン（右中央のピル）・操作ヒント・通知（画面中央下）を `parent` に作る。仕様書 9.1 節。
 * PC・パッドでは自前のピル（「E 休む」/「A 休む」。押せない表示）、タッチでは `<html data-interact-label>` を介して
 * タッチ UI の「調査」ボタンがそのままピルになる（二重にしない。`input/touch`）。
 */
export function mountGuide(view: GuideView, parent: HTMLElement = document.body): GuideHandle {
  const root = el('div', 'guide');
  root.dataset.testid = 'guide';

  const prompt = el('div', 'guide-prompt', root);
  prompt.dataset.testid = 'guide-prompt';
  const key = el('span', 'guide-prompt-key', prompt);
  const label = el('span', 'guide-prompt-label', prompt);

  const bottom = el('div', 'guide-bottom', root);
  const notice = el('div', 'guide-notice', bottom);
  notice.dataset.testid = 'guide-notice';
  const hint = el('div', 'guide-hint', bottom);
  hint.dataset.testid = 'guide-hint';
  parent.appendChild(root);

  let device: InputDevice = 'kbm';
  let lastPromptId: string | null | undefined;
  let lastPromptLabel = '';
  let lastHintId: string | null | undefined;
  let lastHintDevice: InputDevice | undefined;
  let lastNoticeId: number | null | undefined;
  let lastOpacity = NaN;

  const html = document.documentElement;
  const writePrompt = (): void => {
    const p = view.prompt;
    const on = p !== null;
    prompt.classList.toggle('is-visible', on);
    if (p) {
      label.textContent = p.label;
      prompt.dataset.kind = p.id;
      html.dataset.interactLabel = p.label;
    } else {
      delete html.dataset.interactLabel;
    }
    key.textContent = INTERACT_KEY_LABEL[device];
  };
  const writeHint = (): void => {
    const h = view.hint;
    hint.classList.toggle('is-visible', h !== null);
    // 消えている間も文言は残す（0.5s のフェードアウトで文言が消えないように）
    if (h) {
      hint.textContent = h.text[device];
      hint.dataset.hint = h.id;
    }
  };

  const stopObserve = observeInputDevice((d) => {
    device = d;
    // 表記が変わるので次の update で書き直す
    lastPromptId = undefined;
    lastHintId = undefined;
  });

  const update = (): void => {
    const p = view.prompt;
    if (p?.id !== lastPromptId || (p?.label ?? '') !== lastPromptLabel) {
      lastPromptId = p?.id ?? null;
      lastPromptLabel = p?.label ?? '';
      writePrompt();
    }
    const h = view.hint;
    if (h?.id !== lastHintId || device !== lastHintDevice) {
      lastHintId = h?.id ?? null;
      lastHintDevice = device;
      writeHint();
    }
    const n = view.notice;
    if ((n?.id ?? null) !== lastNoticeId) {
      lastNoticeId = n?.id ?? null;
      notice.classList.toggle('is-visible', n !== null);
      if (n) notice.textContent = n.text;
    }
    if (view.opacity !== lastOpacity) {
      lastOpacity = view.opacity;
      root.style.opacity = view.opacity.toFixed(3);
    }
  };
  update();

  return {
    element: root,
    update,
    dispose: () => {
      stopObserve();
      delete html.dataset.interactLabel;
      root.remove();
    },
  };
}

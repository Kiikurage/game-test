// 起動時の画面（ローディング・開始 / 再開）。DOM 操作は ui 層に閉じる。
// タイトル画面（#95）ができるまでの暫定: 黒背景に細い文字、ゆっくり明滅。

export interface LoadingScreen {
  /** 0..1 */
  setProgress(fraction: number): void;
  remove(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function createLoadingScreen(): LoadingScreen {
  const screen = el('div', 'overlay launch-screen launch-loading');
  screen.dataset.testid = 'loading-screen';
  const label = el('p', 'launch-label', 'LOADING');
  const bar = el('div', 'launch-bar');
  const fill = el('div', 'launch-bar-fill');
  bar.appendChild(fill);
  const percent = el('p', 'launch-percent', '0%');
  screen.append(label, bar, percent);
  document.body.appendChild(screen);

  return {
    setProgress(fraction) {
      const f = Math.min(1, Math.max(0, fraction));
      fill.style.transform = `scaleX(${f.toFixed(4)})`;
      percent.textContent = `${Math.round(f * 100)}%`;
      screen.dataset.progress = f.toFixed(3);
    },
    remove() {
      screen.remove();
    },
  };
}

export interface PromptScreen {
  remove(): void;
}

export interface PromptOptions {
  /** `start`: 最初の開始画面（不透明）。`resume`: 一時停止中の再開画面（背後のゲームが透ける）。 */
  readonly kind: 'start' | 'resume';
  readonly text: string;
  readonly hint?: string;
}

/**
 * 「タップ（クリック）で開始・再開」画面。タップ / クリック / Enter / Space で `onActivate` を一度だけ呼ぶ
 * （ユーザー操作のハンドラ内で同期的に呼ばれるので、フルスクリーン・Pointer Lock・オーディオ解除を要求できる）。
 */
export function createPromptScreen(options: PromptOptions, onActivate: () => void): PromptScreen {
  const screen = el('div', `overlay launch-screen launch-prompt launch-${options.kind}`);
  screen.dataset.testid = `${options.kind}-screen`;
  screen.tabIndex = 0;
  screen.setAttribute('role', 'button');
  screen.setAttribute('aria-label', options.text);
  screen.append(el('p', 'launch-title', options.text));
  if (options.hint) screen.append(el('p', 'launch-hint', options.hint));
  document.body.appendChild(screen);

  let fired = false;
  const fire = (): void => {
    if (fired) return;
    fired = true;
    onActivate();
  };
  screen.addEventListener('click', fire);
  screen.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fire();
    }
  });
  const onWindowKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') fire();
  };
  window.addEventListener('keydown', onWindowKey);
  screen.focus({ preventScroll: true });

  return {
    remove() {
      window.removeEventListener('keydown', onWindowKey);
      screen.remove();
    },
  };
}

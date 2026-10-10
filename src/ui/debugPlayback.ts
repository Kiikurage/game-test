/**
 * 検証ツール共通の再生操作（一時停止・1F 送り・スロー再生）。ボス技の検証ツール（`?scene=boss`）と
 * 戦闘デバッグツール（`?scene=combat`）が共有する。一時停止・コマ送りは dev フック（`pause` / `advance`）、
 * スローは呼び出し側が `onSlow`（`setDebugSlow`）へ繋ぐ。
 * クラス名は `<prefix>-pause` / `<prefix>-step` / `<prefix>-slow`（E2E が使う）。
 */

export const SLOW_STEPS = [1, 0.5, 0.25, 0.1] as const;

export function debugButton(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  Object.assign(b.style, { font: 'inherit', padding: '2px 6px', margin: '0 2px 2px 0' });
  return b;
}

export interface PlaybackControls {
  readonly pause: HTMLButtonElement;
  readonly step: HTMLButtonElement;
  readonly slow: HTMLSelectElement;
}

export function createPlaybackControls(
  prefix: string,
  onSlow: (scale: number) => void,
): PlaybackControls {
  let paused = false;
  const setPaused = (p: boolean): void => {
    paused = p;
    window.__game?.dev.pause(p);
    pause.textContent = p ? '再開' : '一時停止';
  };
  const pause = debugButton('一時停止', () => {
    setPaused(!paused);
  });
  pause.className = `${prefix}-pause`;
  const step = debugButton('1F 送り', () => {
    if (!paused) setPaused(true);
    window.__game?.dev.advance(1);
  });
  step.className = `${prefix}-step`;
  const slow = document.createElement('select');
  slow.className = `${prefix}-slow`;
  for (const s of SLOW_STEPS) {
    slow.append(new Option(s === 1 ? '通常速度' : `スロー ×${s}`, String(s)));
  }
  slow.addEventListener('change', () => {
    onSlow(Number(slow.value));
  });
  return { pause, step, slow };
}

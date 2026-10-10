/** UI の基準とする横画面の短辺（Xperia 1 V 横持ち 915×412）。 */
export const UI_BASE_SHORT_SIDE = 412;
export const UI_SCALE_MIN = 0.85;
export const UI_SCALE_MAX = 1.3;

/** UI の拡大率: `clamp(0.85, 短辺 / 412, 1.3)`（仕様書 9.1 節）。 */
export function uiScale(width: number, height: number): number {
  const s = Math.min(width, height) / UI_BASE_SHORT_SIDE;
  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, s));
}

/**
 * `<html>` に `--ui-scale` を設定し、リサイズに追従する。HUD などの寸法は `calc(Npx * var(--ui-scale))` で書く。
 * 戻り値は購読解除。
 */
export function installUiScale(
  root: HTMLElement = document.documentElement,
  win: Window = window,
): () => void {
  const apply = (): void => {
    root.style.setProperty('--ui-scale', uiScale(win.innerWidth, win.innerHeight).toFixed(4));
  };
  apply();
  win.addEventListener('resize', apply);
  return () => {
    win.removeEventListener('resize', apply);
  };
}

/**
 * `?safe=左,上,右,下`（px）でセーフエリアの上書き値を設定する（ノッチの確認・撮影用。実機では `env(safe-area-inset-*)`）。
 * 例: `?safe=44,0,44,21`。CSS は `var(--safe-l)` 等を使う（未指定なら `env()`）。
 */
export function applySafeAreaOverride(
  search: string,
  root: HTMLElement = document.documentElement,
): void {
  const value = new URLSearchParams(search).get('safe');
  if (value === null) return;
  const parts = value.split(',').map((v) => Number(v));
  const names = ['--safe-l', '--safe-t', '--safe-r', '--safe-b'];
  names.forEach((name, i) => {
    const px = parts[i];
    if (px !== undefined && Number.isFinite(px) && px >= 0) root.style.setProperty(name, `${px}px`);
  });
}

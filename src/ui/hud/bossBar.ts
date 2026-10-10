import './bossBar.css';
import type { HudHandle } from './hud';

/** ボス HP バーが読む表示用状態（`game/hud` の `BossBarModel` が満たす）。 */
export interface BossBarView {
  readonly name: string;
  readonly boundaries: readonly number[];
  readonly hpRatio: number;
  readonly ghostRatio: number;
  readonly glow: number;
  /** 0..1（HUD 全体のフェードとの積を渡す）。 */
  readonly opacity: number;
}

function el(className: string, parent?: HTMLElement): HTMLDivElement {
  const e = document.createElement('div');
  e.className = className;
  parent?.appendChild(e);
  return e;
}

/** ボス HP バー（画面下中央）を `parent` に作る。値が変わったときだけ DOM を書く。 */
export function mountBossBar(view: BossBarView, parent: HTMLElement = document.body): HudHandle {
  const root = el('boss-bar');
  root.dataset.testid = 'boss-bar';
  root.style.visibility = 'hidden';
  const name = el('boss-bar-name', root);
  name.dataset.testid = 'boss-bar-name';
  const bar = el('boss-bar-gauge', root);
  const halo = el('boss-bar-halo', bar);
  const track = el('boss-bar-track', bar);
  const ghost = el('boss-bar-fill boss-bar-fill--ghost', track);
  ghost.dataset.testid = 'boss-bar-ghost';
  const fill = el('boss-bar-fill boss-bar-fill--main', track);
  fill.dataset.testid = 'boss-bar-fill';
  const flash = el('boss-bar-flash', track);
  flash.dataset.testid = 'boss-bar-flash';
  const ticks = el('boss-bar-ticks', track);
  parent.appendChild(root);

  let lastName = '';
  let lastTicks = '';
  let lastHp = NaN;
  let lastGhost = NaN;
  let lastGlow = NaN;
  let lastOpacity = NaN;

  const update = (): void => {
    if (view.name !== lastName) {
      lastName = view.name;
      name.textContent = view.name;
    }
    const tickKey = view.boundaries.join(',');
    if (tickKey !== lastTicks) {
      lastTicks = tickKey;
      ticks.replaceChildren(
        ...view.boundaries.map((b) => {
          const t = el('boss-bar-tick');
          t.style.left = `${(b * 100).toFixed(3)}%`;
          return t;
        }),
      );
    }
    if (view.hpRatio !== lastHp) {
      lastHp = view.hpRatio;
      fill.style.transform = `scaleX(${view.hpRatio.toFixed(4)})`;
    }
    if (view.ghostRatio !== lastGhost) {
      lastGhost = view.ghostRatio;
      ghost.style.transform = `scaleX(${view.ghostRatio.toFixed(4)})`;
    }
    if (view.glow !== lastGlow) {
      lastGlow = view.glow;
      flash.style.opacity = (view.glow * 0.85).toFixed(3);
      halo.style.opacity = view.glow.toFixed(3);
    }
    if (view.opacity !== lastOpacity) {
      lastOpacity = view.opacity;
      root.style.opacity = view.opacity.toFixed(3);
      root.style.visibility = view.opacity > 0 ? 'visible' : 'hidden';
    }
  };
  update();

  return {
    element: root,
    update,
    dispose: () => {
      root.remove();
    },
  };
}

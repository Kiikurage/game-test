import './hud.css';

/** HUD が読む表示用状態（`game/hud` の `HudModel` が満たす。ui は game に依存しない）。 */
export interface HudView {
  readonly hpMax: number;
  readonly hpRatio: number;
  readonly hpGhostRatio: number;
  readonly staminaRatio: number;
  readonly staminaRegenerating: boolean;
  readonly staminaBlinkOn: boolean;
  readonly flaskCount: number;
  readonly flaskMax: number;
  readonly flaskGlow: number;
  readonly opacity: number;
}

export interface HudHandle {
  readonly element: HTMLElement;
  /** 毎フレーム呼ぶ。値が変わったときだけ DOM を書く（transform / opacity / class のみ）。 */
  update(): void;
  dispose(): void;
}

const FLASK_SVG = `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <path class="hud-flask-liquid" d="M11.2 17.4h9.6l3.1 6.6a3.4 3.4 0 0 1-3.1 4.8H11.2A3.4 3.4 0 0 1 8.1 24z"/>
  <path class="hud-flask-glass" d="M13 4.5h6v7.2l5.7 12.2a4 4 0 0 1-3.6 5.7H10.9a4 4 0 0 1-3.6-5.7L13 11.7z"/>
  <rect class="hud-flask-cork" x="12" y="2" width="8" height="3.6" rx="1"/>
</svg>`;

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

function bar(className: string, parent: HTMLElement, ghost = false) {
  const root = el('div', `hud-bar ${className}`, parent);
  const ghostFill = ghost ? el('div', 'hud-fill hud-fill--ghost', root) : null;
  const fill = el('div', 'hud-fill hud-fill--main', root);
  return { root, fill, ghostFill };
}

/** HUD（左上: HP バー・スタミナバー・回復瓶）を `parent` に作る。 */
export function mountHud(view: HudView, parent: HTMLElement = document.body): HudHandle {
  const root = el('div', 'hud');
  root.dataset.testid = 'hud';
  const stack = el('div', 'hud-stack', root);
  const hp = bar('hud-bar--hp', stack, true);
  hp.root.dataset.testid = 'hud-hp';
  const stamina = bar('hud-bar--stamina', stack);
  stamina.root.dataset.testid = 'hud-stamina';
  const flask = el('div', 'hud-flask', stack);
  flask.dataset.testid = 'hud-flask';
  const icon = el('div', 'hud-flask-icon', flask);
  const glow = el('div', 'hud-flask-glow', icon);
  icon.insertAdjacentHTML('beforeend', FLASK_SVG);
  const count = el('span', 'hud-flask-count', flask);
  parent.appendChild(root);

  // 前回書いた値（変わらなければ DOM に触れない）
  let lastHpMax = NaN;
  let lastHp = NaN;
  let lastGhost = NaN;
  let lastStamina = NaN;
  let lastRegen: boolean | undefined;
  let lastAlert: boolean | undefined;
  let lastCount = NaN;
  let lastMax = NaN;
  let lastGlow = NaN;
  let lastOpacity = NaN;

  const update = (): void => {
    if (view.hpMax !== lastHpMax) {
      lastHpMax = view.hpMax;
      root.style.setProperty('--hp-max', String(view.hpMax));
    }
    if (view.hpRatio !== lastHp) {
      lastHp = view.hpRatio;
      hp.fill.style.transform = `scaleX(${view.hpRatio.toFixed(4)})`;
    }
    if (view.hpGhostRatio !== lastGhost && hp.ghostFill) {
      lastGhost = view.hpGhostRatio;
      hp.ghostFill.style.transform = `scaleX(${view.hpGhostRatio.toFixed(4)})`;
    }
    if (view.staminaRatio !== lastStamina) {
      lastStamina = view.staminaRatio;
      stamina.fill.style.transform = `scaleX(${view.staminaRatio.toFixed(4)})`;
    }
    if (view.staminaRegenerating !== lastRegen) {
      lastRegen = view.staminaRegenerating;
      stamina.root.classList.toggle('is-regen', lastRegen);
    }
    if (view.staminaBlinkOn !== lastAlert) {
      lastAlert = view.staminaBlinkOn;
      stamina.root.classList.toggle('is-alert', lastAlert);
    }
    if (view.flaskCount !== lastCount || view.flaskMax !== lastMax) {
      lastCount = view.flaskCount;
      lastMax = view.flaskMax;
      count.textContent = `×${view.flaskCount}`;
      flask.classList.toggle('is-empty', view.flaskCount <= 0);
      flask.dataset.count = String(view.flaskCount);
    }
    if (view.flaskGlow !== lastGlow) {
      lastGlow = view.flaskGlow;
      glow.style.opacity = view.flaskGlow.toFixed(3);
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
      root.remove();
    },
  };
}

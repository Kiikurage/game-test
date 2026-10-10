/** 画面全体を覆うメッセージ画面を作る（DOM 操作は ui 層に閉じる）。 */
function createOverlay(className: string, title: string, lines: string[]): HTMLElement {
  const el = document.createElement('div');
  el.className = `overlay ${className}`;
  const h1 = document.createElement('h1');
  h1.textContent = title;
  el.appendChild(h1);
  for (const line of lines) {
    const p = document.createElement('p');
    p.textContent = line;
    el.appendChild(p);
  }
  return el;
}

/** WebGPU 非対応画面。ゲームは起動せず、この画面を出して終了する。 */
export function showUnsupportedScreen(root: HTMLElement, reason: string): void {
  root.replaceChildren(
    createOverlay('unsupported', 'お使いの環境には対応していません', [
      'このゲームの動作には WebGPU が必要です。',
      'WebGPU に対応した最新の Chrome / Edge などでお試しください。',
      `(${reason})`,
    ]),
  );
  root.dataset.state = 'unsupported';
}

export interface OrientationHint {
  /** 横向き化に失敗した（非対応・拒否）環境では案内を「端末を横向きにしてください」に切り替える。 */
  setFailed(failed: boolean): void;
}

/**
 * 縦持ち時の案内。表示の出し分けは CSS（orientation + pointer: coarse）で行う。
 * 通常は「タッチして横画面にする」で、案内自体がタップを受けて `onTap` を呼ぶ（ローディング中も有効）。
 * 失敗後は「端末を横向きにしてください」に切り替え、タップを背後の開始・再開画面へ透過する。
 */
export function mountOrientationHint(onTap: () => void): OrientationHint {
  const el = document.createElement('div');
  el.className = 'overlay orientation-hint';
  el.dataset.testid = 'orientation-hint';
  el.setAttribute('role', 'button');
  const icon = document.createElement('div');
  icon.className = 'orientation-hint-icon';
  const title = document.createElement('p');
  title.className = 'orientation-hint-title';
  const sub = document.createElement('p');
  sub.className = 'orientation-hint-sub';
  el.append(icon, title, sub);
  const setFailed = (failed: boolean): void => {
    el.dataset.failed = String(failed);
    title.textContent = failed
      ? '横向きにできませんでした。端末を横向きにしてください'
      : 'タッチして横画面にする';
    sub.textContent = failed ? '' : '端末を回さなくても、そのまま横画面ではじめられます';
    el.setAttribute('aria-label', title.textContent);
  };
  setFailed(false);
  el.addEventListener('click', () => {
    if (el.dataset.failed !== 'true') onTap();
  });
  document.body.appendChild(el);
  return { setFailed };
}

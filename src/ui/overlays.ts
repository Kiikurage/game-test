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

/**
 * 縦持ち時に横画面を促す表示。表示の出し分けは CSS（orientation + pointer: coarse）で行う。
 * 開始・再開画面より前面に出るが、タップは透過する（縦持ちのままタップして開始 → 自動で横向きにできる）。
 */
export function mountOrientationHint(): void {
  document.body.appendChild(
    createOverlay('orientation-hint', '横画面にしてください', [
      '端末を横向きにするとプレイできます。',
    ]),
  );
}

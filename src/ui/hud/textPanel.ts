import './textPanel.css';

/** テキストパネルが読む表示用状態（`render/hud/textPanel.view.ts` が game から作る。ui は game に依存しない）。 */
export interface TextPanelView {
  /** 表示中のページ（なければ null）。`id` が変わったら書き直す。 */
  readonly page: {
    readonly id: number;
    readonly mode: 'read' | 'conversation';
    readonly text: string;
    readonly index: number;
    readonly total: number;
  } | null;
  /** 0..1。HUD 全体のフェード（休憩中など）に合わせる。 */
  readonly opacity: number;
}

export interface TextPanelHandle {
  readonly element: HTMLElement;
  /** 毎フレーム呼ぶ。値が変わったときだけ DOM を書く。 */
  update(): void;
  dispose(): void;
}

/**
 * テキストパネル（画面中央下、下端から 96px。幅 min(80vw, 560px)、セリフ体 16px、半透明の黒地）。仕様書 9.1 節。
 * 非ブロック（pointer-events なし）。会話は右下に ▼（続きがある）を出す。
 */
export function mountTextPanel(
  view: TextPanelView,
  parent: HTMLElement = document.body,
): TextPanelHandle {
  const root = document.createElement('div');
  root.className = 'text-panel';
  root.dataset.testid = 'text-panel';
  const body = document.createElement('p');
  body.className = 'text-panel-body';
  const more = document.createElement('span');
  more.className = 'text-panel-more';
  more.textContent = '▼';
  root.append(body, more);
  parent.appendChild(root);

  let lastId: number | null | undefined;
  let lastOpacity = NaN;

  const update = (): void => {
    const p = view.page;
    const id = p?.id ?? null;
    if (id !== lastId) {
      lastId = id;
      root.classList.toggle('is-visible', p !== null);
      // 消えている間も文言は残す（フェードアウト中に文言が消えないように）
      if (p) {
        body.textContent = p.text;
        root.dataset.mode = p.mode;
        root.classList.toggle('has-more', p.mode === 'conversation' && p.index + 1 < p.total);
      }
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

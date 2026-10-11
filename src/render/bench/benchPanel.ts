import { BENCH_COLUMNS, rowCells, type BenchRow } from './bench';

/** 進行表示（計測中、画面下に小さく出す）。 */
export function mountBenchProgress(): { set(text: string): void; remove(): void } {
  const el = document.createElement('div');
  el.className = 'bench-progress';
  document.body.appendChild(el);
  return {
    set: (text) => {
      el.textContent = text;
    },
    remove: () => {
      el.remove();
    },
  };
}

/** 結果パネル（表・結果テキスト・コピーボタン）。 */
export function mountBenchResult(
  header: readonly string[],
  rows: readonly BenchRow[],
  text: string,
): void {
  const panel = document.createElement('div');
  panel.className = 'bench-result';
  panel.dataset.testid = 'bench-result';

  const title = document.createElement('h2');
  title.textContent = 'ベンチマーク結果';
  const info = document.createElement('pre');
  info.className = 'bench-info';
  info.textContent = header.join('\n');

  const table = document.createElement('table');
  const head = table.createTHead().insertRow();
  for (const c of BENCH_COLUMNS) {
    const th = document.createElement('th');
    th.textContent = c;
    head.appendChild(th);
  }
  const body = table.createTBody();
  for (const row of rows) {
    const tr = body.insertRow();
    const cells = rowCells(row);
    cells.forEach((c, i) => {
      const td = tr.insertCell();
      td.textContent = c;
      if (i === cells.length - 1 && cells.length < BENCH_COLUMNS.length) {
        td.colSpan = BENCH_COLUMNS.length - i;
      }
    });
  }

  const textarea = document.createElement('textarea');
  textarea.readOnly = true;
  textarea.value = text;
  textarea.rows = 6;

  const actions = document.createElement('div');
  actions.className = 'bench-actions';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'コピー';
  copy.addEventListener('click', () => {
    const done = (ok: boolean): void => {
      copy.textContent = ok ? 'コピーしました' : '下の欄を長押し / 選択してコピーしてください';
    };
    const fallback = (): void => {
      textarea.focus();
      textarea.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Clipboard API が使えない環境（非 HTTPS など）の代替
      done(document.execCommand('copy'));
    };
    // 非 HTTPS などでは navigator.clipboard が無い
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (clipboard) {
      clipboard.writeText(text).then(() => {
        done(true);
      }, fallback);
    } else {
      fallback();
    }
  });
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '閉じる';
  close.addEventListener('click', () => {
    panel.remove();
  });
  actions.append(copy, close);

  panel.append(title, actions, info, table, textarea);
  // ゲームの入力（タッチ操作・ポインタロック）へ渡さない
  for (const type of ['pointerdown', 'touchstart', 'mousedown'] as const) {
    panel.addEventListener(type, (e) => {
      e.stopPropagation();
    });
  }
  document.body.appendChild(panel);
}

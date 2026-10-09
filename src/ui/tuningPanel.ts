/** 調整値の 1 グループ（フィールド名 → 数値 / 真偽）。 */
export type TuningGroup = Record<string, number | boolean>;
export type TuningTree = Record<string, TuningGroup>;

/**
 * `?debug` で出す調整パネル。プレイヤー・カメラ・ロックオンの調整値（`game/tuning.ts`）を実行中に書き換える。
 * 値はロジックが毎ステップ読むので、変更は即座に反映される。既定は折りたたみ。
 * @param tree 調整値（書き換え対象のオブジェクトそのもの）
 * @param reset 初期値へ戻す処理
 */
export function mountTuningPanel(tree: TuningTree, reset: () => void): void {
  const details = document.createElement('details');
  details.className = 'tuning-panel';
  const summary = document.createElement('summary');
  summary.textContent = 'tuning';
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'tuning-body';
  details.appendChild(body);

  const inputs: (() => void)[] = [];
  const build = (): void => {
    body.replaceChildren();
    inputs.length = 0;
    const resetButton = document.createElement('button');
    resetButton.textContent = 'reset all';
    resetButton.addEventListener('click', () => {
      reset();
      build();
    });
    body.appendChild(resetButton);

    for (const [groupName, group] of Object.entries(tree)) {
      const section = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = groupName;
      section.appendChild(legend);
      for (const [key, value] of Object.entries(group)) {
        const label = document.createElement('label');
        const name = document.createElement('span');
        name.textContent = key;
        const input = document.createElement('input');
        if (typeof value === 'boolean') {
          input.type = 'checkbox';
          input.checked = value;
          input.addEventListener('change', () => {
            group[key] = input.checked;
          });
        } else {
          input.type = 'number';
          input.value = String(value);
          input.step = String(Math.abs(value) >= 10 ? 1 : Math.abs(value) >= 1 ? 0.1 : 0.01);
          input.addEventListener('input', () => {
            const n = Number(input.value);
            if (Number.isFinite(n)) group[key] = n;
          });
        }
        label.append(name, input);
        section.appendChild(label);
      }
      body.appendChild(section);
    }
  };
  build();
  document.body.appendChild(details);
}

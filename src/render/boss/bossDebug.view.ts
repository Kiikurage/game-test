import {
  isBossToolScene,
  type BossDebugTool,
  type BossToolInfo,
  type BossToolSettings,
} from '../../game/boss/bossDebug';
import { bossDebugOf } from '../../game/boss/bossDebug.system';
import type { FrameRange } from '../../game/boss/dodgeSim';
import { isDebugEnabled } from '../../ui/debugHud';
import { registerViewPlugin } from '../viewPlugins';

/**
 * ボス技の回避検証ツールの UI（E5-9）。`?debug&scene=boss` のときだけ DOM パネルを出す
 * （`?debug` なし・他のシーンでは何も作らない）。判定形状の可視化は `?debug` の判定表示（CombatDebugView）がそのまま出る。
 * 一時停止・フレーム送りは dev フック（`pause` / `advance`）、スローは `BossDebugTool.set('slow', ..)`。
 */

const SLOW_STEPS = [1, 0.5, 0.25, 0.1] as const;

const ranges = (list: readonly FrameRange[] | undefined): string =>
  !list || list.length === 0
    ? 'なし'
    : list.map((r) => (r.start === r.end ? `F${r.start}` : `F${r.start}–F${r.end}`)).join(', ');

const SEGMENT_LABEL = { startup: '発生', active: '持続', recovery: '硬直' } as const;

/** 画面に出す読み取り表示（テスト・E2E でも使える純粋な文字列化）。 */
export function formatBossToolInfo(info: BossToolInfo): string {
  const lines: string[] = [];
  if (!info.moveName) {
    lines.push('技を選んで「発動」');
  } else {
    lines.push(`${info.moveName}  P${info.phase}  ${info.state}`);
  }
  const fd = info.frameData;
  if (fd) {
    lines.push(
      `段 ${info.stage}/${info.stageCount}  F${info.stageFrame}（通し F${info.moveFrame}）` +
        `  ${info.segment ? SEGMENT_LABEL[info.segment] : ''}`,
    );
    lines.push(
      `発生 ${fd.startup} / 持続 ${fd.active} / 硬直 ${fd.recovery}  追尾 〜F${fd.trackEnd}`,
    );
    lines.push(
      `追尾 ${info.tracking ? '中' : '終了'}  判定 ${info.hitboxActive ? 'あり' : 'なし'}`,
    );
  }
  const p = info.player;
  lines.push(
    `プレイヤー ${p.state}` +
      (p.invulnWindow
        ? `  F${p.dodgeFrame}（無敵 F${p.invulnWindow.start}–F${p.invulnWindow.end}）`
        : '') +
      (p.invulnerable ? '  無敵' : ''),
  );
  if (info.windows) {
    lines.push('回避できる入力フレーム（シミュレーション）');
    lines.push(`  左ロール   ${ranges(info.windows.left)}`);
    lines.push(`  右ロール   ${ranges(info.windows.right)}`);
    lines.push(`  前ロール   ${ranges(info.windows.toward)}`);
    lines.push(`  バックステップ ${ranges(info.windows.backstep)}`);
  } else if (info.moveName) {
    lines.push('このフェーズでは使えない技');
  }
  if (info.expectation) lines.push(`想定（6.3 節）: ${info.expectation}`);
  return lines.join('\n');
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  Object.assign(b.style, { font: 'inherit', padding: '2px 6px', margin: '0 2px 2px 0' });
  return b;
}

function labelled(text: string, control: HTMLElement): HTMLLabelElement {
  const l = document.createElement('label');
  l.style.marginRight = '8px';
  l.style.whiteSpace = 'nowrap';
  l.append(`${text} `, control);
  return l;
}

function buildPanel(tool: BossDebugTool): {
  root: HTMLElement;
  refresh: (info: BossToolInfo) => void;
} {
  const root = document.createElement('details');
  root.className = 'boss-tool';
  root.open = true;
  Object.assign(root.style, {
    position: 'fixed',
    left: '8px',
    bottom: '8px',
    maxWidth: 'min(360px, calc(100vw - 16px))',
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
    padding: '4px 8px',
    font: '11px/1.4 ui-monospace, monospace',
    color: '#fff',
    background: 'rgba(0,0,0,0.7)',
    zIndex: '25',
    borderRadius: '4px',
  });
  const summary = document.createElement('summary');
  summary.textContent = 'ボス技の回避検証';
  summary.style.cursor = 'pointer';
  root.append(summary);

  // 技の一覧（登録済みの技 + スタブ。技が増えれば自動で増える）
  const select = document.createElement('select');
  select.className = 'boss-tool-move';
  const placeholder = new Option('— 技を選ぶ —', '');
  select.append(placeholder);
  for (const m of tool.moves()) {
    select.append(new Option(`${m.name} [${m.id}]  P${m.phases.join('/')}`, m.id));
  }
  select.addEventListener('change', () => {
    const id = select.value;
    tool.set('moveId', id === '' ? null : (id as NonNullable<BossToolSettings['moveId']>));
  });

  const phase = document.createElement('select');
  phase.className = 'boss-tool-phase';
  phase.append(new Option('フェーズ 1', '1'), new Option('フェーズ 2', '2'));
  phase.addEventListener('change', () => {
    tool.set('phase', phase.value === '2' ? 2 : 1);
  });

  const num = (cls: string, value: number, step: number, apply: (v: number) => void) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = cls;
    input.value = String(value);
    input.step = String(step);
    input.style.width = '4.5em';
    input.addEventListener('change', () => {
      const v = Number(input.value);
      if (Number.isFinite(v)) apply(v);
    });
    return input;
  };
  const distance = num('boss-tool-distance', tool.settings.distance, 0.5, (v) => {
    tool.set('distance', Math.max(0.5, Math.min(20, v)));
  });
  const bearing = num('boss-tool-bearing', tool.settings.bearingDeg, 15, (v) => {
    tool.set('bearingDeg', Math.max(-180, Math.min(180, v)));
  });

  const check = (cls: string, key: 'repeat' | 'ai' | 'approach') => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = cls;
    input.checked = tool.settings[key];
    input.addEventListener('change', () => {
      tool.set(key, input.checked);
    });
    return input;
  };

  const slow = document.createElement('select');
  slow.className = 'boss-tool-slow';
  for (const s of SLOW_STEPS)
    slow.append(new Option(s === 1 ? '通常速度' : `スロー ×${s}`, String(s)));
  slow.addEventListener('change', () => {
    tool.set('slow', Number(slow.value));
  });

  let paused = false;
  const pauseButton = button('一時停止', () => {
    paused = !paused;
    window.__game?.dev.pause(paused);
    pauseButton.textContent = paused ? '再開' : '一時停止';
  });
  pauseButton.className = 'boss-tool-pause';
  const stepButton = button('1F 送り', () => {
    if (!paused) {
      paused = true;
      window.__game?.dev.pause(true);
      pauseButton.textContent = '再開';
    }
    window.__game?.dev.advance(1);
  });
  stepButton.className = 'boss-tool-step';
  const fireButton = button('発動', () => {
    tool.fire();
  });
  fireButton.className = 'boss-tool-fire';
  const resetButton = button('リセット', () => {
    tool.reset();
  });
  resetButton.className = 'boss-tool-reset';

  const row1 = document.createElement('div');
  row1.append(select, ' ', phase);
  const row2 = document.createElement('div');
  row2.append(
    labelled('距離', distance),
    labelled('向き°', bearing),
    labelled('連続', check('boss-tool-repeat', 'repeat')),
    labelled('AI', check('boss-tool-ai', 'ai')),
    labelled('接近', check('boss-tool-approach', 'approach')),
  );
  const row3 = document.createElement('div');
  row3.append(fireButton, resetButton, pauseButton, stepButton, slow);
  const readout = document.createElement('pre');
  readout.className = 'boss-tool-info';
  readout.style.margin = '4px 0 0';
  readout.style.whiteSpace = 'pre-wrap';
  root.append(row1, row2, row3, readout);

  return {
    root,
    refresh: (info) => {
      readout.textContent = formatBossToolInfo(info);
    },
  };
}

registerViewPlugin('bossDebug', ({ game }) => {
  if (!isDebugEnabled(location.search) || !isBossToolScene(location.search)) return {};
  const tool = bossDebugOf(game);
  const panel = buildPanel(tool);
  document.body.appendChild(panel.root);
  return {
    update: () => {
      panel.refresh(tool.info());
    },
  };
});

import type { ActionWindowInfo, PlayerActionInfo } from '../../game/combat/actionDebug';
import type { CombatDebugTool, CombatToolInfo } from '../../game/combat/combatTool';
import { combatToolOf } from '../../game/combat/combatTool.system';
import { isDebugEnabled } from '../../ui/debugHud';
import { createPlaybackControls, debugButton } from '../../ui/debugPlayback';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 戦闘デバッグツール（#51）の UI。`?debug&scene=combat` のときだけ DOM パネルを出す
 * （`?debug` なし・他のシーンでは何も作らない）。判定形状の可視化（ハートボックス / ヒットボックス）は
 * `?debug` 共通の `CombatDebugView` を、ここのトグルで切り替える。
 * 一時停止・1F 送り・スローはボス技の検証ツールと共通（`ui/debugPlayback.ts`）。
 */

/** `?scene=combat` は戦闘デバッグシーン（広場にダミーと亡者兵 1 体。`?debug` のときだけ UI が出る）。 */
export function isCombatToolScene(search: string): boolean {
  return new URLSearchParams(search).get('scene') === 'combat';
}

const SEGMENT_LABEL = { startup: '発生', active: '持続', recovery: '硬直' } as const;

const windowText = (w: ActionWindowInfo): string => `F${w.start}–F${w.end}${w.open ? ' ●' : ''}`;

/** アクション欄（名前・フレーム・窓）の読み取り表示。純粋な文字列化（ユニットテストで使う）。 */
export function formatActionInfo(a: PlayerActionInfo): string[] {
  const name = a.actionId ?? a.state;
  const lines = [
    a.total > 0
      ? `動作 ${name}  F${a.frame}/${a.total}  ${a.segment ? SEGMENT_LABEL[a.segment] : ''}` +
        (a.frozen ? '  凍結' : '')
      : `状態 ${a.state}  F${a.frame}` + (a.frozen ? '  凍結' : ''),
  ];
  if (a.total > 0) {
    lines.push(`発生 ${a.startup} / 持続 ${a.active} / 硬直 ${a.recovery}`);
  }
  if (a.cancels.length > 0) {
    lines.push('キャンセル窓（● = 受付中）');
    for (const c of a.cancels) lines.push(`  → ${c.to}  ${windowText(c)}`);
  }
  if (a.invuln) lines.push(`無敵窓 ${windowText(a.invuln)}`);
  if (a.superArmor) {
    lines.push(`スーパーアーマー ${windowText(a.superArmor)}（+${a.superArmor.poiseBonus}）`);
  }
  lines.push(
    `無敵 ${a.invulnerableNow ? 'あり' : 'なし'}  強靭度加算 +${a.poiseBonus}` +
      (a.poiseBonus > 0 ? '（スーパーアーマー中）' : ''),
  );
  return lines;
}

/** パネル全体の読み取り表示。 */
export function formatCombatToolInfo(info: CombatToolInfo): string {
  const p = info.player;
  const lines = [
    `HP ${Math.ceil(p.hp)}/${p.maxHp}  スタミナ ${p.stamina.toFixed(0)}/${p.staminaMax}` +
      `  瓶 ${p.flask}/${p.flaskMax}  強靭度 ${p.poise}/${p.poiseMax}` +
      (p.dead ? '  死亡' : ''),
    ...formatActionInfo(info.action),
  ];
  const d = info.dummy;
  if (d) {
    lines.push(
      `ダミー ${d.id}（${d.distance.toFixed(1)}m）  HP ${Math.ceil(d.hp)}/${d.maxHp}` +
        `  強靭度 ${d.poise}/${d.poiseMax}${d.staggered ? '  崩し中' : ''}`,
    );
  }
  return lines.join('\n');
}

function toggle(
  label: string,
  className: string,
  checked: boolean,
  onChange: (v: boolean) => void,
) {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = className;
  input.checked = checked;
  input.addEventListener('change', () => {
    onChange(input.checked);
  });
  const l = document.createElement('label');
  l.style.marginRight = '8px';
  l.style.whiteSpace = 'nowrap';
  l.append(input, ` ${label}`);
  return l;
}

function buildPanel(
  tool: CombatDebugTool,
  setHeartboxes: (v: boolean) => void,
  setHitboxes: (v: boolean) => void,
): { root: HTMLElement; refresh: (info: CombatToolInfo) => void } {
  const root = document.createElement('details');
  root.className = 'combat-tool';
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
  summary.textContent = '戦闘デバッグ';
  summary.style.cursor = 'pointer';
  root.append(summary);

  const { pause, step, slow } = createPlaybackControls('combat-tool', (scale) => {
    tool.setSlow(scale);
  });
  const restore = debugButton('HP・スタミナ全回復', () => {
    tool.restorePlayer();
  });
  restore.className = 'combat-tool-restore';
  const dummies = debugButton('ダミー全回復', () => {
    tool.resetDummies();
  });
  dummies.className = 'combat-tool-dummies';
  const reposition = debugButton('初期位置へ', () => {
    tool.reposition();
  });
  reposition.className = 'combat-tool-reposition';

  const row1 = document.createElement('div');
  row1.append(
    toggle('ハートボックス', 'combat-tool-heartboxes', true, setHeartboxes),
    toggle('ヒットボックス', 'combat-tool-hitboxes', true, setHitboxes),
  );
  const row2 = document.createElement('div');
  row2.append(restore, dummies, reposition);
  const row3 = document.createElement('div');
  row3.append(pause, step, slow);
  const readout = document.createElement('pre');
  readout.className = 'combat-tool-info';
  readout.style.margin = '4px 0 0';
  readout.style.whiteSpace = 'pre-wrap';
  root.append(row1, row2, row3, readout);
  return {
    root,
    refresh: (info) => {
      readout.textContent = formatCombatToolInfo(info);
    },
  };
}

registerViewPlugin('combatTool', ({ game, view }) => {
  if (!isDebugEnabled(location.search) || !isCombatToolScene(location.search)) return {};
  const tool = combatToolOf(game);
  const panel = buildPanel(
    tool,
    (v) => {
      if (view.combatDebug) view.combatDebug.showHeartboxes = v;
    },
    (v) => {
      if (view.combatDebug) view.combatDebug.showHitboxes = v;
    },
  );
  document.body.appendChild(panel.root);
  return {
    update: () => {
      panel.refresh(tool.info());
    },
  };
});

import type { StateGraph } from '../anim/characterFsm';

/**
 * 雑魚敵の共通 AI 状態（仕様書 5.1 節）。
 *
 * ```
 * Idle ─ゲージ 50→ Suspicious ─ゲージ 100→ Alert(24F) → Chase → Approach → Attack → Recover ─┐
 *  ↑  └ゲージ低下┘                                         ↑ ↑________________________________┘
 *  └──── Return ←── 見失い 6s / リーシュ 25m 超 ──────────┘
 * 全状態から: 強靭度崩し → Staggered / HP 0 → Dead
 * ```
 *
 * `attack`（予備動作→判定→硬直の中身）は #54、`staggered` の入口は #50 が実装する。
 * この基盤は `Enemy.attackBehavior` と `Enemy.stagger()` / `Enemy.kill()` の口だけを用意する。
 */
export type EnemyStateId =
  | 'idle'
  | 'suspicious'
  | 'alert'
  | 'chase'
  | 'approach'
  | 'attack'
  | 'recover'
  | 'return'
  | 'staggered'
  | 'dead';

const ANY = ['staggered', 'dead'] as const;

export const ENEMY_STATE_GRAPH: StateGraph<EnemyStateId> = {
  idle: { kind: 'idle', to: ['suspicious', 'alert', ...ANY] },
  suspicious: { kind: 'move', to: ['idle', 'alert', ...ANY] },
  alert: { kind: 'action', to: ['chase', ...ANY] },
  chase: { kind: 'move', to: ['approach', 'attack', 'return', ...ANY] },
  approach: { kind: 'move', to: ['chase', 'attack', 'return', ...ANY] },
  attack: { kind: 'action', to: ['recover', ...ANY] },
  recover: { kind: 'move', to: ['approach', 'chase', 'return', ...ANY] },
  return: { kind: 'move', to: ['idle', ...ANY] },
  // ひるみ明け: 追跡へ戻る（遠ければ Return は Chase 側で判定）
  staggered: { kind: 'stagger', to: ['chase', 'return', 'dead'] },
  dead: { kind: 'dead', to: [] },
};

/** 戦闘状態（Alert 以降）か。知覚は常時最大範囲で、戦闘用の構えで描画する。 */
export function isCombatState(state: EnemyStateId): boolean {
  return (
    state === 'alert' ||
    state === 'chase' ||
    state === 'approach' ||
    state === 'attack' ||
    state === 'recover'
  );
}

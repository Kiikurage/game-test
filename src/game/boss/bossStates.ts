import type { StateGraph } from '../anim/characterFsm';

export type BossStateId =
  /** 戦闘前（`engage()` まで何もしない）。AI 無効のときの待機にも使う。 */
  | 'dormant'
  /** ビート: 技の硬直後の睨み合い。対象へ向き直るだけ。 */
  | 'beat'
  /** 技の前の接近（技定義の `approach`）。 */
  | 'approach'
  /** 技の実行（予備動作 → 判定 → 硬直、複数段）。 */
  | 'attack'
  /** 選べる技がなかったので対象へ歩み寄る。 */
  | 'reposition'
  /** 強靭度崩し。 */
  | 'staggered'
  /** 壁に追い詰められた対象に、近距離技の前に 1 歩下がる（6.6 節）。 */
  | 'stepBack'
  /** フェーズ移行（`BOSS_BATTLE.transitionFrames` の間、無敵で行動しない。演出は E5-6）。 */
  | 'transition'
  | 'dead';

/**
 * 生きている間はどの状態からでも行ける先: 技の開始（検証用の `startMove` は接近 / 実行へ直接入る）、
 * ビート・待機（硬直明け・AI 無効）、フェーズ移行、撃破。崩しは移行中を除く。
 */
const START = ['approach', 'attack'] as const;
const END = ['beat', 'dormant', 'transition', 'dead'] as const;

/**
 * ボスの状態グラフ（6.2〜6.5 節）。`Boss` が `CharacterFsm` に載せる。リセット（死亡・休憩）はグラフを無視して
 * `dormant` へ戻す（`CharacterFsm.reset`）。
 */
export const BOSS_STATE_GRAPH: StateGraph<BossStateId> = {
  dormant: { kind: 'idle', to: ['beat', 'transition', 'dead', ...START] },
  beat: {
    kind: 'idle',
    to: ['reposition', 'stepBack', 'staggered', 'dormant', 'transition', 'dead', ...START],
  },
  approach: { kind: 'move', to: ['staggered', ...END, 'attack'] },
  attack: { kind: 'action', to: ['staggered', ...END, 'approach'] },
  reposition: { kind: 'move', to: ['staggered', ...END, ...START] },
  stepBack: { kind: 'move', to: ['staggered', ...END, ...START] },
  staggered: { kind: 'stagger', to: [...END, ...START] },
  transition: { kind: 'action', to: ['beat', 'dormant', 'dead', ...START] },
  dead: { kind: 'dead', to: [] },
};

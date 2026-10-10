import { telegraphKindOf, type TelegraphKind } from '../data';
import { TELEGRAPH_CUE } from '../enemy/enemyTelegraph.system';
import { registerGameSystem } from '../systems';
import { bossSystemOf } from './boss.system';
import type { BossPhase } from './bossData';
import { BOSS_MOVES, stagesOf, type BossMoveRegistry } from './bossMove';

/** 実行中の段（`Boss.debugInfo` の技 ID・段）のテレグラフ種別。技が実行中でなければ null。 */
export function bossTelegraphOf(
  info: { readonly move: string | null; readonly stage: number },
  phase: BossPhase,
  moves: BossMoveRegistry = BOSS_MOVES,
): TelegraphKind | null {
  if (!info.move || info.stage < 1) return null;
  const def = moves.get(info.move);
  const stage = def ? stagesOf(def, phase)[info.stage - 1] : undefined;
  return stage ? telegraphKindOf(stage) : null;
}

/**
 * ボスの技の予備動作が始まった瞬間（各段の頭。三連撃は段ごと）に、段の種別（`EnemyAttackDef.telegraph`）に応じた
 * 予備動作の SE を `sound` イベントで出す。雑魚の `enemy-telegraph` と同じ cue（`TELEGRAPH_CUE`）を使う。
 * 武器の発光（リムライト）はボスのモデル（E5-1）が入ってから `bossTelegraphOf` で描画側から引く。
 */
registerGameSystem('boss-telegraph', (game) => {
  let lastKey: string | null = null;
  return {
    update() {
      const boss = bossSystemOf(game).boss;
      if (!boss || boss.state !== 'attack') {
        lastKey = null;
        return;
      }
      const info = boss.debugInfo;
      const key = `${info.move ?? ''}#${info.stage}`;
      if (key === lastKey) return;
      lastKey = key;
      const kind = bossTelegraphOf(info, boss.phase);
      if (!kind) return;
      game.events.emit('sound', {
        cue: TELEGRAPH_CUE[kind],
        source: 'enemy',
        position: { x: boss.position.x, y: boss.position.y, z: boss.position.z },
      });
    },
  };
});

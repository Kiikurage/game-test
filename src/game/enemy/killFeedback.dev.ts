import { registerDevHooks } from '../../devHooks';
import { capsule, capsuleShape, vec3 } from '../combat';

declare module '../../devHooks' {
  interface DevHooks {
    /**
     * `index` 番目の敵の胸へ、プレイヤーの攻撃を 1 発当てる（本物の命中と同じ経路: 反応・ヒットストップ・SE・パーティクル）。
     * 撃破の演出（#281）の E2E・撮影用。命中しなければ `hit: false`。`sounds` はこの命中で出た SE の cue。
     */
    strikeEnemy(
      index: number,
      damage?: number,
    ): { hit: boolean; killed: boolean; sounds: string[] } | null;
  }
}

registerDevHooks('enemy-kill-feedback', ({ game }) => ({
  strikeEnemy: (index, damage = 9999) => {
    const enemy = game.enemies.enemies[index];
    if (!enemy) return null;
    const box = game.combat.allTargets.get(enemy.id)?.heartboxes[0];
    const p = enemy.position;
    // 死体（判定が外れた後）でも同じ場所を振る
    const a = box?.a ?? { x: p.x, y: p.y + 1.1, z: p.z };
    const sounds: string[] = [];
    const off = game.events.on('sound', (e) => sounds.push(e.cue));
    const hitOff = game.events.on('impact', (e) => sounds.push(`hit:${e.kind}`));
    const attack = game.combat.startAttack('player', 'player', {
      id: 'dev-strike',
      damage,
      poiseDamage: 20,
    });
    const shape = capsuleShape(
      capsule(vec3(a.x - 0.3, a.y, a.z - 0.3), vec3(a.x + 0.3, a.y, a.z - 0.3), 0.35),
      vec3(a.x, p.y, a.z - 2),
    );
    const events = game.combat.resolve(attack, shape);
    game.combat.endAttack(attack);
    off();
    hitOff();
    return { hit: events.length > 0, killed: events.some((e) => e.killed), sounds };
  },
}));

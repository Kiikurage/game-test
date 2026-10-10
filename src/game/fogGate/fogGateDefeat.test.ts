import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import { BOSS_MOVE_IDS } from '../boss/bossData';
import { BossMoveRegistry } from '../boss/bossMove';
import { bossSystemOf } from '../boss/boss.system';
import { sectorShape } from '../combat';
import { ARENA_BONFIRE_ID } from '../data/bonfire';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { fogGateOf } from './fogGate.system';

const DT = 1 / 60;

/** ボス撃破（#86）の F300 の `fogClear` で、封鎖中の霧の門が開く（#66 の購読と #86 の `unseal()` が二重に呼ばれても安全）。 */
describe('fog gate and the boss defeat cutscene', () => {
  beforeAll(async () => {
    await Game.create();
  });

  it('unseals at F300 after the boss is defeated, and unseal is idempotent', async () => {
    const input = new FakeInput();
    const game = await Game.create({
      input,
      save: new SaveStore(new MemoryStorage()),
      boxes: [
        { id: 'fog-gate', x: 10, y: 3, z: 40, hx: 2, hy: 3, hz: 0.3, yawDeg: 0, enabled: false },
      ],
      dummies: [],
      enemies: [],
      interactables: [
        { id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: -30 },
        { id: ARENA_BONFIRE_ID, kind: 'bonfire', area: 'F', x: 20, z: 20 },
        { id: 'fog-gate', kind: 'gate', area: 'E', x: 10, z: 40, target: { x: 0, z: 5, yaw: 0 } },
      ],
      spawn: { x: 0, z: 2.5, yaw: Math.PI },
    });
    const gate = fogGateOf(game);
    if (!gate) throw new Error('no fog gate');
    const reg = new BossMoveRegistry();
    for (const id of BOSS_MOVE_IDS) {
      reg.register({
        id,
        name: id,
        phases: [1, 2],
        stages: [
          {
            id: `${id}.1`,
            startup: 40,
            active: 8,
            recovery: 40,
            damage: 0,
            poiseDamage: 0,
            guardStaminaCost: 0,
            moveDistance: 0,
            arcDeg: 120,
            range: 5,
            trackEndFrame: 20,
          },
        ],
      });
    }
    bossSystemOf(game).spawnUnlessDefeated({ x: 0, z: 0, yaw: 0, moves: reg, engage: true });
    gate.seal();
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    run(3);
    const attack = game.combat.startAttack('player', 'player', {
      id: 'test',
      damage: 100000,
      poiseDamage: 0,
    });
    game.combat.resolve(attack, sectorShape({ x: 0, y: 0, z: 3.2 }, Math.PI, 90, 3));
    game.combat.endAttack(attack);
    run(250);
    expect(gate.state).toBe('sealed');
    run(120);
    expect(gate.state).toBe('open');
    expect(gate.blocked).toBe(false);
    expect(gate.unseal()).toBe(false);
  });
});

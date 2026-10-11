import { beforeAll, describe, expect, it } from 'vitest';
import { capsule, capsuleShape, vec3 } from '../combat';
import { KILL_FEEDBACK } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import type { EnemySpawn } from '../world/level';
import { KILL_ASH_CUE, KILL_HIT_CUE } from './killFeedback.system';

const DT = 1 / 60;

const spawn = (id: string, x: number, z: number): EnemySpawn => ({
  id,
  type: 'undead_soldier',
  area: 'A',
  x,
  z,
  yaw: 0,
  behavior: 'wait',
});

/** 雑魚敵の撃破のフィードバック（#281）: 撃破 SE・ロックオンの即時解除・死体への追い打ち無効。 */
describe('enemy kill feedback (#281)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(spawns: readonly EnemySpawn[]) {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [...spawns] });
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('enemy not spawned');
    const box = game.combat.allTargets.get(enemy.id)?.heartboxes[0];
    if (!box) throw new Error('enemy heartbox not registered');
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    // 敵の胸を横切るプレイヤーの攻撃（判定はハートボックスの位置で固定。死体が倒れても同じ場所を振る）
    const a = { x: box.a.x, y: box.a.y, z: box.a.z };
    const hit = (damage: number) => {
      const attack = game.combat.startAttack('player', 'player', {
        id: 'x',
        damage,
        poiseDamage: 0,
      });
      const shape = capsuleShape(
        capsule(vec3(a.x - 0.3, a.y, a.z + 0.3), vec3(a.x + 0.3, a.y, a.z + 0.3), 0.3),
        vec3(a.x, 1, a.z + 2),
      );
      const events = game.combat.resolve(attack, shape);
      game.combat.endAttack(attack);
      return events;
    };
    const sounds: { cue: string; frame: number }[] = [];
    const hits: string[] = [];
    let frame = 0;
    game.events.on('sound', (e) => sounds.push({ cue: e.cue, frame }));
    game.events.on('hit', (e) => hits.push(e.kind));
    const step = (n: number) => {
      for (let i = 0; i < n; i++) {
        run(1);
        frame++;
      }
    };
    return { game, enemy, hit, step, sounds, hits };
  }

  it('plays the kill SE at F0 and the ash SE when the dissolve starts', async () => {
    const { enemy, hit, step, sounds } = await setup([spawn('k1', 0, 0)]);
    const events = hit(9999);
    expect(events).toHaveLength(1);
    expect(events[0]?.killed).toBe(true);
    expect(enemy.alive).toBe(false);
    expect(sounds.filter((s) => s.cue === KILL_HIT_CUE)).toEqual([{ cue: KILL_HIT_CUE, frame: 0 }]);
    step(KILL_FEEDBACK.dissolveStartFrames + 5);
    const ash = sounds.filter((s) => s.cue === KILL_ASH_CUE);
    expect(ash).toHaveLength(1);
    expect(ash[0]?.frame).toBe(KILL_FEEDBACK.dissolveStartFrames - 1);
  });

  it('ignores further attacks on the corpse (no hit, no reaction, no hit SE)', async () => {
    const { game, hit, step, hits } = await setup([spawn('k2', 0, 0)]);
    expect(hit(9999)).toHaveLength(1);
    const hitCount = game.hitCount;
    const hitSe = hits.length;
    for (let i = 0; i < 5; i++) {
      expect(hit(50)).toHaveLength(0);
      step(2);
    }
    expect(game.hitCount).toBe(hitCount);
    expect(hits).toHaveLength(hitSe);
  });

  it('releases the lock-on on the next step after the kill, or moves to a nearby enemy', async () => {
    const { game, enemy, hit, step } = await setup([spawn('k3', 0, 0), spawn('k4', 3, 1)]);
    game.teleportPlayer(0, 6, Math.PI);
    step(2);
    expect(game.lockOnTo(enemy.id)).toBe(true);
    step(1);
    expect(game.lockOn.target?.id).toBe(enemy.id);
    hit(9999);
    step(1);
    expect(game.lockOn.target?.id).toBe('k4');
    const other = game.enemies.enemies[1];
    if (!other) throw new Error('second enemy not spawned');
    other.kill();
    step(1);
    expect(game.lockOn.target).toBeNull();
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { ENEMY_AI } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { ASHEN_FOUNDATION } from '../world/ashenFoundation';
import { createLevel, levelGameOptions, type EnemySpawn } from '../world/level';
import type { BoxSpec } from '../world/playground';

const DT = 1 / 60;

const SPAWN: EnemySpawn = {
  id: 't-soldier',
  type: 'undead_soldier',
  area: 'A',
  x: 0,
  z: 0,
  yaw: 0,
  behavior: 'wait',
};

/** 敵 AI と物理（Rapier のレイキャスト・キャラクターコントローラ）の結合テスト。平らな地面。 */
describe('enemy AI in the game (Rapier)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(boxes: readonly BoxSpec[] = []) {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes, dummies: [], enemies: [SPAWN] });
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('enemy not spawned');
    const run = (frames: number, each?: (frame: number) => void) => {
      for (let i = 0; i < frames; i++) {
        each?.(i);
        game.update(DT);
        input.endStep();
      }
    };
    const until = (cond: () => boolean, max = 2400) => {
      for (let i = 0; i < max; i++) {
        if (cond()) return i;
        run(1);
      }
      throw new Error(`条件が ${max} ステップ内に成立しなかった（敵の状態: ${enemy.state}）`);
    };
    return { game, input, enemy, run, until };
  }

  it('registers enemies as lock-on targets', async () => {
    const { game, enemy } = await setup();
    expect(game.lockOnTargets).toContain(enemy);
    expect(enemy.alive).toBe(true);
    expect(enemy.height).toBeCloseTo(1.8, 5);
  });

  it('notices a player standing in view, chases, closes in, loses sight, returns home and heals', async () => {
    const { game, enemy, run, until } = await setup();
    game.teleportPlayer(0, 8, Math.PI); // 敵の正面 8m（立ち止まり: 足音なし、視覚のみ）
    run(5);
    expect(enemy.state).toBe('idle');

    until(() => enemy.state === 'suspicious');
    until(() => enemy.state === 'alert');
    until(() => enemy.state === 'chase');
    // 追跡して 3m まで詰め、Approach で待つ
    until(() => enemy.state === 'approach');
    run(120);
    const d = Math.hypot(
      game.player.feet.x - enemy.position.x,
      game.player.feet.z - enemy.position.z,
    );
    expect(d).toBeGreaterThan(2.3);
    expect(d).toBeLessThan(3.4);

    // プレイヤーが突然遠くへ（視線も足音も届かない）→ 6 秒で Return
    enemy.hp = 30;
    game.teleportPlayer(0, 80, 0);
    const lostFor = until(() => enemy.state === 'return');
    expect(lostFor).toBeGreaterThanOrEqual(ENEMY_AI.lostSightFrames - 40);
    expect(lostFor).toBeLessThanOrEqual(ENEMY_AI.lostSightFrames + 45);
    until(() => enemy.state === 'idle');
    expect(enemy.homeDistance).toBeLessThan(0.5);
    expect(enemy.hp).toBeGreaterThan(30);
  });

  it('cannot see a standing player behind a wall', async () => {
    const wall: BoxSpec = { id: 'wall', x: 0, y: 2, z: 3, hx: 6, hy: 2, hz: 0.25 };
    const { game, enemy, run } = await setup([wall]);
    game.teleportPlayer(0, 6, Math.PI);
    run(600);
    expect(enemy.state).toBe('idle');
    expect(enemy.gauge).toBe(0);
  });

  it('hears a loud noise through a wall and goes to investigate', async () => {
    const wall: BoxSpec = { id: 'wall', x: 0, y: 2, z: 3, hx: 6, hy: 2, hz: 0.25 };
    const { game, enemy, run } = await setup([wall]);
    game.teleportPlayer(0, 60, Math.PI);
    run(10);
    // 鐘（半径 15m）が壁の向こう 7m で鳴る
    for (let i = 0; i < 30; i++) {
      game.emitNoise({ x: 0, y: 0, z: 7 }, 'bell');
      run(1);
    }
    expect(['suspicious', 'alert', 'chase']).toContain(enemy.state);
  });

  it('keeps enemies on the terrain of the level and registers every spawn point', async () => {
    const level = createLevel(ASHEN_FOUNDATION);
    const game = await Game.create(levelGameOptions(level));
    for (let i = 0; i < 90; i++) game.update(DT);
    expect(game.enemies.enemies).toHaveLength(level.data.enemies.length);
    expect(game.enemies.enemies.length).toBeGreaterThan(0);
    for (const e of game.enemies.enemies) {
      expect(game.lockOnTargets).toContain(e);
      expect(Math.abs(e.position.y - level.heightAt(e.position.x, e.position.z))).toBeLessThan(0.3);
      expect(e.state).toBe('idle');
    }
  });
});

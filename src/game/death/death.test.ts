import { beforeAll, describe, expect, it } from 'vitest';
import type { GameEventMap } from '../../core/gameEvents';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import { bonfiresOf } from '../bonfire/bonfire';
import { DEATH } from '../data/death';
import { PLAYER_STATS } from '../data';
import { Game } from '../game';
import { hudModelOf } from '../hud/hud.system';
import { FakeInput } from '../testing/fakeInput';
import type { EnemySpawn } from '../world/level';
import { deathOf } from './death.system';

const DT = 1 / 60;

const SOLDIER: EnemySpawn = {
  id: 'soldier',
  type: 'undead_soldier',
  area: 'A',
  x: 25,
  z: 25,
  yaw: 0,
  behavior: 'wait',
};

/** 死亡処理（タイムライン・入力無効・スキップ・再開時のリセット）の結合テスト。篝火は (0, 0)、プレイヤーは (5, 5)。 */
describe('death and respawn', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(options: { bonfire?: boolean } = {}) {
    const input = new FakeInput();
    const game = await Game.create({
      input,
      save: new SaveStore(new MemoryStorage()),
      boxes: [],
      dummies: [],
      enemies: [SOLDIER],
      interactables:
        options.bonfire === false
          ? []
          : [{ id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: 0 }],
      spawn: { x: 5, z: 5, yaw: 0 },
    });
    const events: { name: string; payload: unknown }[] = [];
    for (const name of ['death', 'bgmDuck', 'rest'] as const) {
      game.events.on(name, (payload: GameEventMap[typeof name]) => events.push({ name, payload }));
    }
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    run(5);
    return { game, input, events, run, death: deathOf(game) };
  }

  const phases = (events: { name: string; payload: unknown }[]) =>
    events.filter((e) => e.name === 'death').map((e) => (e.payload as GameEventMap['death']).phase);

  it('plays the timeline when HP reaches 0 and respawns at the bonfire (F300)', async () => {
    const { game, events, run, death } = await setup();
    game.playerTarget.health.damage(PLAYER_STATS.hp);
    run(1);
    expect(death.active).toBe(true);
    expect(game.player.dead).toBe(true);
    expect(phases(events)).toEqual(['start']);
    expect(events.find((e) => e.name === 'bgmDuck')?.payload).toEqual({
      db: DEATH.bgmDuckDb,
      frames: DEATH.bgmDuckFrames,
    });

    run(12);
    expect(phases(events)).toEqual(['start', 'anim']);
    run(18);
    expect(phases(events)).toEqual(['start', 'anim', 'grade']);
    run(30);
    expect(phases(events)).toContain('text');
    run(30);
    expect(phases(events)).toContain('skippable');
    expect(death.visual.grade).toBeGreaterThan(0.5);
    run(30);
    expect(phases(events)).toContain('hold');
    expect(death.visual.grade).toBe(1);
    expect(game.camera.presentation.fovOffsetDeg).toBeLessThan(-3.5);
    expect(hudModelOf(game).opacity).toBe(0); // HUD は死亡中に隠れる

    run(120);
    expect(phases(events)).toContain('fadeOut');
    expect(phases(events)).not.toContain('respawn');
    run(60);
    expect(phases(events).slice(-1)).toEqual(['respawn']);
    expect(death.active).toBe(false);
    expect(death.log.map((e) => e.frame)).toEqual([0, 12, 30, 60, 90, 120, 240, 300]);

    // 再開: 篝火の南 1.5m で立ち上がり、HP 全回復・画面効果のリセット
    expect(game.player.state).toBe('standUp');
    expect(game.player.feet.x).toBeCloseTo(0, 3);
    expect(game.player.feet.z).toBeCloseTo(-1.5, 3);
    expect(game.playerTarget.health.current).toBe(PLAYER_STATS.hp);
    expect(game.camera.presentation).toEqual({ fovOffsetDeg: 0, armOffsetM: 0 });
    expect(death.visual.grade).toBe(0);
    expect(
      events.filter((e) => e.name === 'rest').map((e) => (e.payload as { cause: string }).cause),
    ).toEqual(['respawn']);
    // rest（リセット）は respawn の通知より前
    const names = events.map((e) => e.name);
    expect(names.indexOf('rest')).toBeLessThan(names.lastIndexOf('death'));
    expect(events.at(-1)).toMatchObject({ name: 'bgmDuck', payload: { db: 0 } });

    // 立ち上がりの後は操作できる
    run(DEATH.revealFrames + 130);
    expect(game.player.dead).toBe(false);
    expect(['idle', 'move']).toContain(game.player.state);
    expect(death.active).toBe(false);
  });

  it('disables input and releases the lock-on while dead', async () => {
    const { game, input, run } = await setup();
    game.playerTarget.health.damage(PLAYER_STATS.hp);
    run(2);
    const before = { x: game.player.feet.x, z: game.player.feet.z };
    input.setMove(0, 1);
    input.press('lightAttack');
    run(30);
    expect(game.player.state).toBe('dead');
    expect(game.player.feet.x).toBeCloseTo(before.x, 3);
    expect(game.player.feet.z).toBeCloseTo(before.z, 3);
    expect(game.lockOn.active).toBe(false);
  });

  it('refills flasks, revives enemies and keeps saved progress on respawn', async () => {
    const { game, run } = await setup();
    const bonfire = bonfiresOf(game);
    expect(bonfire.ids).toEqual(['bonfire']);
    game.player.flask.use();
    game.player.flask.use();
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('no enemy');
    enemy.kill();
    expect(enemy.alive).toBe(false);
    game.playerTarget.health.damage(PLAYER_STATS.hp);
    run(1 + DEATH.fadeOutFrame + DEATH.fadeOutFrames);
    expect(game.player.flask.count).toBe(game.player.flask.max);
    expect(game.enemies.enemies[0]?.alive).toBe(true);
  });

  it('skips from F90 on: respawns after about 3 seconds', async () => {
    const { game, input, events, run, death } = await setup();
    game.playerTarget.health.damage(PLAYER_STATS.hp);
    run(1);
    // F60 の入力は無視される
    run(60);
    input.press('interact');
    run(1);
    expect(death.skipped).toBe(false);
    run(DEATH.skipFrame - death.frame);
    expect(death.frame).toBe(DEATH.skipFrame);
    input.press('interact');
    run(1);
    expect(death.skipped).toBe(true);
    run(200);
    expect(death.active).toBe(false);
    const respawn = death.log.find((e) => e.phase === 'respawn');
    expect(respawn?.frame).toBe(180);
    expect(phases(events)).not.toContain('hold');
  });

  it('falls back to the spawn point when the level has no bonfire', async () => {
    const { game, run } = await setup({ bonfire: false });
    game.playerTarget.health.damage(PLAYER_STATS.hp);
    run(1 + 300);
    expect(game.playerTarget.health.current).toBe(PLAYER_STATS.hp);
    expect(game.player.dead).toBe(false);
    expect(game.player.feet.x).toBeCloseTo(5, 3);
    expect(game.player.feet.z).toBeCloseTo(5, 3);
  });
});

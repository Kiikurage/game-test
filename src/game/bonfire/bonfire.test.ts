import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore, SAVE_KEY } from '../../core/persistence';
import type { GameEventMap } from '../../core/gameEvents';
import { BONFIRE, PLAYER_STATS } from '../data';
import { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { FakeInput } from '../testing/fakeInput';
import type { EnemySpawn } from '../world/level';
import { bonfiresOf } from './bonfire';

const DT = 1 / 60;

const SOLDIER: EnemySpawn = {
  id: 'soldier',
  type: 'undead_soldier',
  area: 'A',
  x: 20,
  z: 20,
  yaw: 0,
  behavior: 'wait',
};

/** 篝火（インタラクション基盤・点火・休憩・リスポーン）の結合テスト。平らな地面、篝火は (0, 0)。 */
describe('bonfire (interaction, ignition, rest, respawn)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(
    options: { storage?: MemoryStorage; start?: { x: number; z: number } } = {},
  ) {
    const storage = options.storage ?? new MemoryStorage();
    const input = new FakeInput();
    const save = new SaveStore(storage);
    const start = options.start ?? { x: 0, z: -1.2 };
    const game = await Game.create({
      input,
      save,
      boxes: [],
      dummies: [],
      enemies: [SOLDIER],
      interactables: [{ id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: 0 }],
      spawn: { x: start.x, z: start.z, yaw: 0 },
    });
    const events: { name: string; payload: unknown }[] = [];
    for (const name of ['bonfireLit', 'rest', 'interactPrompt'] as const) {
      game.events.on(name, (payload: GameEventMap[typeof name]) => events.push({ name, payload }));
    }
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    const press = () => {
      input.press('interact');
      run(1);
    };
    const bonfire = bonfiresOf(game);
    return { game, input, save, storage, events, run, press, bonfire };
  }

  const savedBonfires = (storage: MemoryStorage): string[] => {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as { data: { bonfires: string[] } }).data.bonfires;
  };

  it('shows the situational action for an unlit bonfire within 1.5m only', async () => {
    const { game, run } = await setup();
    run(5);
    expect(interactionOf(game).prompt).toEqual({
      id: 'bonfire',
      kind: 'bonfire',
      label: '火を灯す',
    });
    game.teleportPlayer(0, -1.6, 0);
    run(2);
    expect(interactionOf(game).prompt).toBeNull();
    game.teleportPlayer(0, -1.5, 0);
    run(2);
    expect(interactionOf(game).prompt?.label).toBe('火を灯す');
  });

  it('ignites in 2 seconds, saves, and emits the banner event', async () => {
    const { game, press, run, events, storage, bonfire } = await setup();
    run(5);
    expect(bonfire.isLit('bonfire')).toBe(false);
    press();
    expect(game.player.state).toBe('interact');
    expect(interactionOf(game).prompt).toBeNull(); // 実行中は他アクション不可
    // 2 秒（120F）で完了。直前まではまだ灯っていない
    run(BONFIRE.igniteFrames - 3);
    expect(bonfire.isLit('bonfire')).toBe(false);
    expect(savedBonfires(storage)).toEqual([]);
    run(4);
    expect(bonfire.isLit('bonfire')).toBe(true);
    expect(savedBonfires(storage)).toEqual(['bonfire']);
    expect(game.save.get().bonfires).toEqual(['bonfire']);
    const lit = events.filter((e) => e.name === 'bonfireLit');
    expect(lit).toHaveLength(1);
    expect(lit[0]?.payload).toMatchObject({ id: 'bonfire', bannerSeconds: 3 });
    run(10);
    expect(game.player.state).toBe('idle');
    expect(interactionOf(game).prompt?.label).toBe('休む');
  });

  it('cancels the ignition when the player is hit', async () => {
    const { game, press, run, bonfire } = await setup();
    run(5);
    press();
    run(30);
    game.debugHitPlayer({ from: 'front', damage: 10, poiseDamage: 100 });
    run(BONFIRE.igniteFrames);
    expect(game.player.state).not.toBe('interact');
    expect(bonfire.isLit('bonfire')).toBe(false);
    expect(game.save.get().bonfires).toEqual([]);
  });

  it('rests: full heal, flasks, stamina, enemy respawn, rest event; holds until the next input', async () => {
    const { game, press, run, events, storage, bonfire } = await setup();
    run(5);
    press();
    run(BONFIRE.igniteFrames + 10); // 点火

    // 傷つき、瓶を使い、敵を倒した状態
    game.playerTarget.health.damage(200);
    game.player.flask.use();
    game.player.flask.use();
    game.player.stamina.consume(60);
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('no enemy');
    enemy.kill();
    expect(enemy.alive).toBe(false);

    press();
    expect(game.player.state).toBe('sitDown');
    expect(game.playerTarget.health.current).toBe(PLAYER_STATS.hp);
    expect(game.player.flask.count).toBe(game.player.flask.max);
    expect(game.player.stamina.current).toBe(game.player.stamina.max);
    expect(enemy.alive).toBe(true);
    expect(enemy.hp).toBe(enemy.maxHp);
    expect(enemy.position.x).toBeCloseTo(SOLDIER.x, 3);
    expect(game.reactors.has(enemy.id)).toBe(true);
    const rests = events.filter((e) => e.name === 'rest');
    expect(rests).toHaveLength(1);
    expect(rests[0]?.payload).toMatchObject({
      cause: 'rest',
      bonfireId: 'bonfire',
      defeatedBosses: [],
    });
    expect(savedBonfires(storage)).toEqual(['bonfire']);

    // 座り込みの後は保持
    run(BONFIRE.sitDownFrames + 30);
    expect(game.player.state).toBe('rest');
    expect(interactionOf(game).prompt?.label).toBe('立ち上がる');
    // 保持中は被弾しない・移動入力で動かない
    expect(game.player.invulnerable).toBe(true);

    // 再入力で立ち上がる（約 2 秒）
    press();
    expect(game.player.state).toBe('standUp');
    run(BONFIRE.standUpFrames - 3);
    expect(game.player.state).toBe('standUp');
    run(6);
    expect(game.player.state).toBe('idle');
    expect(bonfire.currentId).toBe('bonfire');
  });

  it('respawn point is 1.5m south facing the bonfire; respawn stands up for 2s without taking hits', async () => {
    const { game, run, events, bonfire } = await setup({ start: { x: 8, z: 8 } });
    const point = bonfire.respawnPoint('bonfire');
    expect(point).toMatchObject({ x: 0, z: -1.5 });
    expect(point?.yaw).toBeCloseTo(0, 5); // +z（北）= 篝火の方
    expect(bonfire.respawnPoint('none')).toBeNull();

    run(5);
    game.playerTarget.health.damage(PLAYER_STATS.hp);
    game.player.die();
    expect(game.player.dead).toBe(true);
    game.player.flask.use();
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('no enemy');
    enemy.kill();

    expect(bonfire.respawn()).toBe(true);
    expect(game.player.feet.x).toBeCloseTo(0, 3);
    expect(game.player.feet.z).toBeCloseTo(-1.5, 3);
    expect(game.player.state).toBe('standUp');
    expect(game.playerTarget.health.current).toBe(PLAYER_STATS.hp);
    expect(game.player.flask.count).toBe(game.player.flask.max);
    expect(enemy.alive).toBe(true);
    expect(events.filter((e) => e.name === 'rest')[0]?.payload).toMatchObject({ cause: 'respawn' });
    // 未点火の篝火へのリスポーンは点火しない
    expect(game.save.get().bonfires).toEqual([]);

    // 立ち上がり中は動けず、被弾しない
    const x = game.player.feet.x;
    const z = game.player.feet.z;
    run(60);
    expect(game.player.state).toBe('standUp');
    expect(game.player.feet.x).toBeCloseTo(x, 3);
    expect(game.player.feet.z).toBeCloseTo(z, 3);
    game.debugHitPlayer({ from: 'front', damage: 50 });
    expect(game.playerTarget.health.current).toBe(PLAYER_STATS.hp);
    run(BONFIRE.standUpFrames);
    expect(game.player.state).toBe('idle');
    expect(game.player.yaw).toBeCloseTo(0, 3);
  });

  it('restores lit bonfires from the save', async () => {
    const first = await setup();
    first.run(5);
    first.press();
    first.run(BONFIRE.igniteFrames + 5);
    expect(first.bonfire.isLit('bonfire')).toBe(true);

    const second = await setup({ storage: first.storage });
    second.run(5);
    expect(second.bonfire.isLit('bonfire')).toBe(true);
    expect(interactionOf(second.game).prompt?.label).toBe('休む');
  });
});

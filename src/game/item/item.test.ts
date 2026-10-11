import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import type { GameEventMap } from '../../core/gameEvents';
import { PLAYER_STATS } from '../data';
import { LOOT } from '../data/world/lootTuning';
import { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { FakeInput } from '../testing/fakeInput';
import { bonfiresOf } from '../bonfire/bonfire';
import { itemsOf } from './item';

const DT = 1 / 60;

/** アイテム取得（回復瓶 +1）の結合テスト。平らな地面、アイテムは (10, 10)、篝火は (0, 0)。 */
describe('item pickup (flask +1)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(storage = new MemoryStorage()) {
    const input = new FakeInput();
    const save = new SaveStore(storage);
    const game = await Game.create({
      input,
      save,
      boxes: [],
      dummies: [],
      enemies: [],
      interactables: [
        { id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: 0 },
        { id: 'item-flask-c', kind: 'item', area: 'C', x: 10, z: 10, itemId: 'flask_up' },
      ],
      spawn: { x: 10, z: 8.8, yaw: 0 },
    });
    const picked: GameEventMap['itemPicked'][] = [];
    game.events.on('itemPicked', (e) => picked.push(e));
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
    return { game, save, storage, picked, run, press };
  }

  it('offers "拾う" within range', async () => {
    const { game, run } = await setup();
    run(5);
    expect(interactionOf(game).prompt).toEqual({ id: 'item-flask-c', kind: 'loot', label: '拾う' });
  });

  it('picking up raises the max and the count by one, saves, and notifies', async () => {
    const { game, save, picked, run, press } = await setup();
    run(5);
    expect(game.player.flask.max).toBe(3);
    game.player.flask.use();
    press();
    expect(game.player.state).toBe('interact');
    run(LOOT.effectFrame - 3);
    expect(game.player.flask.max).toBe(3);
    run(5);
    expect(game.player.flask.max).toBe(4);
    expect(game.player.flask.count).toBe(3); // 2 + 1
    expect(save.getCount('flask_up')).toBe(1);
    expect(picked).toHaveLength(1);
    expect(picked[0]).toMatchObject({ itemId: 'flask_up', message: '回復瓶を手に入れた' });
    expect(itemsOf(game).ids).toEqual([]);
  });

  it('cannot be picked up twice', async () => {
    const { game, run, press } = await setup();
    run(5);
    press();
    run(LOOT.frames + 10);
    expect(game.player.flask.max).toBe(4);
    expect(interactionOf(game).prompt).toBeNull();
    press();
    run(LOOT.frames + 10);
    expect(game.player.flask.max).toBe(PLAYER_STATS.flask.max);
    expect(game.player.state).toBe('idle');
  });

  it('is cancelled when the player is hit during the pickup', async () => {
    const { game, save, run, press } = await setup();
    run(5);
    press();
    run(5);
    game.debugHitPlayer({ from: 'front', damage: 10, poiseDamage: 100 });
    run(LOOT.frames);
    expect(game.player.flask.max).toBe(3);
    expect(save.getCount('flask_up')).toBe(0);
    expect(itemsOf(game).ids).toEqual(['item-flask-c']);
  });

  it('is not placed again after save and load, and the max is restored', async () => {
    const first = await setup();
    first.run(5);
    first.press();
    first.run(LOOT.frames + 10);
    const second = await setup(first.storage);
    second.run(5);
    expect(itemsOf(second.game).ids).toEqual([]);
    expect(interactionOf(second.game).prompt).toBeNull(); // 取得済みは候補にならない
    expect(second.game.player.flask.max).toBe(4);
    expect(second.game.player.flask.count).toBe(4);
  });

  it('resting refills the flasks up to 4', async () => {
    const { game, run, press } = await setup();
    run(5);
    press();
    run(LOOT.frames + 10);
    game.player.flask.use();
    game.player.flask.use();
    game.player.flask.use();
    expect(game.player.flask.count).toBe(1);
    game.teleportPlayer(0, -1.2, 0);
    run(5);
    press(); // 篝火（未点火）→ 点火
    run(130);
    press(); // 休む
    expect(game.player.flask.count).toBe(4);
    expect(bonfiresOf(game).isLit('bonfire')).toBe(true);
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import type { GameEventMap } from '../../core/gameEvents';
import { LOOT } from '../data/world/lootTuning';
import { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { FakeInput } from '../testing/fakeInput';
import { textPanelOf } from '../text/textPanel.system';
import { interactablesOf } from './interactable';

const DT = 1 / 60;

/** 読む・調べるの結合テスト。平らな地面。碑 `grave_b1` は (16, 3)、遺体 `corpse_b_flask` は (24, 9)（配置データ）。 */
describe('data-driven interactables (read / loot)', () => {
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
        { id: 'grave_b1', kind: 'read', area: null, x: 16, z: 3 },
        { id: 'corpse_b_flask', kind: 'loot', area: null, x: 24, z: 9 },
        // 未実装の種別（祈る）は置いてあっても登録されない
        { id: 'statue_c', kind: 'read', area: null, x: 30, z: 9 },
      ],
      spawn: { x: 16, z: 1.8, yaw: 0 },
    });
    const texts: GameEventMap['showText'][] = [];
    const picked: GameEventMap['itemPicked'][] = [];
    game.events.on('showText', (e) => texts.push(e));
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
    return { game, save, storage, texts, picked, run, press };
  }

  it('registers only the implemented kinds that the level places', async () => {
    const { game } = await setup();
    expect([...interactablesOf(game).ids].sort()).toEqual(['corpse_b_flask', 'grave_b1']);
  });

  it('read: offers 読む, shows the text without stopping, and saves read.<id>', async () => {
    const { game, save, storage, texts, run, press } = await setup();
    run(5);
    expect(interactionOf(game).prompt).toEqual({ id: 'grave_b1', kind: 'read', label: '読む' });
    press();
    expect(texts).toEqual([{ id: 'grave_b1', mode: 'read' }]);
    expect(game.player.state).not.toBe('interact'); // 立ち止まらない
    expect(save.hasFlag('read.grave_b1')).toBe(true);
    expect(textPanelOf(game).current?.text).toBe(
      '名は風が削った。\n門の前で倒れた、とだけ残っている。',
    );
    // セーブされている（ストレージから読み直しても残る）
    expect(new SaveStore(storage).hasFlag('read.grave_b1')).toBe(true);
    // 何度でも読める
    run(5);
    press();
    expect(texts).toHaveLength(2);
  });

  it('read: the text closes after 6 seconds, or when the player moves 2m away', async () => {
    const { game, run, press } = await setup();
    run(5);
    press();
    expect(textPanelOf(game).active).toBe(true);
    run(60 * 6 - 5);
    expect(textPanelOf(game).active).toBe(true);
    run(10);
    expect(textPanelOf(game).active).toBe(false);

    press();
    expect(textPanelOf(game).active).toBe(true);
    game.teleportPlayer(16, 5.2, 0);
    run(2);
    expect(textPanelOf(game).active).toBe(false);
  });

  it('loot: crouches for 60F (defenseless), gets the item and the text at the effect frame, then hides', async () => {
    const { game, save, texts, picked, run, press } = await setup();
    game.teleportPlayer(24, 7.8, 0);
    run(5);
    expect(interactionOf(game).prompt).toEqual({
      id: 'corpse_b_flask',
      kind: 'loot',
      label: '調べる',
    });
    press();
    expect(game.player.state).toBe('interact');
    run(LOOT.effectFrame - 5);
    expect(save.getCount('relic_flask')).toBe(0);
    run(10);
    expect(save.getCount('relic_flask')).toBe(1);
    expect(save.hasFlag('loot.corpse_b_flask')).toBe(true);
    expect(texts).toEqual([{ id: 'corpse_b_flask', mode: 'read' }]);
    expect(picked).toHaveLength(1);
    expect(picked[0]).toMatchObject({ itemId: 'relic_flask', name: '空の水筒' });
    expect(game.player.state).toBe('interact'); // まだかがんでいる（動作は 60F）
    run(LOOT.frames);
    expect(game.player.state).toBe('idle');
    expect(interactionOf(game).prompt).toBeNull();
    expect(interactablesOf(game).usableIds).toEqual(['grave_b1']);
  });

  it('loot: nothing is obtained when the player is hit during the crouch', async () => {
    const { game, save, run, press } = await setup();
    game.teleportPlayer(24, 7.8, 0);
    run(5);
    press();
    run(5);
    game.debugHitPlayer({ from: 'front', damage: 10, poiseDamage: 100 });
    run(LOOT.frames);
    expect(save.getCount('relic_flask')).toBe(0);
    expect(save.hasFlag('loot.corpse_b_flask')).toBe(false);
    expect(interactablesOf(game).usableIds).toContain('corpse_b_flask');
  });

  it('loot: the taken state is saved and the corpse is not offered after loading', async () => {
    const first = await setup();
    first.game.teleportPlayer(24, 7.8, 0);
    first.run(5);
    first.press();
    first.run(LOOT.frames + 5);
    const second = await setup(first.storage);
    second.game.teleportPlayer(24, 7.8, 0);
    second.run(5);
    expect(second.save.getCount('relic_flask')).toBe(1);
    expect(interactionOf(second.game).prompt).toBeNull();
  });
});

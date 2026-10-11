import { beforeAll, describe, expect, it } from 'vitest';
import type { GameEventMap } from '../../core/gameEvents';
import { Game } from '../game';
import { FIELD_BGM_FADE_FRAMES } from './fieldBgm.system';

const DT = 1 / 60;

describe('field BGM system', () => {
  beforeAll(async () => {
    await Game.create();
  });

  it('requests the area track on the first step, on rest and on respawn', async () => {
    const game = await Game.create({ boxes: [], dummies: [], enemies: [], interactables: [] });
    const log: GameEventMap['bgmChange'][] = [];
    game.events.on('bgmChange', (e) => log.push(e));
    expect(log).toEqual([]);
    game.update(DT);
    game.update(DT);
    expect(log).toEqual([{ track: 'bgm.area', frames: FIELD_BGM_FADE_FRAMES }]);
    const rest = { bonfireId: 'b', position: { x: 0, y: 0, z: 0 }, defeatedBosses: [] };
    game.events.emit('rest', { cause: 'rest', ...rest });
    game.events.emit('rest', { cause: 'respawn', ...rest });
    expect(log.filter((e) => e.track === 'bgm.area')).toHaveLength(3);
  });
});

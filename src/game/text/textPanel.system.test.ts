import { beforeAll, describe, expect, it } from 'vitest';
import { WORLD_INTERACTABLES } from '../data/world/interactables';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { textPanelOf } from './textPanel.system';

const DT = 1 / 60;

describe('textPanel system', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  // #353: 石碑のそばで会話を最後まで送ったとき、閉じるための押下で石碑を読み直さない
  it('does not re-read a nearby stele with the press that closes a conversation', async () => {
    const stele = WORLD_INTERACTABLES.find((i) => i.id === 'stone_hearth');
    if (!stele) throw new Error('no stone_hearth');
    const input = new FakeInput();
    const game = await Game.create({
      input,
      boxes: [],
      dummies: [],
      enemies: [],
      interactables: [{ id: stele.id, kind: stele.kind, area: null, x: stele.x, z: stele.z }],
      spawn: { x: stele.x, z: stele.z - 1.2, yaw: 0 },
    });
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    const tap = () => {
      input.press('interact');
      run(1);
      input.release('interact');
      run(1);
    };
    run(5);
    game.events.emit('showText', { text: ['a', 'b', 'c'], mode: 'conversation' });
    run(2);
    const panel = textPanelOf(game);
    expect(panel.current).toMatchObject({ mode: 'conversation', index: 0 });
    tap();
    expect(panel.current?.index).toBe(1);
    tap();
    expect(panel.current?.index).toBe(2);
    tap();
    expect(panel.current).toBeNull();
    run(10);
    expect(panel.current).toBeNull();
    // 次の押下では石碑を読める
    tap();
    expect(panel.current?.mode).toBe('read');
  });
});

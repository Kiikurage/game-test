import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import { PLAYER_STATS } from '../../game/data';
import { Game } from '../../game/game';
import { FakeInput } from '../../game/testing/fakeInput';
import { HUD_FADE_FRAMES } from './hudModel';
import { hudPresentation } from './hudPresentation';

const DT = 1 / 60;

/** 表示用状態が game のステップ（`stepEnd`）とイベントに追従する（game 側は表示用状態を持たない）。 */
describe('hudPresentation', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup() {
    const input = new FakeInput();
    const game = await Game.create({
      input,
      save: new SaveStore(new MemoryStorage()),
      boxes: [],
      dummies: [],
      enemies: [],
      interactables: [{ id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: 0 }],
      spawn: { x: 5, z: 5, yaw: 0 },
    });
    const p = hudPresentation(game);
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    return { game, p, run };
  }

  it('is one per game', async () => {
    const a = await setup();
    const b = await setup();
    expect(hudPresentation(a.game)).toBe(a.p);
    expect(b.p).not.toBe(a.p);
  });

  it('steps the HP bar each game step and fades the HUD out while dead', async () => {
    const { game, p, run } = await setup();
    run(2);
    expect(p.hud.hpRatio).toBe(1);
    expect(p.hud.opacity).toBe(1);
    game.playerTarget.health.damage(PLAYER_STATS.hp);
    run(1);
    expect(p.hud.hpRatio).toBe(0);
    expect(p.hud.hpGhostRatio).toBe(1); // 残像はまだ残る
    run(HUD_FADE_FRAMES);
    expect(p.hud.opacity).toBe(0);
  });

  it('queues a notice for a picked item', async () => {
    const { game, p, run } = await setup();
    game.events.emit('itemPicked', {
      id: 'x',
      itemId: 'x',
      name: 'x',
      message: '拾った',
      position: { x: 0, y: 0, z: 0 },
      noticeSeconds: 2,
    });
    run(1);
    expect(p.notices.current?.text).toBe('拾った');
  });
});

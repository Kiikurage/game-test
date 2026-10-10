import { beforeAll, describe, expect, it } from 'vitest';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { bossDebugOf } from './bossDebug.system';
import { BOSS_MOVE_IDS } from './bossData';
import { REPEAT_GAP_FRAMES, isBossToolScene, listBossToolMoves } from './bossDebug';

const DT = 1 / 60;

describe('boss debug tool (verification UI backend)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup() {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [] });
    game.teleportPlayer(0, 0, Math.PI);
    const tool = bossDebugOf(game);
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    return { game, tool, run };
  }

  it('lists every boss move id dynamically (registered moves and stubs)', () => {
    expect(listBossToolMoves().map((m) => m.id)).toEqual([...BOSS_MOVE_IDS]);
  });

  it('only the boss scene (?scene=boss) is a tool scene', () => {
    expect(isBossToolScene('?scene=boss&debug')).toBe(true);
    expect(isBossToolScene('?scene=test&boss')).toBe(false);
    expect(isBossToolScene('?debug')).toBe(false);
  });

  it('fires the selected move at the configured distance with the AI off', async () => {
    const { game, tool, run } = await setup();
    tool.set('moveId', 'overhead');
    tool.set('distance', 3);
    expect(tool.fire()).toBe(true);
    const boss = tool.boss;
    expect(boss?.currentMove).toBe('overhead');
    const p = game.player.feet;
    expect(Math.hypot((boss?.position.x ?? 0) - p.x, (boss?.position.z ?? 0) - p.z)).toBeCloseTo(3);

    run(10);
    const info = tool.info();
    expect(info.moveName).toContain('大上段');
    expect(info.stageFrame).toBe(10);
    expect(info.segment).toBe('startup');
    expect(info.hitboxActive).toBe(false);
    expect(info.windows).not.toBeNull();
    expect(info.expectation).toContain('F36');

    // 技が終わっても、AI オフなら次の技を出さず待機する
    run(300);
    expect(boss?.state).toBe('dormant');
    expect(boss?.debugInfo.history).toEqual(['overhead']);
  });

  it('repeats the move when repeat is on, and refuses moves the phase cannot use', async () => {
    const { tool, run } = await setup();
    tool.set('moveId', 'spin'); // フェーズ 2 のみ
    expect(tool.fire()).toBe(false);
    tool.set('phase', 2);
    tool.set('repeat', true);
    expect(tool.fire()).toBe(true);
    run(400 + REPEAT_GAP_FRAMES);
    expect(tool.boss?.debugInfo.history.length).toBeGreaterThan(1);
  });

  it('slow motion goes through the shared time scale', async () => {
    const { game, tool } = await setup();
    tool.set('slow', 0.25);
    expect(game.timeScale.current).toBe(0.25);
    tool.set('slow', 1);
    expect(game.timeScale.current).toBe(1);
  });
});

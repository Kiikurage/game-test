import { describe, expect, it, vi } from 'vitest';
import { createHeadlessGame } from './headlessGame';

// game / core が描画用の three/webgpu を読み込んだら、この行で失敗する（数学型は `three` 本体から読む）
vi.mock('three/webgpu', () => {
  throw new Error('three/webgpu must not be imported by the headless simulation');
});

/** 実レベル「灰の礎」をブラウザ無しで動かすハーネスの検証。 */
describe('createHeadlessGame (real level, no browser)', () => {
  it('spawns the player on the ground at the level spawn', async () => {
    const { game, level, run } = await createHeadlessGame({ enemies: [] });
    game.tuning.camera.autoFollow = false;
    run(10);
    const spawn = level.data.playerSpawn;
    expect(game.player.grounded).toBe(true);
    expect(game.player.feet.x).toBeCloseTo(spawn.x, 1);
    expect(game.player.feet.z).toBeCloseTo(spawn.z, 1);
    expect(game.player.feet.y).toBeCloseTo(level.heightAt(spawn.x, spawn.z), 0);
  });

  it('walks up the mausoleum steps onto the roof', async () => {
    // 霊廟の階段（x=29, z=21.6 から -Z へ 8 段・計 2.2m 上る）の下に南向き（-Z）で立つ
    const { game, input, run } = await createHeadlessGame({
      enemies: [],
      at: { x: 29, z: 22.8, yaw: Math.PI },
    });
    game.tuning.camera.autoFollow = false;
    run(10);
    const startY = game.player.feet.y;
    input.setMove(0, 1);
    run(90);
    expect(game.player.feet.z).toBeLessThan(19);
    expect(game.player.feet.y).toBeGreaterThan(startY + 1.8);
    expect(game.player.grounded).toBe(true);
  });

  it('places the level enemies unless overridden', async () => {
    const { game, level } = await createHeadlessGame();
    game.tuning.camera.autoFollow = false;
    expect(game.enemies.enemies.length).toBe(level.data.enemies.length);
  });
});

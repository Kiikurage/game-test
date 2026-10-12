import { describe, expect, it } from 'vitest';
import { createHeadlessGame, settle, stepUntil, tap } from '../testing/headlessGame';

/**
 * 実レベルでのインタラクト動作（E2E の worldActions から移した。案内・テキスト表示を見る鐘・鉄格子は E2E に残す）。
 * 配置データにない対象は `dev.placeInteractable` でその場に置く。
 */
describe('world actions on the level', () => {
  it('hatch: stepping on the rotten floorboard breaks it and drops the player into the waterway', async () => {
    const h = await createHeadlessGame({ enemies: [] });
    settle(h);
    const hp0 = h.sim().combat.playerHp;
    expect(h.dev.hatchBroken('hatch_c')).toBe(false);
    h.game.teleportPlayer(44, 28, 0);
    stepUntil(
      h,
      () => h.dev.hatchBroken('hatch_c'),
      (broken) => broken,
    );
    stepUntil(
      h,
      () => h.game.player.feet.y,
      (y) => y < 1.5,
    );
    expect(h.sim().combat.playerHp).toBe(hp0); // 落下ダメージなし
    expect(h.dev.interactables().flags).toEqual([]); // セーブなし
  });

  it('wall: attacks break a placed breakable wall, which opens the way and is saved', async () => {
    const h = await createHeadlessGame({ enemies: [] });
    settle(h);
    // 鉄門 G1 (78, 32) と同じ位置に壊せる壁を置き、南側から叩く。壊れるとコライダ G1 が外れて通れる
    h.dev.placeInteractable({
      id: 'wall_test',
      kind: 'breakable',
      x: 78,
      z: 32,
      site: 'main',
      prompt: null,
      hp: 150,
      colliderId: 'G1',
      effects: [
        { type: 'emitSound', radiusM: 12, kind: 'crash' },
        { type: 'setFlag', flag: 'world.wallG1Broken' },
      ],
    });
    h.game.teleportPlayer(78, 30.4, 0);
    h.run(20);
    expect(h.dev.wallHp('wall_test')).toBe(150);
    for (let i = 0; i < 8 && h.dev.wallHp('wall_test') !== 0; i++) {
      tap(h, 'lightAttack');
      h.run(90);
    }
    expect(h.dev.wallHp('wall_test')).toBe(0);
    expect(h.dev.interactables().flags).toContain('world.wallG1Broken');
    h.run(80); // 崩壊の演出 60F のあと、通れる
    h.game.teleportPlayer(78, 30.4, 0);
    h.input.setMove(0, 1);
    stepUntil(
      h,
      () => h.game.player.feet.z,
      (z) => z > 34,
    );
    h.input.setMove(0, 0);
  });
});

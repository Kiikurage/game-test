import { describe, expect, it } from 'vitest';
import { createHeadlessGame, settle } from '../testing/headlessGame';

/** 実レベルの敵（E2E の navigation / killFeedback から移した）。 */
describe('enemies on the level', () => {
  it('an enemy goes around the rock of the catacombs to reach a player on the other side', async () => {
    const h = await createHeadlessGame();
    settle(h);
    // d-shield-1 は地下墓所 D の出口側 (74, 49)。プレイヤーは L 字の通路の第 1 区間 (62, 41)。間に岩盤
    // （x 63..78, z 35.5..47.25）があり直線約 14.4m。通路の角 (62, 48.5) を回らないと着かない（約 18m）。
    h.game.teleportPlayer(62, 41, 0);
    h.run(2);
    const enemy = () => {
      const e = h.sim().enemies.find((x) => x.id === 'd-shield-1');
      if (!e) throw new Error('enemy not found');
      return e;
    };
    const player = h.game.player.feet.clone();
    const start = enemy();
    const trail: [number, number][] = [[start.x, start.z]];
    let inRock = false;
    let state = start.state;
    // 鐘（半径 15m。壁越しに聞こえる）で呼ぶ。視線は岩盤に遮られているので、追跡は聴覚だけで続く
    for (let i = 0; i < 160 && state !== 'approach'; i++) {
      h.dev.noise(player.x, player.y, player.z, 'bell');
      h.run(10);
      const e = enemy();
      state = e.state;
      trail.push([e.x, e.z]);
      if (e.x > 63.5 && e.x < 77.8 && e.z > 36 && e.z < 47) inRock = true;
    }
    // Approach は 5m 以内で視認してから 3m まで詰める
    h.run(120);
    const last = enemy();
    trail.push([last.x, last.z]);
    let travelled = 0;
    for (let i = 1; i < trail.length; i++) {
      const [ax, az] = trail[i - 1] as [number, number];
      const [bx, bz] = trail[i] as [number, number];
      travelled += Math.hypot(bx - ax, bz - az);
    }
    expect(state).toBe('approach');
    expect(Math.hypot(last.x - player.x, last.z - player.z)).toBeLessThan(3.6);
    expect(inRock).toBe(false);
    expect(travelled).toBeGreaterThan(14); // 壁へ突っ込まず通路の角を回ると 15m 超
    expect(Math.min(...trail.map((t) => t[0]))).toBeLessThan(65); // 通路の角（x≈62）の近くまで行って戻った
  });

  it('killing an enemy plays the kill SE, drops the lock-on and ignores hits on the corpse', async () => {
    const h = await createHeadlessGame();
    settle(h);
    h.dev.killEnemy(0, false); // 敵の手前へ移動するだけ
    const id = h.sim().enemies[0]?.id ?? '';
    expect(id).not.toBe('');
    h.dev.lock(id);
    h.run(2);
    expect(h.sim().lockOn.targetId).toBe(id);

    const strike = h.dev.strikeEnemy(0);
    expect(strike?.killed).toBe(true);
    expect(strike?.sounds).toContain('sfx.defeat-collapse');
    h.run(1);
    expect(h.sim().lockOn.targetId).not.toBe(id);

    // 死体を何度斬っても命中にならない（命中 SE も出ない）
    for (let i = 0; i < 3; i++) {
      expect(h.dev.strikeEnemy(0, 50)).toEqual({ hit: false, killed: false, sounds: [] });
      h.run(4);
    }
  });
});

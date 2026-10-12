import { describe, expect, it } from 'vitest';
import { MemoryStorage, SAVE_KEY } from '../../core/persistence';
import { createHeadlessGame, settle, tap } from '../testing/headlessGame';
import { arenaOf } from '../world/arena';
import { bossSystem } from './boss.system';

/**
 * ボス撃破演出（#86）を実レベルの闘技場で通す（E2E の bossDefeat から移した）: HP 0 → 撃破のセーブ → F300 に台座の篝火 →
 * F360 に操作可能で休める。各キューの細かいフレームは bossDefeat.system.test.ts。
 */
describe('boss defeat in the arena', () => {
  it('defeating the boss lights the pedestal bonfire and returns control', async () => {
    const storage = new MemoryStorage();
    const h = await createHeadlessGame({ storage });
    settle(h);
    const def = arenaOf(h.level);
    if (!def) throw new Error('no arena');
    // `?arena=boss` と同じ配置: 入口の内側 5m に立ち、ボスは中心の入口寄りで入口を向く
    const dx = def.center.x - def.entry.x;
    const dz = def.center.z - def.entry.z;
    const len = Math.hypot(dx, dz) || 1;
    h.game.teleportPlayer(
      def.entry.x + (dx / len) * 5,
      def.entry.z + (dz / len) * 5,
      Math.atan2(dx, dz),
    );
    h.game.systems.get(bossSystem).spawn({
      x: def.center.x + (dx / len) * 4,
      z: def.center.z + (dz / len) * 4,
      y: def.floorY,
      yaw: Math.atan2(-dx, -dz),
      engage: false,
      arena: def.circle,
      pillars: def.pillars,
    });

    const before = h.dev.bossDefeat();
    expect(before.frame).toBe(-1);
    expect(before.bossAlive).toBe(true);
    expect(before.arenaBonfireLit).toBe(false);
    expect(before.saved).toEqual([]);

    // ボスの HP を 0 に: 撃破のセーブ（以降ボスは復活しない）
    h.dev.bossDamage(1e9);
    const hit = h.dev.bossDefeat();
    expect(hit.frame).toBe(0);
    expect(hit.bossAlive).toBe(false);
    expect(hit.saved).toEqual(['boss']);
    const raw = storage.getItem(SAVE_KEY);
    expect((JSON.parse(raw ?? '{}') as { data: { bosses: string[] } }).data.bosses).toEqual([
      'boss',
    ]);

    // F299: まだ灯っていない / 霧は濃い。F300: 灯る
    h.run(299);
    const f299 = h.dev.bossDefeat();
    expect(f299.frame).toBe(299);
    expect(f299.arenaBonfireLit).toBe(false);
    expect(f299.fogDensity).toBeCloseTo(0.04, 3);
    h.run(1);
    expect(h.dev.bossDefeat().arenaBonfireLit).toBe(true);

    // F360: 操作可能になり、台座の篝火で休める
    h.run(60);
    const control = h.dev.bossDefeat();
    expect(control.frame).toBe(360);
    expect(control.controlRestored).toBe(true);
    expect(control.fogDensity).toBeCloseTo(0.015, 3);
    const slot = def.bonfireSlot;
    h.game.teleportPlayer(slot.x, slot.z - 1.2, 0, slot.y);
    h.run(10);
    const near = h.dev.bonfire();
    expect(near.lit).toContain('bonfire-arena');
    expect(near.prompt?.id).toBe('bonfire-arena');
    expect(near.prompt?.label).toBe('休む');
    tap(h, 'interact');
    expect(h.dev.bonfire().playerState).toBe('sitDown');
  });
});

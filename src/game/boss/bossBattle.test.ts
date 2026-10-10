import { describe, expect, it } from 'vitest';
import { pinnedAgainstWall, sectorTouchesCircle, wallGap } from './bossBattle';

const arena = { x: 0, z: 0, radius: 16 };

describe('pinnedAgainstWall', () => {
  it('is true only when the player is at the wall and the boss is on the centre side', () => {
    expect(pinnedAgainstWall(arena, { x: 0, z: 13 }, { x: 0, z: 15.2 })).toBe(true);
    // 壁際でもボスが壁側（プレイヤーの後ろ）なら、プレイヤーには逃げ場がある
    expect(pinnedAgainstWall(arena, { x: 0, z: 15.5 }, { x: 0, z: 13.5 })).toBe(false);
    // 中央付近
    expect(pinnedAgainstWall(arena, { x: 0, z: 1 }, { x: 0, z: 3 })).toBe(false);
  });

  it('uses the player gap threshold (2.0m)', () => {
    expect(wallGap(arena, { x: 0, z: 14 })).toBe(2);
    expect(pinnedAgainstWall(arena, { x: 0, z: 10 }, { x: 0, z: 14 })).toBe(true);
    expect(pinnedAgainstWall(arena, { x: 0, z: 10 }, { x: 0, z: 13.9 })).toBe(false);
  });
});

describe('sectorTouchesCircle', () => {
  const pillar = { x: 0, z: 3, radius: 0.7 };

  it('touches a pillar in front within range, ignoring what is between', () => {
    expect(sectorTouchesCircle({ x: 0, z: 0 }, 0, 120, 5, pillar)).toBe(true);
    // 柱の手前の面だけが射程内でも触れる
    expect(sectorTouchesCircle({ x: 0, z: 0 }, 0, 120, 2.4, pillar)).toBe(true);
    expect(sectorTouchesCircle({ x: 0, z: 0 }, 0, 120, 2.2, pillar)).toBe(false);
  });

  it('respects the arc, widened by the pillar radius', () => {
    // 真横（90° 横）の柱は 120° の扇形（±60°）に入らない
    expect(sectorTouchesCircle({ x: 0, z: 0 }, Math.PI / 2, 120, 5, pillar)).toBe(false);
    // 全周は向きによらず触れる
    expect(sectorTouchesCircle({ x: 0, z: 0 }, Math.PI / 2, 360, 5, pillar)).toBe(true);
    // 柱の端が扇形の縁にかかる（中心は 45° 方向）
    const near = { x: 3, z: 3, radius: 1.5 };
    expect(sectorTouchesCircle({ x: 0, z: 0 }, 0, 60, 6, near)).toBe(true);
  });

  it('touches when the boss stands inside the pillar footprint', () => {
    expect(sectorTouchesCircle({ x: 0, z: 3 }, Math.PI, 30, 1, pillar)).toBe(true);
  });
});

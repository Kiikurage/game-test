import { describe, expect, it } from 'vitest';
import { ASHEN_FOUNDATION } from '../../game/world/ashenFoundation';
import { createLevel, type PlacedBox } from '../../game/world/level';
import {
  D_CENTERLINE,
  D_NICHES,
  D_TORCHES,
  D_WEBS,
  E_TORCHES,
  MAX_PROTRUSION,
  distanceToPolyline,
  isMasonryProp,
  type WallMount,
} from './cryptLayout';

const level = createLevel(ASHEN_FOUNDATION);

/** 壁面（軸平行の箱の面）に点が乗っているか。 */
function onWallFace(boxes: readonly PlacedBox[], m: WallMount): boolean {
  const tol = 0.06;
  return boxes.some((b) => {
    if ((b.yawDeg ?? 0) !== 0) return false;
    // 法線の逆側（壁の中）へ少し入った点が箱の内側で、空間側へ少し出た点が箱の外側
    const inside = (x: number, z: number): boolean =>
      Math.abs(x - b.x) <= b.hx + tol && Math.abs(z - b.z) <= b.hz + tol;
    const strictlyInside = (x: number, z: number): boolean =>
      Math.abs(x - b.x) <= b.hx - 0.01 && Math.abs(z - b.z) <= b.hz - 0.01;
    return (
      inside(m.x, m.z) &&
      strictlyInside(m.x - m.nx * 0.1, m.z - m.nz * 0.1) &&
      !inside(m.x + m.nx * 0.12, m.z + m.nz * 0.12)
    );
  });
}

describe('crypt / courtyard environment layout', () => {
  const wallBoxes = level.boxes.filter((b) => isMasonryProp(b.id));

  it('replaces the D / E / G1-lane structures and leaves A to C and F alone', () => {
    expect(wallBoxes.length).toBeGreaterThan(10);
    expect(isMasonryProp('chapel-tower')).toBe(false);
    expect(isMasonryProp('lane-s-e')).toBe(true);
    expect(isMasonryProp('f-wall-3')).toBe(false);
    expect(isMasonryProp('d-sarcophagus')).toBe(true);
  });

  it('mounts every torch, niche and web on a real wall face', () => {
    for (const m of [...D_TORCHES, ...E_TORCHES, ...D_NICHES, ...D_WEBS]) {
      expect(onWallFace(wallBoxes, m), `${m.x},${m.z} n=(${m.nx},${m.nz})`).toBe(true);
    }
  });

  it('keeps the crypt corridor walkable around every wall decoration (2.5m corridor)', () => {
    // 飾りは壁から MAX_PROTRUSION まで。通路の中心線から壁までは 1.25m なので、プレイヤー半径 0.35m + 余白を残す
    for (const m of [...D_TORCHES, ...D_NICHES]) {
      const d = distanceToPolyline(
        m.x + m.nx * MAX_PROTRUSION,
        m.z + m.nz * MAX_PROTRUSION,
        D_CENTERLINE,
      );
      expect(d, `${m.x},${m.z}`).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('keeps the torch count tiny (no real lights; masonry shader takes at most 8 per area)', () => {
    expect(D_TORCHES.length).toBeLessThanOrEqual(8);
    expect(E_TORCHES.length).toBeLessThanOrEqual(8);
  });
});

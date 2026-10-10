import { describe, expect, it } from 'vitest';
import { MasonryBuilder, hashSeed } from './masonryGeometry';

const flat = (): number => 0;

describe('MasonryBuilder', () => {
  it('builds boxes with unit normals, finite masonry coordinates and outward winding', () => {
    const b = new MasonryBuilder(flat);
    b.addBox({ x: 5, y: 1, z: 2, hx: 2, hy: 1, hz: 0.35, yaw: 0.6, ruin: 0.4 });
    const g = b.build();
    const pos = g.getAttribute('position');
    const nor = g.getAttribute('normal');
    const mu = g.getAttribute('mu');
    const mx = g.getAttribute('mx');
    for (let i = 0; i < pos.count; i++) {
      expect(Math.hypot(nor.getX(i), nor.getY(i), nor.getZ(i))).toBeCloseTo(1, 4);
      expect(Number.isFinite(mu.getX(i) + mu.getY(i) + mx.getX(i) + mx.getZ(i))).toBe(true);
    }
    // 三角形の向きが法線と一致する（外向き）
    const index = g.getIndex();
    if (!index) throw new Error('no index');
    for (let t = 0; t < index.count; t += 3) {
      const ia = index.getX(t);
      const ib = index.getX(t + 1);
      const ic = index.getX(t + 2);
      const ux = pos.getX(ib) - pos.getX(ia);
      const uy = pos.getY(ib) - pos.getY(ia);
      const uz = pos.getZ(ib) - pos.getZ(ia);
      const vx = pos.getX(ic) - pos.getX(ia);
      const vy = pos.getY(ic) - pos.getY(ia);
      const vz = pos.getZ(ic) - pos.getZ(ia);
      const cx = uy * vz - uz * vy;
      const cy = uz * vx - ux * vz;
      const cz = ux * vy - uy * vx;
      const dot = cx * nor.getX(ia) + cy * nor.getY(ia) + cz * nor.getZ(ia);
      if (Math.hypot(cx, cy, cz) > 1e-6) expect(dot).toBeGreaterThan(0);
    }
  });

  it('keeps the masonry coordinate continuous across coplanar walls (joints line up)', () => {
    const b = new MasonryBuilder(flat);
    // x 方向に隣り合う同じ高さの壁 2 枚。同一平面の面のワールド座標は連続する
    b.addBox({ x: 1, y: 1, z: 0, hx: 1, hy: 1, hz: 0.3 });
    b.addBox({ x: 3, y: 1, z: 0, hx: 1, hy: 1, hz: 0.3 });
    const g = b.build();
    const pos = g.getAttribute('position');
    const nor = g.getAttribute('normal');
    const mu = g.getAttribute('mu');
    const seen = new Map<string, number>();
    let shared = 0;
    for (let i = 0; i < pos.count; i++) {
      if (nor.getZ(i) < 0.9) continue; // +z 面だけ
      const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)}`;
      const u = mu.getX(i);
      const prev = seen.get(key);
      if (prev !== undefined) {
        expect(u).toBeCloseTo(prev, 5);
        shared++;
      }
      seen.set(key, u);
    }
    expect(shared).toBeGreaterThan(0);
  });

  it('measures height above the ground', () => {
    const b = new MasonryBuilder((x) => x * 0.1);
    b.addBox({ x: 0, y: 1, z: 0, hx: 1, hy: 1, hz: 0.3 });
    const g = b.build();
    const pos = g.getAttribute('position');
    const mx = g.getAttribute('mx');
    for (let i = 0; i < pos.count; i++) {
      expect(mx.getZ(i)).toBeCloseTo(pos.getY(i) - pos.getX(i) * 0.1, 5);
    }
  });

  it('builds drums and lathes with an even block count around (no seam offset)', () => {
    const b = new MasonryBuilder(flat);
    b.addDrum({ x: 0, y: 0, z: 0, rBottom: 0.5, rTop: 0.45, height: 2, topJitter: 0.3 });
    b.addLathe({
      x: 0,
      y: 0,
      z: 0,
      profile: [
        [2.3, 0],
        [2.3, 1],
        [1.8, 1],
        [1.8, 0.5],
        [0.5, 0.5],
      ],
      gap: { angle: 0.5, width: 1.2, height: 0.6 },
    });
    const g = b.build();
    const rd = g.getAttribute('rd');
    let rounds = 0;
    for (let i = 0; i < rd.count; i++) {
      if (rd.getY(i) > 0) {
        rounds++;
        expect(rd.getY(i) % 2).toBe(0);
      }
    }
    expect(rounds).toBeGreaterThan(0);
  });

  it('hashes deterministically into 0..1', () => {
    expect(hashSeed('a')).toBe(hashSeed('a'));
    for (const s of ['a', 'b', 'e-wall-w', 12]) {
      expect(hashSeed(s)).toBeGreaterThanOrEqual(0);
      expect(hashSeed(s)).toBeLessThanOrEqual(1);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { COLORS, edgeness } from '../../../scripts/assets/equipment.mjs';
import { box, lathe } from '../../../scripts/assets/geometry.mjs';

type V3 = [number, number, number];
const lum = (c: V3): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
/** 錆らしさ（赤が青を上回る量）。 */
const redness = (c: V3): number => c[0] - c[2];

/** 決定的な疑似乱数で部位（1.5m 角）の点を作る。 */
function samples(n: number): V3[] {
  let s = 12345;
  const rnd = (): number => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: n }, () => [rnd() * 1.5, rnd() * 1.5, rnd() * 1.5] as V3);
}

const iron = (p: V3, n: V3, edge: number): V3 => {
  const fn = COLORS['iron'];
  if (!fn) throw new Error('iron color missing');
  return fn(p, 3.7, { n, edge });
};
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('rusty iron vertex colors (#151)', () => {
  const pts = samples(600);

  it('is mostly dull steel: low contrast, no high-saturation orange', () => {
    const colors = pts.map((p) => iron(p, [0, 1, 0], 0));
    const l = colors.map(lum);
    const spread = Math.max(...l) - Math.min(...l);
    expect(spread).toBeLessThan(0.1); // 迷彩のような明暗の落差が無い
    for (const c of colors) {
      expect(Math.max(...c)).toBeLessThan(0.3);
      expect(c[0] - c[2]).toBeLessThan(0.14); // 彩度を抑えた茶〜赤褐色まで
    }
  });

  it('concentrates rust on edges and downward faces rather than flat top faces', () => {
    const top = mean(pts.map((p) => redness(iron(p, [0, 1, 0], 0))));
    const down = mean(pts.map((p) => redness(iron(p, [0, -1, 0], 0))));
    const edge = mean(pts.map((p) => redness(iron(p, [0, 1, 0], 1))));
    expect(down).toBeGreaterThan(top * 1.3);
    expect(edge).toBeGreaterThan(top * 1.3);
  });

  it('varies smoothly: nearby points (2 cm) have nearly the same color', () => {
    let worst = 0;
    for (const p of pts.slice(0, 200)) {
      const a = iron(p, [0, 0, 1], 0);
      const b = iron([p[0] + 0.02, p[1], p[2]], [0, 0, 1], 0);
      worst = Math.max(worst, Math.abs(lum(a) - lum(b)));
    }
    expect(worst).toBeLessThan(0.02); // 斑点状の高周波ノイズが無い
  });
});

describe('edgeness', () => {
  it('is 1 on the hard edges of a box and 0 on a smooth lathe surface', () => {
    const e = edgeness(box(0, 0, 0, 1, 1, 1));
    expect(Math.min(...e)).toBe(1);
    const smooth = lathe(
      [
        [
          [0.1, 0],
          [0.12, 0.1],
          [0.1, 0.2],
        ],
      ],
      12,
    );
    // 回転体の継ぎ目（0° と 360° の頂点）も法線が同じなので 0
    expect(Math.max(...edgeness(smooth))).toBeLessThan(0.05);
  });
});

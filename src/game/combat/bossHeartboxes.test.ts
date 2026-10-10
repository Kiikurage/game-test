import { describe, expect, it } from 'vitest';
import { capsule, capsulesOverlap, createSegmentClosest, vec3 } from './geometry';
import {
  BOSS_BODY_HEARTBOX,
  BOSS_HEARTBOXES,
  BOSS_HEIGHT,
  BOSS_LEG_HEARTBOX,
  BOSS_RADIUS,
  BOSS_TORSO_HEARTBOX,
  heartboxTop,
} from './bossHeartboxes';
import { UprightTarget } from './uprightTarget';

describe('ボスの被弾判定', () => {
  it('脚部と胴の 2 判定だけで、頭部判定を持たない', () => {
    expect(BOSS_HEARTBOXES).toHaveLength(2);
    const top = Math.max(...BOSS_HEARTBOXES.map(heartboxTop));
    // 兜（身長 4.0m の上端付近）は判定の外
    expect(top).toBeLessThan(BOSS_HEIGHT - 0.4);
    expect(top).toBeGreaterThan(3.2);
  });

  it('最大半径は 0.9m で、身長 4.0m に収まる', () => {
    expect(Math.max(...BOSS_HEARTBOXES.map((h) => h.radius))).toBeCloseTo(BOSS_RADIUS, 6);
    for (const h of BOSS_HEARTBOXES) {
      expect(h.y0 - h.radius).toBeGreaterThanOrEqual(0);
      expect(heartboxTop(h)).toBeLessThanOrEqual(BOSS_HEIGHT);
    }
    expect(BOSS_BODY_HEARTBOX.radius).toBe(0.9);
    expect(heartboxTop(BOSS_BODY_HEARTBOX)).toBeCloseTo(4.0, 6);
  });

  it('脚と胴は隙間なくつながる（当たる高さが足元から胴の上端まで途切れない）', () => {
    const legTop = heartboxTop(BOSS_LEG_HEARTBOX);
    const torsoBottom = BOSS_TORSO_HEARTBOX.y0 - BOSS_TORSO_HEARTBOX.radius;
    expect(torsoBottom).toBeLessThanOrEqual(legTop);
  });

  it('UprightTarget に置くと足元に追従し、脚・胴は当たり、兜の高さは当たらない', () => {
    const target = new UprightTarget('boss', 'enemy', 2400, BOSS_HEARTBOXES);
    target.place(10, 0.5, -4, 0);
    expect(target.heartboxes).toHaveLength(2);
    const closest = createSegmentClosest();
    const hits = (heightAboveFeet: number): boolean => {
      const p = vec3(10.3, 0.5 + heightAboveFeet, -4);
      const probe = capsule(p, p, 0.05);
      return target.heartboxes.some((box) => capsulesOverlap(box, probe, closest));
    };
    expect(hits(0.9)).toBe(true); // 脚
    expect(hits(2.4)).toBe(true); // 胴
    expect(hits(3.8)).toBe(false); // 兜
  });
});

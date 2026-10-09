import { describe, expect, it } from 'vitest';
import {
  GATE_SWORD_COUNT,
  PLANTED_SWORD_SIZE,
  gateSwordPlacements,
  plantedSwordCenterY,
  plantedSwordFacing,
} from './plantedSwords';

const gate = { x: 101, z: 64 };
const options = { gate, approachYaw: -Math.PI / 2 };

describe('gateSwordPlacements (仕様書 14.7 節: 霧の門前の 12 本)', () => {
  const placements = gateSwordPlacements(options);

  it('places 12 swords: 11 toward the gate and exactly 1 upside down', () => {
    expect(placements).toHaveLength(GATE_SWORD_COUNT.total);
    expect(placements.filter((p) => p.towardGate)).toHaveLength(11);
    expect(placements.filter((p) => p.inverted)).toHaveLength(1);
    expect(placements.filter((p) => p.inverted && p.towardGate)).toHaveLength(0);
  });

  it('turns the blade face of the 11 swords toward the gate', () => {
    for (const p of placements.filter((q) => q.towardGate)) {
      const f = plantedSwordFacing(p);
      const dx = gate.x - p.position[0];
      const dz = gate.z - p.position[2];
      const d = Math.hypot(dx, dz);
      expect(f.x * (dx / d) + f.z * (dz / d)).toBeCloseTo(1, 6);
    }
  });

  it('puts the 11 swords on a semicircle on the approach side, all at the same radius', () => {
    const approach = { x: Math.sin(options.approachYaw), z: Math.cos(options.approachYaw) };
    for (const p of placements.filter((q) => q.towardGate)) {
      const dx = p.position[0] - gate.x;
      const dz = p.position[2] - gate.z;
      expect(Math.hypot(dx, dz)).toBeCloseTo(3.2, 6);
      expect(dx * approach.x + dz * approach.z).toBeGreaterThan(0); // 半円は接近側
    }
  });

  it('keeps the upside-down sword apart from the arc, turned away from the gate', () => {
    const lone = placements.find((p) => p.inverted);
    expect(lone).toBeDefined();
    if (!lone) return;
    const dist = Math.hypot(lone.position[0] - gate.x, lone.position[2] - gate.z);
    expect(dist).toBeGreaterThan(3.2 + 0.5);
    // 他のどの剣からも 1.5m 以上離れている
    for (const p of placements.filter((q) => q !== lone)) {
      const gap = Math.hypot(lone.position[0] - p.position[0], lone.position[2] - p.position[2]);
      expect(gap).toBeGreaterThan(1.5);
    }
    const f = plantedSwordFacing(lone);
    const dx = gate.x - lone.position[0];
    const dz = gate.z - lone.position[2];
    expect(f.x * dx + f.z * dz).toBeLessThan(0);
  });

  it('buries the tip (upright) or the pommel (inverted) and is deterministic', () => {
    for (const p of placements) {
      expect(p.position[1]).toBeCloseTo(plantedSwordCenterY(p.inverted), 9);
    }
    // 逆さは柄頭が埋まる分、正立より中心が高い（切先ほど深く埋めない）
    expect(plantedSwordCenterY(true)).toBeGreaterThan(plantedSwordCenterY(false));
    expect(gateSwordPlacements(options)).toEqual(placements);
    expect(PLANTED_SWORD_SIZE.length - PLANTED_SWORD_SIZE.buriedTip).toBeGreaterThan(0.5);
  });

  it('follows the ground height', () => {
    const raised = gateSwordPlacements({ ...options, groundY: 2 });
    expect(raised[0]?.position[1]).toBeCloseTo((placements[0]?.position[1] ?? 0) + 2, 9);
  });
});

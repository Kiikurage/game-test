import { describe, expect, it } from 'vitest';
import { bossClipEvents } from '../../game/anim/bossClips';
import { AXE_GRIP_RANGE } from '../assets/bossCharacter';
import {
  AXE_GRIP_BY_ACTION,
  AXE_GRIP_CARRY,
  AXE_GRIP_DEFAULT,
  approachAxeGrip,
  axeGripOf,
} from './bossAxeGrip';

describe('斧の握りの向き（#225）', () => {
  it('動作中でなければ構え、表のない動作は既定', () => {
    expect(axeGripOf(null)).toBe(AXE_GRIP_CARRY);
    expect(axeGripOf('boss.nothing.1.p1')).toBe(AXE_GRIP_DEFAULT);
  });

  it('マーカー表の全動作に握りが決めてある（射程の照合で調整した値）', () => {
    for (const entry of bossClipEvents.entries) {
      expect(AXE_GRIP_BY_ACTION[entry.id], entry.id).toBeDefined();
    }
  });

  it('表の値は補間できる範囲に収まっている', () => {
    for (const [id, grip] of Object.entries(AXE_GRIP_BY_ACTION)) {
      expect(grip, id).toBeGreaterThanOrEqual(AXE_GRIP_RANGE.min);
      expect(grip, id).toBeLessThanOrEqual(AXE_GRIP_RANGE.max);
    }
  });

  it('追従は目標へ単調に近づき、行き過ぎない。dt 0 では動かない', () => {
    let v = 0;
    for (let i = 0; i < 30; i++) {
      const next = approachAxeGrip(v, 1, 1 / 60);
      expect(next).toBeGreaterThan(v);
      expect(next).toBeLessThanOrEqual(1);
      v = next;
    }
    expect(v).toBeGreaterThan(0.95);
    expect(approachAxeGrip(0.3, 1, 0)).toBe(0.3);
  });
});

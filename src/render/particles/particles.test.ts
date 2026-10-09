import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS } from '../quality';
import { burstCapacity, burstCount, totalParticleBudget } from './budget';
import { SlotPool } from './slotPool';

describe('SlotPool', () => {
  it('hands out distinct slots until full', () => {
    const pool = new SlotPool(3);
    const got = [pool.acquire(), pool.acquire(), pool.acquire()];
    expect(new Set(got.map((g) => g.index)).size).toBe(3);
    expect(got.every((g) => !g.recycled)).toBe(true);
    expect(pool.activeCount).toBe(3);
  });

  it('recycles the oldest slot when exhausted', () => {
    const pool = new SlotPool(2);
    const a = pool.acquire();
    pool.acquire();
    const c = pool.acquire();
    expect(c.recycled).toBe(true);
    expect(c.index).toBe(a.index);
    expect(pool.activeCount).toBe(2);
  });

  it('reuses released slots first', () => {
    const pool = new SlotPool(3);
    pool.acquire();
    const b = pool.acquire();
    pool.acquire();
    pool.release(b.index);
    expect(pool.activeCount).toBe(2);
    expect(pool.isActive(b.index)).toBe(false);
    const d = pool.acquire();
    expect(d.index).toBe(b.index);
    expect(d.recycled).toBe(false);
  });

  it('ignores double release and handles zero capacity', () => {
    const pool = new SlotPool(1);
    const a = pool.acquire();
    pool.release(a.index);
    pool.release(a.index);
    expect(pool.activeCount).toBe(0);
    expect(new SlotPool(0).acquire().index).toBe(-1);
  });
});

describe('particle budget', () => {
  it('ambient ash stays within the spec range 200-400 except on low', () => {
    expect(QUALITY_PRESETS.high.particles.ambientAsh).toBeLessThanOrEqual(400);
    expect(QUALITY_PRESETS.medium.particles.ambientAsh).toBeGreaterThanOrEqual(200);
    expect(QUALITY_PRESETS.low.particles.ambientAsh).toBeLessThan(
      QUALITY_PRESETS.medium.particles.ambientAsh,
    );
  });

  it('counts scale monotonically with quality', () => {
    const q = QUALITY_PRESETS;
    const input = { bonfires: 2, emberFields: 1, burstSlotSizeSum: 100 };
    const low = totalParticleBudget(q.low.particles, input);
    const mid = totalParticleBudget(q.medium.particles, input);
    const high = totalParticleBudget(q.high.particles, input);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  it('computes burst counts with density', () => {
    expect(burstCount(20, QUALITY_PRESETS.high.particles)).toBe(20);
    expect(burstCount(20, QUALITY_PRESETS.low.particles)).toBe(10);
    expect(burstCount(1, QUALITY_PRESETS.low.particles)).toBe(1);
    expect(burstCount(20, { ...QUALITY_PRESETS.low.particles, burstSlots: 0 })).toBe(0);
    expect(burstCapacity(20, QUALITY_PRESETS.medium.particles)).toBe(200);
  });
});

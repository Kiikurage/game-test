import { describe, expect, it } from 'vitest';
import { seededRandom } from '../enemy/enemyManager';
import {
  BOSS_CORRECTION,
  BOSS_MOVE_IDS,
  BOSS_WEIGHTS,
  type BossMoveId,
  type BossPhase,
  type DistanceBand,
} from './bossData';
import {
  PlayerTracker,
  chooseBossMove,
  computeWeights,
  distanceBand,
  type BossSelectionContext,
} from './bossPlanner';

const BANDS: DistanceBand[] = ['close', 'mid', 'far'];
const PHASES: BossPhase[] = [1, 2];

/** フェーズに合う技がすべて使える状態（スタブ全登録と同じ）。 */
function available(phase: BossPhase) {
  return (id: BossMoveId) => {
    if (id === 'shieldBash') return phase === 1;
    if (id === 'spin' || id === 'ashWave') return phase === 2;
    return true;
  };
}

function ctx(
  phase: BossPhase,
  band: DistanceBand,
  extra: Partial<BossSelectionContext> = {},
): BossSelectionContext {
  return {
    phase,
    band,
    history: [],
    available: available(phase),
    behind: false,
    rollStreak: false,
    ...extra,
  };
}

const prob = (c: BossSelectionContext, id: BossMoveId): number =>
  computeWeights(c).entries.find((e) => e.id === id)?.probability ?? 0;

describe('distance bands', () => {
  it('splits at 3.5m (close < 3.5) and 8m (far > 8); both boundaries belong to mid', () => {
    expect(distanceBand(0)).toBe('close');
    expect(distanceBand(3.499)).toBe('close');
    expect(distanceBand(3.5)).toBe('mid');
    expect(distanceBand(8)).toBe('mid');
    expect(distanceBand(8.001)).toBe('far');
    expect(distanceBand(30)).toBe('far');
  });
});

describe('weight table (6.4)', () => {
  it('without history or corrections, probabilities equal the table normalised, for every phase and band', () => {
    for (const phase of PHASES) {
      for (const band of BANDS) {
        const table = BOSS_WEIGHTS[phase][band];
        const total = BOSS_MOVE_IDS.reduce((s, id) => s + (table[id] ?? 0), 0);
        expect(total).toBeGreaterThan(0);
        for (const id of BOSS_MOVE_IDS) {
          expect(prob(ctx(phase, band), id)).toBeCloseTo((table[id] ?? 0) / total, 10);
        }
      }
    }
  });

  it('matches the spec values (spot checks)', () => {
    expect(prob(ctx(1, 'close'), 'shieldBash')).toBeCloseTo(0.25);
    expect(prob(ctx(1, 'mid'), 'overhead')).toBeCloseTo(0.4);
    expect(prob(ctx(1, 'far'), 'leap')).toBeCloseTo(1);
    expect(prob(ctx(2, 'close'), 'spin')).toBeCloseTo(0.3);
    expect(prob(ctx(2, 'mid'), 'ashWave')).toBeCloseTo(0.4);
    expect(prob(ctx(2, 'far'), 'ashWave')).toBeCloseTo(0.6);
    // フェーズ 1 に回転斬り・灰の波、フェーズ 2 に盾打ちはない
    expect(prob(ctx(1, 'close'), 'spin')).toBe(0);
    expect(prob(ctx(2, 'close'), 'shieldBash')).toBe(0);
  });

  it('only picks moves that are available (unregistered moves are left out)', () => {
    const c = ctx(1, 'close', { available: (id) => id === 'overhead' || id === 'sweep' });
    expect(prob(c, 'overhead')).toBeCloseTo(0.5);
    expect(prob(c, 'combo3')).toBe(0);
    const none = chooseBossMove(ctx(1, 'close', { available: () => false }), seededRandom('x'));
    expect(none.id).toBeNull();
  });

  it('seeded sampling converges to the table for every phase and band', () => {
    const N = 20000;
    for (const phase of PHASES) {
      for (const band of BANDS) {
        const random = seededRandom(`table-${phase}-${band}`);
        const counts = new Map<string, number>();
        for (let i = 0; i < N; i++) {
          const id = chooseBossMove(ctx(phase, band), random).id;
          if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
        }
        for (const id of BOSS_MOVE_IDS) {
          const expected = prob(ctx(phase, band), id);
          const actual = (counts.get(id) ?? 0) / N;
          expect(Math.abs(actual - expected), `P${phase} ${band} ${id}`).toBeLessThan(0.015);
        }
      }
    }
  });
});

describe('repeat limits', () => {
  it('never picks the same move three times in a row', () => {
    const random = seededRandom('repeat');
    for (let i = 0; i < 2000; i++) {
      const choice = chooseBossMove(ctx(1, 'close', { history: ['sweep', 'sweep'] }), random);
      expect(choice.id).not.toBe('sweep');
      expect(choice.id).not.toBeNull();
    }
    const w = computeWeights(ctx(1, 'close', { history: ['sweep', 'sweep'] }));
    expect(w.entries.find((e) => e.id === 'sweep')?.excluded).toBe('consecutive');
  });

  it('halves the weight of the move used last time (second in a row)', () => {
    const w = computeWeights(ctx(1, 'close', { history: ['sweep'] }));
    const sweep = w.entries.find((e) => e.id === 'sweep');
    expect(sweep?.repeatFactor).toBe(0.5);
    expect(sweep?.weight).toBe(12.5);
    // 25 : 12.5 : 25 : 25
    expect(sweep?.probability).toBeCloseTo(12.5 / 87.5);
    expect(w.entries.find((e) => e.id === 'overhead')?.weight).toBe(25);
  });

  it('does not limit when the same move is not consecutive', () => {
    const w = computeWeights(ctx(1, 'close', { history: ['sweep', 'overhead', 'sweep'] }));
    expect(w.entries.find((e) => e.id === 'sweep')?.weight).toBe(12.5); // 直前だけ半分
    const w2 = computeWeights(ctx(1, 'close', { history: ['sweep', 'sweep', 'overhead'] }));
    expect(w2.entries.find((e) => e.id === 'sweep')?.weight).toBe(25);
  });

  it('returns null when the only candidate is at the repeat limit (the boss repositions)', () => {
    const c = ctx(1, 'far', { history: ['leap', 'leap'] });
    expect(chooseBossMove(c, seededRandom('far')).id).toBeNull();
  });
});

describe('player-state corrections', () => {
  it('doubles sweep (P1) / sweep and spin (P2) when the player stays behind the boss', () => {
    const base1 = prob(ctx(1, 'close'), 'sweep');
    expect(base1).toBeCloseTo(0.25);
    // P1: sweep 50 : overhead 25 : combo3 25 : shieldBash 25
    expect(prob(ctx(1, 'close', { behind: true }), 'sweep')).toBeCloseTo(50 / 125);
    expect(prob(ctx(1, 'close', { behind: true }), 'overhead')).toBeCloseTo(25 / 125);
    // P2: sweep 50, spin 60, overhead 20, combo3 25
    const p2 = ctx(2, 'close', { behind: true });
    expect(prob(p2, 'sweep')).toBeCloseTo(50 / 155);
    expect(prob(p2, 'spin')).toBeCloseTo(60 / 155);
    expect(computeWeights(p2).entries.find((e) => e.id === 'spin')?.behindFactor).toBe(2);
    // P1 には回転斬りがないので、背後補正は薙ぎ払いにだけ効く
    expect(
      computeWeights(ctx(1, 'close', { behind: true })).entries.find((e) => e.id === 'spin')
        ?.weight,
    ).toBe(0);
  });

  it('adds 20 points to combo3 in the close band after 3 rolls in a row, and only then', () => {
    for (const phase of PHASES) {
      const c = ctx(phase, 'close', { rollStreak: true });
      expect(prob(c, 'combo3')).toBeCloseTo(0.25 + BOSS_CORRECTION.comboBonus, 10);
      expect(computeWeights(c).rollBonus).toBe(true);
      // ほかの技は残りを元の比率で分け合う
      const sum = BOSS_MOVE_IDS.reduce((s, id) => s + prob(c, id), 0);
      expect(sum).toBeCloseTo(1, 10);
    }
    // 近距離以外では効かない
    expect(prob(ctx(1, 'mid', { rollStreak: true }), 'combo3')).toBe(0);
    expect(computeWeights(ctx(1, 'mid', { rollStreak: true })).rollBonus).toBe(false);
    // 三連撃が使えないときも効かない
    const noCombo = ctx(1, 'close', { rollStreak: true, available: (id) => id !== 'combo3' });
    expect(computeWeights(noCombo).rollBonus).toBe(false);
  });

  it('seeded sampling reflects the roll-streak bonus', () => {
    const random = seededRandom('roll');
    const N = 20000;
    let combo = 0;
    for (let i = 0; i < N; i++) {
      if (chooseBossMove(ctx(1, 'close', { rollStreak: true }), random).id === 'combo3') combo++;
    }
    expect(Math.abs(combo / N - 0.45)).toBeLessThan(0.015);
  });
});

describe('PlayerTracker', () => {
  const idle = { x: 0, z: -5, healing: false, rolling: false };

  it('counts frames behind the boss (within 60 degrees of straight back) and resets when the player leaves', () => {
    const t = new PlayerTracker();
    // ボスは原点で +z を向く。プレイヤーは真後ろ（-z）
    for (let i = 0; i < 89; i++) t.update(0, 0, 0, idle);
    expect(t.behindFrames).toBe(89);
    expect(t.behind).toBe(false);
    t.update(0, 0, 0, idle);
    expect(t.behind).toBe(true);
    // 真後ろから 59° ずれた位置はまだ背後、61° は背後ではない
    const at = (deg: number) => ({
      ...idle,
      x: Math.sin(((180 - deg) * Math.PI) / 180) * 5,
      z: Math.cos(((180 - deg) * Math.PI) / 180) * 5,
    });
    t.update(0, 0, 0, at(59));
    expect(t.behindFrames).toBe(91);
    t.update(0, 0, 0, at(61));
    expect(t.behindFrames).toBe(0);
  });

  it('counts consecutive rolls and forgets them after a pause', () => {
    const t = new PlayerTracker();
    const roll = (frames: number) => {
      for (let i = 0; i < frames; i++) t.update(0, 0, 0, { ...idle, rolling: true });
    };
    const wait = (frames: number) => {
      for (let i = 0; i < frames; i++) t.update(0, 0, 0, idle);
    };
    roll(30);
    wait(10);
    roll(30);
    expect(t.rollStreak).toBe(2);
    wait(20);
    roll(30);
    expect(t.rollStreak).toBe(3);
    expect(t.rollStreakReached).toBe(true);
    t.consumeRollStreak();
    expect(t.rollStreak).toBe(0);
    roll(30);
    wait(BOSS_CORRECTION.rollStreakGapFrames + 5);
    expect(t.rollStreak).toBe(0);
    roll(30);
    expect(t.rollStreak).toBe(1);
  });
});

describe('近距離で後退された時の跳躍（6.3 節 技 5）', () => {
  /** 距離を 1F ごとに指定して追跡させる（ボスは原点・向き 0、プレイヤーは +z 側）。 */
  function track(distances: number[]): PlayerTracker {
    const t = new PlayerTracker();
    for (const d of distances) t.update(0, 0, 0, { x: 0, z: d, healing: false, rolling: false });
    return t;
  }
  const line = (from: number, to: number, frames: number): number[] =>
    Array.from({ length: frames }, (_, i) => from + ((to - from) * (i + 1)) / frames);

  it('detects a player who was close and got 1.5m+ away within 60F', () => {
    expect(track([...Array<number>(10).fill(2.5), ...line(2.5, 4.5, 20)]).retreated).toBe(true);
    // ちょうど 1.5m 離れた
    expect(track([2.5, 2.5, 4.0]).retreated).toBe(true);
    expect(track([2.5, 2.5, 3.9]).retreated).toBe(false);
  });

  it('does not trigger for a player who was never close, or who drifted away slowly', () => {
    expect(track([...Array<number>(10).fill(5), ...line(5, 8, 20)]).retreated).toBe(false);
    // 近距離から 60F より長くかけて離れた（窓の外では近距離でなくなる）
    expect(track([2.5, ...line(2.5, 6, 200)]).retreated).toBe(false);
  });

  it('forgets the retreat on reset', () => {
    const t = track([2.5, 2.5, 5]);
    expect(t.retreated).toBe(true);
    t.reset();
    expect(t.retreated).toBe(false);
  });

  it('lets the boss pick the leap at close range only when retreated (weight 40, P1 and P2)', () => {
    for (const phase of PHASES) {
      const plain = computeWeights(ctx(phase, 'close'));
      expect(plain.entries.find((e) => e.id === 'leap')?.weight).toBe(0);
      const w = computeWeights(ctx(phase, 'close', { retreated: true }));
      expect(w.entries.find((e) => e.id === 'leap')?.weight).toBe(
        BOSS_CORRECTION.retreatLeapWeight,
      );
      expect(w.entries.find((e) => e.id === 'leap')?.probability).toBeGreaterThan(0);
    }
  });

  it('raises the mid-range leap weight to at least 40 (P2: 20 -> 40) and keeps a larger table value', () => {
    expect(
      computeWeights(ctx(2, 'mid', { retreated: true })).entries.find((e) => e.id === 'leap')
        ?.weight,
    ).toBe(40);
    expect(
      computeWeights(ctx(1, 'mid', { retreated: true })).entries.find((e) => e.id === 'leap')
        ?.weight,
    ).toBe(40);
    expect(
      computeWeights(ctx(1, 'far', { retreated: true })).entries.find((e) => e.id === 'leap')
        ?.weight,
    ).toBe(100);
  });
});

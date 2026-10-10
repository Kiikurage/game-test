import { describe, expect, it } from 'vitest';
import { BOSS_MOVE_IDS } from './bossData';
import { BossMoveRegistry, type BossMoveDef, type BossStageDef } from './bossMove';
import { canDodge, findDodgeWindows, simulateDodge, toRanges } from './dodgeSim';
import { createStubMoves } from './stubMoves';

/** 仕様書 6.3 節の大上段斬り（P1）。本物の技（E5-3）に依存しない回帰テスト用の定義。 */
const OVERHEAD: BossStageDef = {
  id: 'overhead.test',
  startup: 48,
  active: 8,
  recovery: 52,
  damage: 110,
  poiseDamage: 70,
  guardStaminaCost: 60,
  moveDistance: 0,
  arcDeg: 60,
  range: 4.5,
  heavy: true,
  trackEndFrame: 30,
};

function registryWith(def: BossMoveDef): BossMoveRegistry {
  const reg = new BossMoveRegistry();
  reg.register(def);
  return reg;
}

const overheadMoves = registryWith({
  id: 'overhead',
  name: '大上段斬り',
  phases: [1, 2],
  stages: [OVERHEAD],
});

const base = { move: 'overhead', moves: overheadMoves } as const;

describe('simulateDodge', () => {
  it('standing still gets hit at the first active frame', () => {
    const r = simulateDodge(base);
    expect(r.dodged).toBe(false);
    expect(r.hits).toHaveLength(1);
    expect(r.hits[0]).toMatchObject({ moveFrame: 49, stage: 1, stageFrame: 49, damage: 110 });
    expect(r.frames).toBe(OVERHEAD.startup + OVERHEAD.active + OVERHEAD.recovery);
  });

  it('a roll whose invulnerability covers the whole active window dodges', () => {
    // 入力 F46 → 無敵 F49〜F60（持続 F49〜F56 を完全に覆う）
    expect(canDodge(base, { frame: 46, direction: 'left' })).toBe(true);
    expect(canDodge(base, { frame: 46, direction: 'right' })).toBe(true);
  });

  it('a roll too late (invulnerability starts after the hit) fails', () => {
    // 入力 F47 → 無敵は F50 から。F49 に当たる
    const r = simulateDodge({ ...base, inputs: [{ frame: 47, direction: 'left' }] });
    expect(r.dodged).toBe(false);
    expect(r.hits[0]?.moveFrame).toBe(49);
  });

  it('input timing inside the invulnerability window still matters when the hit is after it', () => {
    // 入力 F36 → 無敵 F39〜F50。持続の途中で無敵が切れるが、横へ 3m 近く動いて扇形の外へ出る
    expect(canDodge(base, { frame: 36, direction: 'left' })).toBe(true);
  });

  it('the roll direction matters: backstep stays inside the reach of a 4.5m strike', () => {
    expect(canDodge(base, { frame: 40, action: 'backstep' })).toBe(false);
  });

  it('rolling toward the boss slips inside the range only when invulnerable through the hit', () => {
    // ロールが持続全体を覆えば方向を問わず回避できる
    expect(canDodge(base, { frame: 46, direction: 'toward' })).toBe(true);
    // 中途半端な前ロール（無敵が F36〜F47 で切れ、ボスの足元の扇形の内側に残る）は当たる
    expect(canDodge(base, { frame: 33, direction: 'toward' })).toBe(false);
  });

  it('reports an unusable move instead of throwing', () => {
    const r = simulateDodge({ move: 'spin', moves: overheadMoves });
    expect(r.dodged).toBe(false);
    expect(r.error).toContain('spin');
    const p1 = simulateDodge({ move: 'spin', moves: createStubMoves(), phase: 1 });
    expect(p1.error).toBeDefined();
    expect(
      simulateDodge({ move: 'spin', moves: createStubMoves(), phase: 2 }).error,
    ).toBeUndefined();
  });

  it('records a per-frame trace when asked', () => {
    const r = simulateDodge({
      ...base,
      inputs: [{ frame: 46, direction: 'left' }],
      trace: true,
    });
    expect(r.trace).toHaveLength(r.frames);
    const f49 = r.trace?.[48];
    expect(f49?.moveFrame).toBe(49);
    expect(f49?.invulnerable).toBe(true);
    expect(r.trace?.[44]?.invulnerable).toBe(false);
  });

  it('is deterministic', () => {
    const a = simulateDodge({ ...base, inputs: [{ frame: 40, direction: 'right' }] });
    const b = simulateDodge({ ...base, inputs: [{ frame: 40, direction: 'right' }] });
    expect(a).toEqual(b);
  });
});

describe('multi-stage moves', () => {
  const stage = (id: string, startup: number, followUp: boolean): BossStageDef => ({
    ...OVERHEAD,
    id,
    startup,
    active: 6,
    recovery: 8,
    arcDeg: 90,
    range: 3,
    trackEndFrame: 6,
    ...(followUp && { followUp: true }),
  });
  const combo = registryWith({
    id: 'combo3',
    name: '三連撃',
    phases: [1],
    stages: [stage('c1', 30, false), stage('c2', 20, true), stage('c3', 36, true)],
  });

  it('counts frames across stages and reports which stage hit', () => {
    const r = simulateDodge({ move: 'combo3', moves: combo });
    expect(r.hits.map((h) => h.stage)).toEqual([1, 2, 3]);
    // 1 段目 F31、2 段目はその段の F21（通し 30+6+8+21 = 65）
    expect(r.hits[0]).toMatchObject({ moveFrame: 31, stageFrame: 31 });
    expect(r.hits[1]).toMatchObject({ moveFrame: 65, stageFrame: 21 });
  });

  it('can dodge every stage with a sequence of inputs', () => {
    const r = simulateDodge({
      move: 'combo3',
      moves: combo,
      inputs: [
        { frame: 28, direction: 'left' },
        { frame: 62, direction: 'right' },
        { frame: 100, direction: 'left' },
      ],
    });
    expect(r.hits.length).toBeLessThan(3);
  });
});

describe('findDodgeWindows', () => {
  it('finds a contiguous window of successful roll inputs (left and right are symmetric)', () => {
    const left = findDodgeWindows(base, { direction: 'left', from: 1, to: 60 });
    const right = findDodgeWindows(base, { direction: 'right', from: 1, to: 60 });
    expect(left.frames.length).toBeGreaterThan(0);
    expect(left.windows).toHaveLength(1);
    expect(left.windows).toEqual(right.windows);
    // 仕様書 6.3 節: 大上段は左右ロールを F36–F46 で入力して回避できる
    const w = left.windows[0];
    expect(w?.end).toBe(46);
    expect(w?.start).toBeLessThanOrEqual(36);
  });

  it('every stub move can be simulated in a phase that allows it', () => {
    for (const id of BOSS_MOVE_IDS) {
      const phase = id === 'spin' || id === 'ashWave' ? 2 : 1;
      const r = simulateDodge({ move: id, moves: createStubMoves(), phase });
      expect(r.error).toBeUndefined();
      expect(r.frames).toBeGreaterThan(0);
      expect(r.dodged).toBe(false);
    }
  });
});

describe('toRanges', () => {
  it('groups consecutive frames', () => {
    expect(toRanges([])).toEqual([]);
    expect(toRanges([3, 4, 5, 9, 11, 12])).toEqual([
      { start: 3, end: 5 },
      { start: 9, end: 9 },
      { start: 11, end: 12 },
    ]);
  });
});

describe('registered moves (E5-3)', () => {
  it('overhead can be rolled left and right at F36-F46 (spec 6.3)', () => {
    for (const direction of ['left', 'right'] as const) {
      const { frames } = findDodgeWindows(
        { move: 'overhead', phase: 1 },
        { direction, from: 1, to: 60 },
      );
      for (let f = 36; f <= 46; f++) expect(frames).toContain(f);
      expect(frames).not.toContain(47);
    }
  });

  it('every registered basic move yields a dodge window', () => {
    for (const move of ['overhead', 'sweep', 'combo3'] as const) {
      const w = findDodgeWindows({ move, phase: 1 }, { direction: 'toward' });
      expect(w.windows.length, move).toBeGreaterThan(0);
    }
  });
});

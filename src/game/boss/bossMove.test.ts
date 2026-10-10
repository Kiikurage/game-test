import { describe, expect, it } from 'vitest';
import { BOSS_MOVE_IDS } from './bossData';
import {
  BossMoveRegistry,
  BOSS_MOVES,
  checkBossMove,
  stagesOf,
  type BossMoveDef,
} from './bossMove';
import { createStubMoves } from './stubMoves';
import './moves';

const GOOD: BossMoveDef = {
  id: 'overhead',
  name: 'テスト',
  phases: [1, 2],
  stages: [
    {
      id: 'overhead.1',
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
      superArmor: { start: 1, end: 56 },
    },
  ],
};

describe('boss move definitions', () => {
  it('stub moves cover all 7 moves and pass the telegraph checks (reusing E3-1c checkEnemyAttack)', () => {
    const stubs = createStubMoves();
    expect(
      stubs
        .all()
        .map((m) => m.id)
        .sort(),
    ).toEqual([...BOSS_MOVE_IDS].sort());
    for (const move of stubs.all()) expect(checkBossMove(move), move.id).toEqual([]);
  });

  it('every registered move passes the checks', () => {
    for (const move of BOSS_MOVES.all()) expect(checkBossMove(move), move.id).toEqual([]);
  });

  it('accepts a well-formed heavy move with a super-armor window', () => {
    expect(checkBossMove(GOOD)).toEqual([]);
  });

  it('flags a startup below the floor (24F normal / 34F heavy / 20F follow-up)', () => {
    const [stage] = GOOD.stages;
    if (!stage) throw new Error('no stage');
    expect(checkBossMove({ ...GOOD, stages: [{ ...stage, startup: 30 }] }).join('\n')).toMatch(
      /下限 34/,
    );
    expect(
      checkBossMove({ ...GOOD, stages: [{ ...stage, heavy: false, startup: 20 }] }).join('\n'),
    ).toMatch(/下限 24/);
    const combo: BossMoveDef = {
      ...GOOD,
      id: 'combo3',
      stages: [
        { ...stage, heavy: false, startup: 30 },
        { ...stage, id: 'c2', heavy: false, followUp: true, startup: 15, trackEndFrame: 3 },
      ],
    };
    expect(checkBossMove(combo).join('\n')).toMatch(/下限 16/);
    // 仕様の三連撃 P2 の 2 段目（発生 16F）はボスの基準で許す
    const ok: BossMoveDef = {
      ...combo,
      stages: [
        { ...stage, heavy: false, startup: 30, trackEndFrame: 18, superArmor: undefined },
        {
          ...stage,
          id: 'c2',
          heavy: false,
          followUp: true,
          startup: 16,
          trackEndFrame: 4,
          superArmor: undefined,
        },
      ],
    };
    expect(checkBossMove(ok)).toEqual([]);
  });

  it('flags a follow-up flag on the first stage, a missing one on later stages, and bad armor windows', () => {
    const [stage] = GOOD.stages;
    if (!stage) throw new Error('no stage');
    expect(checkBossMove({ ...GOOD, stages: [{ ...stage, followUp: true }] }).join('\n')).toMatch(
      /1 段目に followUp/,
    );
    expect(
      checkBossMove({ ...GOOD, stages: [stage, { ...stage, id: 'x', heavy: false }] }).join('\n'),
    ).toMatch(/followUp を付ける/);
    expect(
      checkBossMove({ ...GOOD, stages: [{ ...stage, superArmor: { start: 1, end: 999 } }] }).join(
        '\n',
      ),
    ).toMatch(/スーパーアーマー/);
    expect(
      checkBossMove({ ...GOOD, stages: [{ ...stage, trackEndFrame: 40 }] }).join('\n'),
    ).toMatch(/追尾終了/);
    expect(checkBossMove({ ...GOOD, stages: [{ ...stage, active: 2 }] }).join('\n')).toMatch(
      /持続/,
    );
    expect(
      checkBossMove({ ...GOOD, approach: { speed: 'walk', stopRange: 0 } }).join('\n'),
    ).toMatch(/接近/);
  });

  it('uses phase2Stages only in phase 2', () => {
    const [stage] = GOOD.stages;
    if (!stage) throw new Error('no stage');
    const fast = { ...stage, startup: 42 };
    const move: BossMoveDef = { ...GOOD, phase2Stages: [fast] };
    expect(stagesOf(move, 1)[0]?.startup).toBe(48);
    expect(stagesOf(move, 2)[0]?.startup).toBe(42);
    expect(stagesOf(GOOD, 2)[0]?.startup).toBe(48);
  });
});

describe('boss move registry', () => {
  it('rejects duplicate ids and merges stubs only for missing moves', () => {
    const reg = new BossMoveRegistry();
    reg.register(GOOD);
    expect(() => {
      reg.register(GOOD);
    }).toThrow(/already registered/);
    const merged = BossMoveRegistry.merged(reg, createStubMoves());
    expect(merged.get('overhead')?.name).toBe('テスト'); // 本物が優先
    expect(merged.get('sweep')?.name).toContain('仮');
    expect(merged.all()).toHaveLength(BOSS_MOVE_IDS.length);
  });
});

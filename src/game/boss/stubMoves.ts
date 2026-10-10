import { BOSS_MOVE_IDS, type BossMoveId } from './bossData';
import { BossMoveRegistry, type BossMoveDef, type BossStageDef } from './bossMove';

/**
 * スタブ技（空振りの仮技）。ダメージ 0・強靭度削り 0 の判定だけを出す。E5-3〜E5-5 で本物の技が入るまで、
 * 動作確認（`?scene=test&boss`）と統計テストで AI の骨格を回すために使う。
 * 本物の技は `moves/*.move.ts` で `registerBossMove` する（スタブは未登録の技だけを埋める）。
 */

const STUB_STAGE: BossStageDef = {
  id: 'stub',
  startup: 24,
  active: 6,
  recovery: 12,
  damage: 0,
  poiseDamage: 0,
  guardStaminaCost: 0,
  moveDistance: 0,
  arcDeg: 90,
  range: 4,
  trackEndFrame: 12,
};

function stub(id: BossMoveId, name: string, extra: Partial<BossMoveDef> = {}): BossMoveDef {
  return {
    id,
    name: `${name}（仮）`,
    phases: [1, 2],
    stages: [{ ...STUB_STAGE, id: `${id}.stub` }],
    ...extra,
  };
}

/** 7 つの技すべてのスタブ（フェーズの制限は仕様どおり）。 */
/** `approach: false` で接近（歩き）を付けない（距離帯を保ったまま回したいテスト用）。 */
export function createStubMoves(options: { approach?: boolean } = {}): BossMoveRegistry {
  const approach = options.approach ?? true;
  const reg = new BossMoveRegistry();
  const followUp = (id: string): BossStageDef => ({
    ...STUB_STAGE,
    id,
    startup: 20,
    recovery: 8,
    trackEndFrame: 6,
    followUp: true,
  });
  const defs: Record<BossMoveId, BossMoveDef> = {
    overhead: stub('overhead', '大上段斬り', {
      stages: [{ ...STUB_STAGE, id: 'overhead.stub', startup: 48, heavy: true, trackEndFrame: 28 }],
      ...(approach && { approach: { speed: 'walk', stopRange: 3 } as const }),
    }),
    sweep: stub('sweep', '薙ぎ払い', {
      ...(approach && { approach: { speed: 'walk', stopRange: 3 } as const }),
    }),
    combo3: stub('combo3', '三連撃', {
      stages: [
        { ...STUB_STAGE, id: 'combo3.1', startup: 30, recovery: 8 },
        followUp('combo3.2'),
        { ...followUp('combo3.3'), startup: 36, recovery: 56 },
      ],
    }),
    shieldBash: stub('shieldBash', '盾打ち', { phases: [1] }),
    leap: stub('leap', '跳躍叩きつけ'),
    spin: stub('spin', '回転斬り', { phases: [2] }),
    ashWave: stub('ashWave', '灰の波', { phases: [2] }),
  };
  for (const id of BOSS_MOVE_IDS) reg.register(defs[id]);
  return reg;
}

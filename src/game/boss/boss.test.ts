import { describe, expect, it } from 'vitest';
import { HitResolver, Poise, UprightTarget, uprightHeartbox } from '../combat';
import { seededRandom } from '../enemy/enemyManager';
import { angleDelta } from '../player/movement';
import { Boss } from './boss';
import {
  BOSS_AI,
  BOSS_CORRECTION,
  BOSS_MOVE_IDS,
  BOSS_WEIGHTS,
  type BossMoveId,
  type BossPhase,
} from './bossData';
import { BossMoveRegistry, type BossMoveDef, type BossStageDef } from './bossMove';
import { createStubMoves } from './stubMoves';

const DT = 1 / 60;

interface Harness {
  readonly boss: Boss;
  readonly combat: HitResolver;
  readonly player: UprightTarget;
  /** プレイヤーの入力（毎ステップ `boss.update` へ渡す）。 */
  readonly input: { x: number; z: number; healing: boolean; rolling: boolean };
  step(): void;
}

function harness(options: {
  moves?: BossMoveRegistry;
  random?: () => number;
  phase?: BossPhase;
  playerZ?: number;
  poise?: Poise;
}): Harness {
  const combat = new HitResolver();
  const player = new UprightTarget('player', 'player', 300, [uprightHeartbox(0.35, 1.8)]);
  const input = { x: 0, z: options.playerZ ?? 2, healing: false, rolling: false };
  player.place(input.x, 0, input.z, Math.PI);
  combat.addTarget(player);
  const boss = new Boss(
    { id: 'boss', x: 0, y: 0, z: 0, yaw: 0 },
    {
      combat,
      moves: options.moves ?? createStubMoves({ approach: false }),
      random: options.random ?? seededRandom('boss-test'),
      ...(options.poise && { poise: options.poise }),
    },
  );
  if (options.phase) boss.setPhase(options.phase);
  boss.engage();
  return {
    boss,
    combat,
    player,
    input,
    step: () => {
      player.place(input.x, 0, input.z, Math.PI);
      boss.update(DT, input);
      combat.step();
    },
  };
}

/** 値を順番に返し、尽きたら最後の値を返す乱数。 */
function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

const stage = (over: Partial<BossStageDef> = {}): BossStageDef => ({
  id: 't',
  startup: 48,
  active: 8,
  recovery: 20,
  damage: 100,
  poiseDamage: 50,
  guardStaminaCost: 50,
  moveDistance: 0,
  arcDeg: 120,
  range: 4,
  trackEndFrame: 36,
  ...over,
});

/** 全 ID を 1 つの技で埋めたレジストリ（`make` で技ごとに作る）。 */
function registryOf(make: (id: BossMoveId) => BossMoveDef): BossMoveRegistry {
  const reg = new BossMoveRegistry();
  for (const id of BOSS_MOVE_IDS) reg.register(make(id));
  return reg;
}

describe('Boss AI skeleton', () => {
  it('inserts a beat of 30-60F (P1) / 20-40F (P2) after every move, and uses the full range', () => {
    for (const phase of [1, 2] as const) {
      const h = harness({ phase, playerZ: 2 });
      const [min, max] = BOSS_AI.beatFrames[phase];
      const beats: number[] = [];
      let run = 0;
      let moves = 0;
      let prev = h.boss.state;
      for (let i = 0; i < 60000; i++) {
        const before = h.boss.state;
        h.step();
        if (before === 'beat') run++;
        if (before === 'beat' && h.boss.state !== 'beat') {
          beats.push(run);
          run = 0;
          moves++;
        }
        // 技が終わったら必ずビートへ（硬直 → 待機 → 次の技）
        if (prev === 'attack' && h.boss.state !== 'attack') expect(h.boss.state).toBe('beat');
        prev = h.boss.state;
      }
      expect(moves).toBeGreaterThan(300);
      expect(Math.min(...beats)).toBe(min);
      expect(Math.max(...beats)).toBe(max);
      for (const b of beats) {
        expect(b).toBeGreaterThanOrEqual(min);
        expect(b).toBeLessThanOrEqual(max);
      }
    }
  });

  it('is dormant until engaged, then begins with a beat', () => {
    const combat = new HitResolver();
    const boss = new Boss(
      { id: 'boss', x: 0, y: 0, z: 0, yaw: 0 },
      { combat, moves: createStubMoves(), random: seededRandom('x') },
    );
    for (let i = 0; i < 200; i++) boss.update(DT, { x: 0, z: 3, healing: false, rolling: false });
    expect(boss.state).toBe('dormant');
    boss.engage();
    expect(boss.state).toBe('beat');
  });

  it('follows its weight pipeline in simulation (stub moves; selections vs expected counts)', () => {
    // 距離帯ごとに、プレイヤーを動かさず長く回す。選択のたびに「そのときの重みの確率」を足し込み、
    // 実際の選択回数が期待値（確率の和）に収束することを見る（履歴に依存する半減・連続制限を含めて検証できる）。
    const cases: { phase: BossPhase; z: number; band: 'close' | 'mid' | 'far' }[] = [
      { phase: 1, z: 2, band: 'close' },
      { phase: 1, z: 5, band: 'mid' },
      { phase: 1, z: 10, band: 'far' },
      { phase: 2, z: 2, band: 'close' },
      { phase: 2, z: 5, band: 'mid' },
      { phase: 2, z: 10, band: 'far' },
    ];
    for (const { phase, z, band } of cases) {
      const h = harness({ phase, playerZ: z, random: seededRandom(`stat-${phase}-${band}`) });
      const expected = new Map<string, number>();
      const actual = new Map<string, number>();
      let selections = 0;
      let streak = 0;
      let last = '';
      for (let i = 0; i < 400000; i++) {
        const before = h.boss.state;
        h.step();
        if (before === 'beat' && h.boss.state === 'attack') {
          const d = h.boss.debugInfo;
          const picked = d.move;
          if (!picked || !d.weights) throw new Error('no selection');
          selections++;
          // 重み表で 0 の技は選ばれない（遠距離は跳躍が尽きると歩み寄るので、そのときの距離帯の表で見る）
          expect(BOSS_WEIGHTS[phase][d.band][picked as BossMoveId] ?? 0).toBeGreaterThan(0);
          for (const e of d.weights.entries) {
            expected.set(e.id, (expected.get(e.id) ?? 0) + e.probability);
          }
          actual.set(picked, (actual.get(picked) ?? 0) + 1);
          streak = picked === last ? streak + 1 : 1;
          last = picked;
          // 3 回連続は選ばない
          expect(streak).toBeLessThanOrEqual(BOSS_AI.maxConsecutive);
        }
      }
      expect(selections).toBeGreaterThan(2500);
      for (const id of BOSS_MOVE_IDS) {
        const exp = expected.get(id) ?? 0;
        const act = actual.get(id) ?? 0;
        // 二項分布の標準偏差の 5 倍以内
        const sd = Math.sqrt(Math.max(exp, 1));
        expect(Math.abs(act - exp), `P${phase} ${band} ${id}`).toBeLessThan(5 * sd);
      }
      // 近距離フェーズ 1 は 4 技が対称なので、全体の割合も表（25% ずつ）に近い
      if (phase === 1 && band === 'close') {
        for (const id of ['overhead', 'sweep', 'combo3', 'shieldBash'] as const) {
          expect(Math.abs((actual.get(id) ?? 0) / selections - 0.25)).toBeLessThan(0.03);
        }
      }
    }
  });

  it('keeps the 30F+ first windup of combo3 when the roll-streak bonus picks it', () => {
    const combo = (startup: number): BossMoveDef => ({
      id: 'combo3',
      name: 'c',
      phases: [1, 2],
      stages: [
        stage({ id: 'c1', startup, active: 6, recovery: 8, trackEndFrame: 10 }),
        stage({ id: 'c2', startup: 20, active: 6, recovery: 8, followUp: true, trackEndFrame: 6 }),
      ],
    });
    const moves = registryOf((id) =>
      id === 'combo3' ? combo(24) : { ...combo(24), id, name: id, phases: [1, 2] },
    );
    const lengthOfFirstStage = (rolls: number): number => {
      // 乱数: ビート最大（40F）→ 選択 0.5
      const h = harness({ moves, phase: 2, playerZ: 2, random: sequence(0.99, 0.5) });
      for (let r = 0; r < rolls; r++) {
        h.input.rolling = true;
        for (let i = 0; i < 8; i++) h.step();
        h.input.rolling = false;
        for (let i = 0; i < 4; i++) h.step();
      }
      let frames = 0;
      for (let i = 0; i < 300; i++) {
        h.step();
        const d = h.boss.debugInfo;
        if (d.move === 'combo3' && d.stage === 1) frames++;
        if (d.stage === 2) return frames;
      }
      throw new Error(`combo3 did not reach stage 2 (rolls=${rolls}, move=${h.boss.currentMove})`);
    };
    // 補正なし: 発生 24 + 持続 6 + 硬直 8 = 38F。ロール 3 連続: 発生が 30F に延びて 44F
    expect(lengthOfFirstStage(0)).toBe(38);
    expect(lengthOfFirstStage(3)).toBe(BOSS_CORRECTION.comboMinStartup + 6 + 8);
    // ロール 2 回では補正なし
    expect(lengthOfFirstStage(2)).toBe(38);
  });

  it('turns 120% faster while tracking a healing player in the close band', () => {
    const moves = registryOf((id) => ({
      id,
      name: id,
      phases: [1, 2],
      stages: [stage()],
    }));
    const turned = (healing: boolean, z: number): number => {
      // プレイヤーはボスの真後ろ。ビート最小 → 選択 0（先頭の技）
      const h = harness({ moves, playerZ: z, random: sequence(0, 0, 0), phase: 1 });
      // ビート中の旋回で向きが変わらないよう、技の開始を待ってから測る
      h.input.healing = healing;
      h.input.z = -z;
      let guard = 0;
      while (h.boss.debugInfo.move === null && guard++ < 500) h.step();
      const start = h.boss.yaw;
      while (h.boss.debugInfo.stageFrame < 36) h.step();
      return Math.abs(angleDelta(start, h.boss.yaw));
    };
    const normal = turned(false, 2);
    const healing = turned(true, 2);
    expect(healing / normal).toBeCloseTo(BOSS_CORRECTION.healTrackRate, 1);
    // 近距離でなければ補正なし
    expect(turned(true, 5) / turned(false, 5)).toBeCloseTo(1, 5);
  });

  it('locks the facing after the tracking end frame (rollable) and then does not turn', () => {
    const moves = registryOf((id) => ({
      id,
      name: id,
      phases: [1, 2],
      stages: [stage({ trackEndFrame: 20 })],
    }));
    const h = harness({ moves, playerZ: 2, random: sequence(0, 0, 0) });
    while (h.boss.debugInfo.move === null) h.step();
    // 予備動作中にプレイヤーが横へ回り込む
    h.input.x = 3;
    h.input.z = 0;
    while (h.boss.debugInfo.stageFrame < 20) h.step();
    const lockedYaw = h.boss.yaw;
    for (let i = 0; i < 20; i++) h.step();
    expect(h.boss.yaw).toBe(lockedYaw);
  });

  it('moves in with the approach spec, stops, then winds up (approach is not part of the telegraph)', () => {
    const moves = registryOf((id) => ({
      id,
      name: id,
      phases: [1, 2],
      stages: [stage()],
      approach: { speed: 'walk', stopRange: 3 },
    }));
    const h = harness({ moves, playerZ: 6, random: sequence(0, 0, 0) });
    let sawApproach = false;
    let startPos = 0;
    for (let i = 0; i < 600; i++) {
      h.step();
      if (h.boss.state === 'approach') sawApproach = true;
      if (h.boss.state === 'attack') {
        startPos = h.boss.position.z;
        break;
      }
    }
    expect(sawApproach).toBe(true);
    // 3m まで近付いてから（歩き 2.4m/s）止まって予備動作
    expect(6 - startPos).toBeLessThanOrEqual(3.05);
    expect(6 - startPos).toBeGreaterThan(2.7);
    for (let i = 0; i < 30; i++) h.step();
    expect(h.boss.position.z).toBeCloseTo(startPos, 6);
  });

  it('runs a multi-stage move through every stage, hitting at F(startup+1) of each', () => {
    const stages = [
      stage({ id: 's1', startup: 30, active: 6, recovery: 8, damage: 80, trackEndFrame: 18 }),
      stage({
        id: 's2',
        startup: 20,
        active: 6,
        recovery: 8,
        damage: 80,
        followUp: true,
        trackEndFrame: 8,
      }),
      stage({
        id: 's3',
        startup: 36,
        active: 8,
        recovery: 56,
        damage: 100,
        followUp: true,
        trackEndFrame: 24,
      }),
    ];
    const moves = registryOf((id) => ({ id, name: id, phases: [1, 2], stages }));
    const h = harness({ moves, playerZ: 2, random: sequence(0, 0, 0) });
    const hits: { stage: number; frame: number }[] = [];
    h.combat.onHit(() => {
      const d = h.boss.debugInfo;
      hits.push({ stage: d.stage, frame: d.stageFrame });
    });
    for (let i = 0; i < 400 && h.boss.state !== 'beat'; i++) h.step();
    let guard = 0;
    while (h.boss.currentMove === null && guard++ < 200) h.step();
    // 1 つの技が終わるまで
    for (let i = 0; i < 400 && h.boss.currentMove !== null; i++) h.step();
    expect(hits.map((x) => x.stage)).toEqual([1, 2, 3]);
    expect(hits.map((x) => x.frame)).toEqual([31, 21, 37]);
    expect(h.player.health.current).toBe(300 - 80 - 80 - 100);
  });

  it('super armor: grants a large poise bonus only inside the window; normal bonus until the end of the active frames', () => {
    const poise = new Poise(400);
    const moves = registryOf((id) => ({
      id,
      name: id,
      phases: [1, 2],
      stages: [stage({ superArmor: { start: 5, end: 30 } })],
    }));
    const h = harness({ moves, playerZ: 2, random: sequence(0, 0, 0), poise });
    while (h.boss.currentMove === null) h.step();
    const bonusAt = (frame: number): number => {
      while (h.boss.debugInfo.stageFrame < frame) h.step();
      return poise.bonus;
    };
    expect(bonusAt(2)).toBe(30);
    expect(bonusAt(10)).toBeGreaterThan(1000);
    expect(bonusAt(40)).toBe(30);
    expect(bonusAt(60)).toBe(0); // 持続 F56 まで +30、その後 0
    // 崩れて打ち切られたら加算は消える
    h.boss.stagger(120);
    expect(poise.bonus).toBe(0);
  });

  it('a normal hit does not cancel the move; stagger() cancels it and ends the attack', () => {
    const h = harness({ playerZ: 2 });
    while (h.boss.currentMove === null) h.step();
    for (let i = 0; i < 10; i++) h.step();
    const move = h.boss.currentMove;
    expect(move).not.toBeNull();
    h.boss.freeze(5); // ヒットストップでも技は進行が止まるだけで中断しない
    for (let i = 0; i < 5; i++) h.step();
    expect(h.boss.currentMove).toBe(move);
    h.boss.stagger(120);
    expect(h.boss.state).toBe('staggered');
    expect(h.boss.currentMove).toBeNull();
    for (let i = 0; i < 120; i++) h.step();
    expect(h.boss.state).toBe('beat');
  });

  it('repositions toward the player when no move can be chosen', () => {
    // P1 の遠距離は跳躍のみ。跳躍が 2 回続くと 3 回目は選べず、歩み寄ってからビートへ戻る
    const h = harness({ playerZ: 12, random: seededRandom('far') });
    let sawReposition = false;
    for (let i = 0; i < 3000; i++) {
      h.step();
      if (h.boss.state === 'reposition') sawReposition = true;
    }
    expect(sawReposition).toBe(true);
    expect(h.boss.position.z).toBeGreaterThan(0); // 歩み寄った
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { Game } from '../../game';
import { FakeInput } from '../../testing/fakeInput';
import { bossSystemOf } from '../boss.system';
import type { BossMoveId, BossPhase } from '../bossData';
import { BOSS_MOVES, BossMoveRegistry } from '../bossMove';
import './index';

/**
 * 技 1・2・3 のシミュレーションテスト（Game + Rapier + 本物のプレイヤーのロール / バックステップ）。
 * ボスは (0,0) で +z（南）を向き、プレイヤーは正面（z > 0）で北（-z）を向く。
 * 画面右 = +x。プレイヤーから見て左へのロールは「ボスの右手側」。
 *
 * 入力フレーム `F` は「ボスのその技（段）の F`F` を処理するステップで入力が確定する」と数える
 * （仕様書 6.3 節の「F36–F46 で入力」）。
 * 自動検証ツール（#79）が入るまでの最小のハーネス。
 */

const DT = 1 / 60;

type Dodge = 'left' | 'right' | 'forward' | 'back';

interface Scenario {
  readonly move: BossMoveId;
  readonly phase?: BossPhase;
  /** プレイヤーのボスからの距離（正面）。 */
  readonly distance: number;
  /** 回避入力（段の 1 段目の F）。なければ棒立ち。 */
  readonly dodge?: { readonly kind: Dodge; readonly frame: number };
  /** 技の頭（ボスの F0）から回すフレーム数。 */
  readonly frames?: number;
}

interface Outcome {
  /** プレイヤーに当たった攻撃（`boss.<技>.<段>` と命中時の技の頭からのフレーム）。 */
  readonly hits: { attackId: string; damage: number; frame: number }[];
  readonly hpLost: number;
}

async function play(s: Scenario): Promise<Outcome> {
  const input = new FakeInput();
  const game = await Game.create({ input, boxes: [], dummies: [], enemies: [] });
  game.teleportPlayer(0, s.distance, Math.PI);
  const move = BOSS_MOVES.get(s.move);
  if (!move) throw new Error(`move ${s.move} is not registered`);
  const moves = new BossMoveRegistry();
  moves.register(move);
  const boss = bossSystemOf(game).spawn({ x: 0, z: 0, yaw: 0, moves, engage: true });
  boss.setPhase(s.phase ?? 1);
  const step = () => {
    game.update(DT);
    input.endStep();
  };
  // 技の頭（段 1 の F0）まで進める（ビート → 技の選択。接近が不要な距離で始める）
  for (let i = 0; i < 600 && !(boss.state === 'attack' && boss.debugInfo.stageFrame === 0); i++) {
    step();
  }
  expect(boss.state).toBe('attack');
  const hp0 = game.playerTarget.health.current;
  const start = game.hitLog.length;
  let elapsed = 0;
  let pressed = false;
  const dir: Record<Dodge, readonly [number, number]> = {
    left: [-1, 0],
    right: [1, 0],
    forward: [0, 1],
    back: [0, 0],
  };
  const frames: number[] = [];
  for (let i = 0; i < (s.frames ?? 140); i++) {
    if (s.dodge && !pressed && elapsed === s.dodge.frame - 1) {
      const [x, y] = dir[s.dodge.kind];
      input.setMove(x, y);
      input.press('dodge');
      pressed = true;
    }
    const before = game.hitLog.length;
    step();
    elapsed++;
    if (pressed) input.setMove(0, 0);
    for (let k = before; k < game.hitLog.length; k++) frames.push(elapsed);
  }
  const hits = game.hitLog
    .slice(start)
    .filter((e) => e.targetId === 'player')
    .map((e, i) => ({ attackId: e.attackId, damage: e.baseDamage, frame: frames[i] ?? -1 }));
  return { hits, hpLost: hp0 - game.playerTarget.health.current };
}

describe('boss moves 1-3: simulation against the real player', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  describe('大上段斬り (overhead)', () => {
    it('hits a standing player for 110 at F49 (P1) and 120 at F43 (P2)', async () => {
      const p1 = await play({ move: 'overhead', distance: 3.0, frames: 70 });
      expect(p1.hits).toEqual([{ attackId: 'boss.overhead.1', damage: 110, frame: 49 }]);
      const p2 = await play({ move: 'overhead', phase: 2, distance: 3.0, frames: 70 });
      expect(p2.hits).toEqual([{ attackId: 'boss.overhead.1', damage: 120, frame: 43 }]);
    });

    for (const kind of ['left', 'right'] as const) {
      for (const frame of [36, 46]) {
        it(`dodges with a ${kind} roll input at F${frame} (the F36-F46 window, P1)`, async () => {
          const r = await play({ move: 'overhead', distance: 3.0, dodge: { kind, frame } });
          expect(r.hits).toEqual([]);
        });
      }
    }

    it('is hit by a side roll input that is too late (F49 and later)', async () => {
      for (const kind of ['left', 'right'] as const) {
        const r = await play({ move: 'overhead', distance: 3.0, dodge: { kind, frame: 49 } });
        expect(r.hits).toHaveLength(1);
      }
    });

    it('is dodged by a side roll in P2 too, with the window moved 6F earlier (F30-F40)', async () => {
      for (const frame of [30, 40]) {
        const r = await play({
          move: 'overhead',
          phase: 2,
          distance: 3.0,
          dodge: { kind: 'left', frame },
        });
        expect(r.hits, `F${frame}`).toEqual([]);
      }
      const late = await play({
        move: 'overhead',
        phase: 2,
        distance: 3.0,
        dodge: { kind: 'left', frame: 43 },
      });
      expect(late.hits).toHaveLength(1);
    });

    for (const frame of [36, 41, 46]) {
      it(`dives through with a forward roll input at F${frame} (inside the reach)`, async () => {
        const r = await play({
          move: 'overhead',
          distance: 3.0,
          dodge: { kind: 'forward', frame },
        });
        expect(r.hits).toEqual([]);
      });
    }

    it('is hit when standing still next to the boss at the edge of the reach (4.0m)', async () => {
      const r = await play({ move: 'overhead', distance: 4.0, frames: 70 });
      expect(r.hits).toHaveLength(1);
    });

    it('does not hit a player standing in the dead zone right in front of the boss (inside the axe)', async () => {
      const r = await play({ move: 'overhead', distance: 0.9, frames: 70 });
      expect(r.hits).toEqual([]);
    });
  });

  describe('薙ぎ払い (sweep)', () => {
    it('hits a standing player for 95 at F41 (P1), and twice in P2 (105 at F35, then 90)', async () => {
      const p1 = await play({ move: 'sweep', distance: 2.5, frames: 90 });
      expect(p1.hits).toEqual([{ attackId: 'boss.sweep.1', damage: 95, frame: 41 }]);
      const p2 = await play({ move: 'sweep', phase: 2, distance: 2.5, frames: 120 });
      // 2 発目（逆方向・ダメージ 90）は 1 発目の被弾のヒットストップ分だけ遅れて当たる
      expect(p2.hits.map((h) => [h.attackId, h.damage])).toEqual([
        ['boss.sweep.1', 105],
        ['boss.sweep.2', 90],
      ]);
      expect(p2.hits[0]?.frame).toBe(35);
    });

    it('is not avoided by a backstep: it still reaches (5.0m) whenever the backstep is input', async () => {
      for (const frame of [30, 36, 40, 44]) {
        const r = await play({
          move: 'sweep',
          distance: 2.5,
          dodge: { kind: 'back', frame },
          frames: 90,
        });
        expect(r.hits, `backstep F${frame}`).toHaveLength(1);
      }
    });

    for (const frame of [36, 38]) {
      it(`dives under it with a forward roll input at F${frame}`, async () => {
        const r = await play({
          move: 'sweep',
          distance: 2.5,
          dodge: { kind: 'forward', frame },
          frames: 90,
        });
        expect(r.hits).toEqual([]);
      });
    }

    it('is not avoided by a side roll late enough that the invulnerability ends inside the range', async () => {
      const r = await play({
        move: 'sweep',
        distance: 2.5,
        dodge: { kind: 'left', frame: 41 },
        frames: 90,
      });
      expect(r.hits).toHaveLength(1);
    });
  });

  describe('三連撃 (combo3)', () => {
    it('hits a standing player with all three stages: 80 / 80 / 100 (P1), 85 / 85 / 105 (P2)', async () => {
      const p1 = await play({ move: 'combo3', distance: 2.5, frames: 200 });
      expect(p1.hits.map((h) => [h.attackId, h.damage])).toEqual([
        ['boss.combo3.1', 80],
        ['boss.combo3.2', 80],
        ['boss.combo3.3', 100],
      ]);
      expect(p1.hits[0]?.frame).toBe(31);
      const p2 = await play({ move: 'combo3', phase: 2, distance: 2.5, frames: 200 });
      expect(p2.hits.map((h) => [h.attackId, h.damage])).toEqual([
        ['boss.combo3.1', 85],
        ['boss.combo3.2', 85],
        ['boss.combo3.3', 105],
      ]);
      expect(p2.hits[0]?.frame).toBe(25);
    });

    for (const frame of [22, 25, 28]) {
      it(`dodges the whole combo with a roll to the left (the boss's right hand) input at F${frame}`, async () => {
        const r = await play({
          move: 'combo3',
          distance: 2.5,
          dodge: { kind: 'left', frame },
          frames: 200,
        });
        expect(r.hits).toEqual([]);
      });
    }

    it('dodges the first stage in P2 too (window moved earlier)', async () => {
      for (const frame of [16, 22]) {
        const r = await play({
          move: 'combo3',
          phase: 2,
          distance: 2.5,
          dodge: { kind: 'left', frame },
          frames: 160,
        });
        expect(r.hits, `F${frame}`).toEqual([]);
      }
    });

    it('is hit by the first stage when the roll is input too late', async () => {
      const r = await play({
        move: 'combo3',
        distance: 2.5,
        dodge: { kind: 'left', frame: 33 },
        frames: 200,
      });
      expect(r.hits.length).toBeGreaterThanOrEqual(1);
    });
  });
});

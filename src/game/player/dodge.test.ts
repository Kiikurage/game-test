import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, PLAYER_STATS, UNDEAD_SOLDIER_ATTACKS } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import type { EnemySpawn } from '../world/level';
import { angleDelta } from './movement';

const DT = 1 / 60;

type GameOptions = NonNullable<Parameters<typeof Game.create>[0]>;

/**
 * ロール / バックステップの境界値テスト（仕様 2.3 / 2.4 節）。
 * 無敵 F・キャンセル窓・先行入力・壁際・ダッシュ移行・ロックオン時の向きを、1 フレーム単位で検証する。
 * F は「入力と同じステップが F1」。
 */
describe('roll / backstep frame boundaries', () => {
  beforeAll(async () => {
    await Game.create();
  });

  async function setup(options: Partial<GameOptions> = {}) {
    resetTuning();
    tuning.camera.autoFollow = false;
    const input = new FakeInput();
    const game = await Game.create({ input, dummies: [], boxes: [], ...options });
    const h = {
      game,
      input,
      /** true なら回避ボタンを押しっぱなしにする（ダッシュ移行の検証）。 */
      holdDodge: false,
      run(frames: number) {
        for (let i = 0; i < frames; i++) {
          game.update(DT);
          input.endStep();
          if (!h.holdDodge && input.snapshot.buttons.dodge.held) input.hold('dodge', false);
        }
      },
    };
    h.run(10);
    return h;
  }
  type Harness = Awaited<ReturnType<typeof setup>>;

  /** 状態 `state` の F`frame` になるまで進める（F1 は入力ステップ）。 */
  function runToFrame(h: Harness, state: string, frame: number, limit = 80): void {
    for (let i = 0; i < limit; i++) {
      if (h.game.player.state === state && h.game.player.stateFrame === frame) return;
      h.run(1);
    }
    throw new Error(`never reached ${state} F${frame} (now ${h.game.player.state})`);
  }

  describe('invulnerability vs. a hit on exactly that frame', () => {
    const cases: [string, 'roll' | 'backstep', number, boolean][] = [
      ['roll F1', 'roll', 1, true],
      ['roll F3 (last vulnerable startup frame)', 'roll', 3, true],
      ['roll F4 (first invulnerable frame)', 'roll', 4, false],
      ['roll F15 (last invulnerable frame)', 'roll', 15, false],
      ['roll F16 (first vulnerable recovery frame)', 'roll', 16, true],
      ['roll F32', 'roll', 32, true],
      ['backstep F1', 'backstep', 1, false],
      ['backstep F8 (last invulnerable frame)', 'backstep', 8, false],
      ['backstep F9 (first vulnerable frame)', 'backstep', 9, true],
      ['backstep F22', 'backstep', 22, true],
    ];
    for (const [name, kind, frame, hit] of cases) {
      it(`${name}: ${hit ? 'is hit' : 'passes through'}`, async () => {
        const h = await setup();
        if (kind === 'roll') h.input.setMove(1, 0);
        h.input.press('dodge');
        h.run(1);
        h.input.setMove(0, 0);
        runToFrame(h, kind, frame);
        const hp = h.game.playerTarget.health.current;
        const events = h.game.debugHitPlayer({ damage: 10, poiseDamage: 0 });
        expect(events.length > 0).toBe(hit);
        expect(h.game.playerTarget.health.current).toBe(hit ? hp - 10 : hp);
      });
    }

    it('an invulnerable hit is not resolved at all (no reaction, no guard, no poise)', async () => {
      const h = await setup();
      h.input.setMove(1, 0);
      h.input.press('dodge');
      runToFrame(h, 'roll', 8);
      expect(h.game.debugHitPlayer({ damage: 10, poiseDamage: 999 })).toHaveLength(0);
      expect(h.game.player.state).toBe('roll');
    });

    it('matches the data (roll 12 frames, backstep 8 frames)', () => {
      expect(PLAYER_ACTIONS.roll.invuln).toEqual({ start: 4, end: 15 });
      expect(PLAYER_ACTIONS.backstep.invuln).toEqual({ start: 1, end: 8 });
    });
  });

  describe('cancel windows', () => {
    it('roll: an attack input held in the buffer is consumed on F26, not F25', async () => {
      const h = await setup();
      h.input.setMove(1, 0);
      h.input.press('dodge');
      runToFrame(h, 'roll', 24);
      h.input.setMove(0, 0);
      h.input.press('lightAttack');
      h.run(1); // F25: 窓の外
      expect(h.game.player.state).toBe('roll');
      expect(h.game.player.stateFrame).toBe(25);
      h.run(1); // F26
      expect(h.game.player.state).toBe('light1');
      expect(h.game.player.stateFrame).toBe(1);
    });

    it('roll: an attack input made on F26 starts the attack in the same step', async () => {
      const h = await setup();
      h.input.setMove(1, 0);
      h.input.press('dodge');
      runToFrame(h, 'roll', 25);
      h.input.setMove(0, 0);
      h.input.press('lightAttack');
      h.run(1);
      expect(h.game.player.state).toBe('light1');
    });

    it('roll: guard (held) cancels from F26, not before', async () => {
      const h = await setup();
      h.input.setMove(1, 0);
      h.input.press('dodge');
      runToFrame(h, 'roll', 24);
      h.input.setMove(0, 0);
      h.input.hold('guard', true);
      h.run(1);
      expect(h.game.player.state).toBe('roll');
      expect(h.game.player.stateFrame).toBe(25);
      h.run(1);
      expect(h.game.player.state).toBe('guard');
    });

    it('roll: heal cancels from F26, not before', async () => {
      const h = await setup();
      h.game.playerTarget.health.current -= 50;
      h.input.setMove(1, 0);
      h.input.press('dodge');
      runToFrame(h, 'roll', 24);
      h.input.setMove(0, 0);
      h.input.press('item');
      h.run(1);
      expect(h.game.player.state).toBe('roll');
      h.run(1);
      expect(h.game.player.state).toBe('heal');
    });

    it('roll: move input cancels on F26 (not F25); with no input the recovery lasts until F32', async () => {
      const a = await setup();
      a.input.setMove(1, 0);
      a.input.press('dodge');
      runToFrame(a, 'roll', 25);
      expect(a.game.player.state).toBe('roll');
      a.run(1);
      expect(a.game.player.state).toBe('move');

      const b = await setup();
      b.input.setMove(1, 0);
      b.input.press('dodge');
      runToFrame(b, 'roll', 1);
      b.input.setMove(0, 0);
      runToFrame(b, 'roll', 32);
      b.run(1);
      expect(b.game.player.state).toBe('idle');
    });

    it('backstep: attack cancel opens on F18 (F17 not)', async () => {
      const h = await setup();
      h.input.press('dodge');
      runToFrame(h, 'backstep', 16);
      h.input.press('lightAttack');
      h.run(1); // F17: 窓の外
      expect(h.game.player.state).toBe('backstep');
      expect(h.game.player.stateFrame).toBe(17);
      h.run(1); // F18
      expect(h.game.player.state).toBe('light1');
    });

    it('backstep: ends on F22', async () => {
      const h = await setup();
      h.input.press('dodge');
      runToFrame(h, 'backstep', 22);
      h.run(1);
      expect(h.game.player.state).toBe('idle');
    });

    it('light 1 -> dodge opens on F18 (2F after the active frames), not F17', async () => {
      const h = await setup();
      h.input.press('lightAttack');
      runToFrame(h, 'light1', 16);
      h.input.press('dodge');
      h.run(1); // F17
      expect(h.game.player.state).toBe('light1');
      h.run(1); // F18
      expect(h.game.player.state).toBe('backstep'); // 入力なし = バックステップ
    });

    it('guard -> roll is immediate (guard F1)', async () => {
      const h = await setup();
      h.input.hold('guard', true);
      h.run(2);
      expect(h.game.player.state).toBe('guard');
      h.input.setMove(1, 0);
      h.input.press('dodge');
      h.run(1);
      expect(h.game.player.state).toBe('roll');
      expect(h.game.player.stateFrame).toBe(1);
    });
  });

  describe('input buffer (8F)', () => {
    /** 軽 1 の動作不能中に押した入力が、窓が開く F18 で消費されるか。`framesBefore` は押してから F18 のステップまでの数。 */
    async function pressNStepsBeforeWindow(framesBefore: number) {
      const h = await setup();
      h.input.press('lightAttack');
      runToFrame(h, 'light1', 18 - framesBefore);
      h.input.press('dodge');
      runToFrame(h, 'light1', 17);
      const before = h.game.player.state;
      h.run(1); // F18
      return { before, after: h.game.player.state };
    }

    it('an input made 8 steps before the window opens (age 7 at F18) is accepted', async () => {
      const r = await pressNStepsBeforeWindow(8);
      expect(r.before).toBe('light1');
      expect(r.after).toBe('backstep');
    });

    it('an input made 9 steps before the window opens (age 8 at F18) has expired', async () => {
      const r = await pressNStepsBeforeWindow(9);
      expect(r.before).toBe('light1');
      expect(r.after).not.toBe('backstep');
    });
  });

  describe('movement', () => {
    it('roll covers 3.2m, backstep 2.0m (no obstacles)', async () => {
      const a = await setup();
      const x0 = a.game.player.feet.x;
      const z0 = a.game.player.feet.z;
      a.input.setMove(1, 0);
      a.input.press('dodge');
      a.run(1);
      a.input.setMove(0, 0);
      a.run(40);
      expect(Math.hypot(a.game.player.feet.x - x0, a.game.player.feet.z - z0)).toBeCloseTo(3.2, 1);

      const b = await setup();
      const bz = b.game.player.feet.z;
      b.input.press('dodge');
      b.run(40);
      expect(Math.abs(b.game.player.feet.z - bz)).toBeCloseTo(2.0, 1);
    });

    it('rolls in the stick direction relative to the camera', async () => {
      const h = await setup();
      h.game.camera.reset(h.game.player.feet, Math.PI / 2);
      h.run(1);
      const p0 = h.game.player.feet.clone();
      h.input.setMove(0, 1); // カメラ前方
      h.input.press('dodge');
      h.run(1);
      h.input.setMove(0, 0);
      h.run(40);
      const d = h.game.player.feet.clone().sub(p0);
      expect(Math.abs(angleDelta(Math.atan2(d.x, d.z), h.game.camera.yaw))).toBeLessThan(0.1);
    });

    it('is stopped by a wall 0.1m short, and the invulnerable frames are spent (no rescue)', async () => {
      // カメラは -Z 向き。前方へロール。壁の面は z=-2.0（プレイヤーは z=0 付近）
      const h = await setup({
        boxes: [{ id: 'wall', x: 0, y: 1, z: -2.5, hx: 3, hy: 1, hz: 0.5 }],
      });
      h.game.teleportPlayer(0, 0, Math.PI);
      h.run(2);
      h.input.setMove(0, 1);
      h.input.press('dodge');
      let invulnFrames = 0;
      for (let i = 0; i < 34; i++) {
        h.run(1);
        if (h.game.player.state === 'roll' && h.game.player.invulnerable) invulnFrames++;
        h.input.setMove(0, 0);
      }
      const gap = h.game.player.feet.z + 2.0 - PLAYER_STATS.hurtCapsule.radius;
      expect(gap).toBeGreaterThan(-0.001);
      expect(gap).toBeLessThanOrEqual(0.1);
      expect(invulnFrames).toBe(12);
    });
  });

  describe('dash transition, stamina and lock-on', () => {
    it('moves into a dash when the button is still held as the roll ends, and into a run when released', async () => {
      for (const held of [true, false]) {
        const h = await setup();
        h.holdDodge = held;
        h.input.setMove(0, 1);
        h.input.press('dodge');
        h.run(1);
        h.input.hold('dodge', held);
        for (let i = 0; i < 40 && h.game.player.state === 'roll'; i++) h.run(1);
        expect(h.game.player.state).toBe(held ? 'dash' : 'move');
      }
    });

    it('with no stick input at the end of the roll, a held button waits in idle (no dash)', async () => {
      const h = await setup();
      h.holdDodge = true;
      h.input.setMove(0, 1);
      h.input.press('dodge');
      h.run(1);
      h.input.setMove(0, 0);
      runToFrame(h, 'roll', 32);
      h.run(1);
      expect(h.game.player.state).toBe('idle');
    });

    it('stamina: roll costs 20, backstep 12, and neither starts at 0', async () => {
      const a = await setup();
      const s = a.game.player.stamina.current;
      a.input.setMove(1, 0);
      a.input.press('dodge');
      a.run(1);
      expect(a.game.player.stamina.current).toBeCloseTo(s - PLAYER_ACTIONS.roll.staminaCost, 3);
      const b = await setup();
      b.input.press('dodge');
      b.run(1);
      expect(b.game.player.stamina.current).toBeCloseTo(s - PLAYER_ACTIONS.backstep.staminaCost, 3);
      const c = await setup();
      c.game.player.stamina.consume(1000);
      c.input.press('dodge');
      c.run(2);
      expect(c.game.player.state).toBe('idle');
    });

    it('locked on: rolls relative to the input, then turns back to face the enemy by F32', async () => {
      const h = await setup({ enemies: [{ ...ENEMY, x: 0, z: -6 }] });
      h.input.press('lockOn');
      h.run(20);
      expect(h.game.lockOn.target).not.toBeNull();
      const p0 = h.game.player.feet.clone();
      h.input.setMove(1, 0); // 画面右
      h.input.press('dodge');
      h.run(1);
      h.input.setMove(0, 0);
      expect(h.game.player.state).toBe('roll');
      runToFrame(h, 'roll', 10);
      // ロール中は進行方向（+X）を向く
      expect(Math.abs(angleDelta(h.game.player.yaw, Math.PI / 2))).toBeLessThan(0.3);
      h.run(60);
      expect(h.game.player.feet.x - p0.x).toBeGreaterThan(3.0);
      const t = h.game.lockOn.target;
      if (!t) throw new Error('lost target');
      const toTarget = Math.atan2(
        t.position.x - h.game.player.feet.x,
        t.position.z - h.game.player.feet.z,
      );
      expect(Math.abs(angleDelta(h.game.player.yaw, toTarget))).toBeLessThan(0.1);
    });

    it('locked on with no stick input: backstep away from the enemy while keeping it in front', async () => {
      const h = await setup({ enemies: [{ ...ENEMY, x: 0, z: -6 }] });
      h.input.press('lockOn');
      h.run(20);
      expect(h.game.lockOn.target).not.toBeNull();
      const z0 = h.game.player.feet.z;
      const yaw0 = h.game.player.yaw;
      h.input.press('dodge');
      h.run(30);
      expect(h.game.player.feet.z - z0).toBeCloseTo(2.0, 1);
      expect(Math.abs(angleDelta(h.game.player.yaw, yaw0))).toBeLessThan(0.1);
    });
  });
});

const ENEMY: EnemySpawn = {
  id: 't-soldier',
  type: 'undead_soldier',
  area: 'A',
  x: 0,
  z: 0,
  yaw: 0,
  behavior: 'wait',
};

describe('roll vs. a real enemy attack (simulation)', () => {
  beforeAll(async () => {
    await Game.create();
  });

  /**
   * 敵の A1（横斬り）の最初の判定フレームに、ロールが `firstActiveRollFrame` になるよう押して命中数を返す。
   * 命中は敵の F(発生+1) から持続 5F。ロールの F4–F15 が持続を覆っていれば素通りする。
   * 最初の技が A1 でなければ -1。
   */
  async function trial(firstActiveRollFrame: number): Promise<number> {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [ENEMY] });
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('no enemy');
    const run = (n: number) => {
      for (let i = 0; i < n; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    game.teleportPlayer(0, 2, Math.PI);
    for (let i = 0; i < 1500 && enemy.state !== 'attack'; i++) run(1);
    const id = enemy.fsm.actionId?.replace('enemy.undead.', '') ?? '';
    if (id !== 'a1') return -1;
    const def = UNDEAD_SOLDIER_ATTACKS.a1;
    const pressAt = def.startup + 1 - (firstActiveRollFrame - 1);
    while (enemy.fsm.stateFrame < pressAt - 1) run(1);
    input.setMove(1, 0);
    input.press('dodge');
    for (let i = 0; i < 60; i++) run(1);
    return game.hitLog.filter((e) => e.targetId === 'player').length;
  }

  it('passes through when roll F4.. covers the whole swing, is hit on F3', async () => {
    const results: Record<number, number> = {};
    for (const f of [3, 4, 8, 11]) {
      let r = await trial(f);
      for (let k = 0; k < 8 && r === -1; k++) r = await trial(f);
      results[f] = r;
    }
    expect(results[4]).toBe(0);
    expect(results[8]).toBe(0);
    expect(results[11]).toBe(0);
    expect(results[3]).toBeGreaterThan(0);
  }, 120_000);
});

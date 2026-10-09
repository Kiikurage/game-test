import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, PLAYER_STATS, attackDamage, totalFrames } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';

const DT = 1 / 60;

/**
 * 軽攻撃 3 段コンボ（#46）の結合テスト。窓の境界値・先行入力・スタミナ・フレーム一致を、
 * 物理を含む Game で 1 ステップずつ検証する。
 *
 * 表記: 「F n」は攻撃動作の n フレーム目。F1 は入力と同じステップ（入力から動き出しまで 0 フレーム）。
 */
describe('light attack combo', () => {
  let game: Game;
  let input: FakeInput;

  beforeAll(async () => {
    await Game.create();
  });

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    input = new FakeInput();
    game = await Game.create({ input });
  });

  function tick(): void {
    game.update(DT);
    input.endStep();
  }

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) tick();
  }

  /** 軽攻撃ボタンを押して 1 ステップ進める（F1 のステップ）。 */
  function press(): void {
    input.press('lightAttack');
    tick();
  }

  /** ステップごとの状態の記録（`states[n - 1]` が F n）。 */
  function record(frames: number): { state: string; frame: number; hit: boolean }[] {
    const out: { state: string; frame: number; hit: boolean }[] = [];
    for (let i = 0; i < frames; i++) {
      tick();
      out.push({
        state: game.player.state,
        frame: game.player.stateFrame,
        hit: game.player.attack?.hitActive ?? false,
      });
    }
    return out;
  }

  /** 攻撃 `from` の開始（F1）から数えて F`frame` のステップで軽攻撃ボタンを押す。F1 のステップを既に実行済みとして使う。 */
  function pressAt(frame: number, from: number): void {
    // いま F`from` を実行し終えたところ（stateFrame == from）。F`frame` のステップの直前まで進めてから押す。
    run(frame - from - 1);
    input.press('lightAttack');
  }

  beforeEach(() => {
    run(10); // 着地・スポーンの落ち着き
  });

  describe('軽攻撃 1 のフレーム単位の一致（発生 12・持続 4・全体 36）', () => {
    it('入力と同じステップで F1 が始まり、当たり窓は F13–F16、F36 まで行動不能、F37 で戻る', () => {
      input.press('lightAttack');
      tick();
      expect(game.player.state).toBe('light1');
      expect(game.player.stateFrame).toBe(1);
      expect(game.player.isActionable).toBe(false);

      const states = record(40); // F2 以降
      const data = PLAYER_ACTIONS.light1;
      expect(totalFrames(data)).toBe(36);
      for (let f = 2; f <= 36; f++) {
        const s = states[f - 2];
        expect(s?.state, `F${f}`).toBe('light1');
        expect(s?.frame, `F${f}`).toBe(f);
        // 当たり窓は F13–F16 だけ（hitStart = 発生 + 1、hitEnd = 発生 + 持続）
        expect(s?.hit, `F${f} hit`).toBe(f >= 13 && f <= 16);
      }
      expect(states[36 - 2 + 1]?.state).toBe('idle'); // F37
      expect(states[36 - 2 + 1]?.hit).toBe(false);
    });

    it('スタミナを動作開始時に 14 消費する', () => {
      const before = game.player.stamina.current;
      press();
      expect(game.player.stamina.current).toBeCloseTo(before - 14, 5);
    });
  });

  describe('次段入力の窓（軽 1: F20–F48）', () => {
    /** 軽 1 の F`pressFrame` で押したときの、その後の状態（F`observe` 時点）。 */
    function stateAfterPress(
      pressFrame: number,
      observe: number,
    ): { state: string; frame: number } {
      press(); // F1
      pressAt(pressFrame, 1);
      run(observe - pressFrame + 1);
      return { state: game.player.state, frame: game.player.stateFrame };
    }

    it('窓が開く F20 で次段が始まる（F19 の入力は先行入力として F20 に持ち越される）', () => {
      press(); // F1
      pressAt(19, 1);
      // F19 のステップ: まだ軽 1（窓は F20 から）
      tick();
      expect(game.player.state).toBe('light1');
      expect(game.player.stateFrame).toBe(19);
      // F20: 窓が開いた最初のフレームで軽 2 の F1
      tick();
      expect(game.player.state).toBe('light2');
      expect(game.player.stateFrame).toBe(1);
    });

    it('F18 / F11 の入力も先行入力（10F）で F20 に繋がる。F10 の入力は期限切れで繋がらない', () => {
      // F11 の入力: F11–F20 の 10 ステップ保持される → F20 で消費
      const r = stateAfterPress(11, 21);
      expect(r.state).toBe('light2');
      expect(r.frame).toBe(2);
    });

    it('先行入力の境界: F10 の入力は F20 まで保持されない', () => {
      const r = stateAfterPress(10, 21);
      // 繋がらず、軽 1 のまま（窓の中の次の入力は受け付けるが、入力自体が失効している）
      expect(r.state).toBe('light1');
      expect(r.frame).toBe(21);
    });

    it('窓の終端 F48（全体 36 の後・動作は終わっている）の入力は軽 2 になる', () => {
      press(); // F1
      run(47 - 1); // F47 まで
      expect(game.player.state).toBe('idle');
      input.press('lightAttack');
      tick(); // F48
      expect(game.player.state).toBe('light2');
      expect(game.player.stateFrame).toBe(1);
    });

    it('窓を過ぎた F49 の入力は軽攻撃 1 に戻る', () => {
      press();
      run(48 - 1); // F48 まで（入力なし）
      input.press('lightAttack');
      tick(); // F49
      expect(game.player.state).toBe('light1');
      expect(game.player.stateFrame).toBe(1);
    });

    it('F20 より前（F12）に押しっぱなしでも、窓の外の入力は消費されない（軽 1 のまま）', () => {
      const r = stateAfterPress(5, 19);
      expect(r.state).toBe('light1');
      expect(r.frame).toBe(19);
    });
  });

  describe('3 段まで繋がる', () => {
    it('軽 1 → 軽 2 → 軽 3 と窓の最初のフレームで繋がり、軽 3 の後は軽 1 に戻る', () => {
      press(); // 軽 1 F1
      // 軽 1 の F19 で押す → F20 で軽 2
      pressAt(19, 1);
      run(2);
      expect(game.player.state).toBe('light2');
      expect(game.player.stateFrame).toBe(1);
      // 軽 2 の窓は F18–F48。F17 で押す → F18 で軽 3
      pressAt(17, 1);
      run(2);
      expect(game.player.state).toBe('light3');
      expect(game.player.stateFrame).toBe(1);
      // 軽 3 は軽攻撃に繋がらない（窓なし）: 中盤で押しても軽 3 のまま
      pressAt(30, 1);
      run(2);
      expect(game.player.state).toBe('light3');
      // 全体 52 の終了後、保持されていれば軽 1
      let guard = 0;
      while (game.player.state === 'light3' && guard++ < 80) {
        input.press('lightAttack');
        tick();
      }
      expect(game.player.state).toBe('light1');
    });

    it('軽 3 は 発生 16・持続 6・全体 52、スタミナ 20', () => {
      const d = PLAYER_ACTIONS.light3;
      expect(totalFrames(d)).toBe(52);
      // 軽 1 → 軽 2 → 軽 3
      press();
      pressAt(19, 1);
      run(2);
      pressAt(17, 1);
      run(2);
      expect(game.player.state).toBe('light3');
      const before = game.player.stamina.current;
      expect(before).toBeLessThan(100);
      const states = record(52);
      // F2..F52 が light3、F53 で idle
      for (let f = 2; f <= 52; f++) {
        expect(states[f - 2]?.state, `F${f}`).toBe('light3');
        expect(states[f - 2]?.hit, `F${f}`).toBe(f >= 17 && f <= 22);
      }
      expect(states[52 - 1]?.state).toBe('idle');
    });
  });

  describe('スタミナ', () => {
    it('スタミナ 0 では開始できない（入力は失効する）', () => {
      game.player.stamina.consume(100);
      press();
      expect(game.player.state).toBe('idle');
      run(5);
      expect(game.player.state).toBe('idle');
    });

    it('スタミナ 0 では次段へ繋げない（窓の間ずっと押していても）', () => {
      press();
      game.player.stamina.consume(100);
      for (let f = 2; f <= 40; f++) {
        input.press('lightAttack');
        tick();
      }
      expect(game.player.state).not.toBe('light2');
    });

    it('残量が少しでもあれば開始でき、0 へクランプされる', () => {
      game.player.stamina.current = 3;
      press();
      expect(game.player.state).toBe('light1');
      expect(game.player.stamina.current).toBe(0);
    });
  });

  describe('キャンセル', () => {
    it('ロールへは持続終了の 2F 後（F18）から。F17 の入力は先行入力で F18 に繋がる', () => {
      press(); // F1
      run(15); // F16 まで
      input.press('dodge');
      tick(); // F17: まだ軽 1
      expect(game.player.state).toBe('light1');
      tick(); // F18
      expect(game.player.state).toBe('backstep'); // 移動入力なし → バックステップ
    });

    it('発生・持続中（F1–F17）はロールへキャンセルできない', () => {
      press();
      for (let i = 0; i < 15; i++) {
        input.press('dodge');
        tick();
        expect(game.player.state).toBe('light1');
      }
    });

    it('ロールの F26 以降から軽攻撃（軽 1）へキャンセルできる', () => {
      input.setMove(0, 1);
      input.press('dodge');
      tick();
      expect(game.player.state).toBe('roll');
      input.setMove(0, 0);
      run(23); // F24
      input.press('lightAttack');
      tick(); // F25: まだロール
      expect(game.player.state).toBe('roll');
      tick(); // F26: 先行入力を消費して軽 1
      expect(game.player.state).toBe('light1');
      expect(game.player.stateFrame).toBe(1);
    });
  });

  describe('前進移動・旋回', () => {
    it('軽 1 で前方へ 0.5m 進み、硬直中は止まる', () => {
      const start = { x: game.player.feet.x, z: game.player.feet.z };
      const fwdZ = Math.cos(game.player.yaw);
      press();
      run(36);
      const moved = (game.player.feet.z - start.z) * fwdZ;
      expect(moved).toBeGreaterThan(0.45);
      expect(moved).toBeLessThan(0.55);
      const z = game.player.feet.z;
      run(5);
      expect(game.player.feet.z).toBeCloseTo(z, 3);
    });

    it('発生中は入力方向へ向きを合わせ、当たり窓が開いたら向きを固定する', () => {
      const yaw0 = game.player.yaw;
      input.setMove(1, 0); // カメラ基準で右
      press();
      run(11); // F12 まで（発生中）
      const yawStartup = game.player.yaw;
      expect(Math.abs(yawStartup - yaw0)).toBeGreaterThan(0.5);
      input.setMove(-1, 0);
      run(10);
      expect(game.player.yaw).toBeCloseTo(yawStartup, 6);
    });
  });

  describe('命中（ダミー）', () => {
    function faceDummy(): void {
      // dummy-a (0, -6) の 1.5m 手前で北向き
      game.teleportPlayer(0, -4.5, Math.PI);
      run(3);
    }

    it('軽 1 は当たり窓の間に 1 回だけ命中し、ダメージは基本攻撃力 × 倍率', () => {
      faceDummy();
      const before = game.hitCount;
      press(); // F1
      let hitFrame = 0;
      for (let f = 2; f <= 40; f++) {
        tick();
        if (!hitFrame && game.hitCount > before) hitFrame = f;
      }
      expect(game.hitCount).toBe(before + 1);
      expect(hitFrame).toBeGreaterThanOrEqual(13);
      expect(hitFrame).toBeLessThanOrEqual(16);
      const e = game.hitLog.at(-1);
      expect(e?.targetId).toBe('dummy-a');
      expect(e?.attackId).toBe('light1');
      expect(e?.baseDamage).toBe(attackDamage(PLAYER_STATS.attackPower, 1.0));
      expect(e?.baseDamage).toBe(40);
    });

    it('3 段それぞれが 1 回ずつ命中する（40 / 42 / 52）', () => {
      faceDummy();
      const before = game.hitCount;
      press();
      pressAt(19, 1);
      run(2);
      pressAt(17, 1);
      run(2);
      run(60);
      expect(game.hitCount).toBe(before + 3);
      const log = game.hitLog.slice(-3);
      expect(log.map((e) => e.attackId)).toEqual(['light1', 'light2', 'light3']);
      expect(log.map((e) => e.baseDamage)).toEqual([40, 42, 52]);
      expect(log.map((e) => e.poiseDamage)).toEqual([20, 20, 35]);
    });

    it('背後のダミーには当たらない', () => {
      game.teleportPlayer(0, -4.5, 0); // 南向き（ダミーは背後）
      run(3);
      const before = game.hitCount;
      press();
      run(40);
      expect(game.hitCount).toBe(before);
    });
  });
});

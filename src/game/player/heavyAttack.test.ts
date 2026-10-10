import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  HEAVY_CHARGE_MOVE_SPEED,
  PLAYER_ACTIONS,
  PLAYER_STATS,
  POISE,
  attackDamage,
  totalFrames,
} from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';

const DT = 1 / 60;
/** スーパーアーマーの強靭度加算（2.3 節: +40）。 */
const ARMOR_BONUS = PLAYER_ACTIONS.heavy.superArmor.poiseBonus;

/**
 * 強攻撃（溜め・スーパーアーマー）と走り攻撃（#52）の結合テスト。窓・溜めの境界値・スタミナ・フレーム一致を、
 * 物理を含む Game で 1 ステップずつ検証する。
 *
 * 表記: 「F n」は動作に入ってから n 番目のステップ。入力と同じステップが F1。
 * 溜めは `heavyCharge` 状態（ボタン保持中）で、離した時点のステップが `heavy` / `heavyCharged` の F1。
 */
describe('heavy attack and run attack', () => {
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
    run(10); // スポーンの落ち着き
  });

  function tick(): void {
    game.update(DT);
    input.endStep();
  }

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) tick();
  }

  const state = (): string => game.player.state;
  const frame = (): number => game.player.stateFrame;

  /** 強攻撃ボタンを押して離す（同じステップ内の短押し）。溜めなしの強攻撃が F1 から始まる。 */
  function tapHeavy(): void {
    input.press('heavyAttack');
    input.release('heavyAttack');
    tick();
  }

  /**
   * 強攻撃ボタンを `held` ステップ保持して離す。押したステップが溜めの F1（保持 1 ステップ目）、
   * 離したステップ（保持を数えない）が `heavy` / `heavyCharged` の F1。
   */
  function chargeAndRelease(held: number): void {
    input.press('heavyAttack');
    tick();
    run(held - 1);
    expect(state()).toBe('heavyCharge');
    expect(frame()).toBe(held);
    input.release('heavyAttack');
    tick();
  }

  function pressLight(): void {
    input.press('lightAttack');
    tick();
  }

  /** 軽攻撃を 1 → ... → `n` 段目の F1 まで出す（各段の窓の最初のフレームで次段を入力）。 */
  function goLight(n: 1 | 2 | 3): void {
    pressLight(); // 軽 1 の F1
    if (n === 1) return;
    run(18); // F19
    pressLight(); // F20: 窓が開いた最初のフレーム → 軽 2 の F1
    if (n === 2) return;
    run(16); // F17
    pressLight(); // F18 → 軽 3 の F1
  }

  /** ステップごとの状態の記録。 */
  function record(frames: number): { state: string; frame: number; hit: boolean }[] {
    const out: { state: string; frame: number; hit: boolean }[] = [];
    for (let i = 0; i < frames; i++) {
      tick();
      out.push({
        state: state(),
        frame: frame(),
        hit: game.player.attack?.hitActive ?? false,
      });
    }
    return out;
  }

  describe('データ（2.3 節）', () => {
    it('強攻撃の全体フレームは 66（溜めなし）/ 66 + 溜め 30（フル溜め）', () => {
      expect(totalFrames(PLAYER_ACTIONS.heavy)).toBe(66);
      expect(totalFrames(PLAYER_ACTIONS.heavyCharged)).toBe(66);
      expect(PLAYER_ACTIONS.heavyCharged.chargeFrames).toBe(30);
      expect(totalFrames(PLAYER_ACTIONS.runAttack)).toBe(49);
    });
  });

  describe('強攻撃（溜めなし）のフレーム単位の一致（発生 22・持続 6・硬直 38・全体 66）', () => {
    it('短押しは入力と同じステップで F1。当たり窓は F23–F28、F66 まで行動不能、F67 で戻る', () => {
      tapHeavy();
      expect(state()).toBe('heavy');
      expect(frame()).toBe(1);
      expect(game.player.isActionable).toBe(false);

      const states = record(70); // F2 以降
      for (let f = 2; f <= 66; f++) {
        const s = states[f - 2];
        expect(s?.state, `F${f}`).toBe('heavy');
        expect(s?.frame, `F${f}`).toBe(f);
        expect(s?.hit, `F${f} hit`).toBe(f >= 23 && f <= 28);
      }
      expect(states[66 - 2 + 1]?.state).toBe('idle'); // F67
    });

    it('スタミナは溜め開始（入力）時に 28 を消費する', () => {
      const before = game.player.stamina.current;
      tapHeavy();
      expect(game.player.stamina.current).toBeCloseTo(before - 28, 5);
    });

    it('スタミナ 0 では開始できない。残量が少しでもあれば開始でき、0 へクランプされる', () => {
      game.player.stamina.current = 0;
      tapHeavy();
      expect(state()).not.toBe('heavy');
      expect(state()).not.toBe('heavyCharge');
      resetStamina(5);
      tapHeavy();
      expect(state()).toBe('heavy');
      expect(game.player.stamina.current).toBe(0);
    });

    function resetStamina(v: number): void {
      game.player.stamina.current = v;
      input.clearBuffer();
    }

    it('前方へ 0.8m 進み、硬直中は止まる', () => {
      const start = { x: game.player.feet.x, z: game.player.feet.z };
      const fwdZ = Math.cos(game.player.yaw);
      tapHeavy();
      run(66);
      const moved = (game.player.feet.z - start.z) * fwdZ;
      expect(moved).toBeGreaterThan(0.75);
      expect(moved).toBeLessThan(0.85);
    });
  });

  describe('溜め（30F で最大）', () => {
    it('溜め 29F で離すと溜めなし（heavy）、30F で離すとフル溜め（heavyCharged）', () => {
      chargeAndRelease(29);
      expect(state()).toBe('heavy');
      expect(frame()).toBe(1);
    });

    it('30F 保持して離すとフル溜め', () => {
      chargeAndRelease(30);
      expect(state()).toBe('heavyCharged');
      expect(frame()).toBe(1);
    });

    it('長く保持しても溜めは 30F で最大のまま（フル溜め）', () => {
      chargeAndRelease(75);
      expect(state()).toBe('heavyCharged');
    });

    it('溜めのあいだはボタンを保持している限り溜めの状態にとどまる', () => {
      input.press('heavyAttack');
      tick();
      for (let f = 2; f <= 45; f++) {
        tick();
        expect(state(), `F${f}`).toBe('heavyCharge');
        expect(game.player.chargeFrames).toBe(f);
      }
    });

    it('フル溜めは入力から 30F の溜め + 全体 66F（発生 22・持続 6・硬直 38）', () => {
      chargeAndRelease(30);
      expect(state()).toBe('heavyCharged');
      const states = record(70); // F2 以降
      for (let f = 2; f <= 66; f++) {
        const s = states[f - 2];
        expect(s?.state, `F${f}`).toBe('heavyCharged');
        expect(s?.frame, `F${f}`).toBe(f);
        expect(s?.hit, `F${f} hit`).toBe(f >= 23 && f <= 28);
      }
      expect(states[66 - 2 + 1]?.state).toBe('idle');
    });

    it('溜め中の歩き速度は 1.0 m/s（入力が強くても超えない）', () => {
      input.setMove(0, 1);
      input.press('heavyAttack');
      tick();
      run(25);
      expect(state()).toBe('heavyCharge');
      expect(game.player.speed).toBeCloseTo(HEAVY_CHARGE_MOVE_SPEED, 2);
      run(5);
      expect(game.player.speed).toBeLessThanOrEqual(HEAVY_CHARGE_MOVE_SPEED + 1e-6);
    });

    it('スタミナ: 溜め開始時に 28、フル溜め（30F）に達した時点で差分 6（計 34）', () => {
      const before = game.player.stamina.current;
      input.press('heavyAttack');
      tick(); // F1
      expect(game.player.stamina.current).toBeCloseTo(before - 28, 5);
      run(28); // F29: まだフル溜めではない
      expect(game.player.stamina.current).toBeCloseTo(before - 28, 1);
      tick(); // F30: フル溜めに達する
      expect(game.player.stamina.current).toBeLessThan(before - 33.9);
      expect(game.player.stamina.current).toBeGreaterThan(before - 34.5);
    });

    it('溜め 29F で離した場合の消費は 28 のまま', () => {
      const before = game.player.stamina.current;
      chargeAndRelease(29);
      expect(game.player.stamina.current).toBeCloseTo(before - 28, 1);
    });

    it('溜め 30F で離した場合の消費は 34', () => {
      const before = game.player.stamina.current;
      chargeAndRelease(30);
      expect(game.player.stamina.current).toBeLessThan(before - 33.9);
      expect(game.player.stamina.current).toBeGreaterThan(before - 34.5);
    });

    it('溜め中はロールで抜けられる（スタミナは消費済み）', () => {
      input.press('heavyAttack');
      tick();
      run(5);
      input.press('dodge');
      tick();
      expect(state()).toBe('backstep'); // 移動入力なし
    });
  });

  describe('スーパーアーマー（発生 F6 〜 持続終了 F28 で強靭度 +40）', () => {
    function poiseBonus(): number {
      return game.player.reactor.poise.bonus;
    }

    it('F5 までは加算なし、F6 から F28 まで +40、F29 で解除', () => {
      tapHeavy(); // F1
      for (let f = 2; f <= 30; f++) {
        tick();
        const expected = f >= 6 && f <= 28 ? ARMOR_BONUS : 0;
        expect(poiseBonus(), `F${f}`).toBe(expected);
      }
    });

    it('F5 の被弾は通常どおり仰け反る（60 削りは強靭度 40 を超える → 崩れて転倒）', () => {
      tapHeavy();
      run(4); // F5
      expect(frame()).toBe(5);
      game.debugHitPlayer({ from: 'front', poiseDamage: 60, damage: 10 });
      expect(state()).toBe('knockdown');
    });

    it('F5 の軽い被弾（20）は強靭度が足りていて崩れないが、仰け反る', () => {
      tapHeavy();
      run(4); // F5
      game.debugHitPlayer({ from: 'front', poiseDamage: 20, damage: 10 });
      expect(state()).toBe('flinch');
    });

    it('F6 の被弾は強靭度 +40 が先に削られ、崩れず動作を続ける', () => {
      tapHeavy();
      run(5); // F6
      expect(frame()).toBe(6);
      expect(poiseBonus()).toBe(ARMOR_BONUS);
      game.debugHitPlayer({ from: 'front', poiseDamage: 60, damage: 10 });
      expect(state()).toBe('heavy');
      expect(game.player.reactor.poise.current).toBe(POISE.player.max - 20);
      run(1);
      expect(state()).toBe('heavy');
    });

    it('F28（持続終了）まで有効。F29 の被弾は通常どおり仰け反る', () => {
      tapHeavy();
      run(27); // F28
      expect(frame()).toBe(28);
      game.debugHitPlayer({ from: 'front', poiseDamage: 20, damage: 10 });
      expect(state()).toBe('heavy');

      // 新しく: F29
      game.respawn();
      run(10);
      tapHeavy();
      run(28); // F29
      expect(frame()).toBe(29);
      expect(poiseBonus()).toBe(0);
      game.debugHitPlayer({ from: 'front', poiseDamage: 20, damage: 10 });
      expect(state()).toBe('flinch');
    });

    it('加算 +40 を超える連続被弾（60 + 60）では崩れる', () => {
      tapHeavy();
      run(5); // F6
      game.debugHitPlayer({ from: 'front', poiseDamage: 60, damage: 10 });
      expect(state()).toBe('heavy');
      // 被弾後無敵（18F）とヒットストップが明けるまで進める（窓 F28 の内側）
      for (let i = 0; i < 60 && game.player.invulnerable; i++) tick();
      expect(state()).toBe('heavy');
      expect(frame()).toBeLessThanOrEqual(28);
      game.debugHitPlayer({ from: 'front', poiseDamage: 60, damage: 10 });
      expect(state()).toBe('knockdown');
      run(1);
      expect(poiseBonus()).toBe(0);
    });

    it('フル溜めも同じ窓（F6–F28）でスーパーアーマーを持つ。溜め中は持たない', () => {
      input.press('heavyAttack');
      tick();
      run(35);
      expect(state()).toBe('heavyCharge');
      expect(poiseBonus()).toBe(0); // 溜め中
      input.release('heavyAttack');
      tick(); // heavyCharged F1
      expect(state()).toBe('heavyCharged');
      for (let f = 2; f <= 30; f++) {
        tick();
        expect(poiseBonus(), `F${f}`).toBe(f >= 6 && f <= 28 ? ARMOR_BONUS : 0);
      }
    });

    it('動作が終わったら（硬直明け）加算は残らない', () => {
      tapHeavy();
      run(70);
      expect(state()).toBe('idle');
      expect(poiseBonus()).toBe(0);
    });
  });

  describe('ロールへのキャンセル（F44 = 持続終了 + 16F から）', () => {
    it('F43 の入力は先行入力で F44 に繋がる。F43 まではキャンセルできない', () => {
      tapHeavy(); // F1
      run(41); // F42
      input.press('dodge');
      tick(); // F43
      expect(state()).toBe('heavy');
      expect(frame()).toBe(43);
      tick(); // F44
      expect(state()).toBe('backstep');
      expect(frame()).toBe(1);
    });

    it('発生・持続・硬直の前半（F1–F43）はキャンセルできない', () => {
      tapHeavy();
      for (let f = 2; f <= 43; f++) {
        input.press('dodge');
        tick();
        expect(state(), `F${f}`).toBe('heavy');
      }
    });

    it('移動入力があればロールへ（フル溜めも F44 から）', () => {
      chargeAndRelease(30);
      run(42); // F43
      expect(frame()).toBe(43);
      input.setMove(0, 1);
      input.press('dodge');
      tick(); // F44
      expect(state()).toBe('roll');
    });
  });

  describe('軽攻撃の窓から強攻撃へ', () => {
    it('軽 1 → 強: 窓が開く F20 で強攻撃（溜めなし）へ。F19 までは軽 1 のまま', () => {
      pressLight();
      run(17); // F18
      input.press('heavyAttack');
      input.release('heavyAttack');
      tick(); // F19
      expect(state()).toBe('light1');
      tick(); // F20
      expect(state()).toBe('heavy');
      expect(frame()).toBe(1);
    });

    it('軽 2 → 強: 窓は F18 から', () => {
      goLight(2);
      expect(state()).toBe('light2');
      run(15); // F16
      input.press('heavyAttack');
      input.release('heavyAttack');
      tick(); // F17
      expect(state()).toBe('light2');
      tick(); // F18
      expect(state()).toBe('heavy');
    });

    it('軽 3 → 強: 窓は F26 から（コンボ終点の後も可）', () => {
      goLight(3);
      expect(state()).toBe('light3');
      run(23); // F24
      input.press('heavyAttack');
      input.release('heavyAttack');
      tick(); // F25
      expect(state()).toBe('light3');
      tick(); // F26
      expect(state()).toBe('heavy');
    });

    it('軽攻撃から溜めへも移れる（保持したままフル溜めになる）', () => {
      pressLight();
      run(18); // F19
      input.press('heavyAttack');
      tick(); // F20: 溜め開始
      expect(state()).toBe('heavyCharge');
      run(30);
      input.release('heavyAttack');
      tick();
      expect(state()).toBe('heavyCharged');
    });

    it('強攻撃の後は軽攻撃 1 へ（コンボは続かない）', () => {
      tapHeavy();
      run(66);
      expect(state()).toBe('idle');
      pressLight();
      expect(state()).toBe('light1');
    });

    it('強攻撃の硬直中に入れた軽攻撃は先行入力で硬直明けに軽 1 になる', () => {
      tapHeavy();
      run(60); // F61
      pressLight(); // F62 の入力（先行入力 10F。F67 まで保持）
      run(4);
      expect(state()).toBe('heavy');
      run(1);
      expect(state()).toBe('light1');
    });
  });

  describe('走り攻撃（ダッシュまたは走り中に攻撃入力）', () => {
    it('ダッシュ中の攻撃入力は走り攻撃（発生 14・持続 5・硬直 30・全体 49）', () => {
      input.setMove(0, 1);
      input.setSprint(true);
      run(20);
      expect(state()).toBe('dash');
      const before = game.player.stamina.current;
      pressLight();
      expect(state()).toBe('runAttack');
      expect(frame()).toBe(1);
      expect(before - game.player.stamina.current).toBeGreaterThan(19.9);

      input.setSprint(false);
      input.setMove(0, 0);
      const states = record(52);
      for (let f = 2; f <= 49; f++) {
        const s = states[f - 2];
        expect(s?.state, `F${f}`).toBe('runAttack');
        expect(s?.hit, `F${f} hit`).toBe(f >= 15 && f <= 19);
      }
      expect(states[49 - 2 + 1]?.state).not.toBe('runAttack'); // F50
    });

    it('走り（走り最高速の 75% 以上）での攻撃入力も走り攻撃', () => {
      input.setMove(0, 1);
      run(20);
      expect(state()).toBe('move');
      expect(game.player.speed).toBeGreaterThan(tuning.player.run * 0.75);
      pressLight();
      expect(state()).toBe('runAttack');
    });

    it('歩き・立ち止まりでの攻撃入力は通常の軽攻撃 1', () => {
      pressLight();
      expect(state()).toBe('light1');
    });

    it('歩き（弱いスティック入力）での攻撃入力は軽攻撃 1', () => {
      input.setMove(0, 0.3);
      run(20);
      expect(game.player.speed).toBeLessThan(tuning.player.run * 0.75);
      pressLight();
      expect(state()).toBe('light1');
    });

    it('スタミナを動作開始時に 20 消費する', () => {
      input.setMove(0, 1);
      input.setSprint(true);
      run(20);
      game.player.stamina.current = 100;
      pressLight();
      expect(state()).toBe('runAttack');
      expect(game.player.stamina.current).toBeCloseTo(80, 0);
    });

    it('前方へ 2.0m 進む', () => {
      input.setMove(0, 1);
      input.setSprint(true);
      run(20);
      input.setMove(0, 0);
      input.setSprint(false);
      const fwd = { x: Math.sin(game.player.yaw), z: Math.cos(game.player.yaw) };
      const start = { x: game.player.feet.x, z: game.player.feet.z };
      pressLight();
      run(49);
      const moved = (game.player.feet.x - start.x) * fwd.x + (game.player.feet.z - start.z) * fwd.z;
      // 走りの慣性（停止 6F）が前の移動分として少し乗る
      expect(moved).toBeGreaterThan(1.9);
      expect(moved).toBeLessThan(2.6);
    });

    it('走り攻撃の後に軽攻撃 1 から始まる（走り攻撃からコンボは続かない）', () => {
      input.setMove(0, 1);
      input.setSprint(true);
      run(20);
      pressLight();
      expect(state()).toBe('runAttack');
      input.setSprint(false);
      input.setMove(0, 0);
      run(60);
      expect(state()).toBe('idle');
      pressLight();
      expect(state()).toBe('light1');
    });
  });

  describe('命中（ダミー）', () => {
    function faceDummy(): void {
      // dummy-a (0, -6) の 1.5m 手前で北向き
      game.teleportPlayer(0, -4.5, Math.PI);
      run(3);
    }

    it('強攻撃（溜めなし）は当たり窓の間に 1 回だけ命中し、72 ダメージ・強靭度削り 60', () => {
      faceDummy();
      const before = game.hitCount;
      tapHeavy();
      let hitFrame = 0;
      for (let f = 2; f <= 70; f++) {
        tick();
        if (!hitFrame && game.hitCount > before) hitFrame = f;
      }
      expect(game.hitCount).toBe(before + 1);
      expect(hitFrame).toBeGreaterThanOrEqual(23);
      expect(hitFrame).toBeLessThanOrEqual(28);
      const e = game.hitLog.at(-1);
      expect(e?.targetId).toBe('dummy-a');
      expect(e?.attackId).toBe('heavy');
      expect(e?.baseDamage).toBe(attackDamage(PLAYER_STATS.attackPower, 1.8));
      expect(e?.baseDamage).toBe(72);
      expect(e?.poiseDamage).toBe(60);
    });

    it('フル溜めは 92 ダメージ・強靭度削り 80', () => {
      faceDummy();
      const before = game.hitCount;
      chargeAndRelease(30);
      run(70);
      expect(game.hitCount).toBe(before + 1);
      const e = game.hitLog.at(-1);
      expect(e?.attackId).toBe('heavyCharged');
      expect(e?.baseDamage).toBe(92);
      expect(e?.poiseDamage).toBe(80);
    });

    it('走り攻撃は 48 ダメージ・強靭度削り 40 で 1 回だけ命中する', () => {
      game.teleportPlayer(0, -2.0, Math.PI);
      run(3);
      const before = game.hitCount;
      input.setMove(0, 1);
      input.setSprint(true);
      run(18);
      pressLight();
      expect(state()).toBe('runAttack');
      input.setMove(0, 0);
      input.setSprint(false);
      run(55);
      expect(game.hitCount).toBe(before + 1);
      const e = game.hitLog.at(-1);
      expect(e?.attackId).toBe('runAttack');
      expect(e?.baseDamage).toBe(48);
      expect(e?.poiseDamage).toBe(40);
    });

    it('背後のダミーには当たらない', () => {
      game.teleportPlayer(0, -4.5, 0);
      run(3);
      const before = game.hitCount;
      tapHeavy();
      run(70);
      expect(game.hitCount).toBe(before);
    });
  });
});

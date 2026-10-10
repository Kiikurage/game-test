import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { HitEvent } from '../combat';
import { GUARD, PLAYER_ACTIONS, PLAYER_STATS, POISE, attackDamage, totalFrames } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';

const DT = 1 / 60;

/**
 * ガード（#53）の結合テスト。物理を含む Game で、構え・ジャストガード・角度・削り・ガードブレイク・
 * ガードカウンターを 1 ステップずつ検証する（敵の攻撃は `debugHitPlayer` で本物の命中経路に流す）。
 *
 * 表記: 「F n」は構えに入ってから n 番目のステップ。入力と同じステップが F1。
 */
describe('guard', () => {
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

  const stateName = (): string => game.player.state;

  function tick(): void {
    game.update(DT);
    input.endStep();
  }

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) tick();
  }

  /** ヒットストップ（凍結）が明けるまで進める。 */
  function thaw(): void {
    run(game.player.fsm.freezeRemaining);
  }

  /** ガードボタンを押して 1 ステップ進める（F1）。 */
  function startGuard(): void {
    input.press('guard');
    tick();
  }

  /** 構えの F`frame` のステップまで進める（F1 は startGuard 済みとする）。 */
  function guardUntil(frame: number): void {
    run(frame - game.player.guardFrame);
  }

  function hit(options: Parameters<Game['debugHitPlayer']>[0] = {}): HitEvent {
    const events = game.debugHitPlayer(options);
    expect(events).toHaveLength(1);
    return events[0] as HitEvent;
  }

  describe('構え', () => {
    it('ボタンを押した同じステップで構えに入る（F1）。F6 で構え完了', () => {
      startGuard();
      expect(stateName()).toBe('guard');
      expect(game.player.guardFrame).toBe(1);
      expect(game.player.animation.guard.phase).toBe('raise');
      guardUntil(5);
      expect(game.player.animation.guard.phase).toBe('raise');
      run(1);
      expect(game.player.guardFrame).toBe(6);
      expect(game.player.animation.guard.phase).toBe('hold');
    });

    it('F5 までの被弾はガードできず通常のダメージ、F6 から防げる（構え完了の境界）', () => {
      startGuard();
      guardUntil(5);
      const early = hit({ damage: 30 });
      expect(early.guard).toBe('none');
      expect(early.damage).toBe(30);
      expect(stateName()).toBe('flinch');
    });

    it('F6 の被弾はジャストガード', () => {
      startGuard();
      guardUntil(6);
      expect(hit().guard).toBe('just');
    });

    it('スタミナ 0 では構えを新規に始められない', () => {
      game.player.stamina.current = 0;
      startGuard();
      expect(stateName()).not.toBe('guard');
    });

    it('ボタンを押しっぱなしで行動不能から復帰したら、動作可能になった瞬間に構える', () => {
      input.press('lightAttack');
      tick();
      expect(stateName()).toBe('light1');
      input.hold('guard', true);
      // 軽 1 の全体 36F の後。ガードへのキャンセルは持続終了の 6F 後（F22）から
      run(20);
      expect(stateName()).toBe('light1');
      run(1); // F22
      expect(stateName()).toBe('guard');
    });
  });

  describe('ジャストガードの窓（F6–F15）', () => {
    it.each([
      [6, 'just'],
      [15, 'just'],
      [16, 'guard'],
      [40, 'guard'],
    ] as const)('F%i の被弾は %s', (frame, expected) => {
      startGuard();
      guardUntil(frame);
      expect(hit().guard).toBe(expected);
    });

    it('ジャストガード: スタミナ消費 50%・削り 0・ヒットストップ 8F・スタンなし', () => {
      startGuard();
      guardUntil(10);
      const stamina0 = game.player.stamina.current;
      const hp0 = game.playerTarget.health.current;
      const e = hit({ damage: 30, guardStaminaCost: 20 });
      expect(e.guard).toBe('just');
      expect(e.damage).toBe(0);
      expect(e.guardStaminaCost).toBe(10);
      expect(stamina0 - game.player.stamina.current).toBe(10);
      expect(game.playerTarget.health.current).toBe(hp0);
      expect(game.lastHitStopFrames).toBe(8);
      expect(game.player.guardStunRemaining).toBe(0);
      // 押し戻しなし
      expect(game.player.reactor.sliding).toBe(false);
    });

    it('通常のガード: スタミナは攻撃ごとの値、ヒットストップ 4F、スタン 10F、被弾後無敵なし', () => {
      startGuard();
      guardUntil(20);
      const stamina0 = game.player.stamina.current;
      const e = hit({ damage: 30, guardStaminaCost: 20 });
      expect(e.guard).toBe('guard');
      expect(e.guardStaminaCost).toBe(20);
      expect(stamina0 - game.player.stamina.current).toBe(20);
      expect(game.lastHitStopFrames).toBe(4);
      expect(game.player.guardStunRemaining).toBe(GUARD.stunFrames);
      expect(stateName()).toBe('guard');
      // ガード成功時は被弾後無敵を付与しない: すぐ次の攻撃も防げる
      expect(game.playerTarget.invulnerable).toBe(false);
      thaw();
      run(1);
      expect(hit().guard).toBe('guard');
    });
  });

  describe('正面 120°（±60°）', () => {
    it.each([
      [0, 'guard'],
      [59.9, 'guard'],
      [60, 'guard'],
      [-60, 'guard'],
      [60.5, 'none'],
      [-60.5, 'none'],
      [90, 'none'],
      [-90, 'none'],
      [180, 'none'],
    ] as const)('攻撃者が正面から %f° の方向: %s', (bearingDeg, expected) => {
      startGuard();
      guardUntil(30);
      const e = hit({ bearingDeg, damage: 30 });
      expect(e.guard).toBe(expected);
      if (expected === 'none') expect(e.damage).toBe(30);
      else expect(e.damage).toBe(3);
    });

    it('背面・側面の被弾は仰け反り（通常ダメージ・強靭度削り）', () => {
      startGuard();
      guardUntil(30);
      const e = hit({ from: 'back', damage: 30, poiseDamage: 30 });
      expect(e.guard).toBe('none');
      expect(e.poiseDamage).toBe(30);
      expect(stateName()).toBe('flinch');
    });

    it('向いている方向が基準（プレイヤーの向きを変えると正面が変わる）', () => {
      game.teleportPlayer(0, 0, Math.PI / 2);
      run(3);
      startGuard();
      guardUntil(30);
      expect(hit({ from: 'front' }).guard).toBe('guard');
    });
  });

  describe('削りダメージ（攻撃の 10%、切り捨て、最低 0）', () => {
    it.each([
      [30, 3],
      [29, 2],
      [19, 1],
      [9, 0],
      [0, 0],
      [100, 10],
      [48, 4],
    ])('ダメージ %i のガード: HP が %i 減る', (damage, chip) => {
      startGuard();
      guardUntil(30);
      const hp0 = game.playerTarget.health.current;
      const e = hit({ damage });
      expect(e.guard).toBe('guard');
      expect(hp0 - game.playerTarget.health.current).toBe(chip);
    });

    it('ガード成功時は強靭度を削られない（仰け反らない）', () => {
      startGuard();
      guardUntil(30);
      hit({ poiseDamage: 100 });
      expect(stateName()).toBe('guard');
      expect(game.player.reactor.poise.current).toBe(POISE.player.max);
    });
  });

  describe('ガードブレイク', () => {
    it('ガード中にスタミナが 0 になるとガード崩し（54F 行動不能）。スタミナは 0 のまま回復待機 60F', () => {
      startGuard();
      guardUntil(30);
      game.player.stamina.current = 15;
      const e = hit({ guardStaminaCost: 20 });
      expect(e.guard).toBe('guard');
      expect(game.player.stamina.current).toBe(0);
      expect(stateName()).toBe('guardBreak');
      expect(game.player.guardBreakCount).toBe(1);
      expect(game.player.stamina.regenDelayRemaining).toBe(60);
      thaw();

      // 54F の間は行動不能（入力を受け付けない）
      input.press('dodge');
      input.setMove(1, 0);
      let broken = 0;
      for (let i = 0; i < 80 && stateName() === 'guardBreak'; i++) {
        tick();
        if (stateName() === 'guardBreak') broken++;
      }
      expect(broken).toBe(GUARD.breakFrames);
      expect(stateName()).not.toBe('roll');
    });

    it('スタミナ 0 のまま 60F は回復しない（待機）。61F 目から回復する', () => {
      startGuard();
      guardUntil(30);
      game.player.stamina.current = 5;
      hit({ guardStaminaCost: 20 });
      thaw();
      run(60);
      expect(game.player.stamina.current).toBe(0);
      run(1);
      expect(game.player.stamina.current).toBeGreaterThan(0);
    });

    it('スタミナがちょうど 0 になる消費でも崩れる。残りがあれば崩れない', () => {
      startGuard();
      guardUntil(30);
      game.player.stamina.current = 21;
      hit({ guardStaminaCost: 20 });
      expect(stateName()).toBe('guard');
      expect(game.player.stamina.current).toBe(1);
      thaw();
      run(1);
      hit({ guardStaminaCost: 20 });
      expect(stateName()).toBe('guardBreak');
    });

    it('崩し中の被ダメージは 1.5 倍で、姿勢は崩れたまま（仰け反りで上書きされない）', () => {
      startGuard();
      guardUntil(30);
      game.player.stamina.current = 1;
      hit({ guardStaminaCost: 20 });
      thaw();
      run(5);
      expect(game.playerTarget.staggered).toBe(true);
      const e = hit({ damage: 30, poiseDamage: 20 });
      expect(e.guard).toBe('none');
      expect(e.multiplier).toBe(1.5);
      expect(e.damage).toBe(45);
      expect(stateName()).toBe('guardBreak');
    });

    it('崩しが明けたら通常へ戻る（1.5 倍は終わる）', () => {
      startGuard();
      guardUntil(30);
      game.player.stamina.current = 1;
      hit({ guardStaminaCost: 20 });
      thaw();
      run(GUARD.breakFrames + 1);
      expect(stateName()).toBe('idle');
      expect(game.playerTarget.staggered).toBe(false);
    });

    it('崩しの SE（hit: guardBreak）が出る', () => {
      const kinds: string[] = [];
      game.events.on('hit', (e) => kinds.push(e.kind));
      startGuard();
      guardUntil(30);
      game.player.stamina.current = 1;
      hit({ guardStaminaCost: 20 });
      expect(kinds).toContain('guard');
      expect(kinds).toContain('guardBreak');
    });

    it('ジャストガードでも消費でスタミナが 0 になれば崩れる', () => {
      startGuard();
      guardUntil(8);
      game.player.stamina.current = 10;
      const e = hit({ guardStaminaCost: 20 });
      expect(e.guard).toBe('just');
      expect(stateName()).toBe('guardBreak');
    });
  });

  describe('解除の硬直 8F', () => {
    it('ボタンを離すと 8F の硬直（解除）。硬直中は新しい動作ができない', () => {
      startGuard();
      guardUntil(20);
      input.release('guard');
      tick();
      expect(stateName()).toBe('guardRelease');
      expect(game.player.stateFrame).toBe(1);
      expect(game.player.isActionable).toBe(false);
      // 硬直中のロール入力は受け付けない
      input.press('dodge');
      input.setMove(1, 0);
      run(7); // F2–F8
      expect(stateName()).toBe('guardRelease');
      run(1); // F9: 硬直明け
      expect(['move', 'roll']).toContain(stateName());
    });

    it('硬直中にボタンを押し直すと、構えをやり直さず即ガードへ復帰する（ジャストガード窓は戻らない）', () => {
      startGuard();
      guardUntil(20);
      input.release('guard');
      tick();
      run(2);
      expect(stateName()).toBe('guardRelease');
      input.press('guard');
      tick();
      expect(stateName()).toBe('guard');
      expect(game.player.guardFrame).toBe(GUARD.justWindow.end + 1);
      // すでに構え完了なので即座に防げるが、ジャストガードにはならない
      expect(hit().guard).toBe('guard');
    });

    it('硬直の最終フレーム（F8）の再入力でも復帰できる', () => {
      startGuard();
      guardUntil(20);
      input.release('guard');
      tick();
      run(6); // F7
      input.press('guard');
      tick(); // F8
      expect(stateName()).toBe('guard');
    });

    it('ガード中の通常の攻撃入力は、解除の 8F 後に通常攻撃として出る', () => {
      input.hold('guard', true);
      startGuard();
      guardUntil(20);
      input.press('lightAttack');
      tick();
      expect(stateName()).toBe('guardRelease');
      expect(game.player.stateFrame).toBe(1);
      run(7); // F2–F8
      expect(stateName()).toBe('guardRelease');
      run(1); // F9
      expect(stateName()).toBe('light1');
      expect(game.player.stateFrame).toBe(1);
    });
  });

  describe('ロール・攻撃からのキャンセル', () => {
    it('ガード中からロールへは F1 から即時（同じステップで発動）', () => {
      startGuard();
      input.setMove(1, 0);
      input.press('dodge');
      tick();
      expect(stateName()).toBe('roll');
      expect(game.player.stateFrame).toBe(1);
    });

    it('バックステップ（移動入力なしのロール入力）も即時', () => {
      startGuard();
      guardUntil(3);
      input.press('dodge');
      tick();
      expect(stateName()).toBe('backstep');
    });

    it('軽攻撃からガードへは持続終了の 6F 後（軽 1 なら F22）から', () => {
      input.press('lightAttack');
      tick();
      input.hold('guard', true);
      run(20); // F21
      expect(stateName()).toBe('light1');
      expect(game.player.stateFrame).toBe(21);
      run(1); // F22
      expect(stateName()).toBe('guard');
    });

    it('ロールの F26 からガードへキャンセルできる', () => {
      input.setMove(1, 0);
      input.press('dodge');
      tick();
      input.release('dodge');
      expect(stateName()).toBe('roll');
      input.hold('guard', true);
      run(24); // F25
      expect(stateName()).toBe('roll');
      run(1); // F26
      expect(stateName()).toBe('guard');
    });
  });

  describe('移動', () => {
    function settledSpeed(): number {
      run(40);
      return game.player.speed;
    }

    it('ガード中の移動は 1.8 m/s', () => {
      startGuard();
      input.setMove(0, 1);
      expect(settledSpeed()).toBeCloseTo(1.8, 1);
      expect(stateName()).toBe('guard');
    });

    it('ロックオン中は 1.4 m/s', () => {
      game.teleportPlayer(0, -4.5, Math.PI);
      run(3);
      expect(game.lockOnTo('dummy-a')).toBe(true);
      run(3);
      startGuard();
      input.setMove(1, 0);
      expect(settledSpeed()).toBeCloseTo(1.4, 1);
    });

    it('ダッシュ入力があっても 1.8 m/s を超えない', () => {
      startGuard();
      input.setMove(0, 1);
      input.setSprint(true);
      expect(settledSpeed()).toBeLessThanOrEqual(1.81);
    });

    it('被ガードのスタン中は動けない。スタンが明けるまで解除もできない', () => {
      startGuard();
      guardUntil(30);
      input.setMove(0, 1);
      run(20);
      expect(game.player.speed).toBeGreaterThan(1.5);
      hit();
      thaw();
      input.release('guard');
      run(1);
      expect(stateName()).toBe('guard');
      expect(game.player.guardStunRemaining).toBe(GUARD.stunFrames - 1);
      run(GUARD.stunFrames - 2);
      expect(stateName()).toBe('guard');
      run(1); // スタンの 10 ステップ目（まだ解除できない）
      expect(stateName()).toBe('guard');
      expect(game.player.guardStunRemaining).toBe(0);
      run(1); // スタン明け
      expect(stateName()).toBe('guardRelease');
    });
  });

  describe('スタミナ回復', () => {
    it('ガード中の回復は毎秒 20（通常の半分）', () => {
      startGuard();
      guardUntil(10);
      game.player.stamina.current = 50;
      run(46); // 回復待ちは消費がないので 0。そのまま回復が始まる
      const gained = game.player.stamina.current - 50;
      expect(gained).toBeCloseTo((20 / 60) * 46, 1);
    });
  });

  describe('ガードカウンター（被ガード後 30F 以内に攻撃入力）', () => {
    /** ガードして被弾し、ヒットストップが明けるまで進める。以降、`step()` ごとに被ガードからの経過が 1 進む。 */
    function guardedHit(): void {
      input.hold('guard', true);
      startGuard();
      guardUntil(30);
      hit({ damage: 30, guardStaminaCost: 20 });
      thaw();
    }

    it('被ガードの 30F 目の攻撃入力はガードカウンター（発生 14・持続 5・全体 47・スタミナ 16）', () => {
      guardedHit();
      run(29); // 経過 29
      expect(game.player.guardCounterOpen).toBe(true);
      const stamina0 = game.player.stamina.current;
      input.press('lightAttack');
      tick(); // 経過 30
      expect(stateName()).toBe('guardCounter');
      expect(game.player.stateFrame).toBe(1);
      expect(stamina0 - game.player.stamina.current).toBeCloseTo(
        PLAYER_ACTIONS.guardCounter.staminaCost,
        1,
      );
      expect(totalFrames(PLAYER_ACTIONS.guardCounter)).toBe(47);
    });

    it('31F 目の攻撃入力はカウンターにならない（解除の 8F 後に通常攻撃）', () => {
      guardedHit();
      run(30); // 経過 30
      expect(game.player.guardCounterOpen).toBe(true);
      run(1); // 経過 31
      expect(game.player.guardCounterOpen).toBe(false);
      input.press('lightAttack');
      tick();
      expect(stateName()).toBe('guardRelease');
      run(8);
      expect(stateName()).toBe('light1');
    });

    it('被ガードの直後（経過 1、スタン中）の攻撃入力でもカウンターが出る', () => {
      guardedHit();
      input.press('lightAttack');
      tick();
      expect(stateName()).toBe('guardCounter');
    });

    it('ヒットストップ中の経過は数えない（凍結は窓を進めない）', () => {
      input.hold('guard', true);
      startGuard();
      guardUntil(30);
      hit();
      // 凍結 4F を進めても、経過はまだ 0
      run(4);
      run(29);
      expect(game.player.guardCounterOpen).toBe(true);
    });

    it('当たり窓は F15–F19。1 回だけ命中し、強靭度削り 50・ダメージ 56 が入る', () => {
      // ダミー（亡者兵相当）の正面に立つ
      game.teleportPlayer(0, -4.5, Math.PI);
      run(3);
      input.hold('guard', true);
      startGuard();
      guardUntil(30);
      hit({ damage: 30, guardStaminaCost: 20, bearingDeg: 0 });
      thaw();
      input.press('lightAttack');
      tick();
      expect(stateName()).toBe('guardCounter');
      const hits: HitEvent[] = [];
      const off = game.combat.onHit((e) => {
        if (e.attackerId === 'player') hits.push(e);
      });
      for (let i = 0; i < 40; i++) {
        tick();
        if (game.player.attack === null) break;
      }
      off();
      expect(hits).toHaveLength(1);
      const e = hits[0] as HitEvent;
      expect(e.attackId).toBe('guardCounter');
      expect(e.baseDamage).toBe(attackDamage(PLAYER_STATS.attackPower, 1.4));
      expect(e.baseDamage).toBe(56);
      expect(e.attackPoiseDamage).toBe(50);
      expect(e.targetId).toBe('dummy-a');
    });

    it('全体 47F の後に行動可能。ボタン保持なら構え直す', () => {
      guardedHit();
      input.press('lightAttack');
      tick(); // F1
      run(46); // F47
      expect(stateName()).toBe('guardCounter');
      run(1); // F48
      expect(stateName()).toBe('guard');
    });

    it('ガードカウンターの途中は他の動作にキャンセルできない', () => {
      guardedHit();
      input.press('lightAttack');
      tick();
      input.press('dodge');
      input.setMove(1, 0);
      run(10);
      expect(stateName()).toBe('guardCounter');
    });

    it('スタミナ 0 ではカウンターが出ない', () => {
      guardedHit();
      game.player.stamina.current = 0;
      input.press('lightAttack');
      tick();
      expect(stateName()).not.toBe('guardCounter');
    });
  });

  describe('外部から差し替えられるパラメータ（入力補助 11.2 節・E10-1 向け）', () => {
    it('構え完了とジャストガード窓を差し替えると判定が変わる', () => {
      game.player.guardParams = {
        ...game.player.guardParams,
        raiseFrames: 3,
        justWindow: { start: 3, end: 30 },
      };
      startGuard();
      guardUntil(3);
      expect(hit().guard).toBe('just');
    });

    it('スタン・カウンター窓・崩しの長さも差し替えられる', () => {
      game.player.guardParams = {
        ...game.player.guardParams,
        stunFrames: 4,
        breakFrames: 20,
      };
      startGuard();
      guardUntil(30);
      hit();
      expect(game.player.guardStunRemaining).toBe(4);
      thaw();
      game.player.stamina.current = 1;
      hit({ guardStaminaCost: 20 });
      thaw();
      let broken = 0;
      for (let i = 0; i < 40 && stateName() === 'guardBreak'; i++) {
        tick();
        if (stateName() === 'guardBreak') broken++;
      }
      expect(broken).toBe(20);
    });
  });
});

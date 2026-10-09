import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { GameEventMap } from '../core/gameEvents';
import { capsule, capsuleShape, vec3, type HitEvent } from './combat';
import { KNOCKBACK, POISE } from './data';
import { Game } from './game';
import { FakeInput } from './testing/fakeInput';
import { resetTuning, tuning } from './tuning';
import { DUMMIES } from './world/playground';

const DT = 1 / 60;

/** 被弾リアクションの結合テスト（プレイヤーとダミー。物理を含む）。 */
describe('hit reaction (player + dummy)', () => {
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
    run(10);
  });

  /** 型の絞り込みに邪魔されず、現在の状態名を読む。 */
  const stateName = (): string => game.player.state;

  /** 命中のヒットストップ（敵の攻撃は 6F）が明けるまで進める。凍結中は反応の窓・押し戻しも進まない。 */
  function thaw(): void {
    run(game.player.fsm.freezeRemaining);
  }

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) {
      game.update(DT);
      input.endStep();
    }
  }

  /** 敵（+z 側にいる）の 1 ヒットを、プレイヤーの胴へ当てる。 */
  function enemyHitsPlayer(poiseDamage: number, damage = 10): HitEvent[] {
    const p = game.player.feet;
    const attack = game.combat.startAttack('enemy-1', 'enemy', {
      id: 'test-swing',
      damage,
      poiseDamage,
    });
    const origin = vec3(p.x, p.y, p.z + 1.5);
    const shape = capsuleShape(
      capsule(vec3(p.x - 0.3, p.y + 1, p.z), vec3(p.x + 0.3, p.y + 1, p.z), 0.1),
      origin,
    );
    const events = game.combat.resolve(attack, shape);
    game.combat.endAttack(attack);
    return events;
  }

  it('軽い被弾: 仰け反り 24F の間行動不能、攻撃側から離れる向きに 0.5m 後退して復帰する', () => {
    const z0 = game.player.feet.z;
    const events = enemyHitsPlayer(30);
    expect(events).toHaveLength(1);
    expect(game.player.state).toBe('flinch');
    thaw();
    // 仰け反り中は入力を受け付けない
    input.setMove(1, 0);
    let flinchSteps = 0;
    for (let i = 0; i < 60 && stateName() === 'flinch'; i++) {
      run(1);
      if (stateName() === 'flinch') flinchSteps++;
    }
    expect(flinchSteps).toBe(KNOCKBACK.player.light.flinchFrames);
    // 攻撃側は +z、プレイヤーは -z へ押される
    const back = z0 - game.player.feet.z;
    expect(back).toBeGreaterThan(0.45);
    expect(back).toBeLessThan(0.55);
    expect(game.player.state).toBe('move');
  });

  it('被弾後無敵: 被弾から 18F は次の命中を受けず、19F 目で当たる（ヒットストップ中は進まない）', () => {
    enemyHitsPlayer(10);
    thaw();
    for (let i = 1; i <= 18; i++) {
      run(1);
      expect(game.playerTarget.invulnerable).toBe(true);
      expect(enemyHitsPlayer(10)).toHaveLength(0);
    }
    run(1);
    expect(game.playerTarget.invulnerable).toBe(false);
    expect(enemyHitsPlayer(10)).toHaveLength(1);
  });

  it('重い被弾（削り 50）: 転倒 48F・1.5m 後退。F36 まで無敵、F37 から被弾後無敵が切れていれば当たる', () => {
    const z0 = game.player.feet.z;
    enemyHitsPlayer(50);
    expect(game.player.state).toBe('knockdown');
    thaw();
    let invulnerableUntil = 0;
    let downSteps = 0;
    for (let i = 0; i < 80 && stateName() === 'knockdown'; i++) {
      run(1);
      if (stateName() !== 'knockdown') break;
      downSteps++;
      if (game.player.invulnerable) invulnerableUntil = game.player.stateFrame;
    }
    expect(downSteps).toBe(KNOCKBACK.player.heavy.downFrames);
    expect(invulnerableUntil).toBe(KNOCKBACK.player.heavy.wakeInvulnUntilFrame);
    const back = z0 - game.player.feet.z;
    expect(back).toBeGreaterThan(1.4);
    expect(back).toBeLessThan(1.6);
  });

  it('転倒中の F37 は無敵が切れて被弾できる（軽い追撃は転倒を中断しない）', () => {
    enemyHitsPlayer(50);
    thaw();
    run(36);
    expect(game.player.state).toBe('knockdown');
    expect(game.player.stateFrame).toBe(36);
    expect(game.player.invulnerable).toBe(true);
    run(1);
    expect(game.player.stateFrame).toBe(37);
    expect(game.player.invulnerable).toBe(false);
    const hpBefore = game.playerTarget.health.current;
    expect(enemyHitsPlayer(10, 20)).toHaveLength(1);
    expect(game.playerTarget.health.current).toBe(hpBefore - 20);
    expect(game.player.state).toBe('knockdown');
  });

  it('hitReaction イベントを命中と同じステップで発行する（回復中断などが購読する）', () => {
    const seen: GameEventMap['hitReaction'][] = [];
    game.events.on('hitReaction', (e) => seen.push(e));
    enemyHitsPlayer(20);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      targetId: 'player',
      kind: 'flinch',
      interruptsAction: true,
      knockback: 0.5,
    });
  });

  it('ロール無敵中の攻撃は反応を起こさない', () => {
    input.setMove(1, 0);
    input.press('dodge');
    run(8);
    expect(game.player.state).toBe('roll');
    expect(game.player.invulnerable).toBe(true);
    expect(enemyHitsPlayer(50)).toHaveLength(0);
    expect(game.player.state).toBe('roll');
  });

  describe('ダミー（亡者兵相当の強靭度 50）', () => {
    const id = DUMMIES[0]?.id ?? '';

    function playerHitsDummy(poiseDamage: number): HitEvent[] {
      const heart = game.combat.allTargets.get(id);
      const box = heart?.heartboxes[0];
      if (!box) throw new Error('dummy not found');
      const attack = game.combat.startAttack('player', 'player', {
        id: 'light',
        damage: 40,
        poiseDamage,
      });
      const shape = capsuleShape(
        capsule(
          vec3(box.a.x - 0.2, box.a.y, box.a.z + 0.3),
          vec3(box.a.x + 0.2, box.a.y, box.a.z + 0.3),
          0.1,
        ),
        vec3(box.a.x, 1, box.a.z + 2),
      );
      const events = game.combat.resolve(attack, shape);
      game.combat.endAttack(attack);
      return events;
    }

    it('軽攻撃（削り 20）3 ヒットで崩れ、崩し中の被ダメージは 1.5 倍になる', () => {
      const reactor = game.reactors.get(id);
      const target = game.combat.allTargets.get(id);
      if (!reactor || !target) throw new Error('dummy reactor not found');
      const kinds: string[] = [];
      game.events.on('hitReaction', (e) => {
        if (e.targetId === id) kinds.push(e.kind);
      });
      for (let i = 0; i < 3; i++) {
        expect(playerHitsDummy(20)).toHaveLength(1);
        run(30);
      }
      expect(kinds).toEqual(['flinch', 'flinch', 'stagger']);
      expect(reactor.staggered).toBe(true);
      expect(target.staggered).toBe(true);
      const hits = playerHitsDummy(20);
      expect(hits[0]?.multiplier).toBe(1.5);
      expect(hits[0]?.damage).toBe(60);
      // 硬直が終わるまで進めると通常倍率に戻る
      run(POISE.hollowSoldier.staggerFrames);
      expect(target.staggered).toBe(false);
      expect(playerHitsDummy(20)[0]?.multiplier).toBe(1);
    });
  });
});

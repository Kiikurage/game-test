import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { GameEventMap } from '../core/gameEvents';
import {
  FreezeCounter,
  UprightTarget,
  capsule,
  capsuleShape,
  uprightHeartbox,
  vec3,
  type GuardOutcome,
  type HitEvent,
} from './combat';
import { Game } from './game';
import { FakeInput } from './testing/fakeInput';
import { resetTuning, tuning } from './tuning';

const DT = 1 / 60;

/** ヒットストップの結合テスト（実際の `Game`: プレイヤー・ダミー・判定・スロー。物理を含む）。 */
describe('hit-stop (Game)', () => {
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

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) {
      game.update(DT);
      input.endStep();
    }
  }

  /** プレイヤーの胴へ当てる。`attackerId` は攻撃側（敵の ID）。 */
  function hitPlayer(attackerId: string, attackId = 'swing', poiseDamage = 20): HitEvent[] {
    const p = game.player.feet;
    const attack = game.combat.startAttack(attackerId, 'enemy', {
      id: attackId,
      damage: 10,
      poiseDamage,
    });
    const shape = capsuleShape(
      capsule(vec3(p.x - 0.3, p.y + 1, p.z), vec3(p.x + 0.3, p.y + 1, p.z), 0.1),
      vec3(p.x, p.y + 1, p.z + 1.5),
    );
    const events = game.combat.resolve(attack, shape);
    game.combat.endAttack(attack);
    return events;
  }

  /** プレイヤー（id = 'player'）の攻撃を、`id` の被弾側のハートボックスへ当てる。 */
  function playerHits(id: string, attackId = 'light1', damage = 40): HitEvent[] {
    const heart = game.combat.allTargets.get(id);
    const box = heart?.heartboxes[0];
    if (!box) throw new Error(`target ${id} not found`);
    const attack = game.combat.startAttack('player', 'player', {
      id: attackId,
      damage,
      poiseDamage: 20,
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

  function addEnemy(id: string, hp = 100): { target: UprightTarget; freeze: FreezeCounter } {
    const target = new UprightTarget(id, 'enemy', hp, [uprightHeartbox(0.35, 1.8)]);
    target.place(game.player.feet.x, game.player.feet.y, game.player.feet.z + 1.5, 0);
    game.combat.addTarget(target);
    const freeze = new FreezeCounter();
    game.registerFreezable(id, freeze);
    return { target, freeze };
  }

  it('敵の攻撃がプレイヤーに命中: 6F、攻撃側の敵とプレイヤーが同時に凍結する。他のキャラクターは凍結しない', () => {
    const enemy = addEnemy('soldier-1');
    const bystander = new FreezeCounter();
    game.registerFreezable('bystander', bystander);
    expect(hitPlayer('soldier-1')).toHaveLength(1);
    expect(game.player.fsm.freezeRemaining).toBe(6);
    expect(enemy.freeze.remaining).toBe(6);
    expect(bystander.remaining).toBe(0);
    expect(game.debugState.combat.lastHitStopFrames).toBe(6);
  });

  it('被弾リアクタ（ダミーの強靭度・崩しの残り）もヒットストップ中は進まない', () => {
    const reactor = game.reactors.get('dummy-a');
    if (!reactor) throw new Error('dummy reactor not found');
    for (let i = 0; i < 3; i++) {
      playerHits('dummy-a', 'light1');
      run(30);
    }
    expect(reactor.staggered).toBe(true);
    const before = reactor.poise.staggerRemaining;
    // 崩し中の追撃（4F 凍結）。凍結の 4 ステップは崩しの残りが減らない
    playerHits('dummy-a', 'light1');
    run(4);
    expect(reactor.poise.staggerRemaining).toBe(before);
    run(1);
    expect(reactor.poise.staggerRemaining).toBe(before - 1);
  });

  it('ボスの攻撃は 8F', () => {
    game.bossIds.add('boss-1');
    const boss = addEnemy('boss-1');
    hitPlayer('boss-1', 'slam');
    expect(game.player.fsm.freezeRemaining).toBe(8);
    expect(boss.freeze.remaining).toBe(8);
  });

  it('プレイヤーの軽攻撃が命中: 攻撃側（プレイヤー）と被弾側の両方が 4F 凍結する', () => {
    const dummy = new FreezeCounter();
    game.registerFreezable('dummy-a', dummy);
    expect(playerHits('dummy-a', 'light1')).toHaveLength(1);
    expect(game.player.fsm.freezeRemaining).toBe(4);
    expect(dummy.remaining).toBe(4);
  });

  it('凍結中、プレイヤーの状態フレーム・無敵などの窓・位置・仮の攻撃のフレームは進まず、他は進み続ける', () => {
    const dummy = new FreezeCounter();
    game.registerFreezable('dummy-a', dummy);
    game.teleportPlayer(0, -4.5, Math.PI);
    run(2);
    game.debugSwing.start();
    // 発生 12F のあと、持続中に命中する
    let guard = 0;
    while (game.hitCount === 0 && guard++ < 60) run(1);
    expect(game.hitCount).toBe(1);
    expect(game.player.fsm.freezeRemaining).toBe(4);
    const frame = game.player.stateFrame;
    const stepsBefore = game.debugState.combat.hitStops;
    // 4F の間は凍結。その間も物理・カメラ・タイムは進む（別のキャラクターの凍結の消費は呼び出し側）
    run(4);
    expect(game.player.stateFrame).toBe(frame);
    expect(game.player.animation.frozen).toBe(true);
    expect(game.player.fsm.freezeRemaining).toBe(0);
    run(1);
    expect(game.player.animation.frozen).toBe(false);
    expect(game.debugState.combat.hitStops).toBe(stepsBefore);
  });

  it('シミュレーション: 軽攻撃が命中すると、攻撃側の動作が +4F 遅れて終わる', () => {
    const swingSteps = (): number => {
      game.debugSwing.start();
      let steps = 0;
      while (game.debugSwing.active && steps < 100) {
        run(1);
        steps++;
      }
      return steps;
    };
    game.teleportPlayer(0, 3.5, Math.PI); // 周囲にダミーはいない
    run(5);
    const miss = swingSteps();
    const hits0 = game.hitCount;
    game.teleportPlayer(0, -4.5, Math.PI); // dummy-a の 1.5m 手前
    run(5);
    const hit = swingSteps();
    expect(game.hitCount).toBe(hits0 + 1);
    expect(hit).toBe(miss + tuning.hitStop.playerLight);
    expect(tuning.hitStop.playerLight).toBe(4);
  });

  it('重ね掛け: 凍結中に再び命中しても、長い方を採用する（足し算にならない）', () => {
    addEnemy('soldier-1');
    addEnemy('soldier-2');
    hitPlayer('soldier-1'); // 6F
    run(2); // 残り 4F
    expect(game.player.fsm.freezeRemaining).toBe(4);
    game.player.hitStop(0);
    // 被弾後無敵を避けるため、別の対象（プレイヤー攻撃）で重ねる
    const dummy = new FreezeCounter();
    game.registerFreezable('dummy-a', dummy);
    playerHits('dummy-a', 'heavy'); // 8F
    expect(game.player.fsm.freezeRemaining).toBe(8);
    playerHits('dummy-b', 'light1'); // 4F（短い方では上書きされない）
    expect(game.player.fsm.freezeRemaining).toBe(8);
  });

  it('ガード成功 4F / ジャストガード 8F。ガードされた攻撃側も凍結する', () => {
    const enemy = addEnemy('soldier-1');
    let outcome: GuardOutcome = 'guard';
    game.playerTarget.guard = () => outcome;
    hitPlayer('soldier-1');
    expect(game.player.fsm.freezeRemaining).toBe(4);
    expect(enemy.freeze.remaining).toBe(4);
    run(10);
    outcome = 'just';
    hitPlayer('soldier-1');
    expect(game.player.fsm.freezeRemaining).toBe(8);
    expect(enemy.freeze.remaining).toBe(8);
  });

  it('ロール成功（無敵中の通過）はヒットストップなし', () => {
    addEnemy('soldier-1');
    input.setMove(1, 0);
    input.press('dodge');
    run(8);
    expect(game.player.invulnerable).toBe(true);
    expect(hitPlayer('soldier-1')).toHaveLength(0);
    expect(game.player.fsm.freezeRemaining).toBe(0);
    expect(game.debugState.combat.hitStops).toBe(0);
  });

  it('撃破: 12F 凍結 + スロー（凍結が明けてから 0.3 倍速で 30F）。死亡確定はヒットストップ前に通知される', () => {
    const weak = addEnemy('weak', 10);
    // 手前のキャラクターを狙う（プレイヤー攻撃の経路で当てる）
    weak.target.place(20, 0, 20, 0);
    const events: HitEvent[] = [];
    game.combat.onHit((e) => events.push(e));
    const out = playerHits('weak', 'light1', 40);
    expect(out[0]?.killed).toBe(true);
    expect(events[0]?.killed).toBe(true);
    expect(game.player.fsm.freezeRemaining).toBe(12);
    expect(weak.freeze.remaining).toBe(12);
    // 凍結の 12 ステップは等速、そのあと 30 ステップだけ 0.3 倍
    const scales: number[] = [];
    for (let i = 0; i < 12 + 30 + 2; i++) {
      scales.push(game.timeScale.current);
      run(1);
    }
    expect(scales.slice(0, 12).every((s) => s === 1)).toBe(true);
    expect(scales.slice(12, 42).every((s) => s === 0.3)).toBe(true);
    expect(scales.slice(42).every((s) => s === 1)).toBe(true);
  });

  it('ボスの撃破は 60F のスロー', () => {
    game.bossIds.add('boss-1');
    const boss = addEnemy('boss-1', 10);
    boss.target.place(20, 0, 20, 0);
    playerHits('boss-1', 'light1', 40);
    let slow = 0;
    for (let i = 0; i < 12 + 60 + 5; i++) {
      run(1);
      if (game.timeScale.current < 1) slow++;
    }
    expect(slow).toBe(60);
  });

  it('hitStop イベント: 命中と同じステップで、演出用の情報（赤フラッシュ・凍結フレーム・向き）を発行する', () => {
    addEnemy('soldier-1');
    const seen: GameEventMap['hitStop'][] = [];
    game.events.on('hitStop', (e) => seen.push(e));
    const hits: GameEventMap['hit'][] = [];
    game.events.on('hit', (e) => hits.push(e));
    hitPlayer('soldier-1');
    expect(seen).toHaveLength(1);
    expect(hits).toHaveLength(1); // SE は凍結と同じステップ（0F 遅延）
    expect(seen[0]).toMatchObject({
      frames: 6,
      toPlayer: true,
      fromPlayer: false,
      flash: 'red',
      flashFrames: 4,
      killed: false,
    });
    const n = seen[0]?.normal;
    expect(Math.hypot(n?.x ?? 0, n?.y ?? 0, n?.z ?? 0)).toBeCloseTo(1, 6);
  });

  it('フル溜め強攻撃の命中でヒットストップ 12F（画面振動は camera/cameraEffects.system.test.ts）', () => {
    playerHits('dummy-a', 'heavyCharged');
    expect(game.player.fsm.freezeRemaining).toBe(12);
  });

  it('tuning.hitStop.enabled = false ならヒットストップも撃破スローも起きない', () => {
    tuning.hitStop.enabled = false;
    const weak = addEnemy('weak', 10);
    weak.target.place(20, 0, 20, 0);
    playerHits('weak', 'light1', 40);
    expect(game.player.fsm.freezeRemaining).toBe(0);
    expect(game.timeScale.active).toBe(false);
  });
});

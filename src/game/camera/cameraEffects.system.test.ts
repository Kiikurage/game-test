import { Quaternion, Vector3 } from 'three/webgpu';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  FreezeCounter,
  UprightTarget,
  capsule,
  capsuleShape,
  uprightHeartbox,
  vec3,
  type GuardOutcome,
  type HitEvent,
} from '../combat';
import { CAMERA_FX } from '../data/cameraEffects';
import { deathOf } from '../death/death.system';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { PHASE_TRANSITION_CLIP } from './cameraClips';
import { cameraEffectsOf, cameraReactionFor, slamAt } from './cameraEffects.system';

const DT = 1 / 60;

function hitEvent(over: Partial<HitEvent> = {}): HitEvent {
  const guard: GuardOutcome = over.guard ?? 'none';
  return {
    attackerId: 'soldier-1',
    targetId: 'player',
    attackId: 'swing',
    attackInstanceId: 1,
    damage: 10,
    baseDamage: 10,
    multiplier: 1,
    poiseDamage: 20,
    attackPoiseDamage: 20,
    attackerPosition: vec3(),
    guard,
    guardStaminaCost: 0,
    position: vec3(0, 1, 1),
    hurtboxIndex: 0,
    targetHp: 100,
    killed: false,
    kind: guard === 'none' ? 'light' : 'guard',
    ...over,
  };
}

describe('cameraReactionFor（3.3 節の演出表）', () => {
  it('プレイヤーの被弾: 軽は hitLight、重い被弾・ボスの攻撃は hitHeavy', () => {
    expect(cameraReactionFor(hitEvent(), false)).toBe('hitLight');
    expect(cameraReactionFor(hitEvent({ kind: 'heavy' }), false)).toBe('hitHeavy');
    expect(cameraReactionFor(hitEvent({ attackerId: 'boss' }), true)).toBe('hitHeavy');
  });

  it('ガード・ジャストガード・ガード崩しでは出さない', () => {
    expect(cameraReactionFor(hitEvent({ guard: 'guard' }), false)).toBeNull();
    expect(cameraReactionFor(hitEvent({ guard: 'just' }), true)).toBeNull();
    expect(cameraReactionFor(hitEvent({ kind: 'guardBreak' }), true)).toBeNull();
  });

  it('プレイヤーが死ぬ命中では出さない（死亡演出は振動なし）', () => {
    expect(cameraReactionFor(hitEvent({ killed: true }), false)).toBeNull();
    expect(cameraReactionFor(hitEvent({ killed: true, kind: 'heavy' }), true)).toBeNull();
  });

  it('プレイヤーの攻撃: 強攻撃（溜めなし・フル溜め）だけ。軽攻撃・その他は出さない', () => {
    const base = { attackerId: 'player', targetId: 'dummy-a' };
    expect(cameraReactionFor(hitEvent({ ...base, attackId: 'heavy' }), false)).toBe(
      'playerHeavyHit',
    );
    expect(cameraReactionFor(hitEvent({ ...base, attackId: 'heavyCharged' }), false)).toBe(
      'playerHeavyHit',
    );
    expect(cameraReactionFor(hitEvent({ ...base, attackId: 'light1' }), false)).toBeNull();
    expect(cameraReactionFor(hitEvent({ ...base, attackId: 'runAttack' }), false)).toBeNull();
  });

  it('敵同士・環境の命中では出さない', () => {
    expect(cameraReactionFor(hitEvent({ targetId: 'soldier-2' }), false)).toBeNull();
  });
});

/** 実際の `Game` での発火（命中と同じステップで始まり、カメラの姿勢が変わる）。 */
describe('camera effects (Game)', () => {
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

  function hitPlayer(attackerId: string, attackId = 'swing', poiseDamage = 20): void {
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
    game.combat.resolve(attack, shape);
    game.combat.endAttack(attack);
  }

  function playerHits(id: string, attackId: string): void {
    const box = game.combat.allTargets.get(id)?.heartboxes[0];
    if (!box) throw new Error(`target ${id} not found`);
    const attack = game.combat.startAttack('player', 'player', {
      id: attackId,
      damage: 5,
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
    game.combat.resolve(attack, shape);
    game.combat.endAttack(attack);
  }

  function addEnemy(id: string): void {
    const target = new UprightTarget(id, 'enemy', 100, [uprightHeartbox(0.35, 1.8)]);
    target.place(game.player.feet.x, game.player.feet.y, game.player.feet.z + 1.5, 0);
    game.combat.addTarget(target);
    game.registerFreezable(id, new FreezeCounter());
  }

  /** 描画に使うカメラの向きと、振動を除いた向き（`forward`）のなす角[度]。 */
  function shakeAngleDeg(): number {
    const q = new Quaternion().copy(game.camera.transform.quaternion);
    const actual = new Vector3(0, 0, -1).applyQuaternion(q);
    return (actual.angleTo(game.camera.forward) * 180) / Math.PI;
  }

  it('被弾（軽）: 命中の次のステップに 0.3° の振動が出て、6F で止まる。カメラの向きが実際に変わる', () => {
    addEnemy('soldier-1');
    expect(shakeAngleDeg()).toBeLessThan(1e-6);
    hitPlayer('soldier-1');
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeCloseTo(0.3, 6);
    expect(shakeAngleDeg()).toBeGreaterThan(0);
    expect(shakeAngleDeg()).toBeLessThanOrEqual(0.3 * Math.SQRT2 + 1e-6);
    run(5);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeGreaterThan(0);
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBe(0);
    expect(shakeAngleDeg()).toBeLessThan(1e-6);
  });

  it('ヒットストップ中も振動は進む（凍結 6F の間に 6F の振動が終わる）', () => {
    addEnemy('soldier-1');
    hitPlayer('soldier-1');
    expect(game.player.fsm.freezeRemaining).toBe(6);
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeCloseTo(0.3, 6);
    run(2);
    // 凍結中も振動は減衰しながら続く（凍結の長さに引きずられない）
    expect(game.player.fsm.freezeRemaining).toBeGreaterThan(0);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeCloseTo(0.3 * (1 - 2 / 6), 6);
    run(4);
    expect(cameraEffectsOf(game).output.shakeDeg).toBe(0);
  });

  it('ボスの攻撃: 0.8°・12F + FOV +2° が 8F で戻る', () => {
    game.bossIds.add('boss-1');
    addEnemy('boss-1');
    const baseFov = game.camera.fovDeg;
    hitPlayer('boss-1', 'slam');
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeCloseTo(0.8, 6);
    expect(game.camera.fovDeg).toBeCloseTo(baseFov + 2, 6);
    run(8);
    expect(game.camera.fovDeg).toBeCloseTo(baseFov, 6);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeGreaterThan(0);
    run(4);
    expect(cameraEffectsOf(game).output.shakeDeg).toBe(0);
  });

  it('プレイヤーの強攻撃ヒットで 0.4°、軽攻撃ヒットでは出ない', () => {
    playerHits('dummy-a', 'light1');
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBe(0);
    playerHits('dummy-a', 'heavy');
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeCloseTo(0.4, 6);
    run(8);
    expect(cameraEffectsOf(game).output.shakeDeg).toBe(0);
    playerHits('dummy-a', 'heavyCharged');
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeCloseTo(0.4, 6);
  });

  it('強度 0%: 命中しても振動も FOV の変化も出ず、姿勢は基準のまま', () => {
    cameraEffectsOf(game).setStrengthSource(() => 0);
    game.bossIds.add('boss-1');
    addEnemy('boss-1');
    const baseFov = game.camera.fovDeg;
    hitPlayer('boss-1', 'slam');
    run(3);
    expect(game.camera.fovDeg).toBeCloseTo(baseFov, 6);
    expect(shakeAngleDeg()).toBeLessThan(1e-6);
  });

  it('クリップの距離・FOV はカメラのアーム長・FOV に反映される（衝突解決の前に足す）', () => {
    const baseFov = game.camera.fovDeg;
    const baseArm = game.camera.armLength;
    cameraEffectsOf(game).playClip({
      id: 'dolly',
      frames: 90,
      ease: 'linear',
      keys: [{ frame: 0, armOffsetM: 1.5, fovOffsetDeg: 6 }],
    });
    run(60);
    expect(game.camera.fovDeg).toBeCloseTo(baseFov + 6, 6);
    expect(game.camera.armLength).toBeGreaterThan(baseArm + 1);
    run(40);
    expect(game.camera.fovDeg).toBeCloseTo(baseFov, 6);
  });

  it('slamAt: プレイヤーとの距離で減衰する', () => {
    const p = game.player.feet;
    slamAt(game, { x: p.x + 3, z: p.z });
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBeCloseTo(CAMERA_FX.slam.shakeDeg, 6);
    run(30);
    slamAt(game, { x: p.x + 40, z: p.z });
    run(1);
    expect(cameraEffectsOf(game).output.shakeDeg).toBe(0);
  });

  it('ロックオン・衝突解決に干渉しない: 振動中も forward / yaw / pitch / armLength は基準のまま', () => {
    const fx = cameraEffectsOf(game);
    run(5);
    const before = { yaw: game.camera.yaw, pitch: game.camera.pitch, arm: game.camera.armLength };
    fx.shake(1.2, 24);
    run(10);
    expect(game.camera.yaw).toBeCloseTo(before.yaw, 9);
    expect(game.camera.pitch).toBeCloseTo(before.pitch, 9);
    expect(game.camera.armLength).toBeCloseTo(before.arm, 6);
  });

  it('死亡中は演出を出さず、再生中のものも止める（FOV 縮小は死亡側）', () => {
    const fx = cameraEffectsOf(game);
    fx.playClip(PHASE_TRANSITION_CLIP);
    fx.hitHeavy();
    game.player.die();
    run(2);
    expect(deathOf(game).active).toBe(true);
    expect(fx.active).toBe(false);
    hitPlayer('soldier-x');
    run(1);
    expect(fx.output.shakeDeg).toBe(0);
  });
});

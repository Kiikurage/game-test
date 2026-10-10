import { beforeAll, describe, expect, it } from 'vitest';
import { capsule, capsuleShape, vec3 } from '../combat';
import { PLAYER_STATS, UNDEAD_SOLDIER_ATTACKS, type UndeadAttackId } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import type { EnemySpawn } from '../world/level';

const DT = 1 / 60;

const SPAWN: EnemySpawn = {
  id: 't-soldier',
  type: 'undead_soldier',
  area: 'A',
  x: 0,
  z: 0,
  yaw: 0,
  behavior: 'wait',
};

/** 敵の攻撃 → プレイヤーの被弾・回避の結合テスト（Rapier・平らな地面）。 */
describe('enemy attacks in the game (Rapier)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup() {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [SPAWN] });
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('enemy not spawned');
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    // 敵の正面 2m（近距離の A1 / A2）に、敵の方を向いて立つ
    game.teleportPlayer(0, 2, Math.PI);
    const runUntilAttack = () => {
      for (let i = 0; i < 1500 && enemy.state !== 'attack'; i++) run(1);
      expect(enemy.state).toBe('attack');
      return enemy.fsm.actionId?.replace('enemy.undead.', '') as UndeadAttackId;
    };
    return { game, input, enemy, run, runUntilAttack };
  }

  it('telegraphs, swings, and the hit damages and staggers the player (attacker freezes for 6F)', async () => {
    const { game, enemy, run, runUntilAttack } = await setup();
    const hp0 = game.playerTarget.health.current;
    const id = runUntilAttack();
    const def = UNDEAD_SOLDIER_ATTACKS[id];
    expect(['a1', 'a2']).toContain(id);

    // 予備動作の間は当たらない。発生の次のフレーム（F(発生+1)）に命中する
    let hitFrame = -1;
    for (let f = 1; f <= def.startup + def.active; f++) {
      const hits = game.hitCount;
      run(1);
      if (game.hitCount > hits && hitFrame < 0) hitFrame = enemy.fsm.stateFrame;
      if (hitFrame >= 0) break;
    }
    expect(hitFrame).toBe(def.startup + 1);
    expect(game.playerTarget.health.current).toBe(hp0 - def.damage);
    expect(game.hitLog.at(-1)?.attackerId).toBe('t-soldier');
    expect(game.hitLog.at(-1)?.targetId).toBe('player');

    // 被弾リアクション（A1: 強靭度削り 25 → 仰け反り / A2: 50 → 転倒）とヒットストップ 6F（攻撃側の敵も凍結）
    expect(game.player.state).toBe(def.poiseDamage >= 50 ? 'knockdown' : 'flinch');
    expect(game.lastHitStopFrames).toBe(6);
    expect(enemy.fsm.freezeRemaining).toBe(6);
    const frame = enemy.fsm.stateFrame;
    run(6);
    expect(enemy.fsm.stateFrame).toBe(frame); // 凍結中は状態フレームも進まない
    run(1);
    expect(enemy.fsm.stateFrame).toBe(frame + 1);

    // 攻撃が終われば Recover へ。同じ攻撃で 2 度は当たらない
    for (let i = 0; i < 200 && enemy.state === 'attack'; i++) run(1);
    expect(enemy.state).not.toBe('attack');
    expect(game.hitLog.filter((e) => e.attackerId === 't-soldier').length).toBeLessThanOrEqual(2);
  });

  it('lets a well-timed roll dodge the attack through its invulnerability frames', async () => {
    const { game, input, enemy, run, runUntilAttack } = await setup();
    const hp0 = game.playerTarget.health.current;
    const id = runUntilAttack();
    const def = UNDEAD_SOLDIER_ATTACKS[id];
    // 発生の 3F 前に右へロール（ロールの無敵 F4–F15 が判定の持続を覆う）
    while (enemy.fsm.stateFrame < def.startup - 3) run(1);
    input.setMove(1, 0);
    input.press('dodge');
    let invulnerableDuringActive = false;
    for (let i = 0; i < def.active + 20; i++) {
      run(1);
      const f = enemy.fsm.stateFrame;
      if (f > def.startup && f <= def.startup + def.active && game.player.invulnerable) {
        invulnerableDuringActive = true;
      }
    }
    expect(game.eventCounts.rollStart).toBe(1);
    expect(invulnerableDuringActive).toBe(true);
    expect(game.playerTarget.health.current).toBe(hp0);
    expect(game.hitLog.filter((e) => e.targetId === 'player')).toHaveLength(0);
    expect(game.player.dead).toBe(false);
  });

  it('is a real threat: standing still through repeated attacks kills the player (HP 0 -> dead state)', async () => {
    const { game, enemy, run } = await setup();
    expect(game.player.dead).toBe(false);
    // 敵が殴り続ける（プレイヤーは立ったまま）。HP 100 は数発で尽きる
    for (let i = 0; i < 6000 && !game.player.dead; i++) {
      run(1);
      // 逃げも反撃もしないが、離れすぎないよう敵の正面 2m に立たせ続ける
      if (enemy.state !== 'attack' && game.player.state === 'idle') {
        game.teleportPlayer(0, 2, Math.PI);
      }
    }
    expect(game.player.dead).toBe(true);
    expect(game.playerTarget.health.current).toBe(0);
    expect(game.player.state).toBe('dead');
    expect(game.debugState.combat.playerDead).toBe(true);
    const x = game.player.feet.x;
    run(60);
    expect(game.player.state).toBe('dead'); // 倒れたまま動かない
    expect(game.player.feet.x).toBeCloseTo(x, 3);
    // リスポーンで HP が戻り、操作可能な状態に戻る
    game.respawn();
    expect(game.player.dead).toBe(false);
    expect(game.playerTarget.health.current).toBe(PLAYER_STATS.hp);
  });

  it('freezes a hit enemy for the hit-stop and applies the knockback to its movement', async () => {
    const { game, enemy, run } = await setup();
    game.teleportPlayer(0, 30, Math.PI); // 気付かれない距離
    const heart = game.combat.allTargets.get(enemy.id);
    const box = heart?.heartboxes[0];
    if (!heart || !box) throw new Error('enemy heartbox not registered');
    const z0 = enemy.position.z;
    const attack = game.combat.startAttack('player', 'player', {
      id: 'x',
      damage: 5,
      poiseDamage: 10,
    });
    // 敵の +z 側から当たる（押し戻しは -z へ）
    const shape = capsuleShape(
      capsule(
        vec3(box.a.x - 0.2, box.a.y, box.a.z + 0.3),
        vec3(box.a.x + 0.2, box.a.y, box.a.z + 0.3),
        0.1,
      ),
      vec3(box.a.x, 1, box.a.z + 2),
    );
    expect(game.combat.resolve(attack, shape)).toHaveLength(1);
    game.combat.endAttack(attack);
    // 敵側のヒットストップ（強攻撃扱いで 8F。敵の凍結口が登録されている）
    expect(enemy.fsm.freezeRemaining).toBeGreaterThan(0);
    const frozen = enemy.fsm.freezeRemaining;
    const frame = enemy.fsm.stateFrame;
    run(frozen);
    expect(enemy.fsm.stateFrame).toBe(frame);
    // 凍結が明けると被弾ノックバック（敵への軽い被弾 0.3m）が敵の移動に足される（Alert の 24F は立ち止まっている）
    run(12);
    expect(z0 - enemy.position.z).toBeGreaterThan(0.25);
    expect(z0 - enemy.position.z).toBeLessThan(0.35);
  });
});

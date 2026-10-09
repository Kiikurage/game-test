import { describe, expect, it } from 'vitest';
import {
  GUARD,
  HEAVY_HIT_POISE_THRESHOLD,
  HIT_STOP,
  KNOCKBACK,
  POISE,
  attackDamage,
  guardChipDamage,
  isHeavyHit,
} from './combat';
import { ENEMY_ATTACK_RULES, checkEnemyAttack } from './enemyAttack';
import { inWindow, windowLength } from './frameWindow';
import { PLAYER_ACTIONS, PLUNGE_UNAWARE_MULTIPLIER } from './playerActions';
import { INPUT_BUFFER_FRAMES, MOVEMENT, PLAYER_STATS, STAMINA } from './playerStats';
import { totalFrames, type EnemyAttackDef } from './types';

describe('ダメージ計算', () => {
  it('基本攻撃力 40 × 倍率を四捨五入（浮動小数の誤差に影響されない）', () => {
    expect(attackDamage(40, 1.0)).toBe(40);
    expect(attackDamage(40, 1.05)).toBe(42);
    expect(attackDamage(40, 1.3)).toBe(52);
    expect(attackDamage(40, 1.8)).toBe(72);
    expect(attackDamage(40, 2.3)).toBe(92);
    expect(attackDamage(40, 4.0)).toBe(160);
    expect(attackDamage(40, PLUNGE_UNAWARE_MULTIPLIER)).toBe(132);
  });

  it('四捨五入の境界（.5 は切り上げ）', () => {
    expect(attackDamage(10, 1.04)).toBe(10); // 10.4
    expect(attackDamage(10, 1.05)).toBe(11); // 10.5
    expect(attackDamage(10, 1.06)).toBe(11); // 10.6
  });

  it('ガード成功時の削りは 10% 切り捨て・最低 0', () => {
    expect(guardChipDamage(45)).toBe(4); // 4.5 → 4
    expect(guardChipDamage(70)).toBe(7);
    expect(guardChipDamage(30)).toBe(3);
    expect(guardChipDamage(65)).toBe(6);
    expect(guardChipDamage(9)).toBe(0); // 0.9 → 0
    expect(guardChipDamage(10)).toBe(1);
    expect(guardChipDamage(0)).toBe(0);
    expect(guardChipDamage(-5)).toBe(0);
  });
});

describe('ガード', () => {
  it('ジャストガードは構え完了 F6 から 10F（F6–F15）', () => {
    expect(GUARD.justWindow).toEqual({ start: GUARD.raiseFrames, end: 15 });
    expect(windowLength(GUARD.justWindow)).toBe(10);
    expect(inWindow(5, GUARD.justWindow)).toBe(false);
    expect(inWindow(6, GUARD.justWindow)).toBe(true);
    expect(inWindow(15, GUARD.justWindow)).toBe(true);
    expect(inWindow(16, GUARD.justWindow)).toBe(false);
  });

  it('主要値', () => {
    expect(GUARD.frontArcDeg).toBe(120);
    expect(GUARD.justStaminaPercent).toBe(50);
    expect(GUARD.breakFrames).toBe(54);
    expect(GUARD.breakDamageMultiplier).toBe(1.5);
    expect(GUARD.stunFrames).toBe(10);
    expect(GUARD.counterWindowFrames).toBe(30);
    expect(GUARD.releaseRecoveryFrames).toBe(8);
  });
});

describe('ヒットストップ（4.1）', () => {
  it('表の値', () => {
    expect(HIT_STOP).toMatchObject({
      playerLight: 4,
      playerHeavy: 8,
      playerHeavyCharged: 12,
      enemyHitsPlayer: 6,
      bossHitsPlayer: 8,
      guardSuccess: 4,
      justGuard: 8,
      kill: 12,
      rollDodge: 0,
    });
  });
});

describe('強靭度（4.3）と被弾（4.4）', () => {
  it('最大強靭度', () => {
    expect(PLAYER_STATS.poise).toBe(POISE.player.max);
    expect([
      POISE.player.max,
      POISE.hollowSoldier.max,
      POISE.shieldbearer.max,
      POISE.boss.max,
    ]).toEqual([40, 50, 80, 400]);
    expect(POISE.recoverFrames).toBe(300);
  });

  it('崩しの硬直', () => {
    expect(POISE.player.staggerLightFrames).toBe(24);
    expect(POISE.player.staggerHeavyFrames).toBe(48);
    expect(POISE.hollowSoldier.staggerFrames).toBe(54);
    expect(POISE.boss.staggerFrames).toBe(120);
  });

  it('重い被弾の閾値は強靭度削り 50 以上（境界 49 / 50）', () => {
    expect(HEAVY_HIT_POISE_THRESHOLD).toBe(50);
    expect(isHeavyHit(49)).toBe(false);
    expect(isHeavyHit(50)).toBe(true);
  });

  it('プレイヤーの強靭度 40 に対し、軽攻撃 2 発（20×2）で崩れる値、スーパーアーマーで +40', () => {
    expect(PLAYER_ACTIONS.light1.poiseDamage * 2).toBeGreaterThanOrEqual(PLAYER_STATS.poise);
    expect(PLAYER_ACTIONS.heavy.superArmor.poiseBonus).toBe(40);
  });

  it('ノックバック・被弾後無敵', () => {
    expect(KNOCKBACK.player.light).toEqual({ distance: 0.5, flinchFrames: 24 });
    expect(KNOCKBACK.player.heavy).toEqual({
      distance: 1.5,
      downFrames: 48,
      wakeInvulnUntilFrame: 36,
    });
    expect(KNOCKBACK.player.guardLight).toBe(0.6);
    expect(KNOCKBACK.player.guardHeavy).toBe(1.2);
    expect(KNOCKBACK.enemy).toEqual({ light: 0.3, heavy: 0.8, staggerBreak: 0.8 });
    expect(KNOCKBACK.postHitInvulnFrames).toBe(18);
  });
});

describe('プレイヤーのステータス・スタミナ・移動', () => {
  it('ステータス（2.1 節）', () => {
    expect(PLAYER_STATS.hp).toBe(300);
    expect(PLAYER_STATS.stamina).toBe(100);
    expect(PLAYER_STATS.attackPower).toBe(40);
    expect(PLAYER_STATS.flask).toEqual({ initial: 3, max: 4 });
  });

  it('スタミナ回復: 毎秒 40 = 0.667/F、待ち 45F（0 になると 60F）', () => {
    expect(STAMINA.regenDelayFrames).toBe(45);
    expect(STAMINA.depletedDelayFrames).toBe(60);
    expect(STAMINA.regenPerSecond / 60).toBeCloseTo(0.667, 3);
    expect(STAMINA.guardRegenPerSecond).toBe(20);
  });

  it('移動速度（2.2 節）', () => {
    expect([MOVEMENT.walk, MOVEMENT.run, MOVEMENT.dash]).toEqual([1.8, 4.5, 6.5]);
    expect(MOVEMENT.lockOn).toEqual({ side: 3.8, back: 2.6, dash: 5.5 });
    expect(MOVEMENT.guardLockOn).toBe(1.4);
    expect(INPUT_BUFFER_FRAMES).toEqual({ attack: 10, roll: 8, heal: 6 });
  });
});

describe('敵の攻撃定義スキーマ', () => {
  // 仕様書 5.2 節 A1（亡者兵 横斬り）を例に、スキーマで書けることを確認する
  const a1: EnemyAttackDef = {
    id: 'hollow.a1',
    startup: 24,
    active: 5,
    recovery: 28,
    damage: 45,
    poiseDamage: 25,
    guardStaminaCost: 22,
    moveDistance: 0,
    arcDeg: 100,
    range: 1.8,
  };

  it('全体フレームを派生値で算出できる', () => {
    expect(totalFrames(a1)).toBe(57);
  });

  it('テレグラフ基準（境界: 通常 24F / 強 34F / 持続 4F）', () => {
    expect(checkEnemyAttack(a1)).toEqual([]);
    expect(checkEnemyAttack({ ...a1, startup: 23 })).toHaveLength(1);
    expect(checkEnemyAttack({ ...a1, active: 4 })).toEqual([]);
    expect(checkEnemyAttack({ ...a1, active: 3 })).toHaveLength(1);
    const heavy = { ...a1, heavy: true, startup: 34 };
    expect(checkEnemyAttack(heavy)).toEqual([]);
    expect(checkEnemyAttack({ ...heavy, startup: 33 })).toHaveLength(1);
    expect(ENEMY_ATTACK_RULES.minStartup).toBe(24);
  });
});

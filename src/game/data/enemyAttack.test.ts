import { describe, expect, it } from 'vitest';
import { undeadClipEvents } from '../anim/enemyClips';
import { markersOfType } from '../anim/eventMarkers';
import {
  ENEMY_ATTACK_RULES,
  UNDEAD_ATTACK_RULES,
  UNDEAD_SOLDIER_ATTACKS,
  checkEnemyAttack,
  dodgeWindow,
  trackEndFrame,
} from './enemyAttack';
import { totalFrames, type EnemyAttackDef } from './types';

const base: EnemyAttackDef = {
  id: 'test',
  startup: 30,
  active: 6,
  recovery: 30,
  damage: 10,
  poiseDamage: 10,
  guardStaminaCost: 10,
  moveDistance: 0,
  arcDeg: 90,
  range: 1.5,
};

describe('テレグラフ品質の検証（5.1 節）', () => {
  it('通常攻撃は予備動作 24F 以上（23F は違反）', () => {
    expect(checkEnemyAttack({ ...base, startup: 24 })).toEqual([]);
    expect(checkEnemyAttack({ ...base, startup: 23 })).toHaveLength(1);
  });

  it('強い攻撃は予備動作 34F 以上（33F は違反）', () => {
    expect(checkEnemyAttack({ ...base, heavy: true, startup: 34 })).toEqual([]);
    expect(checkEnemyAttack({ ...base, heavy: true, startup: 33 })).toHaveLength(1);
  });

  it('持続は 4F 以上（3F は違反）', () => {
    expect(checkEnemyAttack({ ...base, active: 4 })).toEqual([]);
    expect(checkEnemyAttack({ ...base, active: 3 })).toHaveLength(1);
  });

  it('反応から回避完了までの猶予（予備動作 + 持続）は 26F 以上', () => {
    expect(ENEMY_ATTACK_RULES.minDodgeWindow).toBe(26);
    expect(dodgeWindow(base)).toBe(36);
    const problems = checkEnemyAttack({ ...base, startup: 22, active: 3 });
    expect(problems.some((p) => p.includes('回避の猶予'))).toBe(true);
    // 下限同士（24 + 4 = 28）なら猶予は足りている
    expect(dodgeWindow({ ...base, startup: 24, active: 4 })).toBeGreaterThanOrEqual(26);
  });

  it('連続攻撃の 2 発目（followUp）は 20F まで許し、それ未満は違反', () => {
    expect(checkEnemyAttack({ ...base, followUp: true, startup: 20 })).toEqual([]);
    expect(checkEnemyAttack({ ...base, followUp: true, startup: 19 })).toHaveLength(1);
    // 連続でない攻撃には適用されない
    expect(checkEnemyAttack({ ...base, startup: 20 })).toHaveLength(1);
  });

  it('向きの追尾は発生の 60% までを超えられない', () => {
    expect(trackEndFrame(base)).toBe(18);
    expect(checkEnemyAttack({ ...base, trackEndFrame: 18 })).toEqual([]);
    expect(checkEnemyAttack({ ...base, trackEndFrame: 19 })).toHaveLength(1);
  });

  it('複数の違反はすべて列挙される', () => {
    const problems = checkEnemyAttack({ ...base, startup: 10, active: 2 });
    expect(problems.length).toBeGreaterThanOrEqual(3);
  });
});

describe('亡者兵の攻撃定義（5.2 節）', () => {
  it('すべて基準を満たす', () => {
    for (const def of Object.values(UNDEAD_SOLDIER_ATTACKS)) {
      expect(checkEnemyAttack(def), def.id).toEqual([]);
    }
  });

  it('仕様書の表の数値と一致する', () => {
    const { a1, a1b, a2, a3 } = UNDEAD_SOLDIER_ATTACKS;
    const row = (d: EnemyAttackDef) => [
      d.startup,
      d.active,
      d.recovery,
      d.damage,
      d.poiseDamage,
      d.guardStaminaCost,
      d.arcDeg,
      d.range,
    ];
    expect(row(a1)).toEqual([24, 5, 28, 45, 25, 22, 100, 1.8]);
    expect(row(a2)).toEqual([34, 6, 36, 70, 50, 35, 60, 2.0]);
    expect(row(a3).slice(0, 7)).toEqual([28, 8, 34, 55, 30, 28, 30]);
    expect(a3.moveDistance).toBe(2.5);
    // A1 の連続: 発生 20F、ダメージ 45
    expect(a1b.startup).toBe(20);
    expect(a1b.damage).toBe(45);
    expect(totalFrames(a1)).toBe(57);
  });

  it('A2（大振り）は強い攻撃として 34F、A3 は突進（移動しながら）', () => {
    expect(UNDEAD_SOLDIER_ATTACKS.a2.heavy).toBe(true);
    expect(UNDEAD_SOLDIER_ATTACKS.a3.moveDistance).toBeGreaterThan(0);
  });

  it('選択ルールの数値', () => {
    expect(UNDEAD_ATTACK_RULES.closeRange).toBe(2.2);
    expect(UNDEAD_ATTACK_RULES.midRange).toEqual([2.5, 5.0]);
    expect(UNDEAD_ATTACK_RULES.closeWeights).toEqual({ a1: 60, a2: 40 });
    expect(UNDEAD_ATTACK_RULES.midWeights.a3).toBe(70);
    expect(UNDEAD_ATTACK_RULES.maxConsecutive).toBe(2);
  });

  it('マーカー表（undeadClips.json）が攻撃定義と一致する（判定窓 = 発生の次〜発生 + 持続）', () => {
    const ids = Object.keys(UNDEAD_SOLDIER_ATTACKS);
    expect(undeadClipEvents.entries.map((e) => e.id).sort()).toEqual(
      ids.map((id) => `enemy.undead.${id}`).sort(),
    );
    for (const entry of undeadClipEvents.entries) {
      const def = UNDEAD_SOLDIER_ATTACKS[entry.id.replace('enemy.undead.', '') as 'a1'];
      expect(entry.spec, entry.id).toEqual({
        startup: def.startup,
        active: def.active,
        recovery: def.recovery,
      });
      expect(markersOfType(entry, 'hitStart').map((m) => m.frame)).toEqual([def.startup + 1]);
      expect(markersOfType(entry, 'hitEnd').map((m) => m.frame)).toEqual([
        def.startup + def.active,
      ]);
    }
  });
});

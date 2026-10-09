import { describe, expect, it } from 'vitest';
import { activeWindow, totalFrames } from './types';
import { attackDamage } from './combat';
import { PLAYER_ACTIONS, PLAYER_ACTION_IDS } from './playerActions';
import { PLAYER_STATS } from './playerStats';

/** 仕様書 2.3 節の表の「全体」「スタミナ」「ダメージ」列（突き合わせ用の期待値。データとは別に手書き）。 */
const SPEC_TABLE = {
  light1: { total: 36, stamina: 14, damage: 40, poise: 20 },
  light2: { total: 36, stamina: 14, damage: 42, poise: 20 },
  light3: { total: 52, stamina: 20, damage: 52, poise: 35 },
  heavy: { total: 66, stamina: 28, damage: 72, poise: 60 },
  heavyCharged: { total: 66, stamina: 34, damage: 92, poise: 80 },
  runAttack: { total: 49, stamina: 20, damage: 48, poise: 40 },
  guardCounter: { total: 47, stamina: 16, damage: 56, poise: 50 },
  backstab: { total: 47, stamina: 16, damage: 160, poise: 100 },
  plunge: { total: 28, stamina: 20, damage: 88, poise: 60 },
  roll: { total: 32, stamina: 20, damage: undefined, poise: 0 },
  backstep: { total: 22, stamina: 12, damage: undefined, poise: 0 },
  heal: { total: 54, stamina: 0, damage: undefined, poise: 0 },
} as const;

describe('プレイヤーのアクションデータ', () => {
  it('表の全アクションを網羅している', () => {
    expect([...PLAYER_ACTION_IDS].sort()).toEqual(Object.keys(SPEC_TABLE).sort());
  });

  it.each(Object.entries(SPEC_TABLE))(
    '%s: 全体・スタミナ・ダメージ・強靭度削りが表と一致',
    (id, spec) => {
      const a = PLAYER_ACTIONS[id as keyof typeof PLAYER_ACTIONS];
      expect(a.id).toBe(id);
      expect(totalFrames(a), '全体 = 発生 + 持続 + 硬直').toBe(spec.total);
      expect(a.staminaCost).toBe(spec.stamina);
      expect(a.poiseDamage).toBe(spec.poise);
      if (spec.damage === undefined) {
        expect('damageMultiplier' in a).toBe(false);
      } else {
        const mult = (a as { damageMultiplier: number }).damageMultiplier;
        expect(attackDamage(PLAYER_STATS.attackPower, mult)).toBe(spec.damage);
      }
    },
  );

  it('発生・持続・硬直の個別値（軽攻撃 1: 12/4/20 など）', () => {
    const triple = (id: keyof typeof PLAYER_ACTIONS) => {
      const a = PLAYER_ACTIONS[id];
      return [a.startup, a.active, a.recovery];
    };
    expect(triple('light1')).toEqual([12, 4, 20]);
    expect(triple('light2')).toEqual([10, 4, 22]);
    expect(triple('light3')).toEqual([16, 6, 30]);
    expect(triple('heavy')).toEqual([22, 6, 38]);
    expect(triple('runAttack')).toEqual([14, 5, 30]);
    expect(triple('guardCounter')).toEqual([14, 5, 28]);
    expect(triple('roll')).toEqual([3, 0, 29]);
    expect(triple('backstep')).toEqual([2, 0, 20]);
  });

  it('フル溜めの全体は 66 + 溜め 30', () => {
    const a = PLAYER_ACTIONS.heavyCharged;
    expect(a.chargeFrames).toBe(30);
    expect(totalFrames(a) + a.chargeFrames).toBe(96);
  });

  it('持続窓は F(発生+1)–F(発生+持続)（軽攻撃 1 は F13–F16）', () => {
    expect(activeWindow(PLAYER_ACTIONS.light1)).toEqual({ start: 13, end: 16 });
    expect(activeWindow(PLAYER_ACTIONS.roll)).toBeNull();
  });

  it('回復: F26 で HP +120（healApply）。HP 300 の 40%', () => {
    const h = PLAYER_ACTIONS.heal;
    expect(h.applyFrame).toBe(h.startup + 1);
    expect(h.applyFrame).toBe(26);
    expect(h.healAmount).toBe(120);
    expect(h.healAmount / PLAYER_STATS.hp).toBeCloseTo(0.4);
  });

  it('キャンセル窓は動作の範囲に収まる（コンボ窓は全体 + 12F まで）', () => {
    for (const a of Object.values(PLAYER_ACTIONS)) {
      const total = totalFrames(a);
      for (const c of a.cancels) {
        expect(c.start, `${a.id}→${c.to}`).toBeGreaterThanOrEqual(1);
        expect(c.start, `${a.id}→${c.to}`).toBeLessThanOrEqual(c.end);
        const isCombo = c.to === 'lightAttack' || c.to === 'heavyAttack';
        expect(c.end, `${a.id}→${c.to}`).toBeLessThanOrEqual(isCombo ? total + 12 : total);
        // 発生中・持続中はキャンセル不可（回復の F26 前も含む）
        expect(c.start, `${a.id}→${c.to}`).toBeGreaterThan(a.startup + a.active);
      }
    }
  });

  it('軽攻撃のコンボ窓は 持続終了 + 4F から 全体 + 12F まで', () => {
    for (const id of ['light1', 'light2', 'light3'] as const) {
      const a = PLAYER_ACTIONS[id];
      const c = a.cancels.find((x) => x.to === 'heavyAttack');
      expect(c?.start, id).toBe(a.startup + a.active + 4);
      expect(c?.end, id).toBe(totalFrames(a) + 12);
    }
  });

  it('軽攻撃のロール/ガードキャンセルは 持続終了 +2F / +6F から', () => {
    for (const id of ['light1', 'light2', 'light3'] as const) {
      const a = PLAYER_ACTIONS[id];
      const end = a.startup + a.active;
      expect(a.cancels.find((x) => x.to === 'dodge')?.start, id).toBe(end + 2);
      expect(a.cancels.find((x) => x.to === 'guard')?.start, id).toBe(end + 6);
    }
  });

  it('無敵窓: ロール 12F・バックステップ 8F、それ以外は無敵なし', () => {
    expect(PLAYER_ACTIONS.roll.invuln).toEqual({ start: 4, end: 15 });
    expect(PLAYER_ACTIONS.backstep.invuln).toEqual({ start: 1, end: 8 });
    expect('invuln' in PLAYER_ACTIONS.light1).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { BOSS_MOVES, stagesOf } from '../../game/boss/bossMove';
import '../../game/boss/boss.system';
import { CHARGE_COLOR, CHARGE_FLASH_COLOR } from '../player/heavyChargeGlow';
import { WEAPON_TELEGRAPH } from '../telegraph/weaponTelegraph';
import { BOSS_WEAPON_TELEGRAPH, bossWeaponGlow } from './bossWeaponGlow';

/** 色相（度）。 */
function hue(rgb: number): number {
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(hue(a) - hue(b));
  return Math.min(d, 360 - d);
};

/** 地面の予告（`GroundTelegraphs`）は赤橙の熾火。 */
const GROUND_TELEGRAPH_COLOR = 0xff4a10;

describe('ボスの予兆の発光色（#214）', () => {
  it('プレイヤーの溜め発光（琥珀・金白）・地面の予告・雑魚の強攻撃の縁と色相が大きく離れている', () => {
    const others = [
      CHARGE_COLOR,
      CHARGE_FLASH_COLOR,
      GROUND_TELEGRAPH_COLOR,
      WEAPON_TELEGRAPH.heavy.color,
      WEAPON_TELEGRAPH.unblockable.color,
    ];
    for (const kind of ['normal', 'heavy', 'unblockable'] as const) {
      for (const other of others) {
        expect(hueDistance(BOSS_WEAPON_TELEGRAPH[kind].color, other)).toBeGreaterThan(120);
      }
    }
  });

  it('種別は色だけでなく強さ・持続でも見分けられる（強攻撃は濃く、持続の終わりまで光る）', () => {
    const { normal, heavy } = BOSS_WEAPON_TELEGRAPH;
    expect(heavy.peak).toBeGreaterThan(normal.peak * 2);
    expect(heavy.holdThroughActive).toBe(true);
    expect(normal.holdThroughActive).toBe(false);
  });
});

describe('bossWeaponGlow: 技の段ごとの発光', () => {
  const stage = (move: string, index: number, phase: 1 | 2 = 1) => {
    const def = BOSS_MOVES.get(move);
    const s = def ? stagesOf(def, phase)[index] : undefined;
    if (!s) throw new Error(`no stage ${move}#${index}`);
    return s;
  };

  it('技の最中でなければ消える', () => {
    expect(bossWeaponGlow({ move: null, stage: 0, stageFrame: 0 }, 1).amount).toBe(0);
    expect(bossWeaponGlow({ move: 'overhead', stage: 0, stageFrame: 5 }, 1).amount).toBe(0);
  });

  it('大上段（強攻撃）: 予備動作の頭から氷の青で立ち上がり、持続の終わりまで光り、そのあと消える', () => {
    const s = stage('overhead', 0);
    const at = (f: number) => bossWeaponGlow({ move: 'overhead', stage: 1, stageFrame: f }, 1);
    expect(at(1).amount).toBeGreaterThan(0);
    expect(at(1).color).toBe(BOSS_WEAPON_TELEGRAPH.heavy.color);
    expect(at(9).amount).toBeGreaterThan(at(1).amount);
    expect(at(s.startup).amount).toBeCloseTo(BOSS_WEAPON_TELEGRAPH.heavy.peak);
    expect(at(s.startup + s.active).amount).toBeCloseTo(BOSS_WEAPON_TELEGRAPH.heavy.peak);
    expect(at(s.startup + s.active + 40).amount).toBe(0);
  });

  it('三連撃の 1 段目（通常）は弱く、発生で消え始める。2 段目も段の頭から光り直す', () => {
    const s = stage('combo3', 0);
    const first = (f: number) => bossWeaponGlow({ move: 'combo3', stage: 1, stageFrame: f }, 1);
    expect(first(1).color).toBe(BOSS_WEAPON_TELEGRAPH.normal.color);
    expect(first(s.startup).amount).toBeLessThan(BOSS_WEAPON_TELEGRAPH.heavy.peak / 2);
    expect(first(s.startup + 10).amount).toBe(0);
    const second = bossWeaponGlow({ move: 'combo3', stage: 2, stageFrame: 1 }, 1);
    expect(second.amount).toBeGreaterThan(0);
  });

  it('全技・全段・全フェーズで、予備動作の最後（発生 F）まで光っている', () => {
    for (const id of ['overhead', 'sweep', 'combo3', 'shieldBash', 'leap']) {
      const def = BOSS_MOVES.get(id);
      if (!def) throw new Error(id);
      for (const phase of def.phases) {
        stagesOf(def, phase).forEach((s, i) => {
          const g = bossWeaponGlow({ move: id, stage: i + 1, stageFrame: s.startup }, phase);
          expect(g.amount, `${id}#${i + 1} P${phase}`).toBeGreaterThan(0);
        });
      }
    }
  });
});

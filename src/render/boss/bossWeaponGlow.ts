import type { TelegraphKind } from '../../game/data';
import { BOSS_MOVES, stagesOf } from '../../game/boss/bossMove';
import { bossTelegraphOf } from '../../game/boss/bossTelegraph.system';
import type { BossPhase } from '../../game/boss/bossData';
import { weaponTelegraphAmount, type WeaponTelegraphProfile } from '../telegraph/weaponTelegraph';
import type { WeaponTelegraphStyle } from '../characterLight';

/**
 * ボスの予兆（予備動作）中の斧の発光（#214）。種別は `bossTelegraphOf`（段の `telegraph`）で、描画側が引く。
 *
 * 色は **冷たい白青（灰の青）** にした。ほかの光との取り違えを避けるため:
 *   - プレイヤーの溜め発光は琥珀 0xff7a00 → 金白 0xfff0b8（暖色）
 *   - 地面の予告（5・7 の円 / 線）と雑魚の強攻撃の縁は赤橙
 *   - フェーズ 2 のボス自身の熾火は橙
 * の、どれとも色相が逆（暖色の反対側）になる。眼の発光（0x9fd8ff）と同じ系統なので、ボスの意志の光として一貫する。
 * 色だけに頼らない（色覚配慮）: 通常は **淡く・短く**（判定の発生で消える）、強攻撃は **濃く・判定の持続の終わりまで光り続ける**。
 * 立ち上がり（8F で 0.5 → 1.0）は敵の予兆と同じ（`weaponTelegraphAmount`）。
 */
export const BOSS_WEAPON_TELEGRAPH: Readonly<Record<TelegraphKind, WeaponTelegraphProfile>> = {
  // 灰白に青みを少し: 弱く短い
  normal: { color: 0xd4e4ff, peak: 0.3, fadeFrames: 4, holdThroughActive: false, pulse: 0 },
  // 氷の青: 強く、持続の終わりまで
  heavy: { color: 0x4f8dff, peak: 1, fadeFrames: 14, holdThroughActive: true, pulse: 0 },
  // ボスの技にガード不能は無いが、種別の網羅のため heavy と同じ青を脈動させる
  unblockable: {
    color: 0x4f8dff,
    peak: 0.85,
    fadeFrames: 14,
    holdThroughActive: true,
    pulse: 0.25,
  },
};

/**
 * 発光の見た目（`WeaponTelegraphStyle`。#225）。刃の面は暗い金属のまま、輪郭（刃先・縁）の細い帯だけが冷たい青に光る
 * （頂点属性 `_edge` のマスク。`edge: 1`）。面を染めると斧頭が一様な薄紫のプラスチックに見えるので、面は光らせない。
 *   - `rim`: 輪郭の帯の強さ。
 *   - `fill`: 輪郭から面へ染みる淡いにじみ（bloom）。強攻撃のピークだけ、輪郭の近くが淡く明るむ程度。
 */
export const BOSS_GLOW_STYLE: Readonly<Record<TelegraphKind, WeaponTelegraphStyle>> = {
  normal: { edge: 1, rim: 0.7, fill: 0 },
  heavy: { edge: 1, rim: 1, fill: 0.55 },
  unblockable: { edge: 1, rim: 1, fill: 0.55 },
};

/** どこが光るか。盾打ち 1 段目（盾で打つ）は盾、それ以外は斧。 */
export type BossGlowTarget = 'axe' | 'shield';

/** 盾が光る段（盾打ち 1 段目）。 */
const SHIELD_GLOW_STAGE = 'shieldBash.1';

export interface BossWeaponGlow {
  /** 発光の強さ（0..1）。 */
  readonly amount: number;
  /** 発光色（sRGB 0xRRGGBB）。 */
  readonly color: number;
  /** 見た目の調整（種別ごと）。 */
  readonly style: WeaponTelegraphStyle;
  /** 光る物。 */
  readonly target: BossGlowTarget;
}

const OFF: BossWeaponGlow = {
  amount: 0,
  color: BOSS_WEAPON_TELEGRAPH.normal.color,
  style: BOSS_GLOW_STYLE.normal,
  target: 'axe',
};

/**
 * 実行中の技の段（`info.move` / `info.stage` / `info.stageFrame`）の斧の発光。技の最中でなければ amount 0。
 * 段ごとに予備動作の頭（段 F1）から立ち上がる（三連撃は段ごとに光り直す）。
 */
export function bossWeaponGlow(
  info: { readonly move: string | null; readonly stage: number; readonly stageFrame: number },
  phase: BossPhase,
): BossWeaponGlow {
  const kind = bossTelegraphOf(info, phase);
  if (!kind || !info.move) return OFF;
  const def = BOSS_MOVES.get(info.move);
  const stage = def ? stagesOf(def, phase)[info.stage - 1] : undefined;
  if (!stage) return OFF;
  const amount = weaponTelegraphAmount(stage, kind, info.stageFrame, BOSS_WEAPON_TELEGRAPH);
  return {
    amount,
    color: BOSS_WEAPON_TELEGRAPH[kind].color,
    style: BOSS_GLOW_STYLE[kind],
    target: stage.id === SHIELD_GLOW_STAGE ? 'shield' : 'axe',
  };
}

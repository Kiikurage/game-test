import { telegraphKindOf, type EnemyAttackDef, type TelegraphKind } from '../../game/data';

/**
 * 敵の武器のテレグラフ演出（#62）。攻撃の予備動作の開始（Attack 状態の F1）から武器の縁が淡く光り、
 * 8F で 0.5 → 1.0 まで立ち上がる（5.1 節）。判定が出るまで（強攻撃・ガード不能は持続の終わりまで）光り続け、
 * そのあとゆっくり消える。控えめにするため、通常は弱く短く、強攻撃・ガード不能は強く長くする。
 *
 * 色だけに頼らない（色覚配慮）: 種別ごとに「発光の強さ」「持続」が違い、ガード不能はさらに脈動する。
 */
export interface WeaponTelegraphProfile {
  /** 発光色（sRGB 0xRRGGBB）。 */
  readonly color: number;
  /** 立ち上がりが 1.0 に達したときの発光量（0..1。シェーダ側のゲインに掛かる）。 */
  readonly peak: number;
  /** 判定の発生後に消えるまでのフレーム数。 */
  readonly fadeFrames: number;
  /** true なら持続（判定の間）も光らせたままにする。false なら発生で消え始める。 */
  readonly holdThroughActive: boolean;
  /** 脈動の深さ（0 = なし）。周期は `PULSE_FRAMES`。 */
  readonly pulse: number;
}

/** 立ち上がりのフレーム数（0.5 → 1.0）。 */
export const RAMP_FRAMES = 8;
/** 立ち上がりの開始値。 */
export const RAMP_START = 0.5;
/** ガード不能の脈動の周期（F）。 */
export const PULSE_FRAMES = 6;

export const WEAPON_TELEGRAPH: Readonly<Record<TelegraphKind, WeaponTelegraphProfile>> = {
  normal: { color: 0xfff0dc, peak: 0.35, fadeFrames: 4, holdThroughActive: false, pulse: 0 },
  heavy: { color: 0xff3c08, peak: 0.85, fadeFrames: 12, holdThroughActive: true, pulse: 0 },
  unblockable: { color: 0xff3208, peak: 1, fadeFrames: 14, holdThroughActive: true, pulse: 0.25 },
};

/**
 * Attack 状態に入ってからのフレーム `frame`（F1 起点）での発光量（0..1）。
 * 予備動作の前では 0。`profiles` を渡すと別の色・強さの表（ボス用）で計算する。
 */
export function weaponTelegraphAmount(
  def: Pick<EnemyAttackDef, 'startup' | 'active'>,
  kind: TelegraphKind,
  frame: number,
  profiles: Readonly<Record<TelegraphKind, WeaponTelegraphProfile>> = WEAPON_TELEGRAPH,
): number {
  if (frame < 1) return 0;
  const p = profiles[kind];
  const ramp = RAMP_START + (1 - RAMP_START) * Math.min(1, (frame - 1) / RAMP_FRAMES);
  const holdEnd = p.holdThroughActive ? def.startup + def.active : def.startup;
  let level = ramp;
  if (frame > holdEnd) level *= Math.max(0, 1 - (frame - holdEnd) / p.fadeFrames);
  if (level <= 0) return 0;
  if (p.pulse > 0 && frame <= holdEnd) {
    level *= 1 - p.pulse * (0.5 - 0.5 * Math.cos((2 * Math.PI * frame) / PULSE_FRAMES));
  }
  return Math.min(1, level * p.peak);
}

let previewKind: TelegraphKind | null = null;

/** 撮影・確認用: 攻撃中の敵の発光を、指定した種別のピーク（立ち上がり後・発生まで）に固定する。null で解除。 */
export function setTelegraphPreview(kind: TelegraphKind | null): void {
  previewKind = kind;
}

/** 攻撃定義と状態フレームから発光量と種別を求める。定義がなければ amount 0。 */
export function enemyTelegraph(
  def: EnemyAttackDef | undefined,
  frame: number,
): { amount: number; kind: TelegraphKind } {
  if (!def) return { amount: 0, kind: 'normal' };
  if (previewKind) {
    const f = Math.min(Math.max(frame, 1 + RAMP_FRAMES), def.startup);
    return { amount: weaponTelegraphAmount(def, previewKind, f), kind: previewKind };
  }
  const kind = telegraphKindOf(def);
  return { amount: weaponTelegraphAmount(def, kind, frame), kind };
}

/** 文字列（URL クエリなど）から種別を読む。不正な値は 'normal'。 */
export function parseTelegraphKind(value: string | null | undefined): TelegraphKind {
  return value === 'heavy' || value === 'unblockable' ? value : 'normal';
}

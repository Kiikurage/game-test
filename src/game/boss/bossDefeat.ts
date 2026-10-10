import type { BossDefeatCue } from '../../core/gameEvents';
import { BOSS_KILL_SLOWMO, HIT_STOP } from '../data/combat';

/**
 * ボス撃破演出（#86 / 仕様書 6.6・8.4 節）のタイムライン。純粋なデータと関数（three / Rapier 非依存）。
 * フレームは撃破（`bossDefeated`、HP 0 になった命中のステップ）が F0 のシミュレーションステップ数。
 * ヒットストップ（12F）・0.3 倍速（60F）もシミュレーションのステップで数えるので、F72 = スローが明けた瞬間になる。
 *
 * | F | 内容 |
 * | --- | --- |
 * | 0 | トドメ。ヒットストップ 12F + 0.3 倍速 60F（`Game` が命中から決める）。撃破のセーブ・`defeat` |
 * | 12 | ボスが `Death01` で膝をつき、崩れ落ち始める（ヒットストップが明ける） |
 * | 62 | `touchdown`: 体が地に伏す（砂塵・画面振動） |
 * | 72–162 | `collapse`: 全身が灰になって消えるディゾルブ 90F、熾火が上空へ舞い上がる、BGM フェードアウト 90F |
 * | 150 | `text`: 撃破テキスト「門番、潰えたり」（UI は E6-3b） |
 * | 300 | `fogClear`: 霧が晴れる（フォグ密度 0.04 → 0.015 を 60F。霧の門 `unseal()`）、`bonfire`: 台座に篝火が灯る |
 * | 360 | `control`: 操作可能。篝火で休憩できる |
 */
export const BOSS_DEFEAT = {
  /** ヒットストップ → スローの境（F12 でヒットストップが明け、F72 までが 0.3 倍速）。 */
  hitStopFrames: HIT_STOP.kill,
  slowFrames: BOSS_KILL_SLOWMO.frames,
  /** `Death01`（膝をつき崩れ落ちる）を再生し切るまでのフレーム数（F12 から数える）。 */
  clipFrames: 60,
  /** 体が地に伏す F（クリップの終わりの少し前）。 */
  touchdown: 62,
  /** ディゾルブ・熾火・BGM フェードアウトの開始 F と長さ。 */
  collapse: 72,
  dissolveFrames: 90,
  bgmFadeFrames: 90,
  /** 撃破テキストの F。 */
  text: 150,
  textLabel: '門番、潰えたり',
  /** 霧が晴れる F と長さ、フォグ密度（仕様書 8.4 節。描画は晴れた密度に対する比として使う）。 */
  fogClear: 300,
  fogFrames: 60,
  fogDensityThick: 0.04,
  fogDensityClear: 0.015,
  /** 台座の篝火の点火 F。 */
  bonfire: 300,
  /** 操作可能（篝火で休憩できる）になる F。 */
  control: 360,
} as const;

/** 節目の発行 F（昇順で並べる。同じ F は並びの順に発行する）。 */
export const BOSS_DEFEAT_FRAMES: Readonly<Record<BossDefeatCue, number>> = {
  defeat: 0,
  touchdown: BOSS_DEFEAT.touchdown,
  collapse: BOSS_DEFEAT.collapse,
  text: BOSS_DEFEAT.text,
  fogClear: BOSS_DEFEAT.fogClear,
  bonfire: BOSS_DEFEAT.bonfire,
  control: BOSS_DEFEAT.control,
};

const CUES = Object.entries(BOSS_DEFEAT_FRAMES) as [BossDefeatCue, number][];

/** `from`（含まない）〜 `to`（含む）の F に達する節目（昇順）。 */
export function defeatCuesBetween(from: number, to: number): BossDefeatCue[] {
  return CUES.filter(([, frame]) => frame > from && frame <= to).map(([cue]) => cue);
}

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));
const smooth = (t: number): number => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};

/** 撃破 F → `Death01` の再生位置 0..1（ヒットストップの間は 0 のまま。F12 から `clipFrames` で再生し切る）。 */
export function deathClipProgress(frame: number): number {
  return clamp01((frame - BOSS_DEFEAT.hitStopFrames) / BOSS_DEFEAT.clipFrames);
}

/** 撃破 F → 灰になって消える進行 0..1（F72 から 90F。0 = 実体、1 = 消えた）。 */
export function defeatDissolve(frame: number): number {
  return clamp01((frame - BOSS_DEFEAT.collapse) / BOSS_DEFEAT.dissolveFrames);
}

/**
 * 撃破 F → フォグ密度（仕様書 8.4 節の 0.04 → 0.015）。崩壊の灰で空気が濃くなり（F0–F72 で 0.015 → 0.04）、
 * F300 から 60F かけて 0.015 へ晴れる。`frame < 0`（撃破していない）は晴れた密度。
 */
export function defeatFogDensity(frame: number): number {
  const { fogDensityThick: thick, fogDensityClear: clear, fogClear, fogFrames } = BOSS_DEFEAT;
  if (frame < 0) return clear;
  const rise = smooth(frame / BOSS_DEFEAT.collapse);
  const fall = smooth((frame - fogClear) / fogFrames);
  return clear + (thick - clear) * rise * (1 - fall);
}

/** 撃破 F → 熾火の強さ 0..1（崩れ落ちる間に亀裂・眼窩が燃え上がり、崩壊の頭で最大）。 */
export function defeatEmber(frame: number): number {
  return smooth((frame - BOSS_DEFEAT.hitStopFrames) / BOSS_DEFEAT.clipFrames);
}

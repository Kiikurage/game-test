import { applyPerfToggles, parsePerfToggles, type PerfToggles } from './perfToggles';
import type { ResolutionLimits } from './resolution';

export type QualityLevel = 'low' | 'medium' | 'high';

export const QUALITY_LEVELS: readonly QualityLevel[] = ['low', 'medium', 'high'];

/** パーティクルの個数予算（品質プリセットで段階化する）。 */
export interface ParticleQuality {
  /** 環境の灰（プレイヤー周辺に追従）。仕様 7.2 節: 200〜400 個。0 で無効。 */
  readonly ambientAsh: number;
  /** 篝火 1 基あたりの炎のビルボード数。 */
  readonly bonfireFlames: number;
  /** 篝火 1 基あたりの火の粉の数。 */
  readonly bonfireSparks: number;
  /** 熾火フィールド 1 つあたりの粒数。 */
  readonly emberField: number;
  /** バースト（ヒット・撃破）の同時スロット数（レイヤごと）。 */
  readonly burstSlots: number;
  /** バーストの 1 回あたり粒数に掛ける係数（0..1）。 */
  readonly burstDensity: number;
  /** 篝火の点光源（ゆらぎ付き）を使うか。 */
  readonly bonfireLight: boolean;
}

/** キャラクターの LOD（簡略メッシュ）の切り替え距離。 */
export interface CharacterLodQuality {
  /** この距離（m）までは詳細メッシュ、それより遠い敵は簡略メッシュ 1 つ（ボスなど大きい敵は体格に比例して延ばす）。 */
  readonly nearDistance: number;
}

/** 品質プリセット。描画基盤の各機能のコスト/品質ノブをここに集約する。 */
export interface QualityPreset {
  readonly level: QualityLevel;
  /** 影マップの一辺（px）。 */
  readonly shadowMapSize: number;
  /** プレイヤー追従シャドウカメラがカバーする半径（m）。大きいほど遠くまで影が出るが解像度が粗くなる。 */
  readonly shadowRadius: number;
  /** MSAA を使うか（4x）。 */
  readonly msaa: boolean;
  /** ブルームを有効にするか。 */
  readonly bloom: boolean;
  /** ブルームの強さ。 */
  readonly bloomStrength: number;
  /** 草の房（インスタンス）の数。0 で無効。 */
  readonly grassCount: number;
  /** 地面等の手続き的ディテール（TSL ノイズのオクターブ数）。 */
  readonly detailOctaves: number;
  /** パーティクルの個数予算。 */
  readonly particles: ParticleQuality;
  /** キャラクターの LOD 距離。 */
  readonly characterLod: CharacterLodQuality;
  /** 外周の崖の岩塊・枯れ草の配置密度（0..1。low は間引く。#190）。 */
  readonly cliffDetail: number;
  /** 内部解像度の上限（動的解像度の最大値を決める）。 */
  readonly resolution: ResolutionLimits;
}

export const QUALITY_PRESETS: Readonly<Record<QualityLevel, QualityPreset>> = {
  low: {
    level: 'low',
    shadowMapSize: 1024,
    shadowRadius: 16,
    msaa: false,
    bloom: false,
    bloomStrength: 0,
    detailOctaves: 1,
    grassCount: 0,
    particles: {
      ambientAsh: 150,
      bonfireFlames: 18,
      bonfireSparks: 14,
      emberField: 24,
      burstSlots: 6,
      burstDensity: 0.5,
      bonfireLight: false,
    },
    characterLod: { nearDistance: 8 },
    cliffDetail: 0.3,
    resolution: { maxPixelRatio: 1.5, maxPixels: 1_000_000 },
  },
  medium: {
    level: 'medium',
    // #231: モバイル GPU のフィルレート対策。MSAA を切り、影マップを 2048 → 1536、
    // 内部ピクセル上限を 1.8M → 1.1M にした（理由は docs/performance.md）。
    shadowMapSize: 1536,
    shadowRadius: 24,
    msaa: false,
    bloom: true,
    bloomStrength: 0.35,
    detailOctaves: 2,
    grassCount: 5000,
    particles: {
      ambientAsh: 300,
      bonfireFlames: 30,
      bonfireSparks: 26,
      emberField: 44,
      burstSlots: 10,
      burstDensity: 0.75,
      bonfireLight: true,
    },
    characterLod: { nearDistance: 12 },
    cliffDetail: 0.5,
    resolution: { maxPixelRatio: 2, maxPixels: 1_100_000 },
  },
  high: {
    level: 'high',
    shadowMapSize: 4096,
    shadowRadius: 32,
    msaa: true,
    bloom: true,
    bloomStrength: 0.45,
    detailOctaves: 3,
    grassCount: 14000,
    particles: {
      ambientAsh: 400,
      bonfireFlames: 44,
      bonfireSparks: 40,
      emberField: 64,
      burstSlots: 16,
      burstDensity: 1,
      bonfireLight: true,
    },
    characterLod: { nearDistance: 14 },
    cliffDetail: 1,
    resolution: { maxPixelRatio: 2, maxPixels: 4_000_000 },
  },
};

/** `?quality=` の値を解釈する。不正値・未指定は null。 */
export function parseQualityParam(search: string): QualityLevel | null {
  const value = new URLSearchParams(search).get('quality');
  return QUALITY_LEVELS.find((level) => level === value) ?? null;
}

export interface DeviceHints {
  /** タッチ主体のモバイル端末か。 */
  isMobile: boolean;
  hardwareConcurrency?: number;
  /** navigator.deviceMemory（GB、Chrome のみ）。 */
  deviceMemory?: number;
}

/**
 * 端末特性から初期品質を推定する。以降の負荷変動は動的解像度が吸収する。
 * モバイルは medium（基準機 Xperia 1 V）、非力なモバイルは low、PC は high。
 */
export function detectQuality(hints: DeviceHints): QualityLevel {
  if (hints.isMobile) {
    const weak =
      (hints.hardwareConcurrency !== undefined && hints.hardwareConcurrency <= 4) ||
      (hints.deviceMemory !== undefined && hints.deviceMemory <= 3);
    return weak ? 'low' : 'medium';
  }
  return 'high';
}

/** モバイルの目標 fps は 30、PC は 60。 */
export function targetFpsFor(isMobile: boolean): number {
  return isMobile ? 30 : 60;
}

interface NavigatorHints {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  maxTouchPoints?: number;
}

/** ブラウザ環境から端末特性を取得する（モバイル判定は粗いポインタ + タッチ有無）。 */
export function readDeviceHints(): DeviceHints {
  const nav = navigator as NavigatorHints;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const hints: DeviceHints = { isMobile: coarse && (nav.maxTouchPoints ?? 0) > 0 };
  if (nav.hardwareConcurrency !== undefined) hints.hardwareConcurrency = nav.hardwareConcurrency;
  if (nav.deviceMemory !== undefined) hints.deviceMemory = nav.deviceMemory;
  return hints;
}

/** `?scale=0.5..1`: 動的解像度を無効にして内部解像度スケールを固定する（デバッグ・撮影用）。 */
export function parseFixedScale(search: string): number | null {
  const raw = new URLSearchParams(search).get('scale');
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0.25 && value <= 1 ? value : null;
}

export interface QualitySelection {
  readonly preset: QualityPreset;
  /** 固定スケール指定があれば動的解像度を使わない。 */
  readonly fixedScale: number | null;
  readonly isMobile: boolean;
  readonly targetFps: number;
  /** 実機での切り分け用トグル（`?perf` `?noshadow` など）。 */
  readonly toggles: PerfToggles;
}

/** URL パラメータ（上書き）と端末判定から最終的な品質設定を決める。 */
export function selectQuality(search: string, hints: DeviceHints): QualitySelection {
  const level = parseQualityParam(search) ?? detectQuality(hints);
  const toggles = parsePerfToggles(search);
  return {
    preset: applyPerfToggles(QUALITY_PRESETS[level], toggles),
    toggles,
    fixedScale: parseFixedScale(search),
    isMobile: hints.isMobile,
    targetFps: targetFpsFor(hints.isMobile),
  };
}

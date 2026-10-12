import { MATERIAL_GROUPS, type MaterialGroup } from '../materialGroups';
import type { ResolutionLimits } from './dynamicResolution';

/*
 * 品質設定（#316）。描画の品質段階・端末判定・URL トグルをここに集約する。
 * 各機能は `QualityPreset` の機能フラグ・数値を読むだけにし、`level` で分岐しない。
 * 判定基準は PC high（#294）。low は E2E（`?quality=low`）と非力な端末向けに残す。
 */

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

/** 地下水路の水（#270）の品質ノブ。 */
export interface WaterQuality {
  /** 波のシミュレーションのセル（m）。小さいほど細かい波紋が出るが、セル数は 1/cell² で増える。 */
  readonly simCell: number;
  /** 水面のメッシュの格子（m）。頂点の変位（波紋の盛り上がり）の細かさ。 */
  readonly meshStep: number;
  /** 平面反射の解像度（描画解像度に対する倍率）。0 なら反射を描かず、暗い既定色 + ハイライトだけ。 */
  readonly reflection: number;
  /** しぶきのバースト同時数。 */
  readonly splashSlots: number;
  /** 霧の板の枚数（0..2）。 */
  readonly mistLayers: number;
}

/**
 * 描画負荷の予算（1 フレームの `renderer.info` の値。シャドウパスを含む）。
 * 計測視点（`scripts/perfViewpoints.mjs`）のすべてで、この値以下に収める。E2E（`e2e/perf.spec.ts`）で退行を検出する。
 * 根拠と内訳は docs/performance.md。
 */
export interface RenderBudget {
  readonly drawCalls: number;
  readonly triangles: number;
}

/** 霧の門の品質ノブ。メッシュはすべて透明の 1 枚物。 */
export interface FogGateQuality {
  /** 霧の壁のマテリアルを軽量版にするか。 */
  readonly lite: boolean;
  /** 門の霧の壁（門の中に重ねる枚数）。 */
  readonly wallLayers: number;
  /** 霧の柱の層数（外側の薄いハロを足す）。 */
  readonly pillarLayers: number;
  /** 地表の霧の円盤の枚数。 */
  readonly groundMist: number;
}

/** マテリアルのノイズ層の数などを決める詳細度。0 = low、1 = medium、2 = high。 */
export type MaterialDetail = 0 | 1 | 2;

/** 品質プリセット。描画基盤の各機能のコスト/品質ノブをここに集約する。 */
export interface QualityPreset {
  readonly level: QualityLevel;
  /** 影マップの一辺（px）。 */
  readonly shadowMapSize: number;
  /** プレイヤー追従シャドウカメラがカバーする半径（m）。大きいほど遠くまで影が出るが解像度が粗くなる。 */
  readonly shadowRadius: number;
  /** MSAA を使うか（4x）。TAAU と併用しない（TAAU が有効なら false にする）。 */
  readonly msaa: boolean;
  /**
   * TAAU（時間方向のアンチエイリアス + アップスケール。`render/taau/taau.pass.ts`）の内部解像度スケール。
   * scene パスを出力解像度のこの倍率で描き、ジッタした複数フレームから出力解像度へ再構成する。0 で無効。
   */
  readonly taauScale: number;
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
  /** マテリアル（地形・石積み・地下墓所・水路の壁など）のノイズ層の詳細度。 */
  readonly materialDetail: MaterialDetail;
  /** 空の雲のノイズのオクターブ数（背景は全画面を塗るので段階化する。#236）。 */
  readonly cloudOctaves: number;
  /** 崖の岩の割れ目の暗線を描く距離（m。遠くでチラつかせない）。 */
  readonly rockCrackFar: number;
  /** 霧の門（#189）の透明メッシュの枚数と軽量版の切り替え（モバイルのオーバードロー対策）。 */
  readonly fogGate: FogGateQuality;
  /** 地下水路の水。 */
  readonly water: WaterQuality;
  /** 描画負荷の予算。 */
  readonly budget: RenderBudget;
}

export const QUALITY_PRESETS: Readonly<Record<QualityLevel, QualityPreset>> = {
  low: {
    level: 'low',
    shadowMapSize: 1024,
    shadowRadius: 16,
    msaa: false,
    taauScale: 0,
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
    materialDetail: 0,
    cloudOctaves: 1,
    rockCrackFar: 25,
    fogGate: { lite: true, wallLayers: 1, pillarLayers: 1, groundMist: 0 },
    water: { simCell: 0.12, meshStep: 0.25, reflection: 0, splashSlots: 6, mistLayers: 1 },
    // 基準機 Xperia 1 V で 30fps を出すための目安（#180）。low は medium より軽くあるべきなので同じ上限
    budget: { drawCalls: 150, triangles: 250_000 },
  },
  medium: {
    level: 'medium',
    // #231: モバイル GPU のフィルレート対策。MSAA を切り、影マップを 2048 → 1536、
    // 内部ピクセル上限を 1.8M → 1.1M にした（理由は docs/performance.md）。
    shadowMapSize: 1536,
    shadowRadius: 24,
    msaa: false,
    taauScale: 0,
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
    materialDetail: 1,
    cloudOctaves: 2,
    rockCrackFar: 45,
    fogGate: { lite: false, wallLayers: 2, pillarLayers: 2, groundMist: 1 },
    water: { simCell: 0.08, meshStep: 0.15, reflection: 0.35, splashSlots: 10, mistLayers: 2 },
    budget: { drawCalls: 150, triangles: 250_000 },
  },
  high: {
    level: 'high',
    shadowMapSize: 4096,
    shadowRadius: 32,
    msaa: true,
    // #318: TAAU は `?taau=` のオプトイン（既定無効の理由は docs/performance.md）
    taauScale: 0,
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
    materialDetail: 2,
    cloudOctaves: 4,
    rockCrackFar: 45,
    fogGate: { lite: false, wallLayers: 2, pillarLayers: 2, groundMist: 1 },
    water: { simCell: 0.06, meshStep: 0.1, reflection: 0.5, splashSlots: 16, mistLayers: 2 },
    // PC 向け。草・影・LOD 距離が増える分だけ緩める
    budget: { drawCalls: 200, triangles: 350_000 },
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

/** 動的解像度の開始スケール（モバイルは起動直後に最大解像度で重いフレームを出さないよう 0.8）。 */
export function initialScaleFor(isMobile: boolean): number {
  return isMobile ? 0.8 : 1;
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
    // ?bench は計測中に動的解像度を動かさない（`scale=` がなければ通常の開始スケール: モバイル 0.8 / PC 1）
    fixedScale: parseFixedScale(search) ?? (toggles.bench ? initialScaleFor(hints.isMobile) : null),
    isMobile: hints.isMobile,
    targetFps: targetFpsFor(hints.isMobile),
  };
}

/**
 * 実機での負荷の切り分け用トグル（URL クエリ）。使い方は `docs/performance.md`。
 * 既定はすべて無効（通常のゲームには影響しない）。
 */
export interface PerfToggles {
  /** `?perf`: 計測 HUD を表示する（GPU 時間の計測も有効にする）。`?bench` でも有効。 */
  readonly perf: boolean;
  /** `?bench`: ベンチマークモード（決められたシナリオを自動で計測して結果を表にする。`render/bench/`）。 */
  readonly bench: boolean;
  /** `?noshadow`: シャドウマップを描かない。 */
  readonly noShadow: boolean;
  /** `?nobloom`: ブルームを省く。 */
  readonly noBloom: boolean;
  /** `?nomsaa`: MSAA を切る。 */
  readonly noMsaa: boolean;
  /** `?taau=0.5..1`: TAAU を有効にし、内部解像度スケールを指定する（MSAA は切る）。null は無効（既定）。 */
  readonly taauScale: number | null;
  /** `?nograss`: 草を置かない。 */
  readonly noGrass: boolean;
  /** `?noparticles`: パーティクルを描かない。 */
  readonly noParticles: boolean;
  /** `?nolights`: 篝火の点光源を置かない（ライトの数はすべてのマテリアルのフラグメント負荷に掛かる）。 */
  readonly noLights: boolean;
  /** `?flatmat`: 不透明メッシュの重い TSL マテリアル（地形・石積み・闘技場・亡者など）を単色の MeshStandard に差し替える。`?flatmat=terrain,masonry` でグループ単位。 */
  readonly flatMat: boolean;
  /**
   * `?flatmat=terrain,masonry`: 差し替えるグループ（`MATERIAL_GROUPS`）。null は全グループ（`?flatmat` だけのとき）。
   * `flatMat` が false のときは意味を持たない。
   */
  readonly flatMatGroups: ReadonlySet<MaterialGroup> | null;
}

/** `?flatmat` の値を解釈する。空・'1'・'all' は全グループ（null）、それ以外はカンマ区切りのグループ名。 */
export function parseFlatMatGroups(value: string | null): ReadonlySet<MaterialGroup> | null {
  if (value === null || value === '' || value === '1' || value === 'all') return null;
  const names = value.split(',').map((s) => s.trim());
  return new Set(MATERIAL_GROUPS.filter((g) => names.includes(g)));
}

export function parsePerfToggles(search: string): PerfToggles {
  const params = new URLSearchParams(search);
  const on = (key: string): boolean => params.has(key) && params.get(key) !== '0';
  return {
    perf: on('perf') || on('bench'),
    bench: on('bench'),
    noShadow: on('noshadow'),
    noBloom: on('nobloom'),
    noMsaa: on('nomsaa'),
    taauScale: parseTaauScale(params.get('taau')),
    noGrass: on('nograss'),
    noParticles: on('noparticles'),
    noLights: on('nolights'),
    flatMat: on('flatmat'),
    flatMatGroups: parseFlatMatGroups(params.get('flatmat')),
  };
}

/** `?taau=` の値（0.5..1）。範囲外・未指定は null。 */
export function parseTaauScale(value: string | null): number | null {
  if (value === null || value === '') return null;
  const v = Number(value);
  return Number.isFinite(v) && v >= 0.5 && v <= 1 ? v : null;
}

/** トグルに応じて品質プリセットの該当項目を落とす（変更なしなら同じオブジェクトを返す）。 */
export function applyPerfToggles(preset: QualityPreset, toggles: PerfToggles): QualityPreset {
  const taauScale = toggles.taauScale;
  const taau = taauScale !== null;
  if (!toggles.noBloom && !toggles.noMsaa && !toggles.noGrass && !toggles.noLights && !taau)
    return preset;
  return {
    ...preset,
    ...(toggles.noBloom && { bloom: false, bloomStrength: 0 }),
    ...(taau && { taauScale, msaa: false }),
    ...(toggles.noMsaa && { msaa: false }),
    ...(toggles.noGrass && { grassCount: 0 }),
    ...(toggles.noLights && { particles: { ...preset.particles, bonfireLight: false } }),
  };
}

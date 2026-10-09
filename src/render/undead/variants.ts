/**
 * 亡者（雑魚・ボス共通）の見た目バリアント定義と、ディゾルブ進行度の純粋ロジック（three 非依存）。
 * 色は sRGB の 0xRRGGBB。マテリアルへの適用は `undeadMaterial.ts`。
 */

export type UndeadVariantId = 'gaunt' | 'bloated' | 'scorched' | 'drowned';

/** 衣装メッシュ名（knight.glb 内）。バリアントごとに表示を切り替えて同型の連続を避ける。 */
export const OUTFIT_MESHES = {
  hood: ['Male_Ranger_Head_Hood'],
  pauldron: ['Male_Ranger_Acc_Pauldron'],
  belts: ['Male_Ranger_Body_Belt_1', 'Male_Ranger_Body_Belt_2'],
} as const;

export interface UndeadVariant {
  readonly id: UndeadVariantId;
  /** 肌の色（暗く彩度を落とした灰褐色）。 */
  readonly skin: number;
  /** 肌の斑（痣・腐敗）の色。 */
  readonly bruise: number;
  /** ボロ布の衣へ乗算する色。 */
  readonly cloth: number;
  /** 錆びた金属（肩当て・籠手）の色。 */
  readonly rust: number;
  /** 体型。幅（x/y 方向）と高さの倍率。 */
  readonly build: { readonly width: number; readonly height: number };
  /** 衣装パーツの表示。 */
  readonly hood: boolean;
  readonly pauldron: boolean;
  readonly belts: boolean;
  /** 眼の発光の強さ（1 が標準）。 */
  readonly eyeGlow: number;
}

export const UNDEAD_VARIANTS: Readonly<Record<UndeadVariantId, UndeadVariant>> = {
  // 痩せ細り、フードを被った灰褐色
  gaunt: {
    id: 'gaunt',
    skin: 0x6a5f58,
    bruise: 0x3c3a3e,
    cloth: 0x5c5046,
    rust: 0x7a4a2a,
    build: { width: 0.93, height: 1.03 },
    hood: true,
    pauldron: true,
    belts: true,
    eyeGlow: 1,
  },
  // 肥えて青黒く、フード無し・ベルト無し
  bloated: {
    id: 'bloated',
    skin: 0x5a5e58,
    bruise: 0x2f3a3c,
    cloth: 0x4a4c40,
    rust: 0x6a4a34,
    build: { width: 1.08, height: 0.98 },
    hood: false,
    pauldron: true,
    belts: false,
    eyeGlow: 0.85,
  },
  // 焼け焦げた黒褐色、赤茶けた衣
  scorched: {
    id: 'scorched',
    skin: 0x4a3f3a,
    bruise: 0x24201f,
    cloth: 0x5a3c34,
    rust: 0x8a4a22,
    build: { width: 1, height: 1.05 },
    hood: false,
    pauldron: false,
    belts: true,
    eyeGlow: 1.15,
  },
  // 水死体のような青灰色、フード付き
  drowned: {
    id: 'drowned',
    skin: 0x6c7270,
    bruise: 0x3a4650,
    cloth: 0x3c4a4a,
    rust: 0x5a5a48,
    build: { width: 0.97, height: 0.99 },
    hood: true,
    pauldron: false,
    belts: false,
    eyeGlow: 1,
  },
};

export const UNDEAD_VARIANT_IDS = Object.keys(UNDEAD_VARIANTS) as UndeadVariantId[];

/** 仕様書 5.2 節: 雑魚は 60F、ボスは 90F（60Hz 固定ステップ）。 */
export const DISSOLVE_FRAMES = { soldier: 60, boss: 90 } as const;

/** ディゾルブ進行度を 0〜1 に丸める。NaN は 0（消えていない）として扱う。 */
export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** 経過フレーム数から進行度（0〜1）を求める。 */
export function dissolveProgress(elapsedFrames: number, totalFrames: number): number {
  if (!(totalFrames > 0)) return 1;
  return clampProgress(elapsedFrames / totalFrames);
}

/** 再現性のある乱数（mulberry32）。敵の配置シードからバリアントを決めるのに使う。 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * バリアントを乱数で選ぶ。直前と同じものは選ばない（同型の連続を避ける）。
 * `rand` は [0, 1) の乱数関数。
 */
export function pickVariantId(rand: () => number, previous?: UndeadVariantId): UndeadVariantId {
  const candidates = UNDEAD_VARIANT_IDS.filter((id) => id !== previous);
  const index = Math.min(candidates.length - 1, Math.floor(rand() * candidates.length));
  const picked = candidates[index];
  if (picked === undefined) throw new Error('no undead variants defined');
  return picked;
}

/** 文字列が亡者バリアント ID なら返す（URL クエリ等の入力検証用）。 */
export function parseVariantId(value: string | null | undefined): UndeadVariantId | undefined {
  return UNDEAD_VARIANT_IDS.find((id) => id === value);
}

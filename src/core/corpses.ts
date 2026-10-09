/**
 * 環境ストーリーテリングの遺体の配置データ（仕様書 14.7 節）。純粋なデータ・ヘルパー（描画に依存しない）。
 * 遺体は「ポーズ・位置・向き・バリアント」で指定する。メッシュは `src/render/corpses/` が静止ポーズに焼き込む。
 *
 * ポーズごとの基準（原点の意味）。`yaw` は Y 軸まわりの回転（three の `rotation.y`。ローカル +Z が (sin yaw, cos yaw) を向く）。
 *   sitting   座り。原点 = 座面の中心（岩棚・噴水の縁の上面）。顔と膝は +Z 向き、脚は座面の外へ垂れる。
 *   prone     うつ伏せ。原点 = 体の中心の地面。頭が +Z 向き（這って進んだ方向）。
 *   praying   祈り。原点 = 額が触れる祭壇の面（地面の高さ）。遺体は -Z 側にひざまずき、+Z の祭壇へ額を付ける。
 *   leaning   寄りかかり。原点 = 背が触れる壁（石棺の側面）の地面。遺体は +Z 側に座って壁（-Z）にもたれる。
 */

export const CORPSE_POSES = ['sitting', 'prone', 'praying', 'leaning'] as const;
export type CorpsePose = (typeof CORPSE_POSES)[number];

/** 見た目のバリアント（体型・衣装）。定義は `src/render/corpses/corpseVariants.ts`。 */
export const CORPSE_VARIANTS = ['traveler', 'pilgrim', 'warrior', 'broad'] as const;
export type CorpseVariant = (typeof CORPSE_VARIANTS)[number];

export interface CorpsePlacement {
  readonly pose: CorpsePose;
  readonly variant: CorpseVariant;
  /** ワールド座標（ポーズごとの基準点。上記）。 */
  readonly position: readonly [number, number, number];
  /** Y 軸まわりの回転（ラジアン）。 */
  readonly yaw: number;
}

export function isCorpsePose(value: unknown): value is CorpsePose {
  return CORPSE_POSES.some((p) => p === value);
}

export function isCorpseVariant(value: unknown): value is CorpseVariant {
  return CORPSE_VARIANTS.some((v) => v === value);
}

export interface CorpseSpec {
  readonly pose: CorpsePose;
  readonly x: number;
  readonly z: number;
  /** 地面（または座面）の高さ。既定 0。 */
  readonly y?: number;
  /** 向き（ラジアン）。既定 0。 */
  readonly yaw?: number;
  /** 省略時は `index` から決定的に選ぶ（同じ配置は毎回同じ見た目）。 */
  readonly variant?: CorpseVariant;
}

/**
 * 配置データを作る。バリアントを省略すると、隣り合う遺体が同じ見た目にならないよう index から選ぶ。
 */
export function corpsePlacement(spec: CorpseSpec, index = 0): CorpsePlacement {
  if (!isCorpsePose(spec.pose)) throw new Error(`unknown corpse pose: ${String(spec.pose)}`);
  const variant = spec.variant ?? CORPSE_VARIANTS[index % CORPSE_VARIANTS.length];
  if (!isCorpseVariant(variant)) throw new Error(`unknown corpse variant: ${String(variant)}`);
  return {
    pose: spec.pose,
    variant,
    position: [spec.x, spec.y ?? 0, spec.z],
    yaw: spec.yaw ?? 0,
  };
}

/** 複数の遺体を一度に配置データにする。 */
export function corpsePlacements(specs: readonly CorpseSpec[]): CorpsePlacement[] {
  return specs.map((spec, i) => corpsePlacement(spec, i));
}

/** from から to を向く yaw（ローカル +Z が to の方向を指す）。 */
export function yawToward(
  from: { readonly x: number; readonly z: number },
  to: { readonly x: number; readonly z: number },
): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** from から to の反対（背を向ける）方向の yaw。うつ伏せで「門とは逆向きに這った」遺体に使う。 */
export function yawAwayFrom(
  from: { readonly x: number; readonly z: number },
  to: { readonly x: number; readonly z: number },
): number {
  return yawToward(to, from);
}

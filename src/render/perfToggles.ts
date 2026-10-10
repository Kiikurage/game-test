import { MATERIAL_GROUPS, type MaterialGroup } from './materialGroups';
import type { QualityPreset } from './quality';

/**
 * 実機での負荷の切り分け用トグル（URL クエリ）。使い方は `docs/performance.md`。
 * 既定はすべて無効（通常のゲームには影響しない）。
 */
export interface PerfToggles {
  /** `?perf`: 計測 HUD を表示する（GPU 時間の計測も有効にする）。 */
  readonly perf: boolean;
  /** `?noshadow`: シャドウマップを描かない。 */
  readonly noShadow: boolean;
  /** `?nobloom`: ブルームを省く。 */
  readonly noBloom: boolean;
  /** `?nomsaa`: MSAA を切る。 */
  readonly noMsaa: boolean;
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
    perf: on('perf'),
    noShadow: on('noshadow'),
    noBloom: on('nobloom'),
    noMsaa: on('nomsaa'),
    noGrass: on('nograss'),
    noParticles: on('noparticles'),
    noLights: on('nolights'),
    flatMat: on('flatmat'),
    flatMatGroups: parseFlatMatGroups(params.get('flatmat')),
  };
}

/** トグルに応じて品質プリセットの該当項目を落とす（変更なしなら同じオブジェクトを返す）。 */
export function applyPerfToggles(preset: QualityPreset, toggles: PerfToggles): QualityPreset {
  if (!toggles.noBloom && !toggles.noMsaa && !toggles.noGrass && !toggles.noLights) return preset;
  return {
    ...preset,
    ...(toggles.noBloom && { bloom: false, bloomStrength: 0 }),
    ...(toggles.noMsaa && { msaa: false }),
    ...(toggles.noGrass && { grassCount: 0 }),
    ...(toggles.noLights && { particles: { ...preset.particles, bonfireLight: false } }),
  };
}

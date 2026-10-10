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
  /** `?flatmat`: 不透明メッシュの重い TSL マテリアル（地形・石積み・闘技場・亡者など）を単色の MeshStandard に差し替える。 */
  readonly flatMat: boolean;
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

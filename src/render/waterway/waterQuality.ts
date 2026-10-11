import type { QualityLevel } from '../quality';

/**
 * 地下水路の水（#270）の品質ノブ。品質プリセット（`quality.ts`）は共有ファイルなので、水路の分はここに閉じる。
 *
 * - `simCell`: 波のシミュレーションのセル（m）。小さいほど細かい波紋が出るが、セル数は 1/cell² で増える。
 * - `meshStep`: 水面のメッシュの格子（m）。頂点の変位（波紋の盛り上がり）の細かさ。
 * - `reflection`: 平面反射の解像度（描画解像度に対する倍率）。0 なら反射を描かず、暗い既定色 + ハイライトだけ。
 * - `splashSlots`: しぶきのバースト同時数。
 * - `detail`: 石積みの細かさ（`createMasonryMaterial` の detail）。
 */
export interface WaterQuality {
  readonly simCell: number;
  readonly meshStep: number;
  readonly reflection: number;
  readonly splashSlots: number;
  readonly detail: 0 | 1 | 2;
  /** 霧の板の枚数（0..2）。 */
  readonly mistLayers: number;
}

export const WATER_QUALITY: Readonly<Record<QualityLevel, WaterQuality>> = {
  low: { simCell: 0.12, meshStep: 0.25, reflection: 0, splashSlots: 6, detail: 0, mistLayers: 1 },
  medium: {
    simCell: 0.08,
    meshStep: 0.15,
    reflection: 0.35,
    splashSlots: 10,
    detail: 1,
    mistLayers: 2,
  },
  high: {
    simCell: 0.06,
    meshStep: 0.1,
    reflection: 0.5,
    splashSlots: 16,
    detail: 2,
    mistLayers: 2,
  },
};

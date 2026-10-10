import type { Material } from 'three/webgpu';

/**
 * 不透明マテリアルのグループ名（`?flatmat=terrain,masonry` の切り分け用。#236）。
 * マテリアルの作成側が `tagMaterial` で付ける。タグのないもの（グレーボックス・小物など）は 'other'。
 */
export const MATERIAL_GROUPS = [
  'terrain', // 地形（ground）
  'env', // 環境メッシュの石・木・土・鉄
  'masonry', // 石積み（地下墓所・中庭の壁・柱・噴水）
  'cliff', // 外周の崖の岩塊
  'arena', // 闘技場の床・壁・柱
  'undead', // 亡者・ボスの体・装備
  'other', // 上記以外（グレーボックス・小物）
] as const;

export type MaterialGroup = (typeof MATERIAL_GROUPS)[number];

export function tagMaterial<T extends Material>(material: T, group: MaterialGroup): T {
  material.userData.flatGroup = group;
  return material;
}

export function materialGroupOf(material: Material): MaterialGroup {
  const g = material.userData.flatGroup as MaterialGroup | undefined;
  return g ?? 'other';
}

import type { CorpseVariant } from '../../core/corpses';
import type { EquipmentId } from '../assets/equipment';
import { OUTFIT_MESHES } from '../undead/variants';

/**
 * 遺体の見た目バリアント（体型・衣装）。亡者ではない人の遺体なので、肌は青白く血色が無いだけで、
 * 亡者マテリアル（斑・発光する眼）は使わない。衣装は UBC のレンジャー衣装を暗い色に寄せる。
 * 色は元テクスチャへ乗算する sRGB（0xRRGGBB）。
 */
export interface CorpseVariantDef {
  readonly id: CorpseVariant;
  /** 肌（MI_Regular_Male / MI_Head）へ乗算する色。 */
  readonly skin: number;
  /** 衣装（MI_Ranger: 布・革・肩当て）へ乗算する色。 */
  readonly cloth: number;
  /** 体型の倍率（幅・高さ）。 */
  readonly build: { readonly width: number; readonly height: number };
  readonly hood: boolean;
  readonly pauldron: boolean;
  readonly belts: boolean;
  /** 付ける簡易装備（`equipment.glb`）。 */
  readonly gear: readonly EquipmentId[];
}

export const CORPSE_VARIANT_DEFS: Readonly<Record<CorpseVariant, CorpseVariantDef>> = {
  // 旅装の巡礼者: フード付き、茶色の外套
  traveler: {
    id: 'traveler',
    skin: 0xb8b0a8,
    cloth: 0x86705c,
    build: { width: 1, height: 1 },
    hood: true,
    pauldron: false,
    belts: true,
    gear: [],
  },
  // 痩せた老いた巡礼者: フード付き、灰青の衣、ベルト無し
  pilgrim: {
    id: 'pilgrim',
    skin: 0xbab4b0,
    cloth: 0x667880,
    build: { width: 0.93, height: 1.03 },
    hood: true,
    pauldron: false,
    belts: false,
    gear: [],
  },
  // 門番隊の戦士: 肩当てと錆びた胸当て、剣を携える
  warrior: {
    id: 'warrior',
    skin: 0xb4aca4,
    cloth: 0x62626c,
    build: { width: 1.02, height: 1.02 },
    hood: false,
    pauldron: true,
    belts: true,
    gear: ['Cuirass', 'Sword_Rusty'],
  },
  // 大柄な戦士: 肩当て、ベルト無し、赤茶の衣、錆びた剣
  broad: {
    id: 'broad',
    skin: 0xb6aaa0,
    cloth: 0x8c6250,
    build: { width: 1.1, height: 0.98 },
    hood: false,
    pauldron: true,
    belts: false,
    gear: ['Pauldron_L', 'Sword_Rusty'],
  },
};

/** バリアントで隠すメッシュ名。 */
export function hiddenMeshes(def: CorpseVariantDef): string[] {
  return [
    ...(def.hood ? [] : OUTFIT_MESHES.hood),
    ...(def.pauldron ? [] : OUTFIT_MESHES.pauldron),
    ...(def.belts ? [] : OUTFIT_MESHES.belts),
  ];
}

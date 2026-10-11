/** 「調べる」（loot）の数値（仕様書 14.5 節）。 */
export const LOOT = {
  /** 動作の長さ（フレーム。`Crouch_*`。この間は無防備）。 */
  frames: 60,
  /** 動作の開始からこのフレームで効果（取得・文）が出る。途中で被弾して中断されたら出ない。 */
  effectFrame: 30,
} as const;

/** 読んだ・調べた印のフラグ名。 */
export const readFlag = (id: string): string => `read.${id}`;
export const lootFlag = (id: string): string => `loot.${id}`;

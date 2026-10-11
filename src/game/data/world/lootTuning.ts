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
/** 初回だけ出す文（`showText` の `firstOnly`）を出した印。 */
export const shownFlag = (textId: string): string => `shown.${textId}`;

/** 世界に残るフラグ名（セーブの `flags`）。 */
export const WORLD_FLAGS = {
  /** 鉄格子 D を開けた（開けたまま残る）。 */
  grateDOpen: 'world.grateDOpen',
  /** 亀裂の壁 G1 を壊した（元に戻らない）。 */
  wallG1Broken: 'world.wallG1Broken',
} as const;

/** 祈る（`pray`）の数値（仕様書 14.5 節）。動作 120F・環境音 −6dB / 180F は配置データ（`Effect`）。 */
export const PRAY = {
  /** 祈りの間に増える灰の粒の強さ（0..1。描画側が粒の量に使う）。 */
  ashIntensity: 1,
} as const;

/** 壊す（`breakable`）の数値（仕様書 14.1.4 節）。HP は配置データ。 */
export const BREAKABLE = {
  /**
   * 壁に当たったときのダメージ倍率。軽攻撃 4 回（1 段目 40 ×4）、強攻撃 2 回（72×2 = 144 では足りない）、
   * フル溜め 2 回（92×2）で HP 150 を削り切り、軽 3 連続（134）では壊れないように、少し重くする。
   */
  damageScale: 1.05,
  /** 命中ごとのヒットストップの最低値（F）。 */
  hitStopF: 6,
  /** 崩壊の演出（F）。 */
  collapseF: 60,
  /** ハートボックス（足元からの縦カプセル）。 */
  hurtRadiusM: 1,
  hurtHeightM: 2.6,
  hollowCue: 'sfx.wall-hollow',
  collapseCue: 'sfx.wall-collapse',
} as const;

/** 床板（`floorHatch`）の数値（仕様書 14.1.3 節）。軋む距離は配置データの `radiusM`（3m）。 */
export const FLOOR_HATCH = {
  /** 板の縁をかすめただけでは割れないよう、半幅からこれだけ内側を接触範囲にする。 */
  contactMarginM: 0.15,
  creakCue: 'sfx.hatch-creak',
} as const;

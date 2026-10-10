import { uprightHeartbox, type HeartboxSpec } from './uprightTarget';

/**
 * ボス「門番の骸 オルグ」の被弾判定（仕様書 6.2 節）: 身長 4.0m・最大半径 0.9m。
 * **脚部と胴の 2 判定、頭部判定なし**（頭は胴カプセルの上端より上にあり、当たらない）。
 * UBC を 2.2 倍にした骨格に合わせた数値（脚は地面から約 2.0m、胴は約 1.3m〜3.4m、兜の頂点が約 4.0m）。
 * `UprightTarget` の第 4 引数にそのまま渡せる。
 */
export const BOSS_HEIGHT = 4.0;
export const BOSS_RADIUS = 0.9;

/** 脚部: 足元〜約 2.0m（腰まで）。 */
export const BOSS_LEG_HEARTBOX: HeartboxSpec = { radius: 0.75, y0: 0.75, y1: 1.25 };
/** 胴: 約 1.3m〜3.4m（腰〜肩口）。頭部（3.4m 超）は判定を持たない。 */
export const BOSS_TORSO_HEARTBOX: HeartboxSpec = { radius: BOSS_RADIUS, y0: 2.2, y1: 2.5 };

export const BOSS_HEARTBOXES: readonly HeartboxSpec[] = [BOSS_LEG_HEARTBOX, BOSS_TORSO_HEARTBOX];

/** 判定の最も高い点（足元から）。頭部を含まないので身長より低い。 */
export function heartboxTop(spec: HeartboxSpec): number {
  return spec.y1 + spec.radius;
}

/** 参考: 単一カプセル（半径 0.9m・高さ 4.0m）の定義。ロックオン・移動用コライダーの寸法に使う。 */
export const BOSS_BODY_HEARTBOX: HeartboxSpec = uprightHeartbox(BOSS_RADIUS, BOSS_HEIGHT);

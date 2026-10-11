/**
 * ロックオン中の脚の向き（体のヨーの補正）を決める純粋関数。
 *
 * 移動方向（モデル基準、0 = 前、+ = 左）に体を向ける。後退は歩行を逆再生するので前向きに折り返す。
 * 折り返しの境界は game の逆再生判定（`Player.advanceGait`: 後ろ向き成分が優勢 = 後方 45° 以内）に合わせる。
 * 真横の移動（±90°）を境界にすると、わずかな向きの遅れで ±60° の間を行き来して体がぐるぐる回って見える（#256）。
 * 境界付近の往復を避けるためヒステリシスを持たせる。
 */

/** 脚の向きの最大値（ラジアン）。 */
export const MAX_LEG_YAW = (60 * Math.PI) / 180;

/** 後退へ折り返す角度（後方 45° 以内）。 */
const FOLD_ENTER = (135 * Math.PI) / 180;
/** 前向きへ戻す角度。 */
const FOLD_EXIT = (120 * Math.PI) / 180;

function wrapAngle(a: number): number {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  else if (r <= -Math.PI) r += Math.PI * 2;
  return r;
}

export interface LegYawResult {
  /** 目標の脚の向き（-MAX_LEG_YAW..MAX_LEG_YAW）。 */
  readonly wanted: number;
  /** 後退として折り返しているか（次回の `folded` に渡す）。 */
  readonly folded: boolean;
}

/** `localX` は右が正、`localZ` は前が正。 */
export function legYawTarget(localX: number, localZ: number, folded: boolean): LegYawResult {
  const angle = Math.atan2(-localX, localZ); // + = 左（yaw 増加方向）
  const abs = Math.abs(angle);
  const nowFolded = folded ? abs > FOLD_EXIT : abs > FOLD_ENTER;
  const a = nowFolded ? wrapAngle(angle - Math.sign(angle) * Math.PI) : angle;
  return { wanted: Math.max(-MAX_LEG_YAW, Math.min(MAX_LEG_YAW, a)), folded: nowFolded };
}

import { PLAYER_ACTIONS, PLAYER_STATS, PLUNGE, attackDamage } from '../data';
import type { Vec2Like } from './movement';

/**
 * 落下攻撃（Drop Strike）と空中の移動の純粋関数（仕様書 14.3.3 節）。状態遷移は `Player`、判定は `PlayerAttackDriver`。
 */

/** 浮動小数の誤差で境界値（1.0 / 1.5 / 3.0m）を落とさないための許容（m）。 */
const EPS = 1e-6;

/**
 * 有効な落下高さ（踏み出した足場から着地点まで）に対する落下攻撃の倍率。
 * 1.5m 以上は 2.2（直剣 88）、1.0〜1.5m は 1.6（64）、範囲外（1.0m 未満・3.0m 超）は null（発生しない）。
 */
export function plungeMultiplier(height: number): number | null {
  if (height < PLUNGE.minHeight - EPS || height > PLUNGE.maxHeight + EPS) return null;
  return height >= PLUNGE.highHeight - EPS
    ? PLAYER_ACTIONS.plunge.damageMultiplier
    : PLUNGE.lowMultiplier;
}

/** 落下攻撃のダメージ。未発見の敵には倍率 ×1.5（3.3 → 直剣 132 / 低い落下は 2.4 → 96）。 */
export function plungeDamage(multiplier: number, unaware: boolean): number {
  return attackDamage(
    PLAYER_STATS.attackPower,
    unaware ? multiplier * PLUNGE.unawareFactor : multiplier,
  );
}

export interface PlungeStartInput {
  /** 現在のスタミナ。 */
  readonly stamina: number;
  /** 地面から足元までの高さ（m）。地面がなければ null。 */
  readonly clearance: number | null;
  /** 踏み出した足場から着地点までの落下高さ（m。着地点は足元の真下の地面）。 */
  readonly height: number;
  /** 下降中（垂直速度が負）か。 */
  readonly descending: boolean;
}

/** 落下攻撃を始められるか（攻撃入力があるときに評価する。下に敵がいるかは別に見る）。 */
export function canStartPlunge(input: PlungeStartInput): boolean {
  if (input.stamina < PLUNGE.staminaMin) return false;
  if (!input.descending) return false;
  if (input.clearance === null || input.clearance < PLUNGE.minClearance - EPS) return false;
  return plungeMultiplier(input.height) !== null;
}

/** 攻撃しないで着地したときの硬直（フレーム）。2.0m 以上で 10F、未満は 0（硬直なし）。 */
export function landStiffnessFrames(height: number): number {
  return height >= PLUNGE.landStiffnessHeight - EPS ? PLUNGE.landFrames : 0;
}

export interface AirLockOn {
  /** プレイヤーからロックオン対象への水平ベクトル。 */
  readonly dx: number;
  readonly dz: number;
}

/**
 * 空中の速度の補正（踏み出し時の速度 `base` に足す分。m/s）。
 * 入力は最大 `PLUNGE.airCorrection`（1.5 m/s）。ロックオン対象があれば、対象へ向かう補正を足して全体を `lockSpeed`
 * （標準 2.5 m/s。入力補助の強は 3.5）までに収める（対象に近いほど弱め、着地点を対象の真上に寄せる）。
 * `move` はワールド基準の入力（長さ = 入力の強さ 0..1）。
 */
export function airCorrection(
  move: Vec2Like,
  lock: AirLockOn | null,
  lockSpeed: number,
  out: Vec2Like,
): Vec2Like {
  const strength = Math.min(1, Math.hypot(move.x, move.y));
  const len = Math.hypot(move.x, move.y);
  let cx = len > 1e-6 ? (move.x / len) * strength * PLUNGE.airCorrection : 0;
  let cz = len > 1e-6 ? (move.y / len) * strength * PLUNGE.airCorrection : 0;
  let limit: number = PLUNGE.airCorrection;
  if (lock) {
    const dist = Math.hypot(lock.dx, lock.dz);
    if (dist > 1e-3) {
      const pull = Math.min(lockSpeed, dist / PLUNGE.airLockPullSeconds);
      cx += (lock.dx / dist) * pull;
      cz += (lock.dz / dist) * pull;
    }
    limit = lockSpeed;
  }
  const total = Math.hypot(cx, cz);
  if (total > limit) {
    cx *= limit / total;
    cz *= limit / total;
  }
  out.x = cx;
  out.y = cz;
  return out;
}

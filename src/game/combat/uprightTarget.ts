import { PLAYER_STATS } from '../data';
import { vec3, type Capsule } from './geometry';
import {
  Health,
  type GuardOutcome,
  type GuardQuery,
  type HitTarget,
  type Team,
} from './hitResolver';

/**
 * 直立したキャラクターのハートボックス 1 つの定義（キャラクターのローカル座標）。
 * 敵・ボスはキャラごとに複数設定できる（ボスは脚部と胴の 2 判定、頭部判定なし）。
 */
export interface HeartboxSpec {
  readonly radius: number;
  /** カプセルの芯の下端・上端の足元からの高さ（m）。全高は `y1 + radius`。 */
  readonly y0: number;
  readonly y1: number;
  /** キャラクターの前方 / 右方向へのずれ（m）。省略時 0。 */
  readonly forward?: number;
  readonly right?: number;
}

/** 足元から `height` までの 1 本のカプセル（全高 = height）。 */
export function uprightHeartbox(radius: number, height: number): HeartboxSpec {
  return { radius, y0: radius, y1: Math.max(radius, height - radius) };
}

/** プレイヤーの被弾判定: 半径 0.35m・高さ 1.8m（2.1 節）。 */
export const PLAYER_HEARTBOXES: readonly HeartboxSpec[] = [
  uprightHeartbox(PLAYER_STATS.hurtCapsule.radius, PLAYER_STATS.hurtCapsule.height),
];

/**
 * 直立キャラクターの `HitTarget` 標準実装。`place` で足元の位置と向きを更新するとハートボックスが追従する。
 * 無敵・崩し・ガードは持ち主（プレイヤー・敵）が差し込む。
 */
export class UprightTarget implements HitTarget {
  readonly health: Health;
  readonly heartboxes: Capsule[];
  /** 被弾判定を持たない間 true にする（無敵 F・被弾後無敵）。 */
  invulnerable = false;
  /** 強靭度崩し・ガード崩し中。 */
  staggered = false;
  /** ガード判定（E2-6）。 */
  guard: ((query: GuardQuery) => GuardOutcome) | undefined;

  constructor(
    readonly id: string,
    readonly team: Team,
    maxHp: number,
    private readonly specs: readonly HeartboxSpec[],
  ) {
    this.health = new Health(maxHp);
    this.heartboxes = specs.map((s) => ({ a: vec3(), b: vec3(), radius: s.radius }));
  }

  /** 足元 `(x, y, z)`・向き `yaw`（前方 = (sin yaw, cos yaw)）へハートボックスを置く。 */
  place(x: number, y: number, z: number, yaw: number): void {
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    for (let i = 0; i < this.specs.length; i++) {
      const s = this.specs[i];
      const box = this.heartboxes[i];
      if (!s || !box) continue;
      const ox = fx * (s.forward ?? 0) + fz * (s.right ?? 0);
      const oz = fz * (s.forward ?? 0) - fx * (s.right ?? 0);
      box.a.x = box.b.x = x + ox;
      box.a.z = box.b.z = z + oz;
      box.a.y = y + s.y0;
      box.b.y = y + s.y1;
    }
  }
}

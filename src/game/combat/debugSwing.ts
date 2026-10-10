import { PLAYER_ACTIONS, PLAYER_STATS, attackDamage } from '../data';
import { vec3, type Capsule, type Vec3 } from './geometry';
import type { ActiveAttack, AttackProfile, HitEvent, HitResolver } from './hitResolver';
import { capsuleShape } from './shapes';
import { WEAPON_CAPSULE } from './weaponPose';

const DEG = Math.PI / 180;

/** 軽攻撃 1 の判定プロファイル（ダメージは基本攻撃力 × 倍率）。 */
export function playerAttackProfile(
  id: 'light1' | 'light2' | 'light3' | 'heavy' | 'guardCounter',
): AttackProfile {
  const a = PLAYER_ACTIONS[id];
  return {
    id,
    damage: attackDamage(PLAYER_STATS.attackPower, a.damageMultiplier),
    poiseDamage: a.poiseDamage,
  };
}

/** 手続き的な横斬りの武器カプセル。体の前 1.3m の高さで、体の中心から `bearing`（右が正）へ伸びる。 */
export function proceduralSwingCapsule(
  feet: Vec3,
  yaw: number,
  bearingRad: number,
  out: Capsule,
): Capsule {
  const dir = yaw + bearingRad;
  const sx = Math.sin(dir);
  const sz = Math.cos(dir);
  const h = 1.2;
  const grip = 0.35;
  out.a.x = feet.x + sx * grip;
  out.a.y = feet.y + h;
  out.a.z = feet.z + sz * grip;
  out.b.x = feet.x + sx * (grip + WEAPON_CAPSULE.length);
  out.b.y = feet.y + h;
  out.b.z = feet.z + sz * (grip + WEAPON_CAPSULE.length);
  out.radius = WEAPON_CAPSULE.radius;
  return out;
}

/**
 * ?debug 用の仮の攻撃: 軽攻撃 1 のフレームデータ（発生 12・持続 4）で、右から左へ 110° 横に斬る武器カプセルを
 * 判定する。実際の攻撃動作（#46）が入るまでの、判定とその可視化の動作確認用。ゲームの状態には触れない。
 */
export class DebugSwing {
  private frame = -1;
  private attack: ActiveAttack | null = null;
  private readonly scratch: Capsule = { a: vec3(), b: vec3(), radius: WEAPON_CAPSULE.radius };
  private readonly profile = playerAttackProfile('light1');
  /** 開始してから命中したイベントの累計（デバッグ・E2E 用）。 */
  readonly hits: HitEvent[] = [];

  constructor(private readonly resolver: HitResolver) {}

  get active(): boolean {
    return this.frame >= 0;
  }

  start(): void {
    if (this.attack) this.resolver.endAttack(this.attack);
    this.attack = this.resolver.startAttack('player', 'player', this.profile);
    this.frame = 0;
  }

  /** 1 ステップ進める。`feet` / `yaw` は攻撃者の現在位置と向き。 */
  update(feet: Vec3, yaw: number): void {
    if (this.frame < 0 || !this.attack) return;
    this.frame++;
    const { startup, active, arcDeg } = PLAYER_ACTIONS.light1;
    const half = (arcDeg * DEG) / 2;
    // 発生の最終フレームを判定開始直前の姿勢（右端）にし、持続の各フレームで左へ進める
    const f = this.frame - startup;
    if (f >= 0 && f <= active) {
      const bearing = half - ((2 * half) / active) * f;
      proceduralSwingCapsule(feet, yaw, bearing, this.scratch);
      const shape = capsuleShape(this.scratch, feet);
      if (f === 0) {
        this.resolver.prime(this.attack, shape);
      } else {
        this.hits.push(...this.resolver.resolve(this.attack, shape));
      }
    }
    if (f >= active) {
      this.resolver.endAttack(this.attack);
      this.attack = null;
      this.frame = -1;
    }
  }
}

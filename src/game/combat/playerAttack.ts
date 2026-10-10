import { PLAYER_ACTIONS, activeWindow } from '../data';
import type { LightAttackId, PlayerAttackId } from '../player/playerStates';
import { vec3, type Capsule, type Vec3 } from './geometry';
import { playerAttackProfile } from './debugSwing';
import type { ActiveAttack, HitEvent, HitResolver } from './hitResolver';
import { capsuleShape, type CapsuleShape } from './shapes';
import { WEAPON_CAPSULE } from './weaponPose';

const DEG = Math.PI / 180;

/** プレイヤー側が毎ステップ渡す、いま出している攻撃の情報（`Player.attack`）。 */
export interface PlayerAttackInfo {
  readonly id: PlayerAttackId;
  /** 動作ごとに増える通し番号（1 スイング = 1 インスタンスの切れ目）。 */
  readonly serial: number;
  /** 動作開始からのフレーム（F1 起点）。 */
  readonly frame: number;
  /** 当たり窓の中か（`hitStart` 〜 `hitEnd` マーカー）。 */
  readonly hitActive: boolean;
}

export interface AttackSource {
  readonly attack: PlayerAttackInfo | null;
  readonly feet: Vec3;
  readonly yaw: number;
  /** 直近のステップがヒットストップ（凍結）だったか。凍結中は判定しない。 */
  readonly frozen: boolean;
}

function set(v: Vec3, x: number, y: number, z: number): void {
  v.x = x;
  v.y = y;
  v.z = z;
}

/**
 * 軽攻撃の武器カプセル（ゲーム側の手続き的な軌道。2.3 節の弧・射程に合わせ、向きと高さは実クリップの剣の動きに合わせた）。
 * `p` は持続中の進行（0 = 判定開始直前の姿勢、1 = 持続の最終フレーム）。
 *
 * - light1 横斬り（Sword_Regular_A）: 体の右下から左上へ斬り上げながら水平に 110° 振る（仰角 −25° → +35°）。
 * - light2（Sword_Regular_B）: 左から右へ、肩の高さで水平に 90° 振る（やや斬り下ろし気味に仰角 +10° → −15°）。
 * - light3 突き（Sword_Regular_C）: 剣を引いた位置から正面へ突き出す。剣先は体の前 1.2m → 2.2m（射程 2.2m）、左右 ±20°（弧 40°）。
 */
export function lightAttackCapsule(
  id: LightAttackId,
  feet: Vec3,
  yaw: number,
  p: number,
  out: Capsule,
): Capsule {
  const len = WEAPON_CAPSULE.length;
  const arc = PLAYER_ACTIONS[id].arcDeg * DEG;
  out.radius = WEAPON_CAPSULE.radius;
  if (id === 'light3') {
    const dir = yaw + arc / 2 - arc * p;
    const sx = Math.sin(dir);
    const sz = Math.cos(dir);
    const reach = PLAYER_ACTIONS.light3.range;
    const from = 0.1;
    const s = from + (reach - len - from) * p;
    set(out.a, feet.x + sx * s, feet.y + 1.2, feet.z + sz * s);
    set(out.b, feet.x + sx * (s + len), feet.y + 1.2, feet.z + sz * (s + len));
    return out;
  }
  // 水平方向の振り（bearing は右が正）と仰角
  const bearing = id === 'light1' ? arc / 2 - arc * p : -arc / 2 + arc * p;
  const elevation = (id === 'light1' ? -25 + 60 * p : 10 - 25 * p) * DEG;
  const height = id === 'light1' ? 1.15 : 1.3;
  return slashCapsule(feet, yaw, bearing, elevation, height, out);
}

/** 剣を `bearing`（右が正）・`elevation`（仰角）の向きへ、手元の高さ `height` から伸ばした武器カプセル。 */
function slashCapsule(
  feet: Vec3,
  yaw: number,
  bearing: number,
  elevation: number,
  height: number,
  out: Capsule,
): Capsule {
  const dir = yaw + bearing;
  const ce = Math.cos(elevation);
  const dx = Math.sin(dir) * ce;
  const dz = Math.cos(dir) * ce;
  const dy = Math.sin(elevation);
  const grip = 0.35;
  const len = WEAPON_CAPSULE.length;
  out.radius = WEAPON_CAPSULE.radius;
  set(out.a, feet.x + dx * grip, feet.y + height + dy * grip, feet.z + dz * grip);
  set(
    out.b,
    feet.x + dx * (grip + len),
    feet.y + height + dy * (grip + len),
    feet.z + dz * (grip + len),
  );
  return out;
}

/** 走り攻撃の弧（度）。ダッシュしながら体の右から左へ水平に薙ぐ（Sword_Dash の振り抜き）。 */
const RUN_ATTACK_ARC_DEG = 100;

/**
 * 走り攻撃（Sword_Dash）: 低い姿勢で踏み込み、右下から左へ水平に薙ぐ（仰角 −15° → +10°、手元の高さ 1.0m）。
 * `p` は持続中の進行（0 = 判定開始直前、1 = 持続の最終フレーム）。前進 2.0m と合わせて、体の前 2m 超まで届く。
 */
export function runAttackCapsule(feet: Vec3, yaw: number, p: number, out: Capsule): Capsule {
  const arc = RUN_ATTACK_ARC_DEG * DEG;
  return slashCapsule(feet, yaw, arc / 2 - arc * p, (-15 + 25 * p) * DEG, 1.0, out);
}

/**
 * 強攻撃（溜めなし / フル溜め共通。Sword_Heavy_Combo の振り下ろし）: 頭上に構えた剣を、正面の鉛直面で
 * 仰角 +80°（真上近く）→ −45°（前下）へ振り下ろす。手元の高さ 1.5m、体の前 0.25m。
 * `p` は持続中の進行（0 = 判定開始直前の姿勢 = 振りかぶり、1 = 持続の最終フレーム = 地面近く）。
 * 剣先は p = 0.64 で水平（高さ 1.5m・前 1.7m）を通り、前進 0.8〜1.0m と合わせて体の前 2.5m 近くまで届く。
 */
export function heavyAttackCapsule(feet: Vec3, yaw: number, p: number, out: Capsule): Capsule {
  const len = WEAPON_CAPSULE.length;
  const elevation = (80 - 125 * p) * DEG;
  const ce = Math.cos(elevation);
  const se = Math.sin(elevation);
  const sx = Math.sin(yaw);
  const sz = Math.cos(yaw);
  const height = 1.5;
  const forward = 0.25;
  const grip = 0.35;
  set(
    out.a,
    feet.x + sx * (forward + ce * grip),
    feet.y + height + se * grip,
    feet.z + sz * (forward + ce * grip),
  );
  set(
    out.b,
    feet.x + sx * (forward + ce * (grip + len)),
    feet.y + height + se * (grip + len),
    feet.z + sz * (forward + ce * (grip + len)),
  );
  out.radius = WEAPON_CAPSULE.radius;
  return out;
}

/**
 * ガードカウンター（盾の打撃）の判定カプセル。盾は体の左前で縦に構えられ、打ち出すと前へ 0.55m → 1.1m に出る
 * （半径 0.3m の縦長カプセル。前進 0.8m と合わせて、体の前 1.9m 程度まで届く）。
 * `p` は持続中の進行（0 = 判定開始直前、1 = 持続の最終フレーム）。
 */
export function guardCounterCapsule(feet: Vec3, yaw: number, p: number, out: Capsule): Capsule {
  const sx = Math.sin(yaw);
  const sz = Math.cos(yaw);
  // 左（前方から見て −right）へ 0.15m ずらす。right = (cos yaw, −sin yaw)
  const side = -0.15;
  const dist = 0.55 + 0.55 * p;
  const x = feet.x + sx * dist + sz * side;
  const z = feet.z + sz * dist - sx * side;
  set(out.a, x, feet.y + 0.7, z);
  set(out.b, x, feet.y + 1.5, z);
  out.radius = 0.3;
  return out;
}

/**
 * プレイヤーの攻撃動作と判定（`HitResolver`）をつなぐ。毎ステップ `update` を呼ぶ（`Player.update` の後）。
 *
 * - 動作が変わる（`serial` が変わる）ごとに `startAttack` / `endAttack`（1 スイング 1 ヒット）。
 * - 発生の最終フレームで `prime`（判定開始直前の姿勢）、当たり窓の間は毎ステップ `resolve`（前フレーム → 現在をスイープ）。
 * - 命中は `HitResolver.onHit` の購読者（ヒットストップ・被弾リアクション・SE・パーティクル）へ通知される。
 */
export class PlayerAttackDriver {
  private attack: ActiveAttack | null = null;
  private serial = -1;
  private primed = false;
  private lastFrame = 0;
  private readonly scratch: Capsule = { a: vec3(), b: vec3(), radius: WEAPON_CAPSULE.radius };
  /** 命中イベントの累計（デバッグ・E2E 用）。 */
  readonly hits: HitEvent[] = [];

  constructor(private readonly resolver: HitResolver) {}

  update(source: AttackSource): void {
    const info = source.attack;
    if (!info || info.serial !== this.serial) this.finish();
    if (!info) {
      this.serial = -1;
      return;
    }
    if (info.serial !== this.serial) {
      this.serial = info.serial;
      this.attack = this.resolver.startAttack('player', 'player', playerAttackProfile(info.id));
      this.primed = false;
      this.lastFrame = 0;
    }
    if (source.frozen || info.frame === this.lastFrame || !this.attack) return;
    this.lastFrame = info.frame;

    const data = PLAYER_ACTIONS[info.id];
    const window = activeWindow(data);
    if (!window) return;
    if (!this.primed && info.frame >= data.startup) {
      this.primed = true;
      this.resolver.prime(this.attack, this.shape(info.id, source, 0));
    }
    if (info.hitActive && info.frame >= window.start && info.frame <= window.end) {
      const p = (info.frame - data.startup) / data.active;
      this.hits.push(...this.resolver.resolve(this.attack, this.shape(info.id, source, p)));
    }
  }

  private shape(id: PlayerAttackId, source: AttackSource, p: number): CapsuleShape {
    switch (id) {
      case 'guardCounter':
        guardCounterCapsule(source.feet, source.yaw, p, this.scratch);
        break;
      case 'heavy':
      case 'heavyCharged':
        heavyAttackCapsule(source.feet, source.yaw, p, this.scratch);
        break;
      case 'runAttack':
        runAttackCapsule(source.feet, source.yaw, p, this.scratch);
        break;
      default:
        lightAttackCapsule(id, source.feet, source.yaw, p, this.scratch);
    }
    return capsuleShape(this.scratch, source.feet);
  }

  private finish(): void {
    if (this.attack) this.resolver.endAttack(this.attack);
    this.attack = null;
  }
}

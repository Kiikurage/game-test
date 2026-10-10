import { Quaternion, Vector3, type Object3D } from 'three/webgpu';

/**
 * ボスが投げ捨てた大盾の簡易物理（仕様書 6.5 節: 「盾が飛んで地面に刺さる、破片」）。
 * 放物運動 + 回転で飛び、地面に着いたら縁から刺さって止まる。演出（破片・カメラ）は E5-6 が呼び出し側で行う。
 * `object` は `BossCharacter.detachShield` が返した、ワールド座標に置かれた盾。
 */
export interface ThrownShieldOptions {
  /** 初速（m/s、ワールド）。 */
  readonly velocity: Vector3;
  /** 角速度（rad/s、ワールド軸まわり）。 */
  readonly spin?: Vector3;
  /** 地面の高さ（x, z → y）。既定は 0。 */
  readonly groundHeight?: (x: number, z: number) => number;
  /** 重力（m/s²）。既定 20（ゲームの落下と同じ）。 */
  readonly gravity?: number;
  /** 盾の中心から縁までの距離（拡大後の m）。刺さったとき、地面にこの分だけ縁が埋まる深さを引く。 */
  readonly radius?: number;
  /** 地面に刺さったときに呼ばれる（破片・振動の起点）。 */
  readonly onLand?: (position: Vector3) => void;
}

const UP = new Vector3(0, 1, 0);

export class ThrownShield {
  private readonly velocity: Vector3;
  private readonly spin: Vector3;
  private readonly groundHeight: (x: number, z: number) => number;
  private readonly gravity: number;
  private readonly radius: number;
  private readonly onLand: ((position: Vector3) => void) | undefined;
  private readonly delta = new Quaternion();
  private landedFlag = false;
  private elapsed = 0;

  constructor(
    readonly object: Object3D,
    options: ThrownShieldOptions,
  ) {
    this.velocity = options.velocity.clone();
    this.spin = options.spin?.clone() ?? new Vector3();
    this.groundHeight = options.groundHeight ?? (() => 0);
    this.gravity = options.gravity ?? 20;
    this.radius = options.radius ?? 1.1;
    this.onLand = options.onLand;
  }

  get landed(): boolean {
    return this.landedFlag;
  }

  /** 飛行中の秒数。 */
  get flightTime(): number {
    return this.elapsed;
  }

  /** 毎フレーム呼ぶ。着地後は何もしない。 */
  update(dt: number): void {
    if (this.landedFlag || dt <= 0) return;
    const step = Math.min(dt, 0.05);
    this.elapsed += step;
    this.velocity.y -= this.gravity * step;
    const p = this.object.position;
    p.addScaledVector(this.velocity, step);
    const angle = this.spin.length() * step;
    if (angle > 1e-6) {
      this.delta.setFromAxisAngle(this.spin.clone().normalize(), angle);
      this.object.quaternion.premultiply(this.delta);
    }
    const ground = this.groundHeight(p.x, p.z);
    // 縁が地面に届いたら刺さる（盾は半径ぶん縦に立つので、中心は地面 + 半径 × 0.55 の高さ）
    if (p.y <= ground + this.radius * 0.55) {
      this.land(ground);
    }
  }

  private land(ground: number): void {
    this.landedFlag = true;
    const p = this.object.position;
    p.y = ground + this.radius * 0.55 - 0.18; // 縁が少し地面に埋まる
    // 向き: 飛んできた方向（水平）へ表面を向け、縁から斜め（鉛直から 20° 後ろへ倒れた姿勢）に突き立つ
    const heading = Math.atan2(this.velocity.x, this.velocity.z);
    this.object.quaternion
      .setFromAxisAngle(UP, heading)
      .multiply(this.delta.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 9));
    this.velocity.set(0, 0, 0);
    this.onLand?.(p);
  }
}

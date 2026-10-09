/**
 * 外套の揺れ（軽量なボーン揺れ）の物理。three 非依存の純粋ロジック。
 * 外套は上から順に鎖状につながった段（蝶番）で、段ごとに前後（pitch）と左右（roll）の角度を持ち、
 * 移動速度（後ろへなびく）・旋回（外側へ振られる）を目標角にしたバネ・ダンパーで追従する。
 * 角度は各段のローカル（親の段に対する相対）の回転。
 */
export interface CapeMotion {
  /** 前進速度（m/s。後退は負）。 */
  readonly forwardSpeed: number;
  /** 旋回の角速度（rad/s。左旋回が正）。 */
  readonly turnRate: number;
  /** 上体の前傾（rad。前へ倒れるほど正）。外套が重力で垂れ下がるよう、段の角度が打ち消す。既定 0。 */
  readonly leanPitch?: number;
  /** 上体の左右の傾き（rad。キャラクターの左へ傾くほど正）。既定 0。 */
  readonly leanRoll?: number;
}

export interface CapeSpringOptions {
  /** 段の数。既定 3。 */
  readonly segments?: number;
  /** バネの固有角振動数（rad/s）。大きいほどキビキビ戻る。 */
  readonly stiffness?: number;
  /** 減衰比（1 で臨界減衰）。小さいほどゆらゆら揺れる。 */
  readonly damping?: number;
}

const MAX_PITCH = 0.8;
/** 重力による打ち消しの配分（上の段から。合計 1）。 */
const GRAVITY_SHARE = [0.5, 0.3, 0.2];
const MAX_ROLL = 0.4;
/** 1 回の計算の最大時間（秒）。フレーム落ち時の発散を防ぐ。 */
const MAX_STEP = 1 / 30;

export class CapeSpring {
  readonly pitch: number[];
  readonly roll: number[];
  private readonly pitchVel: number[];
  private readonly rollVel: number[];
  private readonly omega: number;
  private readonly zeta: number;
  private time = 0;

  constructor(options: CapeSpringOptions = {}) {
    const n = options.segments ?? 3;
    this.pitch = new Array<number>(n).fill(0);
    this.roll = new Array<number>(n).fill(0);
    this.pitchVel = new Array<number>(n).fill(0);
    this.rollVel = new Array<number>(n).fill(0);
    this.omega = options.stiffness ?? 13;
    this.zeta = options.damping ?? 0.45;
  }

  get segments(): number {
    return this.pitch.length;
  }

  /** dt 秒進める。 */
  step(dt: number, motion: CapeMotion): void {
    const h = Math.min(Math.max(dt, 0), MAX_STEP);
    if (h === 0) return;
    this.time += h;
    // 後ろへなびく量（前進で正）。速いほど大きく、後退では前へ少しだけ
    const wind = Math.max(-0.15, Math.min(MAX_PITCH, motion.forwardSpeed * 0.06));
    const swing = Math.max(-MAX_ROLL, Math.min(MAX_ROLL, -motion.turnRate * 0.07));
    // 重力: 上体が傾いても外套は真下へ垂れる。各段の角度の合計が傾きを打ち消すように配分する（上の段ほど多く）
    const gravityPitch = -(motion.leanPitch ?? 0);
    const gravityRoll = motion.leanRoll ?? 0;
    for (let i = 0; i < this.segments; i++) {
      // 上の段ほど体に沿い、下の段ほど大きくなびく（ローカル角なので段ごとの寄与は小さめ）
      const weight = i === 0 ? 0.5 : 0.3;
      const flutter =
        Math.sin(this.time * (6 + i * 1.7) + i * 1.3) *
        0.035 *
        Math.min(1, Math.abs(motion.forwardSpeed) / 3);
      const breeze = Math.sin(this.time * 1.1 + i * 0.9) * 0.012;
      const share = GRAVITY_SHARE[i] ?? 0.15;
      const targetPitch = wind * weight + flutter + breeze + gravityPitch * share;
      const targetRoll = swing * (i === 0 ? 0.4 : 0.35) + breeze * 0.5 + gravityRoll * share;
      this.pitchVel[i] = integrate(
        this.pitch[i] ?? 0,
        this.pitchVel[i] ?? 0,
        targetPitch,
        this.omega,
        this.zeta,
        h,
      );
      this.pitch[i] = (this.pitch[i] ?? 0) + (this.pitchVel[i] ?? 0) * h;
      this.rollVel[i] = integrate(
        this.roll[i] ?? 0,
        this.rollVel[i] ?? 0,
        targetRoll,
        this.omega,
        this.zeta,
        h,
      );
      this.roll[i] = (this.roll[i] ?? 0) + (this.rollVel[i] ?? 0) * h;
    }
  }

  /** 静止状態へ戻す。 */
  reset(): void {
    this.pitch.fill(0);
    this.roll.fill(0);
    this.pitchVel.fill(0);
    this.rollVel.fill(0);
    this.time = 0;
  }
}

/** バネ・ダンパーの速度更新（半陰解法）。 */
function integrate(
  x: number,
  v: number,
  target: number,
  omega: number,
  zeta: number,
  h: number,
): number {
  const accel = omega * omega * (target - x) - 2 * zeta * omega * v;
  return v + accel * h;
}

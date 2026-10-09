import {
  ENEMY_VISION,
  HEARING_GAIN_PER_SECOND,
  NOISE_RADIUS,
  ONE_SHOT_NOISE_SECONDS,
  RUN_NOISE_MIN_SPEED,
  WALK_NOISE_MIN_SPEED,
  type NoiseKind,
  type PlayerMotion,
} from '../data';
import { angleDelta, yawOf } from '../player/movement';

/**
 * 敵の知覚（仕様書 5.1 節 / 14.3.1 節）。three にも物理にも依存しない純粋関数と、音の受け口。
 * 視線が通るか（遮蔽）は呼び出し側が `LineOfSight` として渡す（実体は Rapier のレイキャスト）。
 *
 * 気付きゲージ（#119 で本格化）の拡張点:
 *  - 視覚の増加量は `visualGainPerSecond`、聴覚は `hearingGainPerSecond`。環境（暗所）や動作の倍率はここへ足す。
 *  - 音の種類は `NOISE_RADIUS`（data/enemyAi.ts）へ足す。発生側は `NoiseField.emit` を呼ぶだけでよい。
 */

export interface Vec3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** `from` から `to` への視線が通っているか。 */
export type LineOfSight = (from: Vec3Like, to: Vec3Like) => boolean;

const RAD2DEG = 180 / Math.PI;

/** 観察者（敵）から見た対象の水平距離と、正面からの角度（度、絶対値）。 */
export function bearing(
  observer: { readonly x: number; readonly z: number },
  yaw: number,
  target: { readonly x: number; readonly z: number },
): { distance: number; angleDeg: number } {
  const dx = target.x - observer.x;
  const dz = target.z - observer.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 1e-6) return { distance, angleDeg: 0 };
  return { distance, angleDeg: Math.abs(angleDelta(yaw, yawOf(dx, dz))) * RAD2DEG };
}

/** 距離・FOV の範囲内か（遮蔽は見ない）。`fovDeg` は全角（戦闘中は `ENEMY_VISION.combatFovDeg`）。 */
export function inVisionCone(
  distance: number,
  angleDeg: number,
  fovDeg: number = ENEMY_VISION.fovDeg,
): boolean {
  return distance <= ENEMY_VISION.range && angleDeg <= fovDeg / 2;
}

/** 距離帯ごとの増加量（毎秒）。範囲外は 0。 */
export function distanceRate(distance: number): number {
  for (const band of ENEMY_VISION.distanceBands) {
    if (distance <= band.upTo) return band.rate;
  }
  return 0;
}

/** 角度による倍率。FOV の外は 0。 */
export function angleScale(angleDeg: number): number {
  for (const band of ENEMY_VISION.angleBands) {
    if (angleDeg <= band.withinDeg) return band.scale;
  }
  return 0;
}

export interface VisualInput {
  readonly distance: number;
  readonly angleDeg: number;
  readonly motion: PlayerMotion;
  /** 視線が通っているか。 */
  readonly lineOfSight: boolean;
  /** 暗所か。 */
  readonly dark?: boolean;
  readonly suspicious?: boolean;
}

/** 視覚によるゲージの増加量（毎秒）。距離 × 角度 × 動作 × 環境。視線が通らなければ 0。 */
export function visualGainPerSecond(i: VisualInput): number {
  if (!i.lineOfSight) return 0;
  let gain = distanceRate(i.distance) * angleScale(i.angleDeg) * ENEMY_VISION.motionScale[i.motion];
  if (i.dark) gain *= ENEMY_VISION.darkScale;
  if (i.suspicious) gain *= ENEMY_VISION.suspiciousScale;
  return gain;
}

// ---- 聴覚 ----

export interface Noise {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** 聞こえる半径（m、3D 距離）。 */
  readonly radius: number;
  /** 残り時間（秒）。 */
  remaining: number;
}

export interface NoiseOptions {
  /** 半径の倍率（地下の反響 ×1.3 など）。 */
  readonly radiusScale?: number;
  /** 気付きの判定に効く時間（秒）。既定は一発もの（0.5 秒）。連続音（足音）は 1 ステップ分だけ渡す。 */
  readonly duration?: number;
}

/**
 * 発生した音の受け口。`emit` された音は `duration` 秒だけ有効で、敵は有効な音を毎ステップ読む。
 * 壁越しでも聞こえる（遮蔽は見ない）。
 */
export class NoiseField {
  private readonly list: Noise[] = [];

  /** 有効な音（読み取り専用）。 */
  get active(): readonly Noise[] {
    return this.list;
  }

  emit(position: Vec3Like, kind: NoiseKind, options: NoiseOptions = {}): void {
    this.emitRadius(position, NOISE_RADIUS[kind] * (options.radiusScale ?? 1), options.duration);
  }

  /** 半径を直接指定して音を出す。 */
  emitRadius(position: Vec3Like, radius: number, duration = ONE_SHOT_NOISE_SECONDS): void {
    this.list.push({
      x: position.x,
      y: position.y,
      z: position.z,
      radius,
      remaining: duration,
    });
  }

  /** 経過時間を進め、期限切れを捨てる。敵の更新の後に 1 回呼ぶ。 */
  advance(dt: number): void {
    let w = 0;
    for (const n of this.list) {
      n.remaining -= dt;
      if (n.remaining > 1e-9) this.list[w++] = n;
    }
    this.list.length = w;
  }

  clear(): void {
    this.list.length = 0;
  }
}

/** `observer` に聞こえる音のうち最も近いもの（なければ null）。聞こえるのは 3D 距離が半径以内。 */
export function loudestAudible(noises: readonly Noise[], observer: Vec3Like): Noise | null {
  let best: Noise | null = null;
  let bestRatio = Infinity;
  for (const n of noises) {
    const d = Math.hypot(n.x - observer.x, n.y - observer.y, n.z - observer.z);
    if (d > n.radius) continue;
    const ratio = d / n.radius;
    if (ratio < bestRatio) {
      best = n;
      bestRatio = ratio;
    }
  }
  return best;
}

/** 聴覚によるゲージの増加量（毎秒）。聞こえる音があれば一定。 */
export function hearingGainPerSecond(audible: Noise | null): number {
  return audible ? HEARING_GAIN_PER_SECOND : 0;
}

// ---- プレイヤーの動作 → 動作の分類・足音 ----

/**
 * プレイヤーの状態と水平速度から、動作の分類を決める。ダッシュ・ロール・バックステップは `dash`、
 * 立ち止まりは `still`、移動中は速度で `walk` / `run`。
 */
export function playerMotion(state: string, speed: number): PlayerMotion {
  if (state === 'dash' || state === 'roll' || state === 'backstep') return 'dash';
  if (state === 'move') {
    if (speed >= RUN_NOISE_MIN_SPEED) return 'run';
    if (speed >= WALK_NOISE_MIN_SPEED) return 'walk';
  }
  return 'still';
}

/** 動作の分類に対応する足音の種類。立ち止まりは無音（null）。 */
export function motionNoise(motion: PlayerMotion): NoiseKind | null {
  switch (motion) {
    case 'dash':
      return 'dash';
    case 'run':
      return 'run';
    case 'walk':
      return 'walk';
    case 'still':
      return null;
  }
}

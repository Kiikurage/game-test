import type { FootstepGait } from '../../core/gameEvents';
import { MOVEMENT } from '../data/playerStats';
import type { AnimMarkerEvent } from './markerDispatcher';

/**
 * 移動アニメーション（立ち・歩き・走り・ダッシュ）の共通ロジック。
 * 位相（歩行サイクルのどこか）はシミュレーション側で持ち、描画はそれを読んでクリップ時刻にする。
 * こうすると足音イベント（足の接地）が足の動きと同じ位相で発火し、ヒットストップ中は位相ごと止まる。
 * 速度の閾値だけ差し替えれば、敵・ボスにも使える。
 */

export type GaitName = 'walk' | 'jog' | 'sprint';

export interface LocomotionProfile {
  /** この速度（m/s）で歩きクリップ 100%。これ以下は立ち（Idle）とブレンド。 */
  readonly walk: number;
  /** この速度で走り（Jog）100%。 */
  readonly run: number;
  /** この速度でダッシュ（Sprint）100%。 */
  readonly dash: number;
}

export const PLAYER_LOCOMOTION: LocomotionProfile = {
  walk: MOVEMENT.walk,
  run: MOVEMENT.run,
  dash: MOVEMENT.dash,
};

export interface LocomotionBlend {
  idle: number;
  walk: number;
  jog: number;
  sprint: number;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** 水平速度 → 4 つのループのブレンド比（合計 1）: 0 → 歩き → 走り → ダッシュ。 */
export function locomotionBlend(
  speed: number,
  profile: LocomotionProfile = PLAYER_LOCOMOTION,
  out: LocomotionBlend = { idle: 0, walk: 0, jog: 0, sprint: 0 },
): LocomotionBlend {
  out.idle = out.walk = out.jog = out.sprint = 0;
  const { walk, run, dash } = profile;
  if (speed <= walk) {
    const k = smoothstep(0, walk * 0.9, speed);
    out.idle = 1 - k;
    out.walk = k;
  } else if (speed <= run) {
    const k = (speed - walk) / (run - walk);
    out.walk = 1 - k;
    out.jog = k;
  } else {
    const k = Math.min(1, (speed - run) / (dash - run));
    out.jog = 1 - k;
    out.sprint = k;
  }
  return out;
}

/** クリップのキーフレームレート（UAL は全クリップ 30fps）とループの長さ（フレーム）。 */
export const GAIT_CLIP_FRAMES = { walk: 40, jog: 28, sprint: 20 } as const;
const CLIP_FPS = 30;

/**
 * 各ループが「その場で」想定している移動速度（m/s。接地中の足の後退速度から測定）。
 * 足滑りの少ない再生速度の基準で、1 サイクルで進む距離 = 速度 × クリップ長。
 */
export const GAIT_NOMINAL_SPEED = { walk: 1.2, jog: 4.6, sprint: 7.5 } as const;

/** 1 サイクル（左足の接地 → 次の左足の接地）で進む距離（m）。 */
export const GAIT_CYCLE_METERS: Readonly<Record<GaitName, number>> = {
  walk: GAIT_NOMINAL_SPEED.walk * (GAIT_CLIP_FRAMES.walk / CLIP_FPS),
  jog: GAIT_NOMINAL_SPEED.jog * (GAIT_CLIP_FRAMES.jog / CLIP_FPS),
  sprint: GAIT_NOMINAL_SPEED.sprint * (GAIT_CLIP_FRAMES.sprint / CLIP_FPS),
};

/**
 * 各ループで「左足が最も前に出る」クリップ位相（0..1）。クリップ時刻 = (共通位相 + この値) % 1 とすると、
 * 歩き・走り・ダッシュの足の運びが揃い、ブレンド中に足が交差して見えない。
 * （Walk / Jog / Sprint を 60 分割でサンプルして測定。scripts/assets/clipMeasure.mjs でも確認できる）
 */
export const GAIT_PHASE_OFFSET: Readonly<Record<GaitName, number>> = {
  walk: 0,
  jog: 0.967,
  sprint: 0.875,
};

/**
 * 共通位相での足の接地（足が最も前に出る瞬間）。左足は 0、右足は歩幅の違いで少しずれる
 * （Walk .500 / Jog .527 / Sprint .550。clipMeasure.mjs の実測）。
 */
export const GAIT_RIGHT_FOOT_PHASE: Readonly<Record<GaitName, number>> = {
  walk: 0.5,
  jog: 0.527,
  sprint: 0.55,
};

/** ブレンド比で重み付けした、1 サイクルの距離（m）。 */
export function blendedCycleMeters(b: LocomotionBlend): number {
  const sum = b.walk + b.jog + b.sprint;
  if (sum < 1e-6) return GAIT_CYCLE_METERS.walk;
  return (
    (b.walk * GAIT_CYCLE_METERS.walk +
      b.jog * GAIT_CYCLE_METERS.jog +
      b.sprint * GAIT_CYCLE_METERS.sprint) /
    sum
  );
}

/** これ以下の速度では位相を進めない（立ち止まり中の足音を出さない）。 */
const MIN_GAIT_SPEED = 0.25;

/**
 * 歩行サイクルの位相時計。毎ステップ `advance(speed, dt)` で位相を進め、足の接地をまたいだら `footstep` を積む。
 * ロックオン中の後退は `reverse` で逆回し（クリップの逆再生）。
 */
export class GaitClock {
  /** 共通位相（0..1）。 */
  phase = 0;
  /** 直近の `advance` での位相の変化量（逆回しなら負）。描画の補間に使う。 */
  lastDelta = 0;
  private total = 0;
  private readonly blend: LocomotionBlend = { idle: 1, walk: 0, jog: 0, sprint: 0 };

  reset(): void {
    this.phase = 0;
    this.total = 0;
    this.lastDelta = 0;
  }

  advance(
    speed: number,
    dt: number,
    options: {
      reverse?: boolean;
      profile?: LocomotionProfile;
      out?: AnimMarkerEvent[];
      /** 足音の発火元の動作 ID（既定 `locomotion`）。 */
      actionId?: string;
    } = {},
  ): void {
    this.lastDelta = 0;
    if (speed < MIN_GAIT_SPEED) return;
    const b = locomotionBlend(speed, options.profile, this.blend);
    const cycles = (speed * dt) / blendedCycleMeters(b);
    const delta = options.reverse ? -cycles : cycles;
    const before = this.total;
    this.total += delta;
    this.lastDelta = delta;
    this.phase = ((this.total % 1) + 1) % 1;
    if (!options.out) return;

    const sum = b.walk + b.jog + b.sprint;
    const right =
      sum > 1e-6
        ? (b.walk * GAIT_RIGHT_FOOT_PHASE.walk +
            b.jog * GAIT_RIGHT_FOOT_PHASE.jog +
            b.sprint * GAIT_RIGHT_FOOT_PHASE.sprint) /
          sum
        : 0.5;
    const gait: FootstepGait =
      b.walk >= 0.5 || (b.idle > 0 && b.jog + b.sprint < 0.01) ? 'walk' : 'run';
    for (const p of [0, right]) {
      if (Math.floor(this.total - p) !== Math.floor(before - p)) {
        options.out.push({
          type: 'footstep',
          actionId: options.actionId ?? 'locomotion',
          frame: 0,
          gait,
        });
      }
    }
  }
}

import {
  GAIT_CYCLE_METERS,
  blendedCycleMeters,
  locomotionBlend,
  type LocomotionProfile,
} from '../../game/anim/locomotion';

/**
 * ボスの歩幅・足音の設定（仕様書 6.2 / 6.3 節末）。
 *
 * ボスは UBC を `BOSS_SCALE` 倍にしているので、同じクリップ速度だと足が滑る（1 歩が 2.2 倍長くなる）。
 * 足滑りを抑える作り: **歩行位相の時計（`GaitClock`）に「モデル空間の速度 = 実速度 ÷ BOSS_SCALE」を渡す**。
 * こうすると 1 サイクルで進む距離が自動で 2.2 倍になり、足の運びが拡大後の歩幅に合う。
 *
 *   gait.advance(bossSpeed / BOSS_SCALE, dt, { profile: BOSS_LOCOMOTION, out: markers })
 *
 * 数値の対応表は `BOSS_GAIT_TABLE`（`bossGaitFor` で任意の速度を引ける）。
 */

/** UBC に対する拡大率（身長 1.8m → 約 4.0m）。 */
export const BOSS_SCALE = 2.2;

/** 仕様書 6.2 節: 歩き 2.4 m/s、走り 4.2 m/s（フェーズ 2 は 4.8 m/s）。 */
export const BOSS_SPEED = { walk: 2.4, run: { 1: 4.2, 2: 4.8 } } as const;

/**
 * 歩き・走りのブレンド点（モデル空間の速度。実速度 ÷ `BOSS_SCALE`）。
 * 走りクリップ（Jog）を全開にすると 1 歩が 4.7m になり、スローモーションの跳躍に見える（巨体の足運びにならない）。
 * そこで**歩きクリップを主に、走りクリップを `RUN_BLEND`（4.2 m/s で約 10%）だけ混ぜる**:
 * 1 歩 1.8〜2.3m・毎秒 2 歩前後の「重く速い行軍」の足運びになる（毎秒 1 歩のスローモーションでも、毎秒 2.7 歩の小走りでもない）。
 * ダッシュは使わない（ダッシュの速度を十分大きくして、走り → ダッシュのブレンドが起きないようにしてある）。
 */
const RUN_BLEND = 0.1;
export const BOSS_LOCOMOTION: LocomotionProfile = {
  walk: BOSS_SPEED.walk / BOSS_SCALE,
  run: (BOSS_SPEED.walk + (BOSS_SPEED.run[1] - BOSS_SPEED.walk) / RUN_BLEND) / BOSS_SCALE,
  dash: 1000,
};

/** 実速度（m/s）→ 歩行位相の時計に渡すモデル空間の速度。 */
export function toModelSpeed(speed: number): number {
  return speed / BOSS_SCALE;
}

export interface BossGaitEntry {
  readonly id: 'walk' | 'run1' | 'run2';
  /** 移動速度（m/s）。 */
  readonly speed: number;
  /** 歩き / 走りクリップのブレンド比（合計 1。立ちは 0）。 */
  readonly walkWeight: number;
  readonly jogWeight: number;
  /** 1 サイクル（左足の接地 → 次の左足の接地）の秒数。 */
  readonly cycleSeconds: number;
  /** 1 歩（片足の接地間隔）の距離（m）。 */
  readonly stepMeters: number;
  /** 各クリップの足の接地速度（m/s）の、移動速度に対するずれの重み付き平均（0 = 足滑りなし）。 */
  readonly slip: number;
}

/** 速度に対するブレンド・歩幅・足滑りの見込み。`GaitClock` に `toModelSpeed(speed)` を渡したときの挙動と一致する。 */
export function bossGaitFor(speed: number, id: BossGaitEntry['id'] = 'walk'): BossGaitEntry {
  const blend = locomotionBlend(toModelSpeed(speed), BOSS_LOCOMOTION);
  const cycleMeters = blendedCycleMeters(blend) * BOSS_SCALE;
  const cycleSeconds = cycleMeters / speed;
  const sum = blend.walk + blend.jog;
  const walkWeight = blend.walk / sum;
  const jogWeight = blend.jog / sum;
  // 各クリップが 1 サイクルを cycleSeconds で再生したときの足の接地速度
  const footSpeed = (g: 'walk' | 'jog'): number =>
    (GAIT_CYCLE_METERS[g] * BOSS_SCALE) / cycleSeconds;
  const slip =
    (walkWeight * Math.abs(footSpeed('walk') - speed) +
      jogWeight * Math.abs(footSpeed('jog') - speed)) /
    speed;
  return {
    id,
    speed,
    walkWeight,
    jogWeight,
    cycleSeconds,
    stepMeters: cycleMeters / 2,
    slip,
  };
}

export const BOSS_GAIT_TABLE: readonly BossGaitEntry[] = [
  bossGaitFor(BOSS_SPEED.walk, 'walk'),
  bossGaitFor(BOSS_SPEED.run[1], 'run1'),
  bossGaitFor(BOSS_SPEED.run[2], 'run2'),
];

/**
 * 足音（仕様書 14 章: 重い・低音）。音声側（E5 の SE チケット）が読む指定口。
 * 足の接地位置は `foot_l` / `foot_r` ボーンのワールド座標、画面揺れは接地の強さに応じて。
 */
export const BOSS_FOOTSTEP = {
  /** 足音マーカーを置く足のボーン。 */
  bones: { left: 'foot_l', right: 'foot_r' },
  /** 通常の足音に対する再生ピッチ比（約 −13 半音 = 低音）。 */
  pitchRatio: 0.48,
  /** 音量の倍率（重さ）。走りは歩きより強い。 */
  gain: { walk: 1.1, run: 1.35 },
  /** 接地ごとのカメラ微振動（度）と持続（F）。近距離（10m 以内）のみ。 */
  shake: { walk: { degrees: 0.15, frames: 8 }, run: { degrees: 0.3, frames: 10 }, range: 10 },
} as const;

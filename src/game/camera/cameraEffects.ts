import { CAMERA_FX, DEFAULT_CAMERA_SHAKE } from '../data/cameraEffects';

// カメラ演出（仕様書 3.3 節 / 6.5 節）。振動・FOV・距離の補正を、カメラの最終段へ「加算」するための値として計算する。
// カメラの基準姿勢（ロックオン・フリー・衝突解決）には触れない。`ThirdPersonCamera.updatePlacement` が毎ステップ
// `step()` を 1 回呼び、返った補正を最終の向き・FOV・アーム長へ足す。
//
// 時間: 演出は固定ステップ（60Hz）で数え、ヒットストップ（キャラクター単位の局所凍結）では止まらない。
// 振動は命中と同じステップで始まる。ヒットストップ中も揺れ続けるので、12F 止まる間に 6F の振動が消えることはない。
//
// 重なり時の合成:
// - 振動: 最大値採用（各演出の「いまの振幅」の最大。足し合わせない。連続被弾でも画面が暴れない）。
// - 被弾の FOV キック: 最大値採用。
// - クリップの FOV・距離: 加算（別々の演出が同時に引く・寄る場合を許す）。クリップと FOV キックの合計は
//   `CAMERA_FX.fovOffsetMin/MaxDeg`・`armOffsetMin/MaxM` で頭打ちにする。
//
// 強度設定: OFF / 50% / 100%（既定 100%）。振動の振幅と被弾の FOV キックに掛ける（0 なら出さない）。
// クリップの距離・FOV はシネマティックな演出なので強度では変えない（クリップ内の振動チャンネルだけ掛かる）。

const DEG = Math.PI / 180;

/** クリップのキーフレーム。`frame` は 0 始まり（再生開始のステップが 0）。指定のないチャンネルは触らない。 */
export interface CameraClipKey {
  readonly frame: number;
  /** アーム長（カメラ距離）の補正 [m]。正で引く。 */
  readonly armOffsetM?: number;
  /** FOV の補正 [度]。 */
  readonly fovOffsetDeg?: number;
  /** 振動の振幅 [度]。 */
  readonly shakeDeg?: number;
}

/**
 * カメラ演出クリップ（距離・FOV・振動のキーフレーム）。フェーズ移行（6.5 節）・ボスの技などが使う。
 * 各チャンネルはキーの間を補間する（既定は `smooth`）。最初のキーより前は最初の値、最後のキーより後は
 * クリップの終わり（`frames`）まで最後の値を保つ。`frames` を過ぎるとクリップは終わり、補正は 0 に戻る
 * （自然に戻すには、最後のキーを 0 にしておく）。
 */
export interface CameraClip {
  readonly id: string;
  /** 再生の長さ（ステップ数）。 */
  readonly frames: number;
  readonly keys: readonly CameraClipKey[];
  readonly ease?: 'linear' | 'smooth';
}

export interface CameraClipOptions {
  /** 振動・距離・FOV すべてへ掛ける倍率（既定 1）。 */
  readonly intensity?: number;
}

/** 1 ステップぶんの補正（カメラの最終段が足す）。 */
export interface CameraEffectsOutput {
  /** 振動の向き（ラジアン。ヨー・ピッチへ足す）。 */
  readonly shakeYaw: number;
  readonly shakePitch: number;
  /** 振動の包絡（度。最大値採用後・強度適用後）。テスト・デバッグ用。 */
  readonly shakeDeg: number;
  readonly fovOffsetDeg: number;
  readonly armOffsetM: number;
}

interface ShakeLayer {
  amplitudeDeg: number;
  frames: number;
  elapsed: number;
}

interface FovKick {
  deg: number;
  frames: number;
  elapsed: number;
}

interface ClipPlayer {
  clip: CameraClip;
  intensity: number;
  elapsed: number;
}

/** 距離減衰（叩きつけ）。`near` 以内 1、`far` 以上 0、間は線形。 */
export function distanceFalloff(distance: number, near: number, far: number): number {
  if (distance <= near) return 1;
  if (distance >= far) return 0;
  return 1 - (distance - near) / (far - near);
}

/** クリップのあるチャンネルの、`frame` での値（キーが 1 つもなければ undefined）。 */
export function sampleClipChannel(
  clip: CameraClip,
  channel: 'armOffsetM' | 'fovOffsetDeg' | 'shakeDeg',
  frame: number,
): number | undefined {
  let prev: { frame: number; value: number } | undefined;
  let next: { frame: number; value: number } | undefined;
  for (const key of clip.keys) {
    const value = key[channel];
    if (value === undefined) continue;
    if (key.frame <= frame && (!prev || key.frame >= prev.frame))
      prev = { frame: key.frame, value };
    if (key.frame > frame && (!next || key.frame < next.frame)) next = { frame: key.frame, value };
  }
  if (!prev) return next?.value;
  if (!next) return prev.value;
  const t = (frame - prev.frame) / (next.frame - prev.frame);
  const k = clip.ease === 'linear' ? t : t * t * (3 - 2 * t);
  return prev.value + (next.value - prev.value) * k;
}

const ZERO: CameraEffectsOutput = {
  shakeYaw: 0,
  shakePitch: 0,
  shakeDeg: 0,
  fovOffsetDeg: 0,
  armOffsetM: 0,
};

export class CameraEffects {
  private shakes: ShakeLayer[] = [];
  private kicks: FovKick[] = [];
  private clips: ClipPlayer[] = [];
  private seed = 1;
  private strengthSource: () => number = () => DEFAULT_CAMERA_SHAKE;
  private last: CameraEffectsOutput = ZERO;
  private peaks = { shakeDeg: 0, fovOffsetDeg: 0 };

  /**
   * 強度設定の取得元（0 / 50 / 100）。設定ストア（E9-1a）が接続されたら
   * `setStrengthSource(() => settings.get().cameraShake)` を呼ぶ。未接続は 100%。
   */
  setStrengthSource(source: () => number): void {
    this.strengthSource = source;
  }

  /** 現在の強度（0〜1）。範囲外は丸め、非数は 100% として扱う。 */
  get strength(): number {
    const v = this.strengthSource();
    if (!Number.isFinite(v)) return 1;
    return Math.min(1, Math.max(0, v / 100));
  }

  /** 直近の `step()` の結果。 */
  get output(): CameraEffectsOutput {
    return this.last;
  }

  /** `resetPeaks` 以降の補正の最大値（E2E: 短い演出を実時間のポーリングで取りこぼさないため）。 */
  get peak(): Readonly<{ shakeDeg: number; fovOffsetDeg: number }> {
    return this.peaks;
  }

  resetPeaks(): void {
    this.peaks = { shakeDeg: 0, fovOffsetDeg: 0 };
  }

  /** 何か再生中か。 */
  get active(): boolean {
    return this.shakes.length > 0 || this.kicks.length > 0 || this.clips.length > 0;
  }

  /** 再生中のクリップの id。 */
  get playingClips(): readonly string[] {
    return this.clips.map((c) => c.clip.id);
  }

  /** 振動を加える。`scale`（距離減衰など）は振幅へ掛ける。強度設定は `step()` で掛かる。 */
  shake(amplitudeDeg: number, frames: number, scale = 1): void {
    const amplitude = amplitudeDeg * scale;
    if (amplitude <= 0 || frames <= 0) return;
    this.shakes.push({ amplitudeDeg: amplitude, frames: Math.floor(frames), elapsed: 0 });
  }

  /** FOV を `deg` だけ広げ、`frames` かけて 0 へ戻す。 */
  fovKick(deg: number, frames: number): void {
    if (deg === 0 || frames <= 0) return;
    this.kicks.push({ deg, frames: Math.floor(frames), elapsed: 0 });
  }

  /** 被弾（軽）。 */
  hitLight(): void {
    this.shake(CAMERA_FX.hitLight.shakeDeg, CAMERA_FX.hitLight.shakeFrames);
  }

  /** 被弾（重 / ボスの攻撃）。振動 + FOV キック。 */
  hitHeavy(): void {
    const c = CAMERA_FX.hitHeavy;
    this.shake(c.shakeDeg, c.shakeFrames);
    this.fovKick(c.fovDeg, c.fovFrames);
  }

  /** プレイヤーの強攻撃がヒットした。 */
  playerHeavyHit(): void {
    this.shake(CAMERA_FX.playerHeavyHit.shakeDeg, CAMERA_FX.playerHeavyHit.shakeFrames);
  }

  /** ボスの叩きつけ。`distance` は叩きつけの位置とプレイヤーの水平距離 [m]（省略時は減衰なし）。 */
  slam(distance = 0): void {
    const c = CAMERA_FX.slam;
    this.shake(c.shakeDeg, c.shakeFrames, distanceFalloff(distance, c.near, c.far));
  }

  /** クリップを再生する。同じ `id` が再生中なら頭から再生し直す。 */
  playClip(clip: CameraClip, options: CameraClipOptions = {}): void {
    this.stopClip(clip.id);
    if (clip.frames <= 0) return;
    this.clips.push({ clip, intensity: options.intensity ?? 1, elapsed: 0 });
  }

  stopClip(id: string): void {
    this.clips = this.clips.filter((c) => c.clip.id !== id);
  }

  /** すべての演出を止める（死亡・リスポーン）。 */
  clear(): void {
    this.shakes = [];
    this.kicks = [];
    this.clips = [];
    this.last = ZERO;
  }

  /** 1 固定ステップ進めて、このステップの補正を返す。ステップごとに 1 回だけ呼ぶ。 */
  step(): CameraEffectsOutput {
    if (!this.active) {
      this.last = ZERO;
      return ZERO;
    }
    const strength = this.strength;
    let envelope = 0;
    let fovKick = 0;
    let fov = 0;
    let arm = 0;

    for (const s of this.shakes) {
      // 振幅は線形に減衰（最初のステップが最大、最後のステップが 1/frames）
      envelope = Math.max(envelope, s.amplitudeDeg * (1 - s.elapsed / s.frames));
      s.elapsed++;
    }
    this.shakes = this.shakes.filter((s) => s.elapsed < s.frames);

    for (const k of this.kicks) {
      const v = k.deg * (1 - k.elapsed / k.frames);
      if (Math.abs(v) > Math.abs(fovKick)) fovKick = v;
      k.elapsed++;
    }
    this.kicks = this.kicks.filter((k) => k.elapsed < k.frames);

    for (const c of this.clips) {
      const shake = sampleClipChannel(c.clip, 'shakeDeg', c.elapsed);
      if (shake !== undefined) envelope = Math.max(envelope, shake * c.intensity);
      fov += (sampleClipChannel(c.clip, 'fovOffsetDeg', c.elapsed) ?? 0) * c.intensity;
      arm += (sampleClipChannel(c.clip, 'armOffsetM', c.elapsed) ?? 0) * c.intensity;
      c.elapsed++;
    }
    this.clips = this.clips.filter((c) => c.elapsed < c.clip.frames);

    const shakeDeg = envelope * strength;
    let shakeYaw = 0;
    let shakePitch = 0;
    if (shakeDeg > 0) {
      shakeYaw = this.random() * shakeDeg * DEG;
      shakePitch = this.random() * shakeDeg * DEG;
    }
    this.last = {
      shakeYaw,
      shakePitch,
      shakeDeg,
      fovOffsetDeg: Math.min(
        CAMERA_FX.fovOffsetMaxDeg,
        Math.max(CAMERA_FX.fovOffsetMinDeg, fovKick * strength + fov),
      ),
      armOffsetM: Math.min(CAMERA_FX.armOffsetMaxM, Math.max(CAMERA_FX.armOffsetMinM, arm)),
    };
    this.peaks.shakeDeg = Math.max(this.peaks.shakeDeg, this.last.shakeDeg);
    this.peaks.fovOffsetDeg = Math.max(this.peaks.fovOffsetDeg, this.last.fovOffsetDeg);
    return this.last;
  }

  /** -1〜1 の決定的な乱数（揺れがテストで再現する）。 */
  private random(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed / 2147483647) * 2 - 1;
  }
}

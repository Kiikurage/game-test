import { describe, expect, it } from 'vitest';
import { CAMERA_FX } from '../data/cameraEffects';
import { PHASE_TRANSITION_CLIP } from './cameraClips';
import {
  CameraEffects,
  distanceFalloff,
  sampleClipChannel,
  type CameraClip,
} from './cameraEffects';

/** `n` ステップ進めて、各ステップの出力を返す。 */
function run(fx: CameraEffects, n: number) {
  return Array.from({ length: n }, () => fx.step());
}

describe('CameraEffects: 各演出の持続と振幅（3.3 節）', () => {
  it('被弾（軽）: 0.3°・6F。最初のステップが最大で、6F 目まで揺れ、7F 目からは 0', () => {
    const fx = new CameraEffects();
    fx.hitLight();
    const out = run(fx, 8);
    expect(out[0]?.shakeDeg).toBeCloseTo(0.3, 6);
    for (let i = 0; i < 6; i++) expect(out[i]?.shakeDeg).toBeGreaterThan(0);
    expect(out[6]?.shakeDeg).toBe(0);
    expect(out[7]?.shakeDeg).toBe(0);
    expect(fx.active).toBe(false);
    // 揺れの向きの大きさは振幅以内
    for (const o of out) {
      const limit = ((o.shakeDeg * Math.PI) / 180) * 1.0001;
      expect(Math.abs(o.shakeYaw)).toBeLessThanOrEqual(limit);
      expect(Math.abs(o.shakePitch)).toBeLessThanOrEqual(limit);
    }
  });

  it('被弾（重）: 0.8°・12F + FOV +2° が 8F で 0 へ戻る', () => {
    const fx = new CameraEffects();
    fx.hitHeavy();
    const out = run(fx, 14);
    expect(out[0]?.shakeDeg).toBeCloseTo(0.8, 6);
    expect(out[11]?.shakeDeg).toBeGreaterThan(0);
    expect(out[12]?.shakeDeg).toBe(0);
    expect(out[0]?.fovOffsetDeg).toBeCloseTo(2, 6);
    // 単調に減り、8F 目（index 7）まで正、9F 目で 0 になって復帰済み
    for (let i = 1; i < 8; i++) {
      expect(out[i]?.fovOffsetDeg).toBeLessThan(out[i - 1]?.fovOffsetDeg ?? 0);
      expect(out[i]?.fovOffsetDeg).toBeGreaterThan(0);
    }
    expect(out[8]?.fovOffsetDeg).toBe(0);
    expect(out[13]?.fovOffsetDeg).toBe(0);
  });

  it('強攻撃ヒット: 0.4°・8F', () => {
    const fx = new CameraEffects();
    fx.playerHeavyHit();
    const out = run(fx, 10);
    expect(out[0]?.shakeDeg).toBeCloseTo(0.4, 6);
    expect(out[7]?.shakeDeg).toBeGreaterThan(0);
    expect(out[8]?.shakeDeg).toBe(0);
    expect(out[0]?.fovOffsetDeg).toBe(0);
  });

  it('ボスの叩きつけ: 1.2°・24F、距離で減衰', () => {
    const near = new CameraEffects();
    near.slam(CAMERA_FX.slam.near);
    const nearOut = run(near, 26);
    expect(nearOut[0]?.shakeDeg).toBeCloseTo(1.2, 6);
    expect(nearOut[23]?.shakeDeg).toBeGreaterThan(0);
    expect(nearOut[24]?.shakeDeg).toBe(0);

    const mid = new CameraEffects();
    mid.slam((CAMERA_FX.slam.near + CAMERA_FX.slam.far) / 2);
    expect(mid.step().shakeDeg).toBeCloseTo(0.6, 6);

    const far = new CameraEffects();
    far.slam(CAMERA_FX.slam.far + 5);
    expect(far.active).toBe(false);
    expect(far.step().shakeDeg).toBe(0);
  });

  it('distanceFalloff: near 以内 1、far 以上 0、間は線形', () => {
    expect(distanceFalloff(0, 3, 24)).toBe(1);
    expect(distanceFalloff(3, 3, 24)).toBe(1);
    expect(distanceFalloff(13.5, 3, 24)).toBeCloseTo(0.5, 6);
    expect(distanceFalloff(24, 3, 24)).toBe(0);
    expect(distanceFalloff(100, 3, 24)).toBe(0);
  });
});

describe('CameraEffects: 強度設定（9.3 節）', () => {
  it('既定（設定ストア未接続）は 100%', () => {
    const fx = new CameraEffects();
    expect(fx.strength).toBe(1);
    fx.hitHeavy();
    expect(fx.step().shakeDeg).toBeCloseTo(0.8, 6);
  });

  it('50%: 振幅と FOV キックが半分', () => {
    const fx = new CameraEffects();
    fx.setStrengthSource(() => 50);
    fx.hitHeavy();
    const out = fx.step();
    expect(out.shakeDeg).toBeCloseTo(0.4, 6);
    expect(out.fovOffsetDeg).toBeCloseTo(1, 6);
  });

  it('OFF（0%）: 振動も FOV キックも出ない。設定は即時に反映される', () => {
    let percent = 0;
    const fx = new CameraEffects();
    fx.setStrengthSource(() => percent);
    fx.hitHeavy();
    const out = fx.step();
    expect(out.shakeDeg).toBe(0);
    expect(out.shakeYaw).toBe(0);
    expect(out.shakePitch).toBe(0);
    expect(out.fovOffsetDeg).toBe(0);
    percent = 100;
    fx.hitHeavy();
    expect(fx.step().shakeDeg).toBeGreaterThan(0);
  });

  it('不正な値は丸める（範囲外は 0〜100、非数は 100%）', () => {
    const fx = new CameraEffects();
    fx.setStrengthSource(() => 250);
    expect(fx.strength).toBe(1);
    fx.setStrengthSource(() => -5);
    expect(fx.strength).toBe(0);
    fx.setStrengthSource(() => Number.NaN);
    expect(fx.strength).toBe(1);
  });

  it('クリップの距離・FOV は強度で変わらない（振動チャンネルだけ掛かる）', () => {
    const fx = new CameraEffects();
    fx.setStrengthSource(() => 0);
    fx.playClip(PHASE_TRANSITION_CLIP);
    const out = run(fx, 61)[60];
    expect(out?.armOffsetM).toBeCloseTo(1.5, 6);
    expect(out?.fovOffsetDeg).toBeCloseTo(6, 6);
    expect(out?.shakeDeg).toBe(0);
  });
});

describe('CameraEffects: 重なり時の合成', () => {
  it('振動は最大値採用（足し合わせない）', () => {
    const fx = new CameraEffects();
    fx.hitLight(); // 0.3
    fx.hitLight(); // 0.3
    fx.playerHeavyHit(); // 0.4
    expect(fx.step().shakeDeg).toBeCloseTo(0.4, 6);
  });

  it('大きい振動が減衰して小さい方を下回ったら、小さい方が残りを担う', () => {
    const fx = new CameraEffects();
    fx.slam(0); // 1.2°・24F: 1 ステップごとに 0.05 減る
    const first = fx.step().shakeDeg;
    fx.hitHeavy(); // 0.8°・12F
    expect(first).toBeCloseTo(1.2, 6);
    expect(fx.step().shakeDeg).toBeCloseTo(1.2 * (1 - 1 / 24), 6);
    // slam が 0.8 を下回るのは 1.2*(1-n/24) < 0.8 → n > 8。その後は slam の減衰が優先される（最大値）
    const out = run(fx, 20);
    expect(out.every((o) => o.shakeDeg <= 1.2)).toBe(true);
  });

  it('FOV キックは最大値採用', () => {
    const fx = new CameraEffects();
    fx.hitHeavy();
    fx.hitHeavy();
    expect(fx.step().fovOffsetDeg).toBeCloseTo(2, 6);
  });

  it('クリップの FOV・距離は加算し、上下限で頭打ち', () => {
    const fx = new CameraEffects();
    const big: CameraClip = {
      id: 'big',
      frames: 4,
      keys: [{ frame: 0, armOffsetM: 2, fovOffsetDeg: 8 }],
    };
    const big2: CameraClip = { ...big, id: 'big2' };
    fx.playClip(big);
    fx.playClip(big2);
    const out = fx.step();
    expect(out.armOffsetM).toBe(CAMERA_FX.armOffsetMaxM);
    expect(out.fovOffsetDeg).toBe(CAMERA_FX.fovOffsetMaxDeg);
  });
});

describe('カメラ演出クリップ', () => {
  const clip: CameraClip = {
    id: 'test',
    frames: 10,
    ease: 'linear',
    keys: [
      { frame: 2, armOffsetM: 0, fovOffsetDeg: 0 },
      { frame: 6, armOffsetM: 2, fovOffsetDeg: 4, shakeDeg: 1 },
      { frame: 9, armOffsetM: 0 },
    ],
  };

  it('キーの間を補間し、最初より前は最初の値、最後より後は最後の値を保つ', () => {
    expect(sampleClipChannel(clip, 'armOffsetM', 0)).toBe(0);
    expect(sampleClipChannel(clip, 'armOffsetM', 4)).toBeCloseTo(1, 6);
    expect(sampleClipChannel(clip, 'armOffsetM', 6)).toBe(2);
    expect(sampleClipChannel(clip, 'armOffsetM', 12)).toBe(0);
    // FOV は最後のキー（frame 6）の値を保つ
    expect(sampleClipChannel(clip, 'fovOffsetDeg', 9)).toBe(4);
    // キーのないチャンネルは undefined
    expect(sampleClipChannel({ ...clip, keys: [] }, 'shakeDeg', 3)).toBeUndefined();
  });

  it('smooth は両端で滑らかに（中間点は線形と同じ）', () => {
    const smooth: CameraClip = { ...clip, ease: 'smooth' };
    expect(sampleClipChannel(smooth, 'armOffsetM', 4)).toBeCloseTo(1, 6);
    expect(sampleClipChannel(smooth, 'armOffsetM', 3)).toBeLessThan(0.5);
  });

  it('frames ステップだけ再生して終わり、補正は 0 へ戻る', () => {
    const fx = new CameraEffects();
    fx.playClip(clip);
    expect(fx.playingClips).toEqual(['test']);
    const out = run(fx, 11);
    expect(out[6]?.armOffsetM).toBeCloseTo(2, 6);
    expect(out[6]?.shakeDeg).toBeCloseTo(1, 6);
    expect(out[10]?.armOffsetM).toBe(0);
    expect(out[10]?.fovOffsetDeg).toBe(0);
    expect(fx.playingClips).toEqual([]);
    expect(fx.active).toBe(false);
  });

  it('同じ id の再生は頭からやり直し、intensity で倍率を掛け、stopClip で止まる', () => {
    const fx = new CameraEffects();
    fx.playClip(clip);
    run(fx, 6);
    fx.playClip(clip, { intensity: 0.5 });
    expect(fx.playingClips).toEqual(['test']);
    const out = run(fx, 7);
    expect(out[6]?.armOffsetM).toBeCloseTo(1, 6);
    fx.stopClip('test');
    expect(fx.step().armOffsetM).toBe(0);
  });

  it('フェーズ移行（6.5 節）: F60 で距離 +1.5m・FOV +6°・振動 0.8°、F100 まで保ち、F120 で戻る', () => {
    const fx = new CameraEffects();
    fx.playClip(PHASE_TRANSITION_CLIP);
    const out = run(fx, 121);
    expect(out[0]?.armOffsetM).toBe(0);
    expect(out[30]?.shakeDeg).toBe(0);
    expect(out[60]?.armOffsetM).toBeCloseTo(1.5, 6);
    expect(out[60]?.fovOffsetDeg).toBeCloseTo(6, 6);
    expect(out[60]?.shakeDeg).toBeCloseTo(0.8, 6);
    expect(out[100]?.armOffsetM).toBeCloseTo(1.5, 6);
    expect(out[100]?.fovOffsetDeg).toBeCloseTo(6, 6);
    expect(out[119]?.armOffsetM).toBeCloseTo(0, 6);
    expect(out[119]?.shakeDeg).toBeCloseTo(0, 6);
    expect(out[120]?.armOffsetM).toBe(0);
    expect(fx.active).toBe(false);
  });

  it('clear で全部止まる', () => {
    const fx = new CameraEffects();
    fx.hitHeavy();
    fx.playClip(PHASE_TRANSITION_CLIP);
    fx.clear();
    expect(fx.active).toBe(false);
    expect(fx.step().shakeDeg).toBe(0);
  });
});

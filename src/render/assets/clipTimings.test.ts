import { beforeAll, describe, expect, it } from 'vitest';
import {
  CLIP_FPS,
  footForwardPhase,
  loadClipMeasure,
  peakSpeedFrame,
  type ClipMeasure,
} from '../../../scripts/assets/clipMeasure.mjs';
import { playerClipEvents } from '../../game/anim/playerClips';
import {
  GAIT_CLIP_FRAMES,
  GAIT_PHASE_OFFSET,
  GAIT_RIGHT_FOOT_PHASE,
} from '../../game/anim/locomotion';

/**
 * マーカー表・歩行定数の値を、実際の animations.glb（meshopt 圧縮）から実測した値と突き合わせる。
 * 実測の手順は scripts/assets/clipMeasure.mjs（`node scripts/assets/clipMeasure.mjs`）。
 */
describe('実クリップとの整合（animations.glb を実測）', () => {
  let measure: ClipMeasure;
  beforeAll(async () => {
    measure = await loadClipMeasure();
  });

  const framesOf = (clip: string): number => {
    const info = measure.clips.get(clip);
    if (!info) throw new Error(`clip not found: ${clip}`);
    return info.frames;
  };

  it('キーフレームレートは 30fps で、表の clipFps と一致する', () => {
    expect(CLIP_FPS).toBe(30);
    for (const e of playerClipEvents.entries) expect(e.clipFps, e.id).toBe(CLIP_FPS);
  });

  it('マーカー表の再生範囲は、実クリップの長さに収まる', () => {
    for (const e of playerClipEvents.entries) {
      expect(e.clipRange.endFrame, e.id).toBeLessThanOrEqual(framesOf(e.clip));
    }
  });

  it('戻りクリップ（tail）の再生範囲は、実クリップの長さに収まる', () => {
    const withTail = playerClipEvents.entries.filter((e) => e.tail !== undefined);
    expect(withTail.length).toBeGreaterThan(0);
    for (const e of withTail) {
      expect(e.tail?.endFrame, e.id).toBeLessThanOrEqual(framesOf(e.tail?.clip ?? ''));
    }
  });

  it('攻撃の clipHitFrame は、手（剣）の速さが最大になる実測フレームと一致する（±1F）', () => {
    const attacks = playerClipEvents.entries.filter((e) => e.clipHitFrame !== undefined);
    expect(attacks.length).toBeGreaterThan(0);
    for (const e of attacks) {
      const measured = peakSpeedFrame(measure, e.clip, 'hand_r', [
        e.clipRange.startFrame,
        e.clipRange.endFrame,
      ]);
      expect(
        Math.abs((e.clipHitFrame ?? 0) - measured),
        `${e.id}: 実測 ${measured}`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it('ロールは Roll の 1.4s（実クリップ 1.47s のうち立ち上がりの手前まで）を 32F に合わせる', () => {
    const roll = playerClipEvents.entries.find((e) => e.id === 'player.roll');
    expect(roll?.clipRange.endFrame).toBe(42);
    expect(framesOf('Roll')).toBe(44);
  });

  it('歩行ループの長さ（フレーム数）が定数と一致する', () => {
    expect(framesOf('Walk_Loop')).toBe(GAIT_CLIP_FRAMES.walk);
    expect(framesOf('Jog_Fwd_Loop')).toBe(GAIT_CLIP_FRAMES.jog);
    expect(framesOf('Sprint_Loop')).toBe(GAIT_CLIP_FRAMES.sprint);
  });

  it('左足が最も前に出る位相が、共通位相のオフセットと一致する（足の運びが揃う）', () => {
    const clips = { walk: 'Walk_Loop', jog: 'Jog_Fwd_Loop', sprint: 'Sprint_Loop' } as const;
    for (const g of ['walk', 'jog', 'sprint'] as const) {
      const left = footForwardPhase(measure, clips[g], 'foot_l');
      const d = Math.abs(((left - GAIT_PHASE_OFFSET[g] + 1.5) % 1) - 0.5);
      expect(d, `${g} 左足 ${left.toFixed(3)}`).toBeLessThan(0.03);
    }
  });

  it('右足の接地の共通位相が、足音の位相定数と一致する', () => {
    const clips = { walk: 'Walk_Loop', jog: 'Jog_Fwd_Loop', sprint: 'Sprint_Loop' } as const;
    for (const g of ['walk', 'jog', 'sprint'] as const) {
      const left = footForwardPhase(measure, clips[g], 'foot_l');
      const right = footForwardPhase(measure, clips[g], 'foot_r');
      const common = (((right - left) % 1) + 1) % 1;
      expect(
        Math.abs(common - GAIT_RIGHT_FOOT_PHASE[g]),
        `${g} 右足 ${common.toFixed(3)}`,
      ).toBeLessThan(0.04);
    }
  });
});

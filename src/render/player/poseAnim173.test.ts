import {
  AnimationClip,
  Object3D,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
} from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import {
  THRUST_CLIP_FRAMES,
  THRUST_CLIP_NAME,
  buildThrustClip,
  thrustLunge,
} from '../anim/thrustClip';
import { BonePoseGuard } from './bonePoseGuard';
import { drinkPose, flaskFill } from './drinkPose';
import { rotateBoneAbout, solveTwoBone } from './poseUtils';
import { StepClock } from './stepClock';
import { thrustPose } from './thrustPose';

function arm(): { upper: Object3D; lower: Object3D; hand: Object3D } {
  const upper = new Object3D();
  const lower = new Object3D();
  const hand = new Object3D();
  lower.position.set(0, -0.3, 0);
  hand.position.set(0, -0.3, 0);
  upper.add(lower);
  lower.add(hand);
  // 実際のボーンは必ず親（肩・背骨）を持つ
  new Object3D().add(upper);
  upper.updateWorldMatrix(true, true);
  return { upper, lower, hand };
}

describe('poseUtils', () => {
  it('rotateBoneAbout は +X まわりの正の回転で +Y を前（+Z）へ倒す', () => {
    const parent = new Object3D();
    const child = new Object3D();
    child.position.set(0, 1, 0);
    parent.add(child);
    new Object3D().add(parent);
    parent.updateWorldMatrix(true, true);
    rotateBoneAbout(parent, new Vector3(1, 0, 0), 0.5);
    const p = child.getWorldPosition(new Vector3());
    expect(p.z).toBeGreaterThan(0.4);
    expect(p.y).toBeCloseTo(Math.cos(0.5), 5);
  });

  it('solveTwoBone は届く目標へ手を寄せ、届かない目標では腕を伸ばしきる', () => {
    const { upper, lower, hand } = arm();
    solveTwoBone(upper, lower, hand, new Vector3(0.3, -0.3, 0.2), new Vector3(0, 0, -1));
    expect(
      hand.getWorldPosition(new Vector3()).distanceTo(new Vector3(0.3, -0.3, 0.2)),
    ).toBeLessThan(1e-3);
    const far = arm();
    solveTwoBone(far.upper, far.lower, far.hand, new Vector3(0, 0, 5), new Vector3(0, -1, 0));
    const h = far.hand.getWorldPosition(new Vector3());
    expect(h.length()).toBeGreaterThan(0.59);
    expect(h.z).toBeGreaterThan(0.59);
  });
});

describe('BonePoseGuard', () => {
  it('ミキサーが書き直さないフレームでも、補正が重ならない', () => {
    const bone = new Object3D();
    new Object3D().add(bone);
    bone.updateWorldMatrix(true, true);
    const guard = new BonePoseGuard([bone]);
    const axis = new Vector3(1, 0, 0);
    const apply = (): void => {
      guard.begin();
      rotateBoneAbout(bone, axis, 0.3);
      guard.end();
    };
    apply();
    const first = bone.quaternion.clone();
    apply();
    apply();
    expect(bone.quaternion.angleTo(first)).toBeLessThan(1e-6);
    guard.restore();
    expect(bone.quaternion.angleTo(new Object3D().quaternion)).toBeLessThan(1e-6);
  });
});

describe('突きの派生クリップ', () => {
  it('Sword_Regular_C の両端の姿勢だけから、跳ねのない 27 キーのクリップを作る', () => {
    const times = [0, 1, 2];
    const source = new AnimationClip('Sword_Regular_C', 2, [
      new VectorKeyframeTrack('pelvis.position', times, [0, 0.5, 0, 0, 1, 0, 0, 0.3, 0]),
      new QuaternionKeyframeTrack(
        'spine_01.quaternion',
        times,
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      ),
    ]);
    const clip = buildThrustClip(source);
    expect(clip.name).toBe(THRUST_CLIP_NAME);
    const pelvis = clip.tracks[0];
    expect(pelvis?.times.length).toBe(THRUST_CLIP_FRAMES + 1);
    // 元クリップの途中の山（t = 1s の y = 1）は現れない（両端 t = 0.9s・2s の姿勢の間だけ）
    expect(Math.max(...Array.from(pelvis?.values ?? []))).toBeLessThan(0.96);
  });

  it('踏み込みは溜めで緩く、発生フレームで最大になり、最後は構えへ戻る', () => {
    expect(thrustLunge(0)).toBe(0);
    expect(thrustLunge(4)).toBeLessThan(0.5);
    expect(thrustLunge(8)).toBeCloseTo(1, 6);
    expect(thrustLunge(12)).toBe(1);
    expect(thrustLunge(THRUST_CLIP_FRAMES)).toBeCloseTo(0, 6);
  });
});

describe('突きの手続き姿勢の時間割', () => {
  it('溜め（F1〜F15）では伸びず、判定開始 F17 にはほぼ伸びきり、F44 以降は戻る', () => {
    expect(thrustPose(10).extend).toBe(0);
    expect(thrustPose(10).chamber).toBeGreaterThan(0.5);
    expect(thrustPose(17).extend).toBeGreaterThan(0.6);
    expect(thrustPose(20).extend).toBeCloseTo(1, 1);
    expect(thrustPose(44).extend).toBeCloseTo(0, 5);
    expect(thrustPose(60).weight).toBe(0);
  });

  it('溜めでは体幹が引け、突きで回し込む', () => {
    expect(thrustPose(14).twist).toBeLessThan(0);
    expect(thrustPose(21).twist).toBeGreaterThan(0);
  });
});

describe('回復の時間割', () => {
  it('手を上げて、頭を反らして飲み、手を下ろす。瓶は動作の間だけ現れる', () => {
    expect(drinkPose(0).flask).toBe(0);
    expect(drinkPose(0.3).arm).toBeCloseTo(1, 1);
    expect(drinkPose(0.3).sip).toBeGreaterThan(0.5);
    expect(drinkPose(0.9).arm).toBeLessThan(0.1);
    expect(drinkPose(1).flask).toBe(0);
  });

  it('中身は飲む間に減り、空振りの瓶は空', () => {
    expect(flaskFill(0.2, false)).toBe(1);
    expect(flaskFill(0.7, false)).toBeLessThan(0.5);
    expect(flaskFill(0.2, true)).toBe(0);
  });
});

describe('StepClock', () => {
  it('ステップの間は端数を足し、ヒットストップ中は進めない', () => {
    const c = new StepClock();
    expect(c.update(0.01, 5, false)).toBe(4);
    expect(c.update(0.008, 5, false)).toBeCloseTo(4.48, 2);
    expect(c.update(1, 5, true)).toBeCloseTo(4.48, 2);
    expect(c.update(1, 5, false)).toBe(5);
  });
});

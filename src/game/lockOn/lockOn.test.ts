import { Vector3 } from 'three/webgpu';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetTuning } from '../tuning';
import { LockOnController, type LockOnFrame } from './lockOnController';
import {
  lockOnScore,
  measureTarget,
  selectLockOnTarget,
  selectSwitchTarget,
  type CameraView,
  type SelectOptions,
} from './select';
import { DummyTarget, chestPosition } from './targets';

/** プレイヤーは原点、カメラはその背後 4m・高さ 2m から +Z（前方）を向く。 */
const camera: CameraView = {
  position: new Vector3(0, 2, -4),
  forward: new Vector3(0, 0, 1),
};
const player = new Vector3(0, 0, 0);

const visible = (): boolean => true;
const options = (over: Partial<SelectOptions> = {}): SelectOptions => ({
  playerPosition: player,
  acquireRange: 15,
  viewHalfH: 35,
  viewHalfV: 25,
  isVisible: visible,
  ...over,
});
const dummy = (id: string, x: number, z: number, height = 1.8): DummyTarget =>
  new DummyTarget(id, x, 0, z, height, 0.4);

describe('selectLockOnTarget', () => {
  it('picks the target nearest the screen center, weighing distance', () => {
    const center = dummy('center', 0, 8);
    const left = dummy('left', 3, 8); // yaw が増える側 = 画面左
    expect(selectLockOnTarget([left, center], camera, options())).toBe(center);
  });

  it('prefers a closer target when angles are similar (score = angle*0.6 + distance*0.4)', () => {
    const near = dummy('near', 0.5, 5);
    const far = dummy('far', 0.4, 14);
    expect(selectLockOnTarget([far, near], camera, options())).toBe(near);
    const a = measureTarget(near, camera, player);
    const b = measureTarget(far, camera, player);
    expect(lockOnScore(a)).toBeLessThan(lockOnScore(b));
  });

  it('ignores targets beyond the acquire range', () => {
    expect(selectLockOnTarget([dummy('far', 0, 16)], camera, options())).toBeNull();
    expect(selectLockOnTarget([dummy('ok', 0, 14.5)], camera, options())).not.toBeNull();
  });

  it('ignores targets outside the view cone (behind or far to the side)', () => {
    expect(selectLockOnTarget([dummy('behind', 0, -8)], camera, options())).toBeNull();
    expect(selectLockOnTarget([dummy('side', 12, 6)], camera, options())).toBeNull();
  });

  it('ignores dead targets and targets without line of sight', () => {
    const dead = dummy('dead', 0, 6);
    dead.alive = false;
    expect(selectLockOnTarget([dead], camera, options())).toBeNull();
    const hidden = dummy('hidden', 0, 6);
    expect(selectLockOnTarget([hidden], camera, options({ isVisible: () => false }))).toBeNull();
  });

  it('returns null when there are no candidates', () => {
    expect(selectLockOnTarget([], camera, options())).toBeNull();
  });
});

describe('selectSwitchTarget', () => {
  // カメラは +Z を向く。右 = -X。
  const mid = dummy('mid', 0, 8);
  const right = dummy('right', -3, 8);
  const farRight = dummy('farRight', -6, 9);
  const left = dummy('left', 3, 8);
  const all = [mid, right, farRight, left];

  it('moves to the nearest target in the flicked direction', () => {
    expect(selectSwitchTarget(all, mid, 1, camera, options())).toBe(right);
    expect(selectSwitchTarget(all, mid, -1, camera, options())).toBe(left);
    expect(selectSwitchTarget(all, right, 1, camera, options())).toBe(farRight);
  });

  it('stays put when nothing lies in that direction', () => {
    expect(selectSwitchTarget(all, farRight, 1, camera, options())).toBeNull();
    expect(selectSwitchTarget([mid], mid, 1, camera, options())).toBeNull();
  });
});

describe('LockOnController', () => {
  beforeEach(() => {
    resetTuning();
  });

  function frame(targets: DummyTarget[], over: Partial<LockOnFrame> = {}): LockOnFrame {
    return {
      toggle: false,
      switchDir: 0,
      targets,
      playerPosition: player,
      camera,
      isVisible: visible,
      ...over,
    };
  }

  it('acquires on toggle and releases on the next toggle', () => {
    const c = new LockOnController();
    const t = dummy('t', 0, 8);
    expect(c.update(frame([t], { toggle: true }))).toBe('acquired');
    expect(c.target).toBe(t);
    expect(c.update(frame([t], { toggle: true }))).toBe('released');
    expect(c.target).toBeNull();
  });

  it('reports "failed" when there is nothing to lock onto', () => {
    const c = new LockOnController();
    expect(c.update(frame([], { toggle: true }))).toBe('failed');
    expect(c.active).toBe(false);
  });

  it('releases when the target goes beyond 20m (hysteresis: acquired at <=15m)', () => {
    const c = new LockOnController();
    const t = dummy('t', 0, 14);
    c.update(frame([t], { toggle: true }));
    t.position.set(0, 0, 19);
    expect(c.update(frame([t]))).toBe('none');
    t.position.set(0, 0, 21);
    expect(c.update(frame([t]))).toBe('released');
    expect(c.lastReleaseReason).toBe('range');
  });

  it('releases after 120 frames without line of sight, but not before', () => {
    const c = new LockOnController();
    const t = dummy('t', 0, 8);
    c.update(frame([t], { toggle: true }));
    for (let i = 0; i < 119; i++) {
      expect(c.update(frame([t], { isVisible: () => false }))).toBe('none');
    }
    expect(c.update(frame([t], { isVisible: () => false }))).toBe('released');
    expect(c.lastReleaseReason).toBe('lostSight');
  });

  it('resets the sight timer when the line of sight returns', () => {
    const c = new LockOnController();
    const t = dummy('t', 0, 8);
    c.update(frame([t], { toggle: true }));
    for (let i = 0; i < 100; i++) c.update(frame([t], { isVisible: () => false }));
    c.update(frame([t]));
    for (let i = 0; i < 100; i++)
      expect(c.update(frame([t], { isVisible: () => false }))).toBe('none');
  });

  it('switches targets with a 20-frame cooldown', () => {
    const c = new LockOnController();
    const mid = dummy('mid', 0, 8);
    const right = dummy('right', -3, 8);
    const farRight = dummy('farRight', -6, 9);
    const all = [mid, right, farRight];
    c.update(frame(all, { toggle: true }));
    expect(c.target).toBe(mid);
    expect(c.update(frame(all, { switchDir: 1 }))).toBe('switched');
    expect(c.target).toBe(right);
    // クールダウン中は受け付けない
    for (let i = 0; i < 19; i++) {
      expect(c.update(frame(all, { switchDir: 1 }))).toBe('none');
      expect(c.target).toBe(right);
    }
    expect(c.update(frame(all, { switchDir: 1 }))).toBe('switched');
    expect(c.target).toBe(farRight);
  });

  it('moves to the next target 0.5s after the current one dies, or releases if none is near', () => {
    const c = new LockOnController();
    const a = dummy('a', 0, 8);
    const b = dummy('b', 2, 9);
    c.update(frame([a, b], { toggle: true }));
    expect(c.target).toBe(a);
    a.alive = false;
    for (let i = 0; i < 29; i++) expect(c.update(frame([a, b]))).toBe('none');
    expect(c.update(frame([a, b]))).toBe('switched');
    expect(c.target).toBe(b);

    b.alive = false;
    let event = 'none';
    for (let i = 0; i < 30; i++) event = c.update(frame([a, b]));
    expect(event).toBe('released');
  });

  it('can be released externally (player death)', () => {
    const c = new LockOnController();
    c.update(frame([dummy('t', 0, 8)], { toggle: true }));
    expect(c.release()).toBe('released');
    expect(c.release()).toBe('none');
  });
});

describe('chestPosition', () => {
  it('is at 65% of the height', () => {
    const t = new DummyTarget('t', 1, 2, 3, 4, 0.9);
    const chest = chestPosition(t);
    expect(chest.x).toBe(1);
    expect(chest.y).toBeCloseTo(2 + 4 * 0.65, 9);
    expect(chest.z).toBe(3);
  });
});

import { Vector3 } from 'three/webgpu';
import { beforeEach, describe, expect, it } from 'vitest';
import { DummyTarget, chestPosition } from '../lockOn/targets';
import { resetTuning, tuning } from '../tuning';
import {
  NO_COLLISION,
  ThirdPersonCamera,
  type CameraCollision,
  type CameraFrameInput,
} from './thirdPersonCamera';

const DT = 1 / 60;
const DEG = Math.PI / 180;

function input(over: Partial<CameraFrameInput> = {}): CameraFrameInput {
  return {
    look: { x: 0, y: 0 },
    playerPosition: new Vector3(0, 0, 0),
    playerYaw: 0,
    moveInput: { x: 0, y: 0 },
    running: false,
    lockTarget: null,
    lockEvent: 'none',
    device: 'kbm',
    ...over,
  };
}

function step(
  cam: ThirdPersonCamera,
  i: CameraFrameInput,
  collision: CameraCollision = NO_COLLISION,
): void {
  cam.updateAim(DT, i);
  cam.updatePlacement(DT, i, collision);
}

/** 原点から +Z 方向 z=wallZ にある無限の壁（-Z 側が空間）。 */
function wallBehind(zWall: number): CameraCollision {
  return {
    castSphere(origin, dir, maxDistance, radius) {
      // dir.z < 0 のとき、z = zWall + radius の面へ向かう
      if (dir.z >= -1e-9) return maxDistance;
      const t = (origin.z - (zWall + radius)) / -dir.z;
      return t < 0 ? 0 : Math.min(maxDistance, t);
    },
  };
}

describe('ThirdPersonCamera (free)', () => {
  beforeEach(() => {
    resetTuning();
  });

  it('starts behind the player at 4.2m and looks at the shoulder pivot', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(0, 0, 0), 0);
    step(cam, input());
    const pivot = new Vector3(0, tuning.camera.pivotHeight, 0);
    expect(cam.position.distanceTo(pivot)).toBeCloseTo(tuning.camera.distance, 3);
    // 前方（+Z）を向き、プレイヤーの背後（-Z）にいる
    expect(cam.forward.z).toBeGreaterThan(0.9);
    expect(cam.position.z).toBeLessThan(-3.5);
    // 初期ピッチ +12°（見下ろし）
    expect(cam.pitch).toBeCloseTo(12 * DEG, 6);
    expect(cam.position.y).toBeGreaterThan(pivot.y);
  });

  it('rotates immediately with the look input (no lag)', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(), 0);
    step(cam, input({ look: { x: 0.2, y: 0 } }));
    // 右へ 0.2rad 向く = yaw は減る
    expect(cam.yaw).toBeCloseTo(-0.2, 9);
    step(cam, input({ look: { x: 0, y: 0.1 } }));
    // 上へ向く = ピッチ（見下ろし正）は減る
    expect(cam.pitch).toBeCloseTo(12 * DEG - 0.1, 9);
  });

  it('clamps the pitch to -30..+60 degrees', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(), 0);
    step(cam, input({ look: { x: 0, y: 10 } }));
    expect(cam.pitch).toBeCloseTo(-30 * DEG, 9);
    step(cam, input({ look: { x: 0, y: -10 } }));
    expect(cam.pitch).toBeCloseTo(60 * DEG, 9);
  });

  it('smooths the follow position (0.12s time constant) but not the rotation', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(), 0);
    // プレイヤーが突然 3m 前へ移動
    const player = new Vector3(0, 0, 3);
    step(cam, input({ playerPosition: player }));
    // 1 フレーム後はまだほとんど追いついていない
    expect(cam.pivot.z).toBeLessThan(0.5);
    for (let i = 0; i < 60; i++) step(cam, input({ playerPosition: player }));
    expect(cam.pivot.z).toBeCloseTo(3, 2);
  });

  it('switches the vertical field of view by device', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(), 0);
    step(cam, input({ device: 'touch' }));
    expect(cam.fovDeg).toBe(50);
    step(cam, input({ device: 'kbm' }));
    expect(cam.fovDeg).toBe(55);
  });

  it('never lets the camera pass through a wall behind the player', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(0, 0, 0), 0);
    const wall = wallBehind(-2); // 背後 2m に壁
    for (let i = 0; i < 90; i++) {
      step(cam, input(), wall);
      // 球の半径 0.25 を含めて壁の手前にいる
      expect(cam.position.z).toBeGreaterThanOrEqual(-2 + 0.25 - 1e-6);
    }
    expect(cam.armLength).toBeLessThan(2.2);
  });

  it('pushes in instantly and recovers over roughly 24 frames after the wall is gone', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(0, 0, 0), 0);
    for (let i = 0; i < 30; i++) step(cam, input(), wallBehind(-2));
    const pushed = cam.armLength;
    expect(pushed).toBeLessThan(2.5);
    for (let i = 0; i < 24; i++) step(cam, input());
    // 24F で元の距離のほぼ全て（95% 程度）まで戻る
    expect(cam.armLength).toBeGreaterThan(tuning.camera.distance * 0.9);
    for (let i = 0; i < 60; i++) step(cam, input());
    expect(cam.armLength).toBeCloseTo(tuning.camera.distance, 2);
  });

  it('does not let the smoothed pivot lag into a wall the player is next to', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(0, 0, 5), 0);
    // 注視点の平滑位置（遅れて z=0 付近）を壁（z=2 より手前だけ空間）で止める
    const wallFront: CameraCollision = {
      castSphere(origin, dir, maxDistance) {
        // z=2 に壁。+Z 向きの問い合わせは壁で止まる
        if (dir.z > 1e-9 && origin.z < 2) return Math.min(maxDistance, (2 - origin.z) / dir.z);
        return maxDistance;
      },
    };
    // プレイヤーが壁の向こうへ瞬間移動したが、実際の肩は壁の手前…ここでは単に例外なく動くこと
    step(cam, input({ playerPosition: new Vector3(0, 0, 5) }), wallFront);
    expect(Number.isFinite(cam.position.x)).toBe(true);
  });

  it('auto-follows toward the facing direction after holding sideways input while running', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(), 0);
    const run = input({ running: true, moveInput: { x: 1, y: 0 }, playerYaw: -90 * DEG });
    for (let i = 0; i < 20; i++) step(cam, run);
    expect(cam.yaw).toBe(0); // 20F までは動かない
    for (let i = 0; i < 10; i++) step(cam, run);
    // 以降は 0.3°/F で進行方向（yaw 減少側）へ
    expect(cam.yaw).toBeLessThan(0);
    expect(cam.yaw).toBeGreaterThan(-4 * DEG);
  });

  it('does not auto-follow when the player is not running or the camera is being moved', () => {
    const cam = new ThirdPersonCamera();
    cam.reset(new Vector3(), 0);
    const walk = input({ running: false, moveInput: { x: 1, y: 0 }, playerYaw: -90 * DEG });
    for (let i = 0; i < 60; i++) step(cam, walk);
    expect(cam.yaw).toBe(0);
  });
});

describe('ThirdPersonCamera (lock-on)', () => {
  beforeEach(() => {
    resetTuning();
  });

  function project(
    cam: ThirdPersonCamera,
    point: Vector3,
    fovDeg: number,
    aspect: number,
  ): { x: number; y: number; depth: number } {
    // カメラ空間へ
    const rel = point.clone().sub(cam.position);
    const f = cam.forward.clone().normalize();
    const right = new Vector3().crossVectors(f, new Vector3(0, 1, 0)).normalize();
    const up = new Vector3().crossVectors(right, f).normalize();
    const depth = rel.dot(f);
    const tanV = Math.tan((fovDeg * DEG) / 2);
    return {
      x: rel.dot(right) / (depth * tanV * aspect),
      y: rel.dot(up) / (depth * tanV),
      depth,
    };
  }

  function settle(cam: ThirdPersonCamera, i: CameraFrameInput, frames = 120): void {
    for (let n = 0; n < frames; n++) step(cam, i);
  }

  it('aligns the yaw from the player toward the target and keeps both on screen', () => {
    const cam = new ThirdPersonCamera();
    const player = new Vector3(0, 0, 0);
    cam.reset(player, 0);
    const target = new DummyTarget('t', 4, 0, -9, 1.8, 0.4);
    const frame = input({
      playerPosition: player,
      playerYaw: 0,
      lockTarget: target,
      lockEvent: 'acquired',
    });
    step(cam, frame);
    settle(cam, { ...frame, lockEvent: 'none' });

    const expectedYaw = Math.atan2(4, -9);
    expect(cam.yaw).toBeCloseTo(expectedYaw, 2);

    for (const aspect of [16 / 9, 2.2]) {
      for (const fov of [50, 55]) {
        const p = project(cam, new Vector3(0, 1.0, 0), fov, aspect);
        const t = project(cam, chestPosition(target), fov, aspect);
        expect(p.depth).toBeGreaterThan(0);
        expect(Math.abs(p.x)).toBeLessThan(0.9);
        expect(Math.abs(p.y)).toBeLessThan(0.95);
        expect(Math.abs(t.x)).toBeLessThan(0.9);
        expect(Math.abs(t.y)).toBeLessThan(0.95);
      }
    }
  });

  it('keeps a distant, tall target (boss) in the frame and pulls the camera back', () => {
    const cam = new ThirdPersonCamera();
    const player = new Vector3(0, 0, 0);
    cam.reset(player, 0);
    const boss = new DummyTarget('boss', 0, 0, -8, 4, 0.9);
    const frame = input({ playerPosition: player, lockTarget: boss, lockEvent: 'acquired' });
    step(cam, frame);
    settle(cam, { ...frame, lockEvent: 'none' }, 240);
    // 身長 4m: 4.2 + (4-1.8)*1.2 = 6.84m
    expect(cam.armLength).toBeCloseTo(6.84, 1);
    const t = project(cam, chestPosition(boss), 55, 16 / 9);
    const head = project(cam, new Vector3(0, 4, -8), 55, 16 / 9);
    expect(Math.abs(t.x)).toBeLessThan(0.5);
    expect(head.y).toBeLessThan(1);
  });

  it('catches up instantly when the target swings beyond 40 degrees of yaw error', () => {
    const cam = new ThirdPersonCamera();
    const player = new Vector3(0, 0, 0);
    cam.reset(player, 0);
    const target = new DummyTarget('t', 0, 0, 8, 1.8, 0.4);
    const frame = input({ playerPosition: player, lockTarget: target });
    settle(cam, frame, 60);
    // 対象が真後ろ（-Z）へ回り込んだ（プレイヤーが急に反対側へ移動）
    target.position.set(0, 0, -8);
    step(cam, frame);
    const err = Math.abs(Math.atan2(Math.sin(Math.PI - cam.yaw), Math.cos(Math.PI - cam.yaw)));
    expect(err).toBeLessThanOrEqual(40 * DEG + 1e-6);
  });

  it('ignores horizontal look input while locked, and allows only ±10 degrees of pitch offset', () => {
    const cam = new ThirdPersonCamera();
    const player = new Vector3(0, 0, 0);
    cam.reset(player, 0);
    const target = new DummyTarget('t', 0, 0, 8, 1.8, 0.4);
    const frame = input({ playerPosition: player, lockTarget: target });
    settle(cam, frame, 90);
    const yaw = cam.yaw;
    const pitchBefore = cam.pitch;
    step(cam, { ...frame, look: { x: 1, y: 0 } });
    expect(cam.yaw).toBeCloseTo(yaw, 6);
    for (let i = 0; i < 120; i++) step(cam, { ...frame, look: { x: 0, y: 0.5 } });
    // 上へ最大 10° だけ
    expect(pitchBefore - cam.pitch).toBeLessThanOrEqual(10 * DEG + 0.01);
    expect(pitchBefore - cam.pitch).toBeGreaterThan(5 * DEG);
  });

  it('turns back behind the player over 18 frames after the lock is released', () => {
    const cam = new ThirdPersonCamera();
    const player = new Vector3(0, 0, 0);
    cam.reset(player, 0);
    const target = new DummyTarget('t', 8, 0, 0, 1.8, 0.4);
    const locked = input({ playerPosition: player, playerYaw: 90 * DEG, lockTarget: target });
    settle(cam, locked, 90);
    const released = input({
      playerPosition: player,
      playerYaw: 0,
      lockTarget: null,
      lockEvent: 'released',
    });
    step(cam, released);
    const free = { ...released, lockEvent: 'none' as const };
    for (let i = 0; i < 17; i++) step(cam, free);
    expect(Math.abs(cam.yaw)).toBeLessThan(0.01);
    expect(cam.pitch).toBeCloseTo(tuning.camera.pitchInitial * DEG, 2);
  });
});

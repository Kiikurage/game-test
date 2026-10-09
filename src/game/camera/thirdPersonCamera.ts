import { Matrix4, Vector3 } from 'three/webgpu';
import { InterpolatedTransform } from '../../core/interpolated';
import type { InputDevice } from '../../core/input';
import { LOCK_ON } from '../data';
import type { LockOnEvent } from '../lockOn/lockOnController';
import { chestPosition, type LockOnTarget } from '../lockOn/targets';
import { angleDelta, smoothFactor, wrapAngle, yawOf } from '../player/movement';
import { tuning } from '../tuning';

const DEG = Math.PI / 180;
const UP = new Vector3(0, 1, 0);

/** カメラ衝突の問い合わせ。物理（Rapier の shape cast）側が実装する。 */
export interface CameraCollision {
  /**
   * `origin` から単位ベクトル `dir` の向きへ、半径 `radius` の球を最大 `maxDistance` 動かしたとき、
   * 最初に何かへ当たるまでの距離を返す。当たらなければ `maxDistance`。
   */
  castSphere(origin: Vector3, dir: Vector3, maxDistance: number, radius: number): number;
}

/** 衝突のない空間（テスト・初期化用）。 */
export const NO_COLLISION: CameraCollision = {
  castSphere: (_origin, _dir, maxDistance) => maxDistance,
};

export interface CameraFrameInput {
  /** 前ステップからのカメラ回転量[rad]（x: 右が正, y: 上が正）。 */
  readonly look: { readonly x: number; readonly y: number };
  /** プレイヤーの足元のワールド座標と向き。 */
  readonly playerPosition: Vector3;
  readonly playerYaw: number;
  /** 移動入力（x: 右が正, y: 前が正）。自動回り込みの判定に使う。 */
  readonly moveInput: { readonly x: number; readonly y: number };
  /** 走り・ダッシュ中か（自動回り込みの条件）。 */
  readonly running: boolean;
  readonly lockTarget: LockOnTarget | null;
  readonly lockEvent: LockOnEvent;
  readonly device: InputDevice;
}

const tmpForward = new Vector3();
const tmpRaw = new Vector3();
const tmpDir = new Vector3();
const tmpEye = new Vector3();
const tmpLook = new Vector3();
const tmpChest = new Vector3();
const tmpMatrix = new Matrix4();

/**
 * 三人称カメラ（仕様書 3 章）。位置・向きは game 層の状態として持ち、render 層は
 * `transform`（補間用）と `fovDeg` を読んでカメラへ反映するだけ。
 *
 * - フリー: 注視点（足元 +1.5m）の背後 4.2m。回転は入力に即時、位置は指数平滑。
 * - 衝突: 注視点からカメラへ半径 0.25m の球を飛ばし、壁手前へ即座に押し込み、解消後は 24F かけて戻す。
 * - ロックオン: プレイヤー→対象方向へヨーを合わせ、プレイヤーと対象の両方を画面に収める。
 */
export class ThirdPersonCamera {
  readonly transform = new InterpolatedTransform();
  fovDeg: number = tuning.camera.fovPc;

  /** 向き（ラジアン）。ピッチは下向きが正。 */
  yaw = 0;
  pitch = tuning.camera.pitchInitial * DEG;
  /** 平滑化済みの注視点（プレイヤー肩）。 */
  readonly pivot = new Vector3();
  /** 現在のアーム長（注視点からカメラまで）。 */
  armLength: number = tuning.camera.distance;
  /** ロックオン中の手動ピッチ補正（ラジアン、下向きが正）。 */
  private pitchOffset = 0;
  /** リセット動作の残りフレーム（0 なら動作中でない）。 */
  private resetFrames = 0;
  private strafeFrames = 0;
  private initialized = false;
  private shakeFrames = 0;
  private shakeTotal = 1;
  private shakeAmplitude = 0;
  private shakeSeed = 1;
  private armTarget: number = tuning.camera.distance;

  /** 実際のカメラの向き（前方の単位ベクトル）。ロックオン対象の選択に使う。 */
  readonly forward = new Vector3(0, 0, 1);
  /** ワールド位置（最新ステップ）。 */
  get position(): Vector3 {
    return this.transform.position;
  }

  /** プレイヤー背後へ即座に配置する（スポーン・テレポート）。 */
  reset(playerPosition: Vector3, yaw: number): void {
    this.yaw = yaw;
    this.pitch = tuning.camera.pitchInitial * DEG;
    this.pitchOffset = 0;
    this.resetFrames = 0;
    this.strafeFrames = 0;
    this.pivot.set(
      playerPosition.x,
      playerPosition.y + tuning.camera.pivotHeight,
      playerPosition.z,
    );
    this.armLength = tuning.camera.distance;
    this.initialized = true;
    this.placeFree();
    this.transform.snap();
  }

  /** 画面揺れを加える（被弾・叩きつけ演出。3.3 節）。振幅は度、持続はフレーム。 */
  addShake(amplitudeDeg: number, frames: number): void {
    if (amplitudeDeg * frames >= this.shakeAmplitude * this.shakeFrames) {
      this.shakeAmplitude = amplitudeDeg * DEG;
      this.shakeFrames = frames;
      this.shakeTotal = frames;
    }
  }

  /**
   * 1 固定ステップの前半: 入力とロックオン状態から向き（ヨー・ピッチ）とアーム長の目標を更新する。
   * プレイヤーの更新より前に呼び、移動の基準方向（`yaw`）にこのステップの回転入力を反映する。
   */
  updateAim(dt: number, input: CameraFrameInput): void {
    this.transform.beginStep();
    this.fovDeg = input.device === 'touch' ? tuning.camera.fovMobile : tuning.camera.fovPc;
    if (!this.initialized) this.reset(input.playerPosition, input.playerYaw);

    this.handleLockEvent(input);
    if (input.lockTarget) {
      this.armTarget = this.updateLocked(dt, input, input.lockTarget);
    } else {
      this.armTarget = tuning.camera.distance;
      this.updateFree(dt, input);
    }
  }

  /**
   * 1 固定ステップの後半: プレイヤーと物理の更新後に、注視点・アーム・衝突・最終的な位置と向きを決める。
   */
  updatePlacement(dt: number, input: CameraFrameInput, collision: CameraCollision): void {
    const cam = tuning.camera;
    const distance = this.armTarget;

    this.updatePivot(dt, input.playerPosition, collision);

    // アーム: 注視点から背後へ。壁手前へ即座に押し込み、解消後は指数的に戻す。
    this.forwardFromAngles(this.yaw, this.pitch, tmpForward);
    tmpDir.copy(tmpForward).negate();
    const hit = Math.max(
      0.3,
      collision.castSphere(this.pivot, tmpDir, distance, cam.collisionRadius),
    );
    const blocked = hit < distance - 1e-3;
    if (blocked && hit < this.armLength) {
      this.armLength = hit; // 壁へのめり込みを避けるため押し込みは即時
    } else {
      // 解消後は 24F かけて（約 95%）元の距離へ戻す。距離の目標が変わったときも同じ速さで追う
      const tau = cam.collisionRecoverFrames / 60 / 3;
      this.armLength += (hit - this.armLength) * smoothFactor(dt, tau);
      if (blocked) this.armLength = Math.min(this.armLength, hit);
    }

    tmpEye.copy(this.pivot).addScaledVector(tmpDir, this.armLength);

    // 向き: フリーは yaw/pitch そのまま、ロックオンはプレイヤーと対象の混合点を見る
    let shakeYaw = 0;
    let shakePitch = 0;
    if (this.shakeFrames > 0) {
      const k = (this.shakeFrames / this.shakeTotal) * this.shakeAmplitude;
      this.shakeSeed = (this.shakeSeed * 16807) % 2147483647;
      shakeYaw = ((this.shakeSeed / 2147483647) * 2 - 1) * k;
      this.shakeSeed = (this.shakeSeed * 16807) % 2147483647;
      shakePitch = ((this.shakeSeed / 2147483647) * 2 - 1) * k;
      this.shakeFrames--;
    }
    if (input.lockTarget) {
      chestPosition(input.lockTarget, tmpChest);
      const w = tuning.lockOn.playerWeight;
      tmpLook
        .copy(this.pivot)
        .multiplyScalar(w)
        .addScaledVector(tmpChest, 1 - w);
      tmpDir.copy(tmpLook).sub(tmpEye);
      if (tmpDir.lengthSq() < 1e-6) tmpDir.copy(tmpForward);
      tmpDir.normalize();
    } else {
      tmpDir.copy(tmpForward);
    }
    if (shakeYaw !== 0 || shakePitch !== 0) {
      const y = yawOf(tmpDir.x, tmpDir.z) + shakeYaw;
      const p = Math.asin(Math.min(1, Math.max(-1, -tmpDir.y))) + shakePitch;
      this.forwardFromAngles(y, p, tmpDir);
    }
    this.forward.copy(tmpDir);

    tmpLook.copy(tmpEye).add(tmpDir);
    tmpMatrix.lookAt(tmpEye, tmpLook, UP);
    this.transform.quaternion.setFromRotationMatrix(tmpMatrix);
    this.transform.position.copy(tmpEye);
  }

  /** ロックオン中の実際のヨー・ピッチ（解除時の連続性のため）。 */
  private syncAnglesFromView(): void {
    this.yaw = wrapAngle(yawOf(this.forward.x, this.forward.z));
    this.pitch = Math.asin(Math.min(1, Math.max(-1, -this.forward.y)));
  }

  private handleLockEvent(input: CameraFrameInput): void {
    switch (input.lockEvent) {
      case 'released':
      case 'failed':
        // 見ていた向きから連続させて、プレイヤーの向いている方向へ向け直す
        this.syncAnglesFromView();
        this.pitchOffset = 0;
        this.resetFrames = tuning.lockOn.resetFrames;
        break;
      case 'acquired':
        this.resetFrames = 0;
        this.pitchOffset = 0;
        break;
      default:
        break;
    }
  }

  private updateFree(dt: number, input: CameraFrameInput): void {
    const cam = tuning.camera;
    const lookMagnitude = Math.abs(input.look.x) + Math.abs(input.look.y);
    if (this.resetFrames > 0) {
      if (lookMagnitude > 1e-4) {
        this.resetFrames = 0; // プレイヤーの操作を優先
      } else {
        const n = this.resetFrames;
        this.yaw = wrapAngle(this.yaw + angleDelta(this.yaw, input.playerYaw) / n);
        this.pitch += (cam.pitchInitial * DEG - this.pitch) / n;
        this.resetFrames--;
      }
    }
    if (this.resetFrames === 0) {
      this.yaw = wrapAngle(this.yaw - input.look.x * cam.lookScale);
      this.pitch -= input.look.y * cam.lookScale;
    }
    this.pitch = Math.min(cam.pitchMax * DEG, Math.max(cam.pitchMin * DEG, this.pitch));

    // 自動回り込み（フリー時のみ）: 走り中に左右入力を続けたら進行方向へ寄る
    const sideways =
      Math.abs(input.moveInput.x) > 0.5 &&
      Math.abs(input.moveInput.x) > Math.abs(input.moveInput.y);
    if (cam.autoFollow && input.running && sideways && lookMagnitude < 1e-4) {
      this.strafeFrames++;
      if (this.strafeFrames > cam.autoFollowHoldFrames) {
        const step = cam.autoFollowDegPerFrame * DEG * (dt * 60);
        const diff = angleDelta(this.yaw, input.playerYaw);
        this.yaw = wrapAngle(this.yaw + Math.max(-step, Math.min(step, diff)));
      }
    } else {
      this.strafeFrames = 0;
    }
  }

  /** ロックオン中のヨー・ピッチを更新し、アーム長（距離）を返す。 */
  private updateLocked(dt: number, input: CameraFrameInput, target: LockOnTarget): number {
    const lock = tuning.lockOn;
    const cam = tuning.camera;
    const player = input.playerPosition;
    const dx = target.position.x - player.x;
    const dz = target.position.z - player.z;
    const horizontal = Math.hypot(dx, dz);

    // 手動ピッチ（±10°）。水平入力は無視（切替入力として扱われる）。
    const limit = lock.pitchOffsetLimitDeg * DEG;
    this.pitchOffset = Math.max(
      -limit,
      Math.min(limit, this.pitchOffset - input.look.y * cam.lookScale),
    );

    if (horizontal > 0.6) {
      const targetYaw = yawOf(dx, dz);
      this.yaw = wrapAngle(
        this.yaw + angleDelta(this.yaw, targetYaw) * smoothFactor(dt, lock.yawTau),
      );
      // 画面端に寄りすぎたら即時に追いつかせる（画面外に出さない）
      const err = angleDelta(this.yaw, targetYaw);
      const maxErr = lock.maxYawErrorDeg * DEG;
      if (Math.abs(err) > maxErr) this.yaw = wrapAngle(targetYaw - Math.sign(err) * maxErr);
    }

    // 敵が高いほど見上げる
    chestPosition(target, tmpChest);
    const elevation = Math.atan2(
      tmpChest.y - (player.y + cam.pivotHeight),
      Math.max(horizontal, 1),
    );
    const wantedPitch =
      cam.pitchInitial * DEG - elevation * lock.elevationFactor + this.pitchOffset;
    const clamped = Math.min(cam.pitchMax * DEG, Math.max(cam.pitchMin * DEG, wantedPitch));
    this.pitch += (clamped - this.pitch) * smoothFactor(dt, lock.yawTau);

    const extra = Math.max(0, target.height - LOCK_ON.camera.playerHeight);
    return Math.min(lock.distanceMax, lock.distanceBase + extra * lock.distanceHeightFactor);
  }

  private updatePivot(dt: number, playerPosition: Vector3, collision: CameraCollision): void {
    const cam = tuning.camera;
    tmpRaw.set(playerPosition.x, playerPosition.y + cam.pivotHeight, playerPosition.z);
    const fh = smoothFactor(dt, cam.followTau);
    const fv = smoothFactor(dt, cam.followTauVertical);
    this.pivot.x += (tmpRaw.x - this.pivot.x) * fh;
    this.pivot.z += (tmpRaw.z - this.pivot.z) * fh;
    this.pivot.y += (tmpRaw.y - this.pivot.y) * fv;

    // 平滑化した注視点が壁の向こうへ遅れて入り込まないよう、実際の肩の位置から壁手前で止める
    tmpDir.subVectors(this.pivot, tmpRaw);
    const len = tmpDir.length();
    if (len > 1e-4) {
      tmpDir.divideScalar(len);
      const hit = collision.castSphere(tmpRaw, tmpDir, len, cam.collisionRadius);
      if (hit < len) this.pivot.copy(tmpRaw).addScaledVector(tmpDir, Math.max(0, hit - 0.01));
    }
  }

  private placeFree(): void {
    this.forwardFromAngles(this.yaw, this.pitch, tmpForward);
    tmpEye.copy(this.pivot).addScaledVector(tmpForward, -this.armLength);
    tmpLook.copy(tmpEye).add(tmpForward);
    tmpMatrix.lookAt(tmpEye, tmpLook, UP);
    this.transform.quaternion.setFromRotationMatrix(tmpMatrix);
    this.transform.position.copy(tmpEye);
    this.forward.copy(tmpForward);
  }

  /** ヨー・ピッチ（下向き正）から前方ベクトル。 */
  private forwardFromAngles(yaw: number, pitch: number, out: Vector3): Vector3 {
    const cp = Math.cos(pitch);
    return out.set(Math.sin(yaw) * cp, -Math.sin(pitch), Math.cos(yaw) * cp);
  }
}

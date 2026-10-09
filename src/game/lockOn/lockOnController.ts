import { Vector3 } from 'three/webgpu';
import { LOCK_ON } from '../data';
import { tuning } from '../tuning';
import {
  selectLockOnTarget,
  selectSwitchTarget,
  type CameraView,
  type SelectOptions,
} from './select';
import { chestPosition, type LockOnTarget } from './targets';

/** 1 ステップの結果。カメラはこれを見てリセット動作などを行う。 */
export type LockOnEvent =
  | 'none'
  | 'acquired'
  | 'switched'
  /** 解除（トグル・距離・遮蔽・対象消失・外部要因）。 */
  | 'released'
  /** ロックオン入力があったが候補がなかった（カメラを背後へ向け直す）。 */
  | 'failed';

export interface LockOnFrame {
  /** ロックオン入力（トグル）が押された。 */
  readonly toggle: boolean;
  /** ターゲット切替要求（-1 左 / 1 右 / 0 なし）。 */
  readonly switchDir: -1 | 0 | 1;
  readonly targets: readonly LockOnTarget[];
  readonly playerPosition: Vector3;
  readonly camera: CameraView;
  /** カメラ位置から胸元へ視線が通るか（地形・障害物に遮られていないか）。 */
  readonly isVisible: (from: Vector3, to: Vector3) => boolean;
}

const scratch = new Vector3();

export type LockOnReleaseReason = 'toggle' | 'range' | 'lostSight' | 'noTarget' | 'external';

/**
 * ロックオンの状態管理（仕様書 3.2 節）。取得・維持・解除・切替・対象死亡時の自動移行。
 * 画面内・距離・視線の判定は `select.ts` の純粋関数、視線は外部（物理）から注入する。
 */
export class LockOnController {
  target: LockOnTarget | null = null;
  /** 直近の解除理由（`released` イベント時に有効）。 */
  lastReleaseReason: LockOnReleaseReason | null = null;

  private lostSightFrames = 0;
  private switchCooldown = 0;
  private deadFrames = 0;

  get active(): boolean {
    return this.target !== null;
  }

  /** 外部要因（プレイヤー死亡など）で解除する。 */
  release(reason: LockOnReleaseReason = 'external'): LockOnEvent {
    if (!this.target) return 'none';
    this.clear();
    this.lastReleaseReason = reason;
    return 'released';
  }

  update(frame: LockOnFrame): LockOnEvent {
    if (this.switchCooldown > 0) this.switchCooldown--;

    if (frame.toggle) {
      if (this.target) return this.release('toggle');
      const found = selectLockOnTarget(frame.targets, frame.camera, this.options(frame, null));
      if (!found) return 'failed';
      this.set(found);
      return 'acquired';
    }

    const target = this.target;
    if (!target) return 'none';

    // 対象が登録から外れた（消滅）
    if (!frame.targets.includes(target)) return this.release('noTarget');

    // 距離（ヒステリシス: 取得 15m / 解除 20m）
    const dx = target.position.x - frame.playerPosition.x;
    const dz = target.position.z - frame.playerPosition.z;
    if (Math.hypot(dx, dz) > tuning.lockOn.releaseRange) return this.release('range');

    // 対象の死亡: 0.5s 後に 10m 以内の次の対象へ、なければ解除
    if (!target.alive) {
      this.deadFrames++;
      if (this.deadFrames >= Math.round(LOCK_ON.deathRetargetDelaySeconds * 60)) {
        const next = selectLockOnTarget(frame.targets, frame.camera, {
          ...this.options(frame, target),
          acquireRange: LOCK_ON.deathRetargetRange,
          // 自動移行は画面外でも拾う
          viewHalfH: 180,
          viewHalfV: 180,
        });
        if (!next) return this.release('noTarget');
        this.set(next);
        return 'switched';
      }
      return 'none';
    }

    // 視線遮断が 2 秒続いたら解除
    if (frame.isVisible(frame.camera.position, chestPosition(target, scratch))) {
      this.lostSightFrames = 0;
    } else if (++this.lostSightFrames >= tuning.lockOn.lostSightFrames) {
      return this.release('lostSight');
    }

    // 切替
    if (frame.switchDir !== 0 && this.switchCooldown === 0) {
      const next = selectSwitchTarget(
        frame.targets,
        target,
        frame.switchDir,
        frame.camera,
        this.options(frame, target),
      );
      if (next) {
        this.set(next);
        this.switchCooldown = tuning.lockOn.switchCooldownFrames;
        return 'switched';
      }
    }
    return 'none';
  }

  private set(target: LockOnTarget): void {
    this.target = target;
    this.lostSightFrames = 0;
    this.deadFrames = 0;
  }

  private clear(): void {
    this.target = null;
    this.lostSightFrames = 0;
    this.deadFrames = 0;
  }

  private options(frame: LockOnFrame, exclude: LockOnTarget | null): SelectOptions {
    return {
      playerPosition: frame.playerPosition,
      acquireRange: tuning.lockOn.acquireRange,
      viewHalfH: tuning.lockOn.viewHalfH,
      viewHalfV: tuning.lockOn.viewHalfV,
      isVisible: frame.isVisible,
      exclude,
    };
  }
}

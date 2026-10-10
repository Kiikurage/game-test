import { tuning } from './tuning';
import { registerDevHooks } from '../devHooks';

declare module '../devHooks' {
  interface DevHooks {
    teleport(x: number, z: number, yaw: number, y?: number): void;
    /** 指定した対象を直接ロックオンする（撮影用）。 */
    lock(id: string): boolean;
    /** カメラをプレイヤーの向き + `yawOffset` の背後に置き直す（撮影用）。 */
    view(yawOffset: number, distance?: number, pitchDeg?: number): void;
    /** 音源を鳴らす（敵の聴覚・経路探索の E2E 用）。 */
    noise(x: number, y: number, z: number, kind: 'bell' | 'dash' | 'combat'): void;
    /** プレイヤーの HP を減らす（回復瓶の確認・撮影用）。 */
    damage(amount: number): void;
    /** ?debug 用の仮の攻撃（軽攻撃 1 の判定）を 1 回出す。判定の動作確認・撮影用。 */
    swing(): void;
    /**
     * 敵の攻撃を 1 発プレイヤーへ当てる（ガード・削り・ブレイクの確認用ダミー。`from` は攻撃者の方向、
     * `bearingDeg` は正面からの角度。本物の命中と同じ経路を通る）。
     */
    hitPlayer(options?: {
      from?: 'front' | 'back' | 'left' | 'right';
      damage?: number;
      poiseDamage?: number;
      guardStaminaCost?: number;
      bearingDeg?: number;
    }): void;
    /** プレイヤーを `frames` ステップ凍結する（ヒットストップの確認用）。 */
    hitStop(frames: number): void;
    /** タイムスケールを `scale` 倍にして `frames` ステップ続ける（スローモーションの確認用）。 */
    slowMotion(scale: number, frames: number): void;
  }
}

registerDevHooks('game', ({ game }) => ({
  teleport: (x, z, yaw, y) => {
    game.teleportPlayer(x, z, yaw, y);
  },
  lock: (id) => game.lockOnTo(id),
  view: (yawOffset, distance, pitchDeg) => {
    if (distance !== undefined) tuning.camera.distance = distance;
    game.camera.reset(game.player.feet, game.player.yaw + yawOffset, pitchDeg);
  },
  noise: (x, y, z, kind) => {
    game.emitNoise({ x, y, z }, kind);
  },
  swing: () => {
    game.debugSwing.start();
  },
  hitPlayer: (options) => {
    game.debugHitPlayer(options);
  },
  damage: (amount) => {
    game.playerTarget.health.damage(amount);
  },
  hitStop: (frames) => {
    game.player.hitStop(frames);
  },
  slowMotion: (scale, frames) => {
    game.timeScale.start(scale, frames);
  },
}));

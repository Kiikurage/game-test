import { PLAYER_STATS, STAMINA } from '../data';

/** スタミナの回復モード。 */
export type StaminaRegenMode = 'normal' | 'guard' | 'none';

/**
 * プレイヤーのスタミナ（仕様書 2.1 節）。
 * - 動作開始時の消費は `consume`（0 でクランプ）。0 のときは新規動作を開始できない（`canStartAction`）。
 * - 最後の消費から 45F 経過後に毎秒 40 回復（ガード中 20）。0 になった瞬間は待ちが 60F。走り・ダッシュ中は回復しない。
 * 後続の戦闘チケットがガード・攻撃の消費・回復倍率（護符）を足せるよう、消費は `consume`、継続消費は `drain`。
 */
export class Stamina {
  current: number;
  max: number;
  /** 回復開始までの残り待ちフレーム。 */
  private delay = 0;
  /** 回復量・待ちの倍率（アイテム効果用）。 */
  regenPerSecond: number = STAMINA.regenPerSecond;
  regenDelayFrames: number = STAMINA.regenDelayFrames;

  constructor(max: number = PLAYER_STATS.stamina) {
    this.max = max;
    this.current = max;
  }

  /** 0 でない（新規に動作を開始できる）か。 */
  get canStartAction(): boolean {
    return this.current > 0;
  }

  get ratio(): number {
    return this.current / this.max;
  }

  /** 動作開始時の一括消費。0 でクランプし、回復待ちを開始する。 */
  consume(amount: number): void {
    if (amount <= 0) return;
    this.current = Math.max(0, this.current - amount);
    this.delay = this.current === 0 ? STAMINA.depletedDelayFrames : this.regenDelayFrames;
  }

  /** 継続消費（ダッシュなど。毎ステップ `perSecond * dt`）。0 に達したら true。 */
  drain(perSecond: number, dt: number): boolean {
    this.consume(perSecond * dt);
    return this.current === 0;
  }

  /** 1 ステップ進める。 */
  update(dt: number, mode: StaminaRegenMode = 'normal'): void {
    if (mode === 'none') return;
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    const perSecond = mode === 'guard' ? STAMINA.guardRegenPerSecond : this.regenPerSecond;
    this.current = Math.min(this.max, this.current + perSecond * dt);
  }

  /** 全回復（篝火休息・リスポーン）。 */
  refill(): void {
    this.current = this.max;
    this.delay = 0;
  }
}

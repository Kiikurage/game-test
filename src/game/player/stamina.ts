import { PLAYER_STATS, STAMINA } from '../data';

/** 1 ステップのスタミナ回復に影響する行動（`Stamina.update` の `context`）。 */
export interface StaminaContext {
  /** ガード中（回復は毎秒 20）。 */
  readonly guarding?: boolean;
  /** 走り・ダッシュ中（回復しない。待ち時間は進む）。 */
  readonly sprinting?: boolean;
  /** 強攻撃の溜め中（回復しない。待ち時間は進む）。 */
  readonly charging?: boolean;
}

/**
 * プレイヤーのスタミナ（仕様書 2.1 / 2.2 / 2.3 節）。すべて固定ステップ（60Hz）のフレーム単位で進める。
 *
 * - 消費は動作**開始時**に `consume`。0 でクランプする。0 のときは新規に動作を開始できない
 *   （`canStart`）が、消費の結果 0 になる動作そのものは開始できる。
 * - 回復は、最後の消費から 45F 経過後に毎秒 40（0.667/F）。ガード中は毎秒 20。走り・ダッシュ中と強攻撃の溜め中は回復しない。
 *   消費で 0 になった場合は待ちが 60F。
 * - ダッシュなどの継続消費は `drain`（毎ステップ `毎秒 × dt`）。
 * - 0 に達した瞬間（HUD の点滅・SE・息切れ用）は `onEmpty` で購読する。
 *
 * ガード被弾時の消費（E2-6）や攻撃・ロールの開始消費は `consume`、開始可否は `canStart(cost)` を使う。
 */
export class Stamina {
  current: number;
  max: number;
  /** 回復開始までの残り待ちフレーム。 */
  private delay = 0;
  /** 回復量・待ちの倍率（アイテム効果用）。 */
  regenPerSecond: number = STAMINA.regenPerSecond;
  regenDelayFrames: number = STAMINA.regenDelayFrames;
  private readonly emptyListeners = new Set<() => void>();

  constructor(max: number = PLAYER_STATS.stamina) {
    this.max = max;
    this.current = max;
  }

  /**
   * コスト `cost` の動作を新規に開始できるか。コストが 0（回復など）なら常に可。
   * それ以外は、残量が 0 でなければ可（消費後に 0 へクランプされる動作自体は可）。
   */
  canStart(cost = 1): boolean {
    return cost <= 0 || this.current > 0;
  }

  /** 0 でない（新規に動作を開始できる）か。`canStart()` と同じ。 */
  get canStartAction(): boolean {
    return this.canStart();
  }

  /** 0 か。 */
  get empty(): boolean {
    return this.current <= 0;
  }

  get ratio(): number {
    return this.current / this.max;
  }

  /** 回復開始までの残り待ちフレーム（HUD・テスト用）。 */
  get regenDelayRemaining(): number {
    return this.delay;
  }

  /** 0 に達した瞬間（残量が 0 より大きい状態から 0 になったとき）の通知を購読する。戻り値は購読解除。 */
  onEmpty(listener: () => void): () => void {
    this.emptyListeners.add(listener);
    return () => this.emptyListeners.delete(listener);
  }

  /** 動作開始時の一括消費。0 でクランプし、回復待ちを開始する（0 になれば 60F、そうでなければ 45F）。 */
  consume(amount: number): void {
    if (amount <= 0) return;
    const wasEmpty = this.current <= 0;
    this.current = Math.max(0, this.current - amount);
    const emptied = this.current === 0;
    this.delay = emptied ? STAMINA.depletedDelayFrames : this.regenDelayFrames;
    if (emptied && !wasEmpty) for (const l of [...this.emptyListeners]) l();
  }

  /** 継続消費（ダッシュなど。毎ステップ `perSecond * dt`）。0 に達したら true。 */
  drain(perSecond: number, dt: number): boolean {
    this.consume(perSecond * dt);
    return this.current === 0;
  }

  /** 1 ステップ（1F）進める。待ち時間は走り中も進み、回復量だけが止まる。 */
  update(dt: number, context: StaminaContext = {}): void {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    if (context.sprinting || context.charging) return;
    const perSecond = context.guarding ? STAMINA.guardRegenPerSecond : this.regenPerSecond;
    this.current = Math.min(this.max, this.current + perSecond * dt);
  }

  /** 全回復（篝火休息・リスポーン）。 */
  refill(): void {
    this.current = this.max;
    this.delay = 0;
  }
}

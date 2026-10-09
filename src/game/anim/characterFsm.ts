import type { CancelTarget, CancelWindow } from '../data/types';
import { inWindow } from '../data/frameWindow';

/**
 * キャラクター状態機械（プレイヤー・雑魚・ボス共通。仕様書 13.3 節 E1-1）。
 *
 * 状態 ID はキャラクターごとに自由に決める（プレイヤーなら `roll` / `light1`、敵なら `swing` など）。
 * 各状態は共通の分類 `StateKind`（Idle / Move / Action / Stagger / Dead）のどれかに属し、
 * 遷移できる先をグラフで宣言する。宣言にない遷移は `IllegalTransitionError`（不正遷移の拒否）。
 *
 * - `stateFrame`: 現在の状態に入ってからのフレーム数（F1 起点、仕様書 0.2 節）。状態の中身を進める側が
 *   毎ステップ `advance()` する（遷移すると 0 に戻る）。
 * - `Action` 分類の状態は `actionId`（既定は状態 ID。イベントマーカー表・キャンセル窓の引き当てに使う）を持ち、
 *   `canCancelTo(target)` で「いまのフレームが指定動作へのキャンセル窓の中か」を答える。
 * - ヒットストップ: `freeze(frames)` した間は `consumeFreeze()` が true を返す。呼び出し側はその
 *   ステップの更新（状態フレーム・移動・アニメーション）を丸ごと飛ばす（4.1 節）。
 *
 * 後続（攻撃 #46・ガード #53・被弾 #50）は、状態 ID をグラフへ足し、キャンセル窓（`PLAYER_ACTIONS.*.cancels`）と
 * マーカー表（`player.<状態 ID>`）を用意するだけでよい。
 */

export const STATE_KINDS = ['idle', 'move', 'action', 'stagger', 'dead'] as const;
export type StateKind = (typeof STATE_KINDS)[number];

export interface StateSpec<S extends string> {
  readonly kind: StateKind;
  /** この状態から直接遷移できる状態。 */
  readonly to: readonly S[];
  /** `kind: 'action'` の動作 ID（既定は状態 ID）。 */
  readonly actionId?: string;
}

export type StateGraph<S extends string> = { readonly [K in S]: StateSpec<S> };

export class IllegalTransitionError extends Error {
  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    super(`不正な状態遷移です: ${from} → ${to}`);
    this.name = 'IllegalTransitionError';
  }
}

/** 窓の `to`（キャンセル先の分類）が、問い合わせたキャンセル先に当たるか。`attack` は軽・強どちらも含む。 */
export function cancelTargetMatches(windowTo: CancelTarget, target: CancelTarget): boolean {
  if (windowTo === target) return true;
  const isAttack = (t: CancelTarget) => t === 'lightAttack' || t === 'heavyAttack';
  if (windowTo === 'attack') return isAttack(target);
  if (target === 'attack') return isAttack(windowTo);
  return false;
}

export interface CharacterFsmOptions {
  /** 動作 ID → キャンセル窓（`PLAYER_ACTIONS.<id>.cancels` など）。なければ空。 */
  readonly cancelsOf?: (actionId: string) => readonly CancelWindow[] | undefined;
}

export interface TransitionOptions {
  /**
   * 遷移直後の状態フレーム。既定 0（以降の `advance()` で 1 になる）。
   * 同じステップの途中で状態名だけが変わる移動系（idle ⇔ move）は 1 を指定する。
   */
  readonly frame?: number;
}

export class CharacterFsm<S extends string> {
  private current: S;
  private frame = 0;
  private freezeLeft = 0;
  private frozenStep = false;

  constructor(
    private readonly graph: StateGraph<S>,
    initial: S,
    private readonly options: CharacterFsmOptions = {},
  ) {
    this.assertKnown(initial);
    this.current = initial;
  }

  get state(): S {
    return this.current;
  }

  /** 現在の状態に入ってからのフレーム数（F1 起点）。 */
  get stateFrame(): number {
    return this.frame;
  }

  get kind(): StateKind {
    return this.graph[this.current].kind;
  }

  /** `kind: 'action'` の間の動作 ID。それ以外は null。 */
  get actionId(): string | null {
    const spec = this.graph[this.current];
    return spec.kind === 'action' ? (spec.actionId ?? this.current) : null;
  }

  /** 行動不能（Action / Stagger / Dead）か。移動系の状態では false。 */
  get isBusy(): boolean {
    const k = this.kind;
    return k === 'action' || k === 'stagger' || k === 'dead';
  }

  canTransition(to: S): boolean {
    return this.graph[this.current].to.includes(to);
  }

  /** 遷移する。グラフにない遷移は `IllegalTransitionError`。同じ状態への遷移は何もしない。 */
  transition(to: S, options: TransitionOptions = {}): void {
    this.assertKnown(to);
    if (to === this.current) return;
    if (!this.canTransition(to)) throw new IllegalTransitionError(this.current, to);
    this.current = to;
    this.frame = options.frame ?? 0;
  }

  /** 現在の状態を最初からやり直す（状態フレームを 0 へ戻す。仰け反り中の再被弾など、同じ状態への再突入用）。 */
  restart(): void {
    this.frame = 0;
  }

  /** 遷移できれば遷移して true、できなければ何もせず false。 */
  tryTransition(to: S, options: TransitionOptions = {}): boolean {
    if (to !== this.current && !this.canTransition(to)) return false;
    this.transition(to, options);
    return true;
  }

  /** グラフを無視して状態を置く（テレポート・リスポーン・デバッグ用）。 */
  reset(to: S): void {
    this.assertKnown(to);
    this.current = to;
    this.frame = 0;
    this.freezeLeft = 0;
    this.frozenStep = false;
  }

  /** 状態フレームを 1 進める。 */
  advance(): number {
    return ++this.frame;
  }

  /**
   * 現在の動作が、いまのフレームで `target` へキャンセルできるか（`Action` 以外は常に false。
   * 移動系の状態は自由に遷移できるので、キャンセルの概念を使わない）。
   */
  canCancelTo(target: CancelTarget, frame = this.frame): boolean {
    const id = this.actionId;
    if (id === null) return false;
    const windows = this.options.cancelsOf?.(id);
    if (!windows) return false;
    return windows.some((w) => cancelTargetMatches(w.to, target) && inWindow(frame, w));
  }

  // ---- ヒットストップ ----

  /** `frames` ステップ、状態フレームと動きを凍結する。すでに凍結中ならより長い方を残す。 */
  freeze(frames: number): void {
    if (!Number.isInteger(frames) || frames < 0) {
      throw new RangeError(`凍結フレーム数は 0 以上の整数です（${frames}）`);
    }
    this.freezeLeft = Math.max(this.freezeLeft, frames);
  }

  /** 凍結の残りステップ数。 */
  get freezeRemaining(): number {
    return this.freezeLeft;
  }

  /**
   * 1 ステップの先頭で呼ぶ。凍結中なら残りを 1 減らして true を返す（呼び出し側はこのステップを飛ばす）。
   * `isFrozenStep` は直近のステップが凍結だったかを表し、アニメーションの停止判定に使う。
   */
  consumeFreeze(): boolean {
    if (this.freezeLeft > 0) {
      this.freezeLeft--;
      this.frozenStep = true;
      return true;
    }
    this.frozenStep = false;
    return false;
  }

  get isFrozenStep(): boolean {
    return this.frozenStep;
  }

  private assertKnown(state: S): void {
    if (!(state in this.graph)) throw new RangeError(`未定義の状態です: ${state}`);
  }
}

/** グラフの整合性（遷移先が定義済み・`action` に自己参照のみ等）を検証する。違反の説明を返す（空なら正常）。 */
export function validateStateGraph<S extends string>(graph: StateGraph<S>): string[] {
  const problems: string[] = [];
  const ids = Object.keys(graph) as S[];
  for (const id of ids) {
    const spec = graph[id];
    if (!(STATE_KINDS as readonly string[]).includes(spec.kind)) {
      problems.push(`${id}: 未知の分類 ${spec.kind}`);
    }
    for (const to of spec.to) {
      if (!(to in graph)) problems.push(`${id} → ${to}: 遷移先が未定義`);
      if (to === id) problems.push(`${id} → ${to}: 自己遷移は宣言不要`);
    }
    if (spec.actionId !== undefined && spec.kind !== 'action') {
      problems.push(`${id}: actionId は kind 'action' の状態だけが持てる`);
    }
  }
  return problems;
}

import {
  PLAYER_ACTIONS,
  inWindow,
  totalFrames,
  type CancelTarget,
  type FrameWindow,
  type PlayerActionData,
  type PlayerActionId,
} from '../data';

/**
 * プレイヤーのアクションのデバッグ表示用の情報（`?debug&scene=combat` の戦闘デバッグ HUD）。
 * フレームデータ（`PLAYER_ACTIONS`）と、いまの状態・フレームを突き合わせるだけの純粋関数。
 * 窓（キャンセル・無敵・スーパーアーマー）の「開いているか」は名目の窓（データ表の値）で判定する。
 * 実際の無敵（`invulnerableNow`）・強靭度の加算（`poiseBonus`）は呼び出し側が実機の値を渡す。
 */

export type ActionSegment = 'startup' | 'active' | 'recovery';

export interface ActionWindowInfo extends FrameWindow {
  /** いまのフレームが窓に入っているか。 */
  readonly open: boolean;
}

export interface ActionCancelInfo extends ActionWindowInfo {
  readonly to: CancelTarget;
}

export interface PlayerActionInfo {
  /** 状態 ID（`idle` / `light1` / `guard` ...）。 */
  readonly state: string;
  /** フレームデータのある動作 ID（なければ null。移動・ガードなど）。 */
  readonly actionId: PlayerActionId | null;
  /** 状態に入ってからのフレーム（F1 起点）。 */
  readonly frame: number;
  /** 全体フレーム（データがなければ 0）。 */
  readonly total: number;
  readonly segment: ActionSegment | null;
  readonly startup: number;
  readonly active: number;
  readonly recovery: number;
  readonly cancels: readonly ActionCancelInfo[];
  readonly invuln: ActionWindowInfo | null;
  readonly superArmor: (ActionWindowInfo & { readonly poiseBonus: number }) | null;
  /** 実機の無敵状態（窓の名目値ではなく `Player.invulnerable`）。 */
  readonly invulnerableNow: boolean;
  /** 実機の強靭度の一時加算の残り。 */
  readonly poiseBonus: number;
  /** ヒットストップなどで凍結中か。 */
  readonly frozen: boolean;
}

export interface PlayerActionSample {
  readonly state: string;
  /** `Player.animation.actionId`（動作の ID。なければ null で状態 ID を使う）。 */
  readonly actionId: string | null;
  readonly frame: number;
  readonly invulnerable: boolean;
  readonly poiseBonus: number;
  readonly frozen: boolean;
}

function dataOf(id: string): PlayerActionData | null {
  return Object.prototype.hasOwnProperty.call(PLAYER_ACTIONS, id)
    ? PLAYER_ACTIONS[id as PlayerActionId]
    : null;
}

function windowInfo(w: FrameWindow, frame: number): ActionWindowInfo {
  return { start: w.start, end: w.end, open: inWindow(frame, w) };
}

/** いまのプレイヤーのアクションを、フレームデータと突き合わせた表示用の情報にする。 */
export function describePlayerAction(sample: PlayerActionSample): PlayerActionInfo {
  const data = dataOf(sample.actionId ?? sample.state) ?? dataOf(sample.state);
  const base = {
    state: sample.state,
    frame: sample.frame,
    invulnerableNow: sample.invulnerable,
    poiseBonus: sample.poiseBonus,
    frozen: sample.frozen,
  };
  if (!data) {
    return {
      ...base,
      actionId: null,
      total: 0,
      segment: null,
      startup: 0,
      active: 0,
      recovery: 0,
      cancels: [],
      invuln: null,
      superArmor: null,
    };
  }
  const f = sample.frame;
  const segment: ActionSegment =
    f <= data.startup ? 'startup' : f <= data.startup + data.active ? 'active' : 'recovery';
  return {
    ...base,
    actionId: data.id,
    total: totalFrames(data),
    segment,
    startup: data.startup,
    active: data.active,
    recovery: data.recovery,
    cancels: data.cancels.map((c) => ({ to: c.to, ...windowInfo(c, f) })),
    invuln: data.invuln ? windowInfo(data.invuln, f) : null,
    superArmor: data.superArmor
      ? { ...windowInfo(data.superArmor, f), poiseBonus: data.superArmor.poiseBonus }
      : null,
  };
}

import { ACTIONS, type Action, type Vec2 } from '../core/input';
import { clampLength } from './deadzone';

export type InputSource = 'keyboard' | 'mouse' | 'gamepad' | 'touch';

export interface CollectedButton {
  pressed: boolean;
  held: boolean;
  released: boolean;
  /** 区間内で最後に押された/離された実時刻[ms]（短押し/長押しの判定用。エッジが無ければ 0）。 */
  pressedAt: number;
  releasedAt: number;
}

export interface CollectedFrame {
  move: Vec2;
  look: Vec2;
  targetSwitch: -1 | 0 | 1;
  /** action ごとの、前回 drain 以降の押下/離上エッジと現在の押下状態。 */
  buttons: Record<Action, CollectedButton>;
}

/**
 * 各デバイスからの生入力を集約する。
 * - ボタン: 複数ソースの OR。ステップ間に起きた押下/離上エッジはラッチして取りこぼさない。
 * - 移動: ソースごとのベクトルの和を長さ 1 に丸める。
 * - カメラ: 移動量を加算し、drain で取り出してリセットする。
 * DOM には依存しない。
 */
export class InputCollector {
  /** @param now 実時刻[ms]。ボタンの押下時間を実時間で測るために使う（テストで差し替え可能）。 */
  constructor(private readonly now: () => number = () => performance.now()) {}

  private readonly held = new Map<Action, Set<InputSource>>();
  private readonly pressedLatch = new Set<Action>();
  private readonly releasedLatch = new Set<Action>();
  private readonly pressedAt = new Map<Action, number>();
  private readonly releasedAt = new Map<Action, number>();
  private readonly moves = new Map<InputSource, Vec2>();
  private lookX = 0;
  private lookY = 0;
  private switchDir: -1 | 0 | 1 = 0;

  isHeld(action: Action): boolean {
    return (this.held.get(action)?.size ?? 0) > 0;
  }

  /** @param at イベント発生時刻[ms]（`event.timeStamp`）。省略時は呼び出し時刻。描画が重くハンドラが遅れても短押し判定がずれないようにする。 */
  setButton(source: InputSource, action: Action, down: boolean, at?: number): void {
    let set = this.held.get(action);
    if (!set) {
      set = new Set();
      this.held.set(action, set);
    }
    if (down === set.has(source)) return;
    const wasHeld = set.size > 0;
    if (down) set.add(source);
    else set.delete(source);
    const nowHeld = set.size > 0;
    if (!wasHeld && nowHeld) {
      this.pressedLatch.add(action);
      this.pressedAt.set(action, at ?? this.now());
    }
    if (wasHeld && !nowHeld) {
      this.releasedLatch.add(action);
      this.releasedAt.set(action, at ?? this.now());
    }
  }

  setMove(source: InputSource, x: number, y: number): void {
    if (x === 0 && y === 0) this.moves.delete(source);
    else this.moves.set(source, { x, y });
  }

  addLook(dx: number, dy: number): void {
    this.lookX += dx;
    this.lookY += dy;
  }

  /** ターゲット切替の要求（同一ステップ内で複数来たら最後が勝つ）。 */
  requestTargetSwitch(dir: -1 | 1): void {
    this.switchDir = dir;
  }

  /** あるソースが押しているボタンと移動をすべて解除する（フォーカス喪失・デバイス切替時）。 */
  releaseSource(source: InputSource): void {
    for (const action of ACTIONS) this.setButton(source, action, false);
    this.moves.delete(source);
  }

  /** 蓄積を取り出し、ラッチをクリアする。1 シミュレーションステップごとに 1 回呼ぶ。 */
  drain(): CollectedFrame {
    let mx = 0;
    let my = 0;
    for (const v of this.moves.values()) {
      mx += v.x;
      my += v.y;
    }
    const buttons = {} as Record<Action, CollectedButton>;
    for (const action of ACTIONS) {
      buttons[action] = {
        held: this.isHeld(action),
        // 押下してそのステップ中に離した場合も pressed は立つ
        pressed: this.pressedLatch.has(action),
        released: this.releasedLatch.has(action),
        pressedAt: this.pressedAt.get(action) ?? 0,
        releasedAt: this.releasedAt.get(action) ?? 0,
      };
    }
    const frame: CollectedFrame = {
      move: clampLength(mx, my),
      look: { x: this.lookX, y: this.lookY },
      targetSwitch: this.switchDir,
      buttons,
    };
    this.pressedLatch.clear();
    this.releasedLatch.clear();
    this.pressedAt.clear();
    this.releasedAt.clear();
    this.lookX = 0;
    this.lookY = 0;
    this.switchDir = 0;
    return frame;
  }
}

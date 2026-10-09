import type { FootstepGait } from '../../core/gameEvents';
import type { ClipEventEntry, MarkerType } from './eventMarkers';

/** イベントマーカーが発火したときの通知（`game` 層の消費者へ渡す）。 */
export interface AnimMarkerEvent {
  readonly type: MarkerType;
  /** 発火元の動作 ID（歩行・走りの足音は `locomotion`）。 */
  readonly actionId: string;
  /** 発火したシミュレーションフレーム（F1 起点。歩行の足音は 0）。 */
  readonly frame: number;
  /** 足音の歩様（`footstep` のみ）。 */
  readonly gait?: FootstepGait;
}

/**
 * 動作のイベントマーカー表を、フレームの進行に合わせて発火する。
 *
 * - `begin(entry)` で動作を始め、毎ステップ `advance(frame, out)` を呼ぶ。`frame` は動作に入ってからのフレーム
 *   （F1 起点）。前回から進んだぶん（`lastFrame < marker.frame <= frame`）を、フレーム昇順・同一フレームは
 *   表の記述順で `out` に積む。フレームが飛んでも取りこぼさず、同じマーカーを 2 度発火しない。
 * - 窓の状態（`hitActive` / `invulnerable` / `cancelOpen`）は、マーカーから導く。`hitEnd` / `invulnEnd` は
 *   **そのフレームを含めて**窓が有効（仕様書 0.2 節。F4–F15 なら F15 まで有効）で、次の `advance` で閉じる。
 *   つまり `advance(F)` の直後は「F の判定を行うときの状態」になっている。
 */
export class MarkerDispatcher {
  private entry: ClipEventEntry | undefined;
  private lastFrame = 0;
  private hit = false;
  private invuln = false;
  private cancel = false;
  private hitEnding = false;
  private invulnEnding = false;

  /** 動作を始める（`entry` が undefined なら表のない動作。何も発火しない）。 */
  begin(entry: ClipEventEntry | undefined): void {
    this.entry = entry;
    this.lastFrame = 0;
    this.hit = false;
    this.invuln = false;
    this.cancel = false;
    this.hitEnding = false;
    this.invulnEnding = false;
  }

  get actionId(): string | undefined {
    return this.entry?.id;
  }

  /** 攻撃判定が出ている窓の中か。 */
  get hitActive(): boolean {
    return this.hit;
  }

  /** 被ダメージ判定を持たない窓の中か。 */
  get invulnerable(): boolean {
    return this.invuln;
  }

  /** `cancelOpen` マーカー以降か（硬直中のキャンセル可能区間。個別の可否は `CharacterFsm.canCancelTo`）。 */
  get cancelOpen(): boolean {
    return this.cancel;
  }

  advance(frame: number, out: AnimMarkerEvent[]): void {
    // 前フレームで終了マーカーに達していた窓を閉じる
    if (this.hitEnding) {
      this.hit = false;
      this.hitEnding = false;
    }
    if (this.invulnEnding) {
      this.invuln = false;
      this.invulnEnding = false;
    }
    const entry = this.entry;
    if (!entry || frame <= this.lastFrame) return;
    for (const m of entry.markers) {
      if (m.frame <= this.lastFrame) continue;
      if (m.frame > frame) break;
      switch (m.type) {
        case 'hitStart':
          this.hit = true;
          this.hitEnding = false;
          break;
        case 'hitEnd':
          this.hitEnding = true;
          break;
        case 'invulnStart':
          this.invuln = true;
          this.invulnEnding = false;
          break;
        case 'invulnEnd':
          this.invulnEnding = true;
          break;
        case 'cancelOpen':
          this.cancel = true;
          break;
        default:
          break;
      }
      out.push({ type: m.type, actionId: entry.id, frame: m.frame });
    }
    this.lastFrame = frame;
  }
}

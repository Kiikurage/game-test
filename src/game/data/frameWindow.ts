/**
 * フレーム窓の規約（仕様書 0.2 節）。
 * フレーム番号は動作開始の次のフレームを F1 とし、`F1–F12` は 1〜12 フレーム目を**両端含む**。
 */

/** 閉区間の窓（F`start`–F`end`、両端含む）。 */
export interface FrameWindow {
  readonly start: number;
  readonly end: number;
}

/** `frame` が窓 `[start, end]`（両端含む）に入っているか。`start > end` は定義ミスなので例外。 */
export function isInWindow(frame: number, start: number, end: number): boolean {
  if (start > end) throw new RangeError(`不正な窓: F${start}–F${end}`);
  return frame >= start && frame <= end;
}

export function inWindow(frame: number, window: FrameWindow): boolean {
  return isInWindow(frame, window.start, window.end);
}

/** 窓の長さ（フレーム数）。`F4–F15` なら 12。 */
export function windowLength(window: FrameWindow): number {
  if (window.start > window.end) throw new RangeError(`不正な窓: F${window.start}–F${window.end}`);
  return window.end - window.start + 1;
}

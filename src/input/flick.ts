import { TOUCH } from './config';

export interface FlickSample {
  durationMs: number;
  dx: number;
  dy: number;
}

/** 素早い横方向のスワイプなら -1(左) / 1(右)、そうでなければ 0。 */
export function classifyFlick(s: FlickSample, cfg: typeof TOUCH.flick = TOUCH.flick): -1 | 0 | 1 {
  if (s.durationMs > cfg.maxDurationMs) return 0;
  if (Math.abs(s.dx) < cfg.minDistance) return 0;
  if (Math.abs(s.dx) < Math.abs(s.dy) * cfg.horizontalRatio) return 0;
  return s.dx > 0 ? 1 : -1;
}

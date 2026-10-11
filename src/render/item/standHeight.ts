import type { Interactable } from '../../game/data/world/types';
import type { Level } from '../../game/world/level';

/** 足場の上面が地形からこの高さ（m）以内なら、そこに立てる面とみなす（霊廟の屋根・岩棚・壁上）。 */
const MAX_RISE = 3.2;
/** 箱の縁から少しはみ出た位置も乗っているとみなす（m）。 */
const MARGIN = 0.15;

/**
 * 対象の位置で人が立つ面の高さ。地形より高い足場（脇道）と、地形より下の水路の床を考慮する。
 * 地形の高さ（`level.heightAt`）だけでは屋根・岩棚の上の遺体が地面に埋まるため。
 */
export function standHeight(
  level: Level,
  spot: { readonly x: number; readonly z: number; readonly site?: Interactable['site'] },
): number {
  const terrain = level.heightAt(spot.x, spot.z);
  const underground = spot.site === 'side_waterway';
  let best = underground ? -Infinity : terrain;
  for (const b of level.boxes) {
    if (b.pitchDeg) continue;
    const isWaterwayFloor = b.id.startsWith('ww-floor');
    if (underground ? !isWaterwayFloor : b.id.startsWith('ww-')) continue;
    const r = ((b.yawDeg ?? 0) * Math.PI) / 180;
    const dx = spot.x - b.x;
    const dz = spot.z - b.z;
    const lx = dx * Math.cos(r) - dz * Math.sin(r);
    const lz = dx * Math.sin(r) + dz * Math.cos(r);
    if (Math.abs(lx) > b.hx + MARGIN || Math.abs(lz) > b.hz + MARGIN) continue;
    const top = b.y + b.hy;
    if (underground || (top >= terrain - 0.1 && top <= terrain + MAX_RISE)) {
      best = Math.max(best, top);
    }
  }
  return Number.isFinite(best) ? best : terrain;
}

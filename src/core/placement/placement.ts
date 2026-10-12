// 配置の設定: 各 job をどこで動かすか（#383 spike）。設定はこの 1 か所に集め、`?place=` で上書きできる。
// 例: `?place=particles:gpu,physics:worker-sab`

export type Place = 'main' | 'gpu' | 'worker-sab' | 'worker-msg';

export const PLACES: readonly Place[] = ['main', 'gpu', 'worker-sab', 'worker-msg'];

export type Placement = Readonly<Record<string, Place>>;

/** 既定の配置（job id → 実行場所）。配置を変えるときはここだけを書き換える。 */
export const DEFAULT_PLACEMENT: Placement = {
  particles: 'main',
  physics: 'main',
};

/** `?place=` の値（`id:place` のカンマ区切り）を既定に重ねる。不正な項目は無視する。 */
export function parsePlacement(
  query: string | null,
  base: Placement = DEFAULT_PLACEMENT,
): Placement {
  const out: Record<string, Place> = { ...base };
  if (!query) return out;
  for (const item of query.split(',')) {
    const [id, place] = item.split(':');
    if (!id || !place) continue;
    if ((PLACES as readonly string[]).includes(place)) out[id] = place as Place;
  }
  return out;
}

export function placeOf(placement: Placement, id: string): Place {
  return placement[id] ?? 'main';
}

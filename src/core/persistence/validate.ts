/** 未知の値を検証・補正するための小さなヘルパー群。いずれも例外を投げない。 */

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function asBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** 有限な数値なら [min, max] に丸めて返す（`step` 指定時は min 起点のその刻みに揃える）。そうでなければ undefined。 */
export function clampNumber(
  v: unknown,
  min: number,
  max: number,
  step?: number,
): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined;
  const n = Math.min(max, Math.max(min, v));
  if (step === undefined) return n;
  return Math.min(max, min + Math.round((n - min) / step) * step);
}

export function asNumber(
  v: unknown,
  fallback: number,
  min: number,
  max: number,
  step?: number,
): number {
  return clampNumber(v, min, max, step) ?? fallback;
}

export function asOneOf<const U extends readonly (string | number)[]>(
  v: unknown,
  allowed: U,
  fallback: U[number],
): U[number] {
  return allowed.includes(v as U[number]) ? (v as U[number]) : fallback;
}

/** 文字列の配列（重複除去・ソート済み）。不正な要素は捨てる。 */
export function asStringSet(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out = new Set<string>();
  for (const e of v as unknown[]) if (typeof e === 'string' && e.length > 0) out.add(e);
  return [...out].sort();
}

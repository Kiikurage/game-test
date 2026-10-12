/**
 * ロード時間の内訳（#388）。`performance.measure('load:<名前>')` を残す。コストはほぼ無いので本番でも残す。
 * `npm run perf` が `performance.getEntriesByType('measure')` から `load:` で始まるものを時間順の表にする。
 *
 * 名前は段階（`LOAD_STAGES`: code・renderer・physics・scene・assets）と、その中の主な待ち（`<段階>/<内訳>`）。
 * 内訳は段階の区間に含まれる（足し合わせると段階より短い場合は、計測していない処理がある）。
 */

/** 区間の開始。返した関数を呼ぶと `load:<name>` として記録する。 */
export function beginLoadSpan(name: string): () => void {
  const start = performance.now();
  return () => {
    performance.measure(`load:${name}`, { start, end: performance.now() });
  };
}

/** `fn` の実行（Promise なら完了まで）を `load:<name>` として記録する。失敗しても記録する。 */
export async function loadSpan<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
  const end = beginLoadSpan(name);
  try {
    return await fn();
  } finally {
    end();
  }
}

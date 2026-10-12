/**
 * `promise` が `ms` ミリ秒以内に決着すれば `true`、間に合わなければ `false` で解決する。
 * 待ちきれなくても進めてよい処理（ローディング中の GPU ウォームアップなど）が、ロードを止めないための上限（#369）。
 * `promise` の reject はそのまま伝える。
 */
export function settleWithin(promise: Promise<unknown>, ms: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      resolve(false);
    }, ms);
  });
  return Promise.race([promise.then(() => true), timeout]).finally(() => {
    clearTimeout(timer);
  });
}

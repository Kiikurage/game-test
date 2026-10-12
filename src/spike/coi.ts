// crossOriginIsolated にする（#383 spike）。ヘッダーを付けられない配信（GitHub Pages）向けに、
// `coi-sw.js` を登録して 1 回だけ再読み込みする。SW が使えない・登録に失敗したら false のまま続ける。

const RELOAD_KEY = 'coi-reloaded';

/** true なら SharedArrayBuffer が使える。再読み込みが必要なときは戻らない（ページが読み直される）。 */
export async function ensureCrossOriginIsolated(): Promise<boolean> {
  if (window.crossOriginIsolated) {
    sessionStorage.removeItem(RELOAD_KEY);
    return true;
  }
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return false;
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}coi-sw.js`);
    await navigator.serviceWorker.ready;
    // 制御下に入っているのに隔離されていない（ヘッダーが効かない）なら、何度も読み直さない
    if (sessionStorage.getItem(RELOAD_KEY) === '1') {
      console.warn('[coi] service worker active but page is not crossOriginIsolated');
      return false;
    }
    sessionStorage.setItem(RELOAD_KEY, '1');
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {
            resolve();
          },
          {
            once: true,
          },
        );
      });
    }
    window.location.reload();
    return await new Promise<never>(() => undefined);
  } catch (e) {
    console.warn('[coi] service worker registration failed', e);
    return false;
  }
}

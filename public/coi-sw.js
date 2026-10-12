// COOP / COEP を付ける Service Worker（#383 spike。coi-serviceworker 相当の最小版）。
// GitHub Pages はレスポンスヘッダーを設定できないので、SW がレスポンスを包み直してヘッダーを足し、
// ページを crossOriginIsolated（SharedArrayBuffer が使える状態）にする。
// 本番のゲームに影響しないよう、ナビゲーションは `spike=` を含む URL だけに付ける。
// サブリソース（Worker のスクリプト等）には COEP / CORP を付ける（同一オリジンなので害は無い）。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isNav = req.mode === 'navigate';
  if (isNav && !url.searchParams.has('spike')) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.status === 0) return res;
      const headers = new Headers(res.headers);
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      headers.set('Cross-Origin-Resource-Policy', 'same-origin');
      if (isNav) headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }),
  );
});

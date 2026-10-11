// 撮影・計測スクリプト（shot / heroShots / perf / profile / wgslStats）の共通処理。
// ビルド（スキップ可）→ vite preview → Chromium 起動（GPU_MODE は chromium.mjs の launchOptions が見る）
// → ページを開いて `dev.start()` で開始（開始画面をクリックしない。Pointer Lock を取らず、実マウスに触れない）→ 視点設定。
// 待ちはシミュレーションのステップ数・描画フレーム数で数える（実時間待ちはしない）。
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { launchOptions } from '../chromium.mjs';

const DEG = Math.PI / 180;

/** ビューポート（PC 1280x720 と、モバイル基準機 Xperia 1 V 相当の横画面 915x412 DPR3）。 */
export const VIEWPORTS = {
  pc: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};

/**
 * ビルド → preview → ブラウザ起動。
 * @param {object} o
 * @param {number} o.port プレビューのポート
 * @param {boolean} [o.skipBuild] true ならビルド済みの出力を配信する
 * @param {object} [o.build] vite build の追加設定（例: `{ outDir, minify: false }`）。outDir は preview にも使う
 */
export async function openSession({ port, skipBuild = false, build: buildConfig = {} }) {
  if (!skipBuild) await build({ logLevel: 'warn', build: { emptyOutDir: true, ...buildConfig } });
  const server = await preview({
    build: buildConfig.outDir ? { outDir: buildConfig.outDir } : {},
    preview: { host: 'localhost', port, strictPort: true },
  });
  let browser;
  try {
    browser = await chromium.launch(launchOptions());
  } catch (e) {
    await closeServer(server);
    throw e;
  }
  return {
    browser,
    /** ゲームの URL（query は '?quality=high' のような先頭 '?' 付き、または空文字）。 */
    url: (query = '') => `http://localhost:${port}/game-test/${query}`,
    async close() {
      await browser.close();
      await closeServer(server);
    },
  };
}

function closeServer(server) {
  return new Promise((done) => server.httpServer.close(done));
}

/**
 * 新しいコンテキストでページを開く（console.error / pageerror を標準エラーへ流す）。
 * @param {Awaited<ReturnType<typeof openSession>>} session
 * @param {object} [o]
 * @param {object} [o.context] browser.newContext のオプション（VIEWPORTS の値など）
 * @param {Record<string, unknown>} [o.localStorage] 起動前に入れるキーと値（文字列以外は JSON にする）
 * @param {string} [o.label] ログの接頭辞
 * @param {string[]} [o.consoleTypes] 流す console の種類（既定 ['error']）
 */
export async function newPage(session, o = {}) {
  const context = await session.browser.newContext(o.context ?? {});
  const page = await context.newPage();
  const prefix = o.label ? `[${o.label}] ` : '';
  const types = o.consoleTypes ?? ['error'];
  page.on('console', (m) => {
    if (types.includes(m.type())) console.error(`${prefix}console.${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (err) => console.error(`${prefix}pageerror: ${err.message}`));
  const entries = Object.entries(o.localStorage ?? {}).map(([k, v]) => [
    k,
    typeof v === 'string' ? v : JSON.stringify(v),
  ]);
  if (entries.length > 0) {
    await page.addInitScript((list) => {
      for (const [k, v] of list) localStorage.setItem(k, v);
    }, entries);
  }
  return { context, page };
}

/** 開始画面（`#app[data-state=ready]`。WebGPU 非対応なら unsupported）まで待つ。ローディング中の warmUp も含む。 */
export async function waitReady(page, timeout = 300_000) {
  await page.waitForFunction(
    () => ['ready', 'unsupported'].includes(document.getElementById('app')?.dataset.state ?? ''),
    null,
    { timeout },
  );
  return page.evaluate(() => document.getElementById('app')?.dataset.state);
}

/** 開始画面まで待ち、`dev.start()` で開始して running になるまで待つ。 */
export async function startGame(page, timeout = 300_000) {
  const state = await waitReady(page, timeout);
  if (state !== 'ready') throw new Error(`game did not become ready (state=${state})`);
  await page.evaluate(() => window.__game.dev.start());
  await page.waitForFunction(
    () => document.getElementById('app')?.dataset.state === 'running',
    null,
    { timeout },
  );
}

/** 描画フレームを n 枚進むまで待つ（`window.__game.frames`）。 */
export async function waitFrames(page, n, timeout = 300_000) {
  const start = await page.evaluate(() => window.__game.frames);
  await page.waitForFunction((t) => window.__game.frames >= t, start + n, { timeout });
}

/** シミュレーションが n ステップ進むまで待つ（`window.__game.steps`。一時停止中は進まない）。 */
export async function waitSteps(page, n, timeout = 300_000) {
  const start = await page.evaluate(() => window.__game.steps);
  await page.waitForFunction((t) => window.__game.steps >= t, start + n, { timeout });
}

/** プレイヤーを置き、カメラをその背後に付ける（一時停止はしない。perf / wgslStats の計測視点）。 */
export async function setViewpoint(page, { x, z, yaw, y }) {
  await page.evaluate(
    (v) => {
      window.__game.dev.teleport(v.x, v.z, v.yaw, v.y);
      window.__game.dev.view(0);
    },
    { x, z, yaw, y },
  );
}

/** HUD・タッチ操作の UI を隠し、キャンバスだけを写す。 */
export async function hideHud(page) {
  await page.addStyleTag({
    content: 'body > :not(#app), #app > :not(canvas) { visibility: hidden !important; }',
  });
}

/**
 * heroShots.json の視点（度・向きの点）を、ページ内で実行する形（ラジアン・既定値の解決済み）にする。
 * @param {object} shot heroShots.json の shots[] の要素
 * @param {object} [defaults] heroShots.json の defaults
 */
export function resolveShot(shot, defaults = {}) {
  const camera = { ...(defaults.camera ?? {}), ...(shot.camera ?? {}) };
  const player = shot.player && {
    x: shot.player.x,
    z: shot.player.z,
    y: shot.player.y,
    yaw:
      shot.player.face !== undefined
        ? Math.atan2(shot.player.face[0] - shot.player.x, shot.player.face[1] - shot.player.z)
        : (shot.player.yawDeg ?? 0) * DEG,
  };
  return {
    player,
    camera: {
      yawOffset: (camera.yawOffsetDeg ?? 0) * DEG,
      distance: camera.distance,
      pitchDeg: camera.pitchDeg,
    },
    freeCam: shot.freeCam ?? null,
    dev: shot.dev ?? [],
    actions: shot.actions ?? [],
    steps: shot.steps ?? defaults.steps ?? 60,
    frames: shot.frames ?? defaults.frames ?? 12,
  };
}

/**
 * 視点の状態を作る（resolveShot の結果）。シミュレーションを止め、dev → 配置 → steps だけ進める → actions → 自由視点。
 * その後、描画側（パーティクル・ムードの補間・影）の立ち上がりを spec.frames フレーム待つ。
 */
export async function stageShot(page, spec) {
  await page.evaluate((s) => {
    const dev = window.__game.dev;
    /** 'input.press' のような '.' 区切りの名前も引ける。 */
    const call = ([name, ...args]) => {
      const path = name.split('.');
      const owner = path.slice(0, -1).reduce((o, k) => o?.[k], dev);
      const fn = owner?.[path[path.length - 1]];
      if (typeof fn !== 'function') throw new Error(`unknown dev hook: ${name}`);
      return fn.apply(owner, args);
    };
    dev.pause(true);
    dev.input.releaseAll();
    dev.freeCam(null);
    // 前の視点のボスを残さない（出す視点は dev で bossSpawn / arenaEnter を呼ぶ）
    dev.bossRemove();
    for (const c of s.dev) call(c);
    if (s.player) dev.teleport(s.player.x, s.player.z, s.player.yaw, s.player.y);
    dev.view(s.camera.yawOffset, s.camera.distance, s.camera.pitchDeg);
    // 物理の接地・アニメーション・カメラの追従・敵の反応を落ち着かせる（シミュレーション基準の待ち）
    dev.advance(s.steps);
    for (const c of s.actions) call(c);
    if (s.freeCam) dev.freeCam(s.freeCam.position, s.freeCam.target);
  }, spec);
  await waitFrames(page, spec.frames);
}

// 常駐デバッグサーバ（npm run dbg）。ブラウザとゲームのページを起動したまま保持し、CLI から操作・撮影する。
// ビルド・ブラウザ起動・アセット読み込み・初回シェーダコンパイル（GameView.warmUp）の固定費を 1 回だけ払う。
//
// 使い方: npm run dbg -- <コマンド> [引数]
//   start [--mode dev|build] [--query "?quality=low"] [--size pc|mobile] [--port N] [--live] [--no-hold]
//                      常駐プロセスを起動し、ゲームを開始状態（running、シミュレーション一時停止）まで進めて待つ
//                      dev  : Vite 開発サーバ（ビルドなし。既定）
//                      build: vite build --watch の差分ビルド + preview 配信（本番と同じバンドル）
//   status             状態（URL・クエリ・ステップ数・ソース変更の有無）
//   reload [--query Q] [--size pc|mobile]   再読み込み（クエリ・サイズは以後も保持）
//   eval "<JS>"        ページ内で評価して結果を JSON で返す。`dev`（= window.__game.dev）と `game`（= window.__game）が使える
//                      例: npm run dbg -- eval "dev.teleport(0, 5, 0); game.sim.player"
//   steps <n>          シミュレーションを n ステップ（60Hz）進める（一時停止のまま）
//   teleport <x> <z> [yawDeg] [y]          プレイヤーを移動し、カメラを背後に置き直す
//   key <code> [steps] キーを押したまま n ステップ進めて離す（既定 1。例: key KeyW 30）
//   shot <出力パス> [--view <ヒーローショット名|x,y,z:tx,ty,tz>] [--size pc|mobile] [--frames n] [--no-hud]
//                      PNG を保存する。--view の名前は scripts/heroShots.json の視点（クエリ・セーブも合わせる）
//   stop               常駐プロセスを終了する
// ソース（src/・public/・index.html）が変わっていたら、各コマンドの前に自動で再ビルド（build モード）・再読み込みする。
//
// 複数エージェントの同時使用: 状態ディレクトリ（既定 <worktree>/node_modules/.cache/dbg。DBG_DIR で上書き）ごとに
// 1 つの常駐プロセスが動く。制御用 HTTP と配信のポートは OS が空きを割り当てる（--port / DBG_PORT で固定も可）。
// ブラウザのプロファイル（GPU シェーダのディスクキャッシュを含む）も状態ディレクトリの下に置き、起動をまたいで使い回す。
// 待機中は requestAnimationFrame を保留して描画を止め、CPU を使わない（CDP の Page.setWebLifecycleState=frozen では
// headless の rAF が止まらず、SwiftShader が描画し続けた）。
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer, request } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HIDE_HUD_CSS,
  localStorageEntries,
  resolveShot,
  shotQuery,
  stage,
} from './heroShotStage.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATE_DIR = resolve(process.env.DBG_DIR ?? join(ROOT, 'node_modules/.cache/dbg'));
const INFO_FILE = join(STATE_DIR, 'daemon.json');
const LOG_FILE = join(STATE_DIR, 'daemon.log');

const SIZES = {
  pc: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 915, height: 412 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};
const HUD_STYLE_ID = '__dbg-hide-hud';

function parseFlags(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (key.startsWith('no-')) flags[key.slice(3)] = false;
      else if (next === undefined || next.startsWith('--')) flags[key] = true;
      else flags[key] = argv[++i];
    } else positional.push(a);
  }
  return { flags, positional };
}

const normalizeQuery = (q) => (!q ? '' : q.startsWith('?') ? q : `?${q}`);

// ---------------------------------------------------------------- クライアント

function readInfo() {
  try {
    return JSON.parse(readFileSync(INFO_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function call(port, command, args) {
  const body = JSON.stringify({ command, args });
  return new Promise((resolvePromise, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port,
        method: 'POST',
        path: '/',
        headers: { 'content-type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolvePromise(JSON.parse(data));
          } catch {
            reject(new Error(`bad response: ${data}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.end(body);
  });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function startDaemon(argv) {
  const info = readInfo();
  if (info && isAlive(info.pid)) {
    console.log(`already running (pid ${info.pid}, ${info.url ?? 'loading'}). stop で終了`);
    return;
  }
  mkdirSync(STATE_DIR, { recursive: true });
  rmSync(INFO_FILE, { force: true });
  const log = openSync(LOG_FILE, 'w');
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '__daemon', ...argv], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  const t0 = performance.now();
  // 制御ポートが書き出されるまで待つ（起動直後の短い間だけ。読み込み完了は /status の wait で待つ）
  let current = readInfo();
  while (!current) {
    if (!isAlive(child.pid)) throw new Error(`daemon exited. log: ${LOG_FILE}`);
    await delay(200);
    current = readInfo();
  }
  const res = await call(current.controlPort, 'status', { wait: true });
  if (!res.ok) throw new Error(`${res.error}\nlog: ${LOG_FILE}`);
  console.log(JSON.stringify(res.result, null, 2));
  console.log(`started in ${((performance.now() - t0) / 1000).toFixed(1)}s (log: ${LOG_FILE})`);
}

async function client(command, argv) {
  if (command === 'start') return startDaemon(argv);
  const info = readInfo();
  if (!info || !isAlive(info.pid)) {
    if (command === 'stop') return console.log('not running');
    throw new Error('daemon is not running. 先に `npm run dbg -- start`');
  }
  const { flags, positional } = parseFlags(argv);
  const t0 = performance.now();
  const res = await call(info.controlPort, command, { flags, positional });
  const seconds = ((performance.now() - t0) / 1000).toFixed(1);
  for (const line of res.logs ?? []) console.error(line);
  if (!res.ok) {
    console.error(`error: ${res.error}`);
    process.exitCode = 1;
    return;
  }
  if (res.result !== undefined) console.log(JSON.stringify(res.result, null, 2));
  console.error(`(${command}: ${seconds}s)`);
}

// ---------------------------------------------------------------- 常駐プロセス

/**
 * ページ内（init script）: requestAnimationFrame を保留できるようにし、GPUDevice を捕まえる。
 * SwiftShader では rAF が GPU の完了より速く回り、GPU のキューに数フレーム分の仕事が溜まる（撮影・読み出しがその分待たされる）。
 * 待機中・撮影時は rAF を保留し、1 フレームずつ描いて GPU の完了を待つ。
 *   __dbgHold(bool) : 保留の切り替え。解除時は保留中のコールバックをまとめて登録する
 *   __dbgFrame()    : 保留したまま 1 フレームだけ描き、GPU の完了まで待つ
 *   __dbgIdle()     : GPU のキューが空になるまで待つ
 */
function installRafHold() {
  const native = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const pending = new Map();
  const live = new Map();
  let held = false;
  let nextId = 1;
  let device = null;
  if (window.GPUAdapter) {
    const requestDevice = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...args) {
      device = await requestDevice.apply(this, args);
      return device;
    };
  }
  const schedule = (id, cb) => {
    live.set(
      id,
      native((t) => {
        live.delete(id);
        cb(t);
      }),
    );
  };
  const flush = () => {
    const batch = [...pending];
    pending.clear();
    for (const [id, cb] of batch) schedule(id, cb);
  };
  window.requestAnimationFrame = (cb) => {
    const id = nextId++;
    if (held) pending.set(id, cb);
    else schedule(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    pending.delete(id);
    if (live.has(id)) nativeCancel(live.get(id));
    live.delete(id);
  };
  window.__dbgIdle = async () => {
    await device?.queue.onSubmittedWorkDone();
  };
  window.__dbgHold = (h) => {
    held = h;
    if (!h) flush();
  };
  window.__dbgFrame = async () => {
    held = true;
    flush();
    await new Promise((r) => native(() => native(r)));
    await window.__dbgIdle();
  };
}

async function daemon(argv) {
  const { flags } = parseFlags(argv);
  const { chromium } = await import('@playwright/test');
  const vite = await import('vite');
  const { launchOptions } = await import('./chromium.mjs');

  const mode = flags.mode ?? 'dev';
  if (mode !== 'dev' && mode !== 'build') throw new Error(`unknown mode: ${mode}`);
  const appPort = Number(flags.port ?? process.env.DBG_PORT ?? 0);
  const hold = flags.hold !== false;
  const live = flags.live === true;
  const profileDir = join(STATE_DIR, 'profile');
  const heroViews = JSON.parse(readFileSync(join(ROOT, 'scripts/heroShots.json'), 'utf8'));

  const state = {
    query: normalizeQuery(flags.query ?? ''),
    size: flags.size ?? 'pc',
    storage: [], // 読み込み前に localStorage へ入れる [key, value]（それ以外は消す）
    dirty: false,
    building: false,
    buildError: null,
    lastLoad: null,
  };
  const logs = [];
  const log = (line) => {
    console.log(line);
    logs.push(line);
    if (logs.length > 200) logs.shift();
  };

  // --- 配信（dev: 開発サーバ / build: 差分ビルド + preview）
  let appServer;
  let closeBuild = async () => {};
  let buildDone = Promise.resolve();
  const isSource = (file) => /[/\\](src|public)[/\\]|index\.html$/.test(file);
  if (mode === 'dev') {
    // HMR は切る（勝手に再読み込みさせない）。ファイル監視は残し、変更があれば次のコマンドの前に再読み込みする
    appServer = await vite.createServer({
      root: ROOT,
      logLevel: 'warn',
      server: { host: '127.0.0.1', port: appPort, strictPort: appPort !== 0, hmr: false },
    });
    await appServer.listen();
    appServer.watcher.on('all', (_event, file) => {
      if (isSource(file)) state.dirty = true;
    });
  } else {
    const outDir = join(STATE_DIR, 'dist');
    let finish = () => {};
    const watcher = await vite.build({
      root: ROOT,
      logLevel: 'warn',
      build: { outDir, emptyOutDir: true, watch: {} },
    });
    buildDone = new Promise((r) => (finish = r));
    state.building = true;
    watcher.on('event', (e) => {
      if (e.code === 'START') {
        if (!state.building) buildDone = new Promise((r) => (finish = r));
        state.building = true;
      } else if (e.code === 'ERROR') {
        state.buildError = String(e.error?.message ?? e.error);
        log(`[build] error: ${state.buildError}`);
      } else if (e.code === 'BUNDLE_END') {
        e.result?.close?.();
      } else if (e.code === 'END') {
        if (state.lastLoad) state.dirty = true;
        state.building = false;
        finish();
      }
    });
    closeBuild = () => watcher.close();
    await buildDone;
    if (state.buildError) throw new Error(state.buildError);
    appServer = await vite.preview({
      root: ROOT,
      logLevel: 'warn',
      build: { outDir },
      preview: { host: '127.0.0.1', port: appPort, strictPort: appPort !== 0 },
    });
  }
  const address = appServer.httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const appUrl = `${origin}/game-test/`;

  // --- ブラウザ（固定プロファイル = シェーダのディスクキャッシュを使い回す）
  let context;
  let page;
  let held = false;
  async function openBrowser() {
    if (context) await context.close();
    context = await chromium.launchPersistentContext(profileDir, {
      ...launchOptions(),
      ...SIZES[state.size],
    });
    page = context.pages()[0] ?? (await context.newPage());
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        log(`[console.${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => log(`[pageerror] ${err.message}`));
    // 読み込み前に localStorage を整えるための空ページ（同一オリジン）
    await page.route(`${origin}/__dbg/blank`, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>dbg</title>' }),
    );
    // 待機中に描画を止めるため、rAF を保留できるようにする（window.__dbgHold(true|false)）
    await context.addInitScript(installRafHold);
    held = false;
  }
  async function setHeld(h) {
    if (!hold || held === h || !page) return;
    await page.evaluate((v) => window.__dbgHold?.(v), h);
    held = h;
  }

  async function load() {
    await buildDone;
    if (state.buildError) throw new Error(`build failed: ${state.buildError}`);
    await setHeld(false);
    const t0 = performance.now();
    await page.goto(`${origin}/__dbg/blank`);
    await page.evaluate((entries) => {
      localStorage.clear();
      for (const [k, v] of entries) localStorage.setItem(k, v);
    }, state.storage);
    state.dirty = false;
    await page.goto(`${appUrl}${state.query}`);
    held = false; // 新しいドキュメントは保留なしで始まる
    await page.waitForFunction(
      () => ['ready', 'unsupported'].includes(document.getElementById('app')?.dataset.state ?? ''),
      null,
      { timeout: 900_000, polling: 250 },
    );
    const tReady = performance.now();
    const appState = await page.evaluate(() => document.getElementById('app')?.dataset.state);
    if (appState === 'unsupported') throw new Error('WebGPU unsupported (data-state=unsupported)');
    await page.locator('[data-testid=start-screen]').click();
    await page.waitForFunction(() => document.getElementById('app')?.dataset.state === 'running');
    if (!live) await page.evaluate(() => window.__game.dev.pause(true));
    // 読み込み中に溜まった GPU の仕事を流し切る（以後のコマンドが待たされないように）
    await setHeld(true);
    await page.evaluate(() => window.__dbgIdle());
    state.lastLoad = {
      url: `${appUrl}${state.query}`,
      size: state.size,
      readySeconds: +((tReady - t0) / 1000).toFixed(1),
      totalSeconds: +((performance.now() - t0) / 1000).toFixed(1),
    };
    log(`[load] ${JSON.stringify(state.lastLoad)}`);
    return state.lastLoad;
  }

  /** サイズ・クエリ・セーブが変わる、またはソースが変わったときだけ読み込み直す。 */
  async function ensure({ size, query, storage } = {}) {
    let reopen = false;
    let reload = state.dirty;
    if (size && size !== state.size) {
      if (!SIZES[size]) throw new Error(`unknown size: ${size}`);
      state.size = size;
      reopen = true;
    }
    if (query !== undefined && normalizeQuery(query) !== state.query) {
      state.query = normalizeQuery(query);
      reload = true;
    }
    if (storage && JSON.stringify(storage) !== JSON.stringify(state.storage)) {
      state.storage = storage;
      reload = true;
    }
    if (state.building) reload = true;
    if (reopen) await openBrowser();
    if (reopen || reload) return load();
    return null;
  }

  const inPage = (fn, arg) => page.evaluate(fn, arg);
  const summary = () =>
    inPage(() => {
      const g = window.__game;
      const p = g.sim?.player;
      return {
        steps: g.steps,
        frames: g.frames,
        player: p && { ...p.position, yaw: p.yaw, state: p.state },
      };
    });

  /** 保留したまま n フレーム描く（各フレームで GPU の完了を待つ）。 */
  async function renderFrames(n) {
    await setHeld(true);
    await inPage(async (count) => {
      for (let i = 0; i < count; i++) await window.__dbgFrame();
    }, n);
  }

  const commands = {
    async status({ wait } = {}) {
      if (wait) await ready;
      return {
        mode,
        url: appUrl,
        query: state.query,
        size: state.size,
        dirty: state.dirty,
        building: state.building,
        lastLoad: state.lastLoad,
        stateDir: STATE_DIR,
        ...(page && state.lastLoad ? await summary() : {}),
      };
    },
    async reload({ flags: f }) {
      const reopen = f.size && f.size !== state.size;
      if (f.query !== undefined) state.query = normalizeQuery(f.query === true ? '' : f.query);
      if (reopen) {
        if (!SIZES[f.size]) throw new Error(`unknown size: ${f.size}`);
        state.size = f.size;
        await openBrowser();
      }
      return load();
    },
    async eval({ positional }) {
      const source = positional.join(' ');
      const reloaded = await ensure();
      await setHeld(false); // eval 中は描画も回す（frames を待つ式などのため）
      const result = await inPage(async (src) => {
        const game = window.__game;
        const dev = game?.dev;
        let fn;
        try {
          fn = new Function('game', 'dev', `return (async () => (${src}))();`);
        } catch {
          fn = new Function('game', 'dev', `return (async () => { ${src} })();`);
        }
        const value = await fn(game, dev);
        return value === undefined ? null : JSON.parse(JSON.stringify(value));
      }, source);
      return reloaded ? { reloaded, result } : result;
    },
    async steps({ positional }) {
      const n = Number(positional[0] ?? 1);
      await ensure();
      await inPage((count) => {
        window.__game.dev.pause(true);
        window.__game.dev.advance(count);
      }, n);
      return summary();
    },
    async teleport({ positional }) {
      const [x, z, yawDeg = 0, y] = positional.map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(z)) throw new Error('usage: teleport <x> <z>');
      await ensure();
      await inPage(
        ([px, pz, yaw, py]) => {
          const dev = window.__game.dev;
          dev.pause(true);
          dev.teleport(px, pz, yaw, Number.isFinite(py) ? py : undefined);
          dev.view(0);
        },
        [x, z, (yawDeg * Math.PI) / 180, y],
      );
      return summary();
    },
    async key({ positional }) {
      const code = positional[0];
      const n = Number(positional[1] ?? 1);
      if (!code) throw new Error('usage: key <code> [steps]');
      await ensure();
      await inPage(
        ([c, count]) => {
          const dev = window.__game.dev;
          dev.pause(true);
          const fire = (type) =>
            window.dispatchEvent(new KeyboardEvent(type, { code: c, bubbles: true }));
          fire('keydown');
          dev.advance(count);
          fire('keyup');
          dev.advance(1);
        },
        [code, n],
      );
      return summary();
    },
    async shot({ positional, flags: f }) {
      const out = resolve(ROOT, (positional[0] ?? 'shots/dbg').replace(/(\.png)?$/i, '.png'));
      mkdirSync(dirname(out), { recursive: true });
      let spec = null;
      let hud = f.hud !== false;
      let frames = Number(f.frames ?? 1);
      let freeCam = null;
      let reloaded;
      const view = typeof f.view === 'string' ? f.view : null;
      const free = view && /^(-?[\d.]+,){2}-?[\d.]+:(-?[\d.]+,){2}-?[\d.]+$/.test(view);
      if (view && free) {
        const [p, t] = view.split(':').map((v) => v.split(',').map(Number));
        freeCam = { position: p, target: t };
        reloaded = await ensure({ size: f.size });
      } else if (view) {
        const hero = heroViews.shots.find((s) => s.name === view);
        if (!hero) throw new Error(`unknown view: ${view}（scripts/heroShots.json の name）`);
        const defaults = heroViews.defaults ?? {};
        const base = Object.fromEntries(new URLSearchParams(state.query));
        reloaded = await ensure({
          size: f.size,
          query: shotQuery(hero, defaults, base),
          storage: localStorageEntries(defaults),
        });
        spec = resolveShot(hero, defaults);
        hud = f.hud === true || (f.hud !== false && (defaults.hud ?? false));
        frames = Number(f.frames ?? spec.frames);
      } else {
        reloaded = await ensure({ size: f.size });
      }
      const t0 = performance.now();
      // 溜まった GPU の仕事を流し切ってから、保留したまま視点を組み立てて必要なフレームだけ描く
      await setHeld(true);
      await inPage(() => window.__dbgIdle());
      const tIdle = performance.now();
      if (spec) await inPage(stage, spec);
      if (freeCam) {
        await inPage((c) => window.__game.dev.freeCam(c.position, c.target), freeCam);
      }
      await inPage(
        ([hide, id, css]) => {
          document.getElementById(id)?.remove();
          if (!hide) return;
          const style = document.createElement('style');
          style.id = id;
          style.textContent = css;
          document.head.append(style);
        },
        [!hud, HUD_STYLE_ID, HIDE_HUD_CSS],
      );
      if (frames > 0) await renderFrames(frames);
      await page.screenshot({ path: out, timeout: 600_000 });
      return {
        file: out,
        shotSeconds: +((performance.now() - t0) / 1000).toFixed(1),
        drainSeconds: +((tIdle - t0) / 1000).toFixed(1),
        ...(reloaded ? { reloaded } : {}),
        ...(await summary()),
      };
    },
  };

  // --- 制御用 HTTP（OS が割り当てたポートを daemon.json に書く）
  let queue = Promise.resolve();
  let ready;
  let shutdown;
  const control = createHttpServer((req, res) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { command, args } = JSON.parse(body || '{}');
      const run = async () => {
        const logStart = logs.length;
        try {
          if (command === 'stop') {
            setImmediate(shutdown);
            return { ok: true, result: 'stopping' };
          }
          const fn = commands[command];
          if (!fn) throw new Error(`unknown command: ${command}`);
          if (command !== 'status') await ready;
          const result = await fn(args ?? {});
          return { ok: true, result, logs: logs.slice(logStart) };
        } catch (e) {
          return { ok: false, error: e?.message ?? String(e), logs: logs.slice(logStart) };
        } finally {
          await setHeld(true).catch(() => {});
        }
      };
      // status の wait は読み込み中に来るので、直列化のキューに入れない
      const p = command === 'status' ? run() : (queue = queue.then(run, run));
      void p.then((out) => {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(out));
      });
    });
  });
  await new Promise((r) => control.listen(0, '127.0.0.1', r));
  shutdown = async () => {
    control.close();
    await context?.close().catch(() => {});
    await closeBuild();
    await appServer.close?.();
    await new Promise((r) => appServer.httpServer.close(r));
    rmSync(INFO_FILE, { force: true });
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
  writeFileSync(
    INFO_FILE,
    JSON.stringify({ pid: process.pid, controlPort: control.address().port, url: appUrl, mode }),
  );
  log(`[dbg] ${mode} ${appUrl} control=${control.address().port} profile=${profileDir}`);

  ready = (async () => {
    await openBrowser();
    await load();
  })();
  // 読み込みに失敗しても常駐は続ける（reload で再試行できる）。失敗は status の wait に返す
  ready.catch((e) => log(`[load] failed: ${e?.message ?? e}`));
  ready.finally(() => setHeld(true).catch(() => {}));
}

// ---------------------------------------------------------------- エントリ

const [command, ...rest] = process.argv.slice(2);
if (!command || command === 'help' || command === '--help') {
  const src = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  console.log(
    src
      .slice(0, src.indexOf('\nimport '))
      .split('\n')
      .map((l) => l.replace(/^\/\/ ?/, ''))
      .join('\n'),
  );
} else if (command === '__daemon') {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  daemon(rest).catch((e) => {
    console.error(e);
    rmSync(INFO_FILE, { force: true });
    process.exit(1);
  });
} else {
  client(command, rest).catch((e) => {
    console.error(e?.message ?? e);
    process.exitCode = 1;
  });
}

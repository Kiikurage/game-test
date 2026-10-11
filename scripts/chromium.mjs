// ヘッドレス WebGPU 用の Chromium 起動設定（E2E・スクリーンショット・ベンチで共有）。
//
// GPU_MODE（環境変数）で描画の経路を切り替える:
//   未指定 / 'swiftshader'（既定）: SwiftShader（CPU）で WebGPU を動かす。GPU の無いエージェント環境と CI 用。
//   'hardware': 実 GPU（macOS は Metal）の WebGPU を使う。ローカル（オーナーの Mac）で実 GPU の E2E・撮影・計測を回す用。
//     SwiftShader のフラグを付けず、ブラウザは CHROMIUM_PATH → PW_CHANNEL → Playwright の channel 'chrome'（インストール済みの
//     Google Chrome）の順に選ぶ。Playwright 同梱の headless は chromium-headless-shell（旧ヘッドレス。GPU を使えない）なので使わない。
//     Chrome の新ヘッドレス（--headless。Chrome 132 以降の既定）は headful と同じ GPU プロセスを使い、macOS では Metal の
//     アダプタが取れる。取れない環境では GPU_HEADFUL=1 でウィンドウを出して起動する（ログイン中の GUI セッションが必要）。
//   実 GPU が必要な場面では checkGpuAdapter() でアダプタを確認する（hardware モードで SwiftShader なら失敗させる）。
//
// ローカルでは CHROMIUM_PATH でブラウザを指定できる（swiftshader モードで未指定なら /opt/pw-browsers のブラウザか Playwright 管理のもの）。
import { existsSync } from 'node:fs';

const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/** @type {'hardware' | 'swiftshader'} */
export const gpuMode = process.env.GPU_MODE === 'hardware' ? 'hardware' : 'swiftshader';

const swiftshaderArgs = [
  '--enable-unsafe-webgpu',
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  // スワップチェーン用の共有イメージに Vulkan(SwiftShader) が必要（無いとデバイスロストする）
  '--enable-features=Vulkan',
  '--use-vulkan=swiftshader',
];

const hardwareArgs = [
  // macOS の Chrome は既定で WebGPU が有効。他 OS・古い版でも有効にする（無害）
  '--enable-unsafe-webgpu',
  // GPU のブロックリストで WebGPU / GPU 合成が落ちないようにする
  '--ignore-gpu-blocklist',
  // WebGL / 合成も Metal 経由にする（WebGPU の Dawn は macOS では常に Metal）
  ...(process.platform === 'darwin' ? ['--use-angle=metal'] : []),
];

export const chromiumArgs = gpuMode === 'hardware' ? hardwareArgs : swiftshaderArgs;

export function resolveExecutablePath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (gpuMode === 'hardware') return undefined;
  // CI では playwright install したブラウザを使うので未指定にする
  if (!process.env.CI && existsSync(LOCAL_CHROMIUM)) return LOCAL_CHROMIUM;
  return undefined;
}

export function launchOptions() {
  const executablePath = resolveExecutablePath();
  if (gpuMode !== 'hardware') return { executablePath, args: chromiumArgs };
  return {
    executablePath,
    channel: executablePath ? undefined : (process.env.PW_CHANNEL ?? 'chrome'),
    headless: process.env.GPU_HEADFUL !== '1',
    args: chromiumArgs,
  };
}

const SOFTWARE_ADAPTER = /swiftshader|llvmpipe|lavapipe|software|microsoft basic render/i;

/**
 * ブラウザで `navigator.gpu.requestAdapter()` を呼び、アダプタ情報をログに出して返す。
 * `requireHardware`（既定: GPU_MODE=hardware のとき true）なら、アダプタが無い・SwiftShader 等のソフトウェアのときに例外を投げる。
 * WebGPU は secure context が要るので、*.localhost の仮想ページ（route で応答）で調べる。
 * @param {import('@playwright/test').Browser} browser
 */
export async function checkGpuAdapter(browser, { requireHardware = gpuMode === 'hardware' } = {}) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.route('http://gpu-check.localhost/**', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>gpu-check</title>' }),
    );
    await page.goto('http://gpu-check.localhost/');
    const result = await page.evaluate(async () => {
      const base = { userAgent: navigator.userAgent, secureContext: window.isSecureContext };
      if (!('gpu' in navigator)) {
        return { ...base, adapter: null, reason: 'navigator.gpu is undefined' };
      }
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) return { ...base, adapter: null, reason: 'requestAdapter() returned null' };
      const info = adapter.info ?? {};
      return {
        ...base,
        adapter: {
          vendor: info.vendor ?? '',
          architecture: info.architecture ?? '',
          device: info.device ?? '',
          description: info.description ?? '',
          isFallbackAdapter: info.isFallbackAdapter ?? adapter.isFallbackAdapter ?? false,
          features: [...adapter.features].sort(),
          limits: {
            maxTextureDimension2D: adapter.limits.maxTextureDimension2D,
            maxBufferSize: adapter.limits.maxBufferSize,
            maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
          },
        },
      };
    });
    const a = result.adapter;
    const software =
      !a ||
      a.isFallbackAdapter ||
      SOFTWARE_ADAPTER.test(`${a.vendor} ${a.architecture} ${a.device} ${a.description}`);
    console.log(
      a
        ? `[gpu] mode=${gpuMode} adapter: vendor=${a.vendor} architecture=${a.architecture} ` +
            `device=${a.device} description=${a.description} fallback=${a.isFallbackAdapter} ` +
            `-> ${software ? 'SOFTWARE' : 'hardware'}`
        : `[gpu] mode=${gpuMode} no adapter: ${result.reason}`,
    );
    console.log(`[gpu] ${result.userAgent}`);
    if (requireHardware && software) {
      const what = a ? `${a.vendor}/${a.architecture}/${a.description}` : result.reason;
      throw new Error(
        `GPU_MODE=hardware but the WebGPU adapter is not hardware (${what}). ` +
          'Try GPU_HEADFUL=1, or set CHROMIUM_PATH to Google Chrome (see AGENTS.md section 8).',
      );
    }
    return { gpuMode, launch: launchOptions(), software, ...result };
  } finally {
    await context.close();
  }
}

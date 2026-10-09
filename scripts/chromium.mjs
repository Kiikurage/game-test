// ヘッドレス WebGPU 用の Chromium 起動設定（E2E とスクリーンショットで共有）。
// SwiftShader 経由で GPU なしでも WebGPU が動く。
// ローカルでは CHROMIUM_PATH でブラウザを指定できる（未指定なら Playwright 管理のブラウザ）。
import { existsSync } from 'node:fs';

const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

export const chromiumArgs = [
  '--enable-unsafe-webgpu',
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  // スワップチェーン用の共有イメージに Vulkan(SwiftShader) が必要（無いとデバイスロストする）
  '--enable-features=Vulkan',
  '--use-vulkan=swiftshader',
];

export function resolveExecutablePath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  // CI では playwright install したブラウザを使うので未指定にする
  if (!process.env.CI && existsSync(LOCAL_CHROMIUM)) return LOCAL_CHROMIUM;
  return undefined;
}

export function launchOptions() {
  return { executablePath: resolveExecutablePath(), args: chromiumArgs };
}

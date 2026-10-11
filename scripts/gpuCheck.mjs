// 使い方: node scripts/gpuCheck.mjs [出力 JSON のパス]
// ブラウザを launchOptions()（scripts/chromium.mjs）で起動し、WebGPU アダプタの情報をログと JSON に出す。
// GPU_MODE=hardware のとき、アダプタが SwiftShader などのソフトウェアなら終了コード 1 で失敗する（mac-verify.yml の最初の確認）。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from '@playwright/test';
import { checkGpuAdapter, launchOptions } from './chromium.mjs';

const out = process.argv[2];
const browser = await chromium.launch(launchOptions());
try {
  const report = await checkGpuAdapter(browser, { requireHardware: false });
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (report.gpuMode === 'hardware' && report.software) {
    console.error('[gpu] GPU_MODE=hardware but the adapter is software (see docs/mac-runner.md)');
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}

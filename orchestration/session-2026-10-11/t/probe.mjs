import { chromium } from '/home/user/game-test/.claude/worktrees/agent-af86039f78fdbb64b/node_modules/@playwright/test/index.mjs';
import { launchOptions } from '/home/user/game-test/.claude/worktrees/agent-af86039f78fdbb64b/scripts/chromium.mjs';
const b = await chromium.launch(launchOptions());
const p = await b.newPage();
p.on('console', (m) => console.log(m.text().slice(0, 300)));
await p.route('**/*', (r) => r.fulfill({ contentType: 'text/html', body: '<html></html>' }));
await p.goto('https://probe.test/');
const r = await p.evaluate(async () => {
  const out = [];
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  device.addEventListener('uncapturederror', (e) => out.push('ERR ' + e.error.message.slice(0, 200)));
  for (const [fmt, bpp] of [['r16float', 2], ['r8unorm', 1], ['r32float', 4]]) {
    const t = device.createTexture({ size: { width: 8, height: 8, depthOrArrayLayers: 8 }, dimension: '3d', format: fmt, usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
    const data = new Uint8Array(8 * 8 * 8 * bpp);
    device.queue.writeTexture({ texture: t, origin: { x: 0, y: 0, z: 0 } }, data, { offset: 0, bytesPerRow: 8 * bpp }, { width: 8, height: 8, depthOrArrayLayers: 1 });
    device.queue.writeTexture({ texture: t }, data, { bytesPerRow: 8 * bpp, rowsPerImage: 8 }, { width: 8, height: 8, depthOrArrayLayers: 8 });
    await device.queue.onSubmittedWorkDone();
    out.push(fmt + ' done');
  }
  return out;
});
console.log(r);
await b.close();

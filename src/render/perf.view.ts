import { FlatMaterials } from './flatMaterials';
import { perfProbe, pipelineLabel } from './perfProbe';
import type { GameRenderer } from './renderer';
import { registerViewPlugin } from './viewPlugins';

// 実機の負荷切り分け（#231）: `?perf` の計測 HUD と、`?noparticles` `?flatmat` のトグル。
// （`?noshadow` `?nobloom` `?nomsaa` `?nograss` `?nolights` は renderer / quality 側。docs/performance.md）

interface BackendLike {
  createRenderPipeline?: (...args: unknown[]) => unknown;
  getRenderCacheKey?: (renderObject: unknown) => string;
}

registerViewPlugin('perf', ({ view, gameRenderer }) => {
  const { toggles } = gameRenderer.quality;

  // パイプライン生成回数と CPU 時間は常に数える（E2E の回帰テスト用。コストは無視できる）
  const backend = gameRenderer.renderer.backend as unknown as BackendLike;
  const original = backend.createRenderPipeline;
  if (original) {
    backend.createRenderPipeline = function (this: unknown, ...args: unknown[]) {
      perfProbe.pipelineCreations++;
      perfProbe.pipelineLabels.push(pipelineLabel(args[0]));
      perfProbe.pipelineDetails.push(
        pipelineLabel(args[0], backend.getRenderCacheKey?.call(backend, args[0]) ?? ''),
      );
      return original.apply(this, args);
    };
  }
  const real = gameRenderer as { beginFrame: (n: number) => void; endFrame: () => void };
  const begin = real.beginFrame;
  const end = real.endFrame;
  let t0 = 0;
  // 直近 120 フレームの中央値。毎フレームの配列の生成・ソートを避け、リングバッファと作業用配列を使い回す（#262）
  const recent = new Float64Array(120);
  const sorted = new Float64Array(120);
  let recentCount = 0;
  let recentHead = 0;
  real.beginFrame = (nowMs) => {
    t0 = performance.now();
    begin(nowMs);
  };
  real.endFrame = () => {
    end();
    perfProbe.frameCpuMs = performance.now() - t0;
    recent[recentHead] = perfProbe.frameCpuMs;
    recentHead = (recentHead + 1) % recent.length;
    if (recentCount < recent.length) recentCount++;
    const win = sorted.subarray(0, recentCount);
    win.set(recentCount < recent.length ? recent.subarray(0, recentCount) : recent);
    win.sort();
    perfProbe.frameCpuAvgMs = win[recentCount >> 1] ?? 0;
  };

  if (toggles.noParticles) view.particles.root.visible = false;
  const flat = toggles.flatMat ? new FlatMaterials(toggles.flatMatGroups) : null;

  const hud = toggles.perf ? mountPerfHud(gameRenderer) : null;
  let untilFlat = 0;
  return {
    update: (dt) => {
      hud?.frame(dt);
      if (flat) {
        // 後から追加されるメッシュ（敵・環境の遅延読み込み）にも適用する
        untilFlat -= dt;
        if (untilFlat <= 0) {
          untilFlat = 1;
          flat.apply(view.scene);
        }
      }
    },
  };
});

function mountPerfHud(gameRenderer: GameRenderer): { frame(dt: number): void } {
  const { stats, quality } = gameRenderer;
  const el = document.createElement('pre');
  el.className = 'debug-hud perf-hud';
  document.body.appendChild(el);
  const frames: number[] = []; // 直近のフレーム時間（ms）。1% low 用に 300 フレーム
  let sinceDraw = 0;
  const flags = Object.entries(quality.toggles)
    .filter(([k, v]) => v && k !== 'perf')
    .map(([k]) => k);

  const draw = (): void => {
    const sorted = [...frames].sort((a, b) => a - b);
    const avgMs = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
    // 1% low: 最も遅い 1% のフレームの平均を fps に直したもの
    const worstN = Math.max(1, Math.ceil(sorted.length * 0.01));
    const worst = sorted.slice(-worstN);
    const worstMs = worst.length ? worst.reduce((a, b) => a + b, 0) / worst.length : 0;
    const fps = (ms: number): string => (ms > 0 ? (1000 / ms).toFixed(1) : '-');
    el.textContent = [
      `${fps(avgMs)} fps avg / ${fps(worstMs)} 1% low (target ${quality.targetFps})`,
      `frame ${avgMs.toFixed(1)} ms (worst1% ${worstMs.toFixed(1)})`,
      `cpu ${perfProbe.frameCpuAvgMs.toFixed(1)} ms` +
        (stats.gpuMs !== null ? ` / gpu ${stats.gpuMs.toFixed(1)} ms` : ' / gpu n/a'),
      `${stats.width}x${stats.height} @${stats.pixelRatio.toFixed(2)}`,
      `dyn scale ${stats.scale.toFixed(2)}${quality.fixedScale !== null ? ' (fixed)' : ''}`,
      `quality ${quality.preset.level}${quality.isMobile ? ' (mobile)' : ''}` +
        ` msaa ${quality.preset.msaa ? 'on' : 'off'} bloom ${quality.preset.bloom ? 'on' : 'off'}`,
      `draw ${stats.drawCalls} / tri ${stats.triangles}`,
      `pipelines ${perfProbe.pipelineCreations}`,
      ...(flags.length ? [`toggles: ${flags.join(' ')}`] : []),
    ].join('\n');
  };
  draw();
  return {
    frame: (dt) => {
      frames.push(dt * 1000);
      if (frames.length > 300) frames.shift();
      sinceDraw += dt;
      if (sinceDraw >= 0.5) {
        sinceDraw = 0;
        draw();
      }
    },
  };
}

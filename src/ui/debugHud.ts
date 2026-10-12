import type { RenderStats } from '../render/renderer';
import { formatProfile, type RenderProfile } from '../render/quality';

export interface DebugHudInfo {
  quality: string;
  targetFps: number;
  /** 指定すると、カテゴリ別の描画負荷（メイン / シャドウ別の draws/tris）も表示する。 */
  profile?: () => RenderProfile;
  /** 指定すると、フレームパイプラインのパス構成とパス別 GPU 時間（ms。計測できないときは null）を表示する。 */
  pipeline?: () => {
    passes: readonly string[];
    gpu: {
      frames: number;
      passes: readonly { label: string; ms: number }[];
      sumMs: number;
      rawSumMs: number;
      spanMs: number;
    } | null;
  };
}

/** パス構成とパス別 GPU 時間を HUD の行にする。 */
export function formatPipeline(info: ReturnType<NonNullable<DebugHudInfo['pipeline']>>): string[] {
  const lines = [`passes: ${info.passes.join(' > ')}`];
  if (!info.gpu) return [...lines, 'gpu n/a (timestamp-query unavailable)'];
  lines.push(
    `gpu ${info.gpu.sumMs.toFixed(2)} ms busy / ${info.gpu.spanMs.toFixed(2)} span (median of ${info.gpu.frames}f)`,
  );
  for (const p of info.gpu.passes) lines.push(`  ${p.label.padEnd(12)} ${p.ms.toFixed(2)} ms`);
  return lines;
}

/** `?debug` の指定があるか。 */
export function isDebugEnabled(search: string): boolean {
  return new URLSearchParams(search).has('debug');
}

/** fps・フレーム時間・内部解像度・描画コール数を表示する簡易 HUD。 */
export function mountDebugHud(stats: Readonly<RenderStats>, info: DebugHudInfo): void {
  const el = document.createElement('pre');
  el.className = 'debug-hud';
  document.body.appendChild(el);

  const update = (): void => {
    el.textContent = [
      `${stats.fps.toFixed(1)} fps (target ${info.targetFps})`,
      `${stats.frameMs.toFixed(1)} ms`,
      `${stats.width}x${stats.height} @${stats.pixelRatio.toFixed(2)} (scale ${stats.scale.toFixed(1)})`,
      `draw ${stats.drawCalls} / tri ${stats.triangles}`,
      `quality ${info.quality}`,
      ...(info.pipeline ? formatPipeline(info.pipeline()) : []),
      ...(info.profile ? formatProfile(info.profile()) : []),
    ].join('\n');
  };
  update();
  setInterval(update, 250);
}

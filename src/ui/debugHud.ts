import type { RenderStats } from '../render/renderer';

export interface DebugHudInfo {
  quality: string;
  targetFps: number;
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
    ].join('\n');
  };
  update();
  setInterval(update, 250);
}

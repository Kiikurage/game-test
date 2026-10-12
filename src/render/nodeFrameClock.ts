import type { WebGPURenderer } from 'three/webgpu';
import { renderClock } from './renderClock';

/** three の NodeFrame（TSL の `time` / `deltaTime` / `frameId` の源）の、使う部分だけの型。 */
interface NodeFrameLike {
  frameId: number;
  time: number;
  deltaTime: number;
  lastTime?: number;
  update(): void;
}

/**
 * TSL の `time` を、`performance.now()` ではなく `renderClock` から進める。
 * three の NodeFrame.update は `renderer.render` ごとに実時間で `time` を進めるため、
 * 撮影で時刻を止めても炎・松明・水面の揺らぎが実時間で動いてしまう。
 * 通常は実時間と同じように進む（フレーム先頭で読んだ時刻を使う）。時刻を止めている間は、止めてからの経過だけを `time` にする。
 */
export function installNodeFrameClock(renderer: WebGPURenderer): void {
  const nodeFrame = (renderer as unknown as { _nodes?: { nodeFrame?: NodeFrameLike } })._nodes
    ?.nodeFrame;
  if (!nodeFrame) return;
  nodeFrame.update = function (this: NodeFrameLike): void {
    this.frameId++;
    const now = renderClock.nowMs;
    this.lastTime ??= now;
    this.deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.time = renderClock.frozen ? renderClock.frozenSeconds : this.time + this.deltaTime;
  };
}

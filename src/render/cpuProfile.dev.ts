import { registerDevHooks } from '../devHooks';
import type { Object3D } from 'three/webgpu';
import { perfProbe } from './perfProbe';

// CPU フレーム時間の計測（#262、`npm run profile`）。
// ロックステップ: メインループのシミュレーション進行を止め、描画 1 フレームごとにちょうど 1 ステップ進めてから描く。
// SwiftShader の遅さで 1 フレームあたりのステップ数がぶれないようにし、「60fps 時の 1 フレーム分の JS」を測る。

export interface CpuProfileStats {
  readonly frames: number;
  readonly steps: number;
  /** シミュレーション（入力 + `game.update`）の合計 ms。 */
  readonly simMs: number;
  /** 描画（`GameView.render`。perfProbe.frameCpuMs の合計）の合計 ms。 */
  readonly renderMs: number;
  /** 最も重かった 1 フレーム（シミュレーション + 描画）の ms。GC・一回きりの処理によるスパイクの目安。 */
  readonly maxFrameMs: number;
}

export interface CpuProfileScene {
  /** シーン配下の全オブジェクト。 */
  readonly objects: number;
  readonly meshes: number;
  /** `matrixAutoUpdate` が true（毎フレーム `updateMatrix` する）オブジェクト。 */
  readonly autoUpdate: number;
  /** 毎フレームの `updateMatrixWorld` で辿られるオブジェクト（`matrixWorldAutoUpdate` が false の枝は辿らない）。 */
  readonly traversed: number;
  /** 上位 10 件の、子孫の多い直下の子（名前: 子孫数）。 */
  readonly largest: readonly string[];
}

declare module '../devHooks' {
  interface DevHooks {
    /**
     * ロックステップ計測の開始 / 終了。`invulnerable` のあいだはプレイヤーの HP を毎ステップ満タンに戻す
     * （戦闘負荷を測り続けるため）。
     */
    cpuProfileLockstep(on: boolean, invulnerable?: boolean): void;
    /** 計測値を 0 に戻す。 */
    cpuProfileReset(): void;
    cpuProfileStats(): CpuProfileStats;
    /** シーンのオブジェクト数（`updateMatrixWorld` が毎フレーム辿る数の目安）。 */
    cpuProfileScene(): CpuProfileScene;
  }
}

registerDevHooks('cpuProfile', ({ game, view, input, setPaused }) => {
  const original = view.render.bind(view);
  let frames = 0;
  let steps = 0;
  let simMs = 0;
  let renderMs = 0;
  let maxFrameMs = 0;
  let invulnerable = false;
  const lockstep = (alpha: number): void => {
    const t0 = performance.now();
    input.step(1 / 60);
    game.update(1 / 60);
    if (invulnerable) game.playerTarget.health.refill();
    const sim = performance.now() - t0;
    original(alpha);
    simMs += sim;
    renderMs += perfProbe.frameCpuMs;
    maxFrameMs = Math.max(maxFrameMs, sim + perfProbe.frameCpuMs);
    frames++;
    steps++;
  };
  const target = view as { render: (alpha: number) => void };
  return {
    cpuProfileLockstep: (on, inv = true) => {
      invulnerable = on && inv;
      setPaused(on);
      target.render = on ? lockstep : original;
    },
    cpuProfileReset: () => {
      frames = steps = 0;
      simMs = renderMs = maxFrameMs = 0;
    },
    cpuProfileStats: () => ({ frames, steps, simMs, renderMs, maxFrameMs }),
    cpuProfileScene: () => {
      let objects = 0;
      let meshes = 0;
      let autoUpdate = 0;
      view.scene.traverse((o) => {
        objects++;
        if ((o as { isMesh?: boolean }).isMesh) meshes++;
        if (o.matrixAutoUpdate) autoUpdate++;
      });
      let traversed = 0;
      const walk = (o: Object3D): void => {
        traversed++;
        for (const c of o.children) if (c.matrixWorldAutoUpdate) walk(c);
      };
      walk(view.scene);
      const count = (o: Object3D): number => {
        let n = 0;
        o.traverse(() => n++);
        return n;
      };
      const largest = view.scene.children
        .map((c) => ({ name: c.name || c.type, n: count(c) }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 10)
        .map((c) => `${c.name}: ${c.n}`);
      return { objects, meshes, autoUpdate, traversed, largest };
    },
  };
});

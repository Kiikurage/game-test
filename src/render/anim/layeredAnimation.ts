import type { AnimationMixer } from 'three/webgpu';
import { LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three/webgpu';
import { maskClip } from './boneMask';

/**
 * レイヤ合成つきのクリップ再生（上半身 / 下半身の 2 チャンネル、クロスフェード時間つき）。
 *
 * - 「レイヤ」= 1 本のクリップ。レイヤごとに下半身用・上半身用の 2 つのアクション（ボーンで振り分けたクリップ）を持つ。
 * - 各チャンネル（`upper` / `lower`）の中でレイヤのウェイトを合計 1 に正規化して合成する。通常は両チャンネルに
 *   同じ目標を与える（全身が同じ動き）。上半身だけ別の動き（ガード構え・回復など）を載せるときは、
 *   `setTarget(id, w, 'upper')` で上半身チャンネルだけ目標を変える。
 * - クリップの時刻は呼び出し側が `setTime` で直接指定する（フレーム同期・位相同期のため。再生速度は持たない）。
 * - クロスフェード: ウェイトはレイヤごとの `fadeIn` / `fadeOut`（秒）で目標へ線形に動く。
 */

export type Channel = 'upper' | 'lower';
export const CHANNELS: readonly Channel[] = ['lower', 'upper'];

export interface LayerOptions {
  /** 目標が増えるときのフェード時間（秒）。既定 0.12。0 で即時。 */
  readonly fadeIn?: number;
  /** 目標が減るときのフェード時間（秒）。既定 0.12。 */
  readonly fadeOut?: number;
}

interface Layer {
  readonly id: string;
  readonly clipName: string;
  readonly fadeIn: number;
  readonly fadeOut: number;
  readonly actions: Record<Channel, AnimationAction | null>;
  readonly weight: Record<Channel, number>;
  readonly target: Record<Channel, number>;
}

export class LayeredAnimation {
  private readonly layers = new Map<string, Layer>();

  constructor(
    readonly mixer: AnimationMixer,
    private readonly root: Object3D,
    /** 上半身のノード名（これ以外は下半身）。 */
    private readonly upperBones: ReadonlySet<string>,
  ) {}

  has(id: string): boolean {
    return this.layers.has(id);
  }

  addLayer(id: string, clip: AnimationClip, options: LayerOptions = {}): void {
    if (this.layers.has(id)) throw new Error(`layer already exists: ${id}`);
    const upper = maskClip(clip, (n) => this.upperBones.has(n), 'upper');
    const lower = maskClip(clip, (n) => !this.upperBones.has(n), 'lower');
    const make = (c: AnimationClip): AnimationAction | null => {
      if (c.tracks.length === 0) return null;
      const action = this.mixer.clipAction(c, this.root);
      action.setLoop(LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      action.timeScale = 0; // 時刻は setTime で直接指定する
      action.enabled = true;
      action.setEffectiveWeight(0);
      action.play();
      return action;
    };
    this.layers.set(id, {
      id,
      clipName: clip.name,
      fadeIn: options.fadeIn ?? 0.12,
      fadeOut: options.fadeOut ?? 0.12,
      actions: { upper: make(upper), lower: make(lower) },
      weight: { upper: 0, lower: 0 },
      target: { upper: 0, lower: 0 },
    });
  }

  /** 全レイヤの目標を 0 にする。毎ステップ先頭で呼び、必要なレイヤだけ `setTarget` する。 */
  clearTargets(): void {
    for (const l of this.layers.values()) {
      l.target.upper = 0;
      l.target.lower = 0;
    }
  }

  /** レイヤの目標ウェイト（0..1）。`channel` を省略すると両チャンネル。 */
  setTarget(id: string, weight: number, channel?: Channel): void {
    const l = this.require(id);
    for (const c of channel ? [channel] : CHANNELS) l.target[c] = weight;
  }

  /** 設定済みの目標ウェイト。 */
  targetOf(id: string, channel: Channel): number {
    return this.require(id).target[channel];
  }

  /** レイヤのクリップ時刻（秒）。 */
  setTime(id: string, seconds: number): void {
    const l = this.require(id);
    for (const c of CHANNELS) {
      const a = l.actions[c];
      if (a) a.time = seconds;
    }
  }

  /** 現在のウェイト（正規化前）。 */
  weightOf(id: string, channel: Channel): number {
    return this.require(id).weight[channel];
  }

  /** そのチャンネルで最もウェイトの大きいレイヤのクリップ名。 */
  dominantClip(channel: Channel): string | undefined {
    let best: Layer | undefined;
    for (const l of this.layers.values()) {
      if (!best || l.weight[channel] > best.weight[channel]) best = l;
    }
    return best?.clipName;
  }

  /** 全チャンネルのウェイトを目標へ即座に合わせる（撮影・ポーズ固定・初期化用）。 */
  snapToTargets(): void {
    for (const l of this.layers.values()) {
      l.weight.upper = l.target.upper;
      l.weight.lower = l.target.lower;
    }
  }

  /** ウェイトを `dt` 秒ぶん目標へ進め、正規化して適用し、ミキサーを評価する。 */
  update(dt: number): void {
    for (const channel of CHANNELS) {
      let total = 0;
      for (const l of this.layers.values()) {
        const target = l.target[channel];
        const cur = l.weight[channel];
        const fade = target > cur ? l.fadeIn : l.fadeOut;
        const step = fade <= 0 ? 1 : dt / fade;
        let next = cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);
        if (next < 0.001) next = 0;
        l.weight[channel] = next;
        total += next;
      }
      for (const l of this.layers.values()) {
        l.actions[channel]?.setEffectiveWeight(total > 1e-6 ? l.weight[channel] / total : 0);
      }
    }
    this.mixer.update(0);
  }

  private require(id: string): Layer {
    const l = this.layers.get(id);
    if (!l) throw new Error(`unknown layer: ${id}`);
    return l;
  }
}

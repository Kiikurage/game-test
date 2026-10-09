/**
 * Web Audio のうち AudioEngine が使う最小インターフェース。
 * 実装は `AudioContext`（構造的に満たす）か、テスト用のモック。
 */
export interface AudioParamLike {
  value: number;
  cancelScheduledValues(startTime: number): unknown;
  setValueAtTime(value: number, startTime: number): unknown;
  linearRampToValueAtTime(value: number, endTime: number): unknown;
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown;
}

export interface GainNodeLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}

export interface BiquadFilterNodeLike extends AudioNodeLike {
  type: BiquadFilterType;
  readonly frequency: AudioParamLike;
}

export type AudioContextStateLike = 'suspended' | 'running' | 'closed' | 'interrupted';

export interface AudioContextLike {
  readonly currentTime: number;
  readonly state: AudioContextStateLike;
  readonly destination: AudioNodeLike;
  resume(): Promise<void>;
  createGain(): GainNodeLike;
  createBiquadFilter(): BiquadFilterNodeLike;
  addEventListener(type: 'statechange', listener: () => void): void;
}

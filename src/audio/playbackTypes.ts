import type { AudioContextLike, AudioNodeLike, AudioParamLike } from './types';

/** SE 再生が使う Web Audio の最小インターフェース（`AudioContext` が構造的に満たす。テストではモック）。 */
export interface AudioBufferLike {
  readonly duration: number;
}

export interface ValueParamLike {
  value: number;
}

export interface DisconnectableNodeLike extends AudioNodeLike {
  disconnect(): unknown;
}

export interface GainNodePlaybackLike extends DisconnectableNodeLike {
  readonly gain: AudioParamLike;
}

export interface BufferSourceLike extends DisconnectableNodeLike {
  buffer: AudioBufferLike | null;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  readonly playbackRate: ValueParamLike;
  onended: ((ev: Event) => void) | null;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface PannerLike extends DisconnectableNodeLike {
  panningModel: PanningModelType;
  distanceModel: DistanceModelType;
  refDistance: number;
  maxDistance: number;
  rolloffFactor: number;
  readonly positionX: ValueParamLike;
  readonly positionY: ValueParamLike;
  readonly positionZ: ValueParamLike;
}

export interface ListenerLike {
  readonly positionX: ValueParamLike;
  readonly positionY: ValueParamLike;
  readonly positionZ: ValueParamLike;
  readonly forwardX: ValueParamLike;
  readonly forwardY: ValueParamLike;
  readonly forwardZ: ValueParamLike;
  readonly upX: ValueParamLike;
  readonly upY: ValueParamLike;
  readonly upZ: ValueParamLike;
}

export interface PlaybackContextLike extends AudioContextLike {
  readonly listener: ListenerLike;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBufferLike>;
  createBufferSource(): BufferSourceLike;
  createPanner(): PannerLike;
  createGain(): GainNodePlaybackLike;
}

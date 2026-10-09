export { AudioEngine, PAUSE_LOWPASS_HZ, LOWPASS_OPEN_HZ } from './audioEngine';
export { DuckingEnvelope, type DuckOptions } from './ducking';
export { createBrowserAudioEngine, installAudioUnlock } from './webAudio';
export type { AudioContextLike, AudioContextStateLike } from './types';
export * from './volume';

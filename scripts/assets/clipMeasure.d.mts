import type { Vector3 } from 'three';

export const DEFAULT_GLB: string;
export const CLIP_FPS: number;

export interface ClipMeasure {
  readonly clips: Map<string, { duration: number; frames: number; fps: number }>;
  bonePosition(clip: string, bone: string, time: number, target?: Vector3): Vector3;
}

export function loadClipMeasure(path?: string): Promise<ClipMeasure>;
export function peakSpeedFrame(
  measure: ClipMeasure,
  clip: string,
  bone: string,
  range: readonly [number, number],
): number;
export function footForwardPhase(measure: ClipMeasure, clip: string, bone: string): number;

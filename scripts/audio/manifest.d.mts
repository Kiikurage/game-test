import type { SoundKind } from '../../src/audio/manifest';

export const KINDS: readonly SoundKind[];
export const KIND_BUS: Readonly<Record<SoundKind, string>>;
export const KIND_CHANNELS: Readonly<Record<SoundKind, 1 | 2>>;
export const KIND_BITRATE_KBPS: Readonly<Record<SoundKind, number>>;
export const AUDIO_BUDGET_BYTES: number;
export const BUDGET_WARN_RATIO: number;
export const SOURCE_EXTENSIONS: readonly string[];
export const ALLOWED_LICENSE: RegExp;

export function gainDbToLinear(db: number): number;
export function validateSourceConfig(config: unknown): string[];
export function validateRuntimeManifest(manifest: unknown): string[];
export function checkBudget(
  totalBytes: number,
  budgetBytes?: number,
): { status: 'ok' | 'warn' | 'fail'; ratio: number };
export function parseLicenseTable(
  markdown: string,
): Map<string, { license: string; url: string; author: string; date: string }>;
export function checkLicenses(
  config: { sounds: readonly { id: string; license: string }[] },
  markdown: string,
): string[];

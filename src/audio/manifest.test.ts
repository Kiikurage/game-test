import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AUDIO_BUDGET_BYTES,
  checkBudget,
  checkLicenses,
  gainDbToLinear,
  parseLicenseTable,
  validateRuntimeManifest,
  validateSourceConfig,
} from '../../scripts/audio/manifest.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');

const validSource = {
  id: 'sfx.sword-light1',
  source: 'sfx/sword1.wav',
  kind: 'se',
  priority: 90,
  license: 'k',
};
const cfg = (...sounds: object[]): unknown => ({ version: 1, sounds });

describe('validateSourceConfig', () => {
  it('accepts a minimal valid config', () => {
    expect(validateSourceConfig(cfg(validSource))).toEqual([]);
  });
  it('accepts loops with points and explicit matching bus', () => {
    const loop = {
      ...validSource,
      id: 'bgm.boss',
      kind: 'bgm',
      bus: 'bgm',
      loop: true,
      loopStart: 1.5,
      loopEnd: 90,
      gainDb: -3,
      bitrateKbps: 80,
    };
    expect(validateSourceConfig(cfg(loop))).toEqual([]);
  });
  it('rejects non-objects, bad version and missing sounds', () => {
    expect(validateSourceConfig(null)).not.toEqual([]);
    expect(validateSourceConfig({ version: 2, sounds: [] })).toContain('version は 1');
    expect(validateSourceConfig({ version: 1 })).toContain('sounds は配列');
  });
  it.each([
    ['bad id', { id: 'Sfx Sword' }],
    ['bad kind', { kind: 'voice' }],
    ['bus mismatch', { bus: 'bgm' }],
    ['priority out of range', { priority: 101 }],
    ['priority not integer', { priority: 1.5 }],
    ['path traversal', { source: '../secret.wav' }],
    ['absolute path', { source: '/etc/passwd.wav' }],
    ['unsupported extension', { source: 'a.exe' }],
    ['loop points without loop', { loopStart: 1 }],
    ['loopStart >= loopEnd', { loop: true, loopStart: 5, loopEnd: 5 }],
    ['negative loopStart', { loop: true, loopStart: -1 }],
    ['gainDb out of range', { gainDb: 30 }],
    ['bitrate out of range', { bitrateKbps: 8 }],
    ['missing license', { license: '' }],
  ])('rejects %s', (_name, patch) => {
    expect(validateSourceConfig(cfg({ ...validSource, ...patch })).length).toBeGreaterThan(0);
  });
  it('rejects duplicate ids', () => {
    const errors = validateSourceConfig(cfg(validSource, validSource));
    expect(errors.some((e) => e.includes('重複'))).toBe(true);
  });
});

const validEntry = {
  id: 'ui.click',
  file: 'ui.click.ogg',
  bus: 'ui',
  kind: 'ui',
  loop: false,
  priority: 70,
  gain: 1,
  channels: 1,
  bytes: 1000,
  duration: 0.2,
};
const manifest = (...sounds: { bytes: number }[]): unknown => ({
  version: 1,
  format: 'ogg-opus',
  totalBytes: sounds.reduce((a, s) => a + s.bytes, 0),
  budgetBytes: AUDIO_BUDGET_BYTES,
  sounds,
});

describe('validateRuntimeManifest', () => {
  it('accepts a valid manifest', () => {
    expect(validateRuntimeManifest(manifest(validEntry))).toEqual([]);
  });
  it('accepts looped stereo ambient with fallback file', () => {
    const e = {
      ...validEntry,
      id: 'ambient.wind',
      file: 'ambient.wind.ogg',
      fallbackFile: 'ambient.wind.m4a',
      bus: 'ambient',
      kind: 'ambient',
      channels: 2,
      loop: true,
      loopStart: 0,
      loopEnd: 0.2,
    };
    expect(validateRuntimeManifest(manifest(e))).toEqual([]);
  });
  it.each([
    ['wrong channels for kind', { channels: 2 }],
    ['file not ogg', { file: 'a.wav' }],
    ['fallback not m4a', { fallbackFile: 'a.mp3' }],
    ['missing loop flag', { loop: undefined }],
    ['zero duration', { duration: 0 }],
    ['loopEnd beyond duration', { loop: true, loopStart: 0, loopEnd: 5 }],
    ['non-positive gain', { gain: 0 }],
    ['non-integer bytes', { bytes: 1.5 }],
  ])('rejects %s', (_name, patch) => {
    const e = { ...validEntry, ...patch };
    expect(validateRuntimeManifest(manifest(e)).length).toBeGreaterThan(0);
  });
  it('rejects totalBytes that does not match the sum', () => {
    const m = manifest(validEntry) as { totalBytes: number };
    m.totalBytes = 1;
    expect(validateRuntimeManifest(m).some((e) => e.includes('合計'))).toBe(true);
  });
});

describe('checkBudget', () => {
  it('is ok under 80%, warns from 80%, fails over budget', () => {
    expect(checkBudget(1_000_000).status).toBe('ok');
    expect(checkBudget(AUDIO_BUDGET_BYTES * 0.8).status).toBe('warn');
    expect(checkBudget(AUDIO_BUDGET_BYTES).status).toBe('warn');
    expect(checkBudget(AUDIO_BUDGET_BYTES + 1).status).toBe('fail');
  });
  it('uses an 8MB budget by default', () => {
    expect(AUDIO_BUDGET_BYTES).toBe(8 * 1024 * 1024);
    expect(checkBudget(100, 50).status).toBe('fail');
  });
  it('converts dB to linear gain', () => {
    expect(gainDbToLinear(0)).toBe(1);
    expect(gainDbToLinear(-6)).toBeCloseTo(0.501, 3);
  });
});

describe('license table', () => {
  const table = [
    '| キー | 用途 | 出典 URL | 作者 | ライセンス | 取得日 | 備考 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    '| `ok` | x | https://example.com | A | CC0 1.0 | 2026-10-09 | |',
    '| `mine` | x | repo | me | 自作（CC0 として公開） | 2026-10-09 | |',
    '| `ccby` | x | https://example.com | A | CC-BY 4.0 | 2026-10-09 | |',
    '| `nodate` | x | https://example.com | A | CC0 1.0 | 昨日 | |',
  ].join('\n');
  const use = (license: string): { sounds: { id: string; license: string }[] } => ({
    sounds: [{ id: 's', license }],
  });

  it('parses rows keyed by backticked ids', () => {
    expect([...parseLicenseTable(table).keys()]).toEqual(['ok', 'mine', 'ccby', 'nodate']);
  });
  it('accepts CC0 and self-made, rejects everything else', () => {
    expect(checkLicenses(use('ok'), table)).toEqual([]);
    expect(checkLicenses(use('mine'), table)).toEqual([]);
    expect(checkLicenses(use('ccby'), table).join()).toContain('CC0 のみ');
    expect(checkLicenses(use('nodate'), table).join()).toContain('取得日');
    expect(checkLicenses(use('missing'), table).join()).toContain('表に無い');
  });
});

describe('repository audio assets', () => {
  const config = JSON.parse(read('assets-src/audio/audio.json')) as {
    sounds: { id: string; source: string; license: string }[];
  };

  it('has a valid source config whose licenses are all recorded as CC0', () => {
    expect(validateSourceConfig(config)).toEqual([]);
    expect(checkLicenses(config, read('docs/audio-assets.md'))).toEqual([]);
    for (const s of config.sounds)
      expect(existsSync(join(ROOT, 'assets-src/audio', s.source))).toBe(true);
  });

  it('has a valid output manifest within the budget, matching files on disk', () => {
    const m = JSON.parse(read('public/assets/audio/manifest.json')) as {
      totalBytes: number;
      budgetBytes: number;
      sounds: { id: string; file: string; bytes: number }[];
    };
    expect(validateRuntimeManifest(m)).toEqual([]);
    expect(m.sounds.map((s) => s.id).sort()).toEqual(config.sounds.map((s) => s.id).sort());
    for (const s of m.sounds) {
      expect(statSync(join(ROOT, 'public/assets/audio', s.file)).size).toBe(s.bytes);
    }
    expect(checkBudget(m.totalBytes, m.budgetBytes).status).not.toBe('fail');
  });
});

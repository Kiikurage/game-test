// 使い方:
//   npm run assets:audio               元データ（assets-src/audio/）→ Opus 変換・マニフェスト生成・容量集計
//   npm run assets:audio -- --m4a      iOS 向けの AAC（.m4a）フォールバックも出力する
//   npm run assets:audio:check         ffmpeg 不要。設定・ライセンス表・出力マニフェスト・容量予算の整合検査
//
// 前提: ffmpeg / ffprobe（libopus 付き）。ubuntu-latest では `apt-get install ffmpeg`。
// 元データは信頼できない外部データ。ffmpeg にファイルとして渡すだけ（実行はしない）。
// 入力は file プロトコルのみ許可し、stdin は閉じる。
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUDIO_BUDGET_BYTES,
  KIND_BITRATE_KBPS,
  KIND_BUS,
  KIND_CHANNELS,
  checkBudget,
  checkLicenses,
  gainDbToLinear,
  validateRuntimeManifest,
  validateSourceConfig,
} from './manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = join(ROOT, 'assets-src', 'audio');
const CONFIG_FILE = join(SRC_DIR, 'audio.json');
const LICENSE_DOC = join(ROOT, 'docs', 'audio-assets.md');
const OUT_DIR = join(ROOT, 'public', 'assets', 'audio');
const MANIFEST_FILE = join(OUT_DIR, 'manifest.json');

const checkOnly = process.argv.includes('--check');
const withM4a = process.argv.includes('--m4a');

const fail = (msgs) => {
  for (const m of [].concat(msgs)) console.error(`error: ${m}`);
  process.exit(1);
};
const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`;

function ffmpeg(args) {
  execFileSync(
    'ffmpeg',
    ['-nostdin', '-v', 'error', '-y', '-protocol_whitelist', 'file', ...args],
    {
      stdio: ['ignore', 'inherit', 'inherit'],
    },
  );
}

function probeDuration(file) {
  const out = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file],
    { stdio: ['ignore', 'pipe', 'inherit'] },
  ).toString();
  const d = Number(JSON.parse(out).format.duration);
  if (!Number.isFinite(d) || d <= 0) throw new Error(`duration を取得できない: ${file}`);
  return Math.round(d * 1000) / 1000;
}

// --- 設定とライセンス表の検査 ---
if (!existsSync(CONFIG_FILE)) fail(`${relative(ROOT, CONFIG_FILE)} が無い`);
const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
const configErrors = validateSourceConfig(config);
if (configErrors.length > 0) fail(configErrors);
if (!existsSync(LICENSE_DOC)) fail(`${relative(ROOT, LICENSE_DOC)} が無い`);
const licenseErrors = checkLicenses(config, readFileSync(LICENSE_DOC, 'utf8'));
if (licenseErrors.length > 0) fail(licenseErrors);

function reportBudget(totalBytes, budgetBytes) {
  const { status, ratio } = checkBudget(totalBytes, budgetBytes);
  const line = `合計 ${mb(totalBytes)} / 予算 ${mb(budgetBytes)}（${(ratio * 100).toFixed(1)}%）`;
  if (status === 'fail') fail(`容量予算超過: ${line}`);
  if (status === 'warn') console.warn(`warning: 容量予算の 80% を超えた: ${line}`);
  else console.log(line);
}

if (checkOnly) {
  if (!existsSync(MANIFEST_FILE))
    fail(`${relative(ROOT, MANIFEST_FILE)} が無い。npm run assets:audio を実行する`);
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
  const errors = validateRuntimeManifest(manifest);
  const ids = new Set(manifest.sounds?.map((s) => s.id));
  for (const s of config.sounds) if (!ids.has(s.id)) errors.push(`${s.id}: 出力マニフェストに無い`);
  for (const s of manifest.sounds ?? []) {
    const f = join(OUT_DIR, s.file);
    if (!existsSync(f)) errors.push(`${s.id}: ${s.file} が無い`);
    else if (statSync(f).size !== s.bytes)
      errors.push(`${s.id}: ${s.file} のサイズがマニフェストと違う`);
  }
  if (errors.length > 0) fail(errors);
  reportBudget(manifest.totalBytes, manifest.budgetBytes);
  console.log(`OK: ${manifest.sounds.length} 件`);
  process.exit(0);
}

// --- 変換 ---
mkdirSync(OUT_DIR, { recursive: true });
const sounds = [];
let totalBytes = 0;
let totalM4aBytes = 0;

for (const s of config.sounds) {
  const input = join(SRC_DIR, s.source);
  if (!existsSync(input)) fail(`${s.id}: 元ファイルが無い: ${relative(ROOT, input)}`);
  const channels = KIND_CHANNELS[s.kind];
  const bitrate = s.bitrateKbps ?? KIND_BITRATE_KBPS[s.kind];
  const file = `${s.id}.ogg`;
  const output = join(OUT_DIR, file);

  // Opus は内部 48kHz（44.1kHz 入力は libopus が 48kHz へリサンプルする。Web Audio 側で再生レートへ変換される）。
  ffmpeg([
    '-i',
    input,
    '-vn',
    '-map_metadata',
    '-1',
    '-ac',
    String(channels),
    '-ar',
    '48000',
    '-c:a',
    'libopus',
    '-b:a',
    `${bitrate}k`,
    '-vbr',
    'on',
    '-application',
    'audio',
    output,
  ]);
  const bytes = statSync(output).size;
  const duration = probeDuration(output);
  totalBytes += bytes;

  let fallbackFile;
  if (withM4a) {
    fallbackFile = `${s.id}.m4a`;
    const m4a = join(OUT_DIR, fallbackFile);
    ffmpeg([
      '-i',
      input,
      '-vn',
      '-map_metadata',
      '-1',
      '-ac',
      String(channels),
      '-ar',
      '44100',
      '-c:a',
      'aac',
      '-b:a',
      `${Math.round(bitrate * 1.5)}k`,
      '-movflags',
      '+faststart',
      m4a,
    ]);
    totalM4aBytes += statSync(m4a).size;
  }

  const loop = s.loop === true;
  const entry = {
    id: s.id,
    file,
    ...(fallbackFile ? { fallbackFile } : {}),
    bus: s.bus ?? KIND_BUS[s.kind],
    kind: s.kind,
    loop,
    ...(loop ? { loopStart: s.loopStart ?? 0, loopEnd: s.loopEnd ?? duration } : {}),
    priority: s.priority,
    gain: Math.round(gainDbToLinear(s.gainDb ?? 0) * 10000) / 10000,
    channels,
    bytes,
    duration,
  };
  sounds.push(entry);
  console.log(
    `${s.id.padEnd(28)} ${String(channels)}ch ${String(bitrate).padStart(3)}kbps ${kb(bytes).padStart(9)} ${duration.toFixed(2)}s`,
  );
}

// 設定に無い古い出力を掃除する
const keep = new Set(sounds.flatMap((s) => [s.file, s.fallbackFile].filter(Boolean)));
for (const f of readdirSync(OUT_DIR)) {
  if ((f.endsWith('.ogg') || f.endsWith('.m4a')) && !keep.has(f)) rmSync(join(OUT_DIR, f));
}

const manifest = {
  version: 1,
  format: 'ogg-opus',
  totalBytes,
  budgetBytes: AUDIO_BUDGET_BYTES,
  sounds,
};
const errors = validateRuntimeManifest(manifest);
for (const s of sounds) {
  if (s.loop && s.loopEnd > s.duration + 0.05)
    errors.push(`${s.id}: loopEnd が duration (${s.duration}s) を超えている`);
}
if (errors.length > 0) fail(errors);
writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${relative(ROOT, MANIFEST_FILE)}（${sounds.length} 件）`);
reportBudget(totalBytes, AUDIO_BUDGET_BYTES);
if (withM4a)
  console.log(
    `m4a フォールバック合計 ${mb(totalM4aBytes)}（予算判定は Ogg Opus のみ。端末は片方だけ取得する）`,
  );

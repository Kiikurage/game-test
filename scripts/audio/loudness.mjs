// 音声素材のラウドネス測定（音量バランス調整の基準づくり）。ffmpeg でモノ 44.1kHz の f32 にデコードして計測する。
//
//   node scripts/audio/loudness.mjs            全素材の表（ピーク / 有音区間 RMS / 現在の gainDb / 補正後 RMS）
//   node scripts/audio/loudness.mjs sfx.guard  id の前方一致で絞る
//
// 指標:
//   peak   サンプルピーク (dBFS)
//   rms    有音区間 RMS (dBFS)。20ms 窓のうち RMS が -50dBFS を超える窓だけで平均（無音・残響の尾を除く）
//   eff    gainDb 適用後の rms（= 耳に届く素材の大きさ。同じ区分の素材はこの値を揃える）
//   node scripts/audio/loudness.mjs --apply    TARGETS に従って gainDb を算出し、audio.json と出力マニフェストの gain を更新する
//                                              （再エンコードしない。BGM・環境音は対象外。適用後は `npm run format` と `npm run assets:audio:check`）
// 元データは信頼できない外部データ。ffmpeg にファイルとして渡すだけ。

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = join(ROOT, 'assets-src', 'audio');
const SAMPLE_RATE = 44100;
const WINDOW = Math.round(SAMPLE_RATE * 0.02);
const GATE_DB = -50;

const MANIFEST = join(ROOT, 'public', 'assets', 'audio', 'manifest.json');

/** gainDb 適用後のピークの上限 (dBFS)。これを超えるブーストはしない（クリップ防止）。 */
const PEAK_CEILING_DB = -1;

/**
 * 区分ごとの目標 rms（dBFS、gainDb 適用後）。先頭から順に最初に一致した行を使う。
 * 方針: 頻繁に鳴る音（足音・ロール・鎧の擦れ・小さな衝撃）は控えめ、要所の音（被弾・ガード・パリィ・
 * 致命の一撃・ボスの攻撃・撃破）は前に出す。BGM・環境音は対象外（バス音量とループ素材の作りで調整済み）。
 */
export const TARGETS = [
  [/^sfx\.footstep-/, -30, '足音（プレイヤー・世界。再生側でさらに歩き 0.55 / 走り 0.85 倍）'],
  [/^sfx\.enemy\.step/, -29, '敵の足音'],
  [/^sfx\.boss\.step/, -21, 'ボスの足音（重さは残す）'],
  [/^sfx\.roll/, -25, 'ロール'],
  [/^sfx\.heal-glow/, -26, '回復の持続音'],
  [/^sfx\.heal-drink/, -22, '回復の飲み音'],
  [/^sfx\.player-heavy-charge-full/, -23, '強攻撃のチャージ完了'],
  [/^sfx\.sword-/, -21, 'プレイヤーの剣振り'],
  [/^sfx\.hit-light/, -20, '軽い命中'],
  [/^sfx\.enemy\.notice-minor/, -24, '敵の気づき（小）'],
  [/^sfx\.enemy\.notice/, -21, '敵の気づき'],
  [/^sfx\.enemy\.shield-raise/, -25, '敵の盾構え'],
  [/^sfx\.enemy\.whoosh/, -23, '敵の風切り'],
  [/^sfx\.defeat-/, -20, '敵の撃破'],
  [/^sfx\.boss\.roar/, -13, 'ボスの咆哮（最大）'],
  [/^sfx\.boss\.(enter|defeat)/, -17, 'ボス登場・撃破'],
  [/^sfx\.boss\./, -16, 'ボスの攻撃'],
  [
    /^sfx\.(hurt|guard|shield-deflect|hit-heavy|breathless)/,
    -17,
    '被弾・ガード・パリィ・重い命中・息切れ',
  ],
  [/^ui\./, -22, 'UI'],
];

const toDb = (x) => (x <= 0 ? -Infinity : 20 * Math.log10(x));

/** 素材ファイルを f32 モノラルへデコードして { peak, rms }（dBFS）を返す。 */
export function measure(file) {
  const r = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', '-'],
    { maxBuffer: 1 << 30 },
  );
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${file}\n${String(r.stderr)}`);
  const buf = r.stdout;
  const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4));
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  let sumSq = 0;
  let count = 0;
  for (let i = 0; i + WINDOW <= samples.length; i += WINDOW) {
    let w = 0;
    for (let j = i; j < i + WINDOW; j++) w += samples[j] * samples[j];
    if (toDb(Math.sqrt(w / WINDOW)) > GATE_DB) {
      sumSq += w;
      count += WINDOW;
    }
  }
  return { peak: toDb(peak), rms: count === 0 ? -Infinity : toDb(Math.sqrt(sumSq / count)) };
}

/** 目標区分から gainDb（0.5dB 刻み）を決める。対象外は undefined。 */
export function suggestGainDb(id, m) {
  const t = TARGETS.find(([re]) => re.test(id));
  if (!t) return undefined;
  const db = Math.round((t[1] - m.rms) * 2) / 2;
  return Math.max(-40, Math.min(db, Math.floor((PEAK_CEILING_DB - m.peak) * 2) / 2));
}

function apply(config, measured) {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const gains = new Map();
  for (const s of config.sounds) {
    const m = measured.get(s.id);
    const db = m && suggestGainDb(s.id, m);
    if (db === undefined) continue;
    if (db === 0) delete s.gainDb;
    else s.gainDb = db;
    gains.set(s.id, Math.round(10 ** (db / 20) * 10000) / 10000);
  }
  for (const e of manifest.sounds) if (gains.has(e.id)) e.gain = gains.get(e.id);
  writeFileSync(join(SRC_DIR, 'audio.json'), JSON.stringify(config, null, 2) + '\n');
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

function main() {
  const doApply = process.argv.includes('--apply');
  const filter = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '';
  const config = JSON.parse(readFileSync(join(SRC_DIR, 'audio.json'), 'utf8'));
  const rows = [];
  const measured = new Map();
  for (const s of config.sounds) {
    if (!s.id.startsWith(filter)) continue;
    const m = measure(join(SRC_DIR, s.source));
    measured.set(s.id, m);
    const gainDb = s.gainDb ?? 0;
    rows.push({ id: s.id, kind: s.kind, priority: s.priority, gainDb, ...m, eff: m.rms + gainDb });
  }
  if (doApply) {
    apply(config, measured);
    console.log('gainDb を更新した（audio.json / manifest.json）');
    return;
  }
  const f = (v) => (Number.isFinite(v) ? v.toFixed(1) : '-inf').padStart(7);
  console.log('id'.padEnd(30) + 'kind'.padEnd(9) + 'prio  gainDb    peak     rms     eff');
  for (const r of rows) {
    console.log(
      r.id.padEnd(30) +
        r.kind.padEnd(9) +
        String(r.priority).padStart(4) +
        f(r.gainDb) +
        f(r.peak) +
        f(r.rms) +
        f(r.eff),
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

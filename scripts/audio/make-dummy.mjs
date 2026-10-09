// パイプライン動作確認用のダミー音源を ffmpeg で合成する（assets-src/audio/dummy/）。
// 生成物はコミット済み。再生成したいときだけ: node scripts/audio/make-dummy.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'assets-src',
  'audio',
  'dummy',
);
mkdirSync(dir, { recursive: true });

const run = (...args) =>
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args], { stdio: 'inherit' });

// UI クリック風の短いビープ（モノラル 44.1kHz、0.12 秒）
run(
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=880:duration=0.12:sample_rate=44100',
  '-af',
  'afade=t=in:d=0.005,afade=t=out:st=0.04:d=0.08,volume=0.5',
  '-ac',
  '1',
  '-c:a',
  'pcm_s16le',
  join(dir, 'click.wav'),
);

// 環境音風のピンクノイズ（ステレオ 44.1kHz、0.5 秒）。ループ点の指定を試すためのもの。
run(
  '-f',
  'lavfi',
  '-i',
  'anoisesrc=color=pink:duration=0.5:sample_rate=44100:amplitude=0.2:seed=1',
  '-ac',
  '2',
  '-c:a',
  'pcm_s16le',
  join(dir, 'hiss.wav'),
);

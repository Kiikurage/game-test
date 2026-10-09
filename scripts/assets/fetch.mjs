// 使い方: npm run assets:fetch [-- --update-lock]
// Quaternius CC0 パックの元データを取得して assets-src/quaternius/ に置く（gitignore 対象）。
// 取得したファイルの SHA-256 を assets-src/sources.json と照合する。
// --update-lock: 取得元を変えたときに sources.json を再生成する（通常は不要）。
//
// 取得データは信頼できない外部データとして扱う。ここでは「コピーしてハッシュを取る」だけで、
// ファイルの内容を実行・評価することはない。
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import {
  LICENSE_COPIES,
  LICENSE_DIR,
  LOCK_FILE,
  SOURCE,
  SOURCE_FILES,
  SRC_DIR,
} from './config.mjs';

const updateLock = process.argv.includes('--update-lock');

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
}

function readLock() {
  if (!existsSync(LOCK_FILE)) return undefined;
  return JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
}

/** 全ファイルが揃い、ロックのハッシュと一致するか。 */
function isUpToDate(lock) {
  if (!lock || lock.commit !== SOURCE.commit) return false;
  return SOURCE_FILES.every((f) => {
    const p = join(SRC_DIR, f);
    return existsSync(p) && lock.files[f] === sha256(p);
  });
}

function download() {
  const work = mkdtempSync(join(dirname(SRC_DIR), '.fetch-'));
  try {
    git(work, 'init', '-q');
    git(work, 'remote', 'add', 'origin', SOURCE.repo);
    git(work, 'config', 'core.sparseCheckout', 'true');
    // 必要なファイルだけをチェックアウトする（no-cone パターン）
    writeFileSync(
      join(work, '.git', 'info', 'sparse-checkout'),
      SOURCE_FILES.map((f) => `/${SOURCE.dir}/${f}`).join('\n') + '\n',
    );
    git(work, 'fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', SOURCE.commit);
    git(work, 'checkout', '-q', 'FETCH_HEAD');
    for (const f of SOURCE_FILES) {
      const from = join(work, SOURCE.dir, f);
      if (!existsSync(from)) throw new Error(`missing in source repository: ${f}`);
      const to = join(SRC_DIR, f);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** ライセンス文が CC0 であることを実物で確認し、控えを assets-src/LICENSES/ に保存する。 */
function saveLicenses() {
  mkdirSync(LICENSE_DIR, { recursive: true });
  for (const [from, to] of LICENSE_COPIES) {
    const text = readFileSync(join(SRC_DIR, from), 'utf8');
    if (!/CC0 1\.0 Universal/.test(text) || !/zero\/1\.0/.test(text)) {
      throw new Error(`${from} does not look like a CC0 1.0 license. Stop and review the license.`);
    }
    writeFileSync(join(LICENSE_DIR, to), text);
  }
}

mkdirSync(SRC_DIR, { recursive: true });
let lock = readLock();

if (!updateLock && isUpToDate(lock)) {
  console.log('assets-src/quaternius is up to date');
} else {
  console.log(`fetching ${SOURCE.repo} @ ${SOURCE.commit.slice(0, 12)} ...`);
  download();
  if (updateLock || !lock) {
    lock = {
      repo: SOURCE.repo,
      commit: SOURCE.commit,
      dir: SOURCE.dir,
      license: 'CC0-1.0',
      files: Object.fromEntries(SOURCE_FILES.map((f) => [f, sha256(join(SRC_DIR, f))])),
    };
    writeFileSync(LOCK_FILE, JSON.stringify(lock, null, 2) + '\n');
    console.log(`wrote ${LOCK_FILE}`);
  } else {
    for (const f of SOURCE_FILES) {
      const actual = sha256(join(SRC_DIR, f));
      if (lock.files[f] !== actual) {
        throw new Error(
          `SHA-256 mismatch: ${f}\n  expected ${lock.files[f]}\n  actual   ${actual}`,
        );
      }
    }
    console.log('all files match sources.json');
  }
}
saveLicenses();

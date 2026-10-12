// 配信アセットの内容ハッシュ名（tech-direction §4.4、#331）。vite.config.ts（書き出し）と check.mjs（検査）が共有する。
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

/** ハッシュ名にする対象（`public/` からの相対パスの接頭辞）。 */
export const HASHED_PREFIX = 'assets/';

/** ハッシュの桁数（sha256 の 16 進）。 */
export const HASH_LENGTH = 10;

/** `public/` 配下の全ファイル（相対パス、`/` 区切り、昇順）。 */
export function listFiles(dir, rel = '') {
  const out = [];
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listFiles(dir, p));
    else if (e.isFile() && !e.name.startsWith('.')) out.push(p);
  }
  return out.sort();
}

/** `dir/name.ext` → `dir/name.<hash>.ext`。 */
export function hashedName(path, content) {
  const hash = createHash('sha256').update(content).digest('hex').slice(0, HASH_LENGTH);
  const ext = posix.extname(path);
  return `${path.slice(0, path.length - ext.length)}.${hash}${ext}`;
}

/** ハッシュ付きの名前か（`.<HASH_LENGTH 桁の 16 進>.<拡張子>` で終わる）。 */
export function isHashedName(path) {
  return new RegExp(`\\.[0-9a-f]{${HASH_LENGTH}}\\.[A-Za-z0-9]+$`).test(path);
}

/**
 * `public/` の配信ファイル一覧。`assets/` 配下はハッシュ名に、それ以外はそのままの名前で出す。
 * @returns {{ source: string, output: string }[]}（どちらも `public/` / `dist/` からの相対パス）
 */
export function publicOutputs(publicDir) {
  return listFiles(publicDir).map((source) => ({
    source,
    output: source.startsWith(HASHED_PREFIX)
      ? hashedName(source, readFileSync(join(publicDir, source)))
      : source,
  }));
}

/** `src/core/assetUrl.ts` に埋め込む対応表（ハッシュ名にしたものだけ）。 */
export function assetHashMap(outputs) {
  return Object.fromEntries(
    outputs.filter((o) => o.source !== o.output).map((o) => [o.source, o.output]),
  );
}

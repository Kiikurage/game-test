// 音声パイプラインのスキーマ検証・容量予算・ライセンス表の検査（純粋ロジック。ffmpeg 非依存）。
// ビルドスクリプト（build.mjs）とユニットテスト（src/audio/manifest.test.ts）で共有する。
// 型は src/audio/manifest.ts、関数の型宣言は manifest.d.mts。

/** 音声の種別。 */
export const KINDS = ['se', 'bgm', 'ambient', 'ui'];

/** 種別 → 既定のバス（仕様書 10.2 節: master ← bgm / sfx / ambient / ui）。 */
export const KIND_BUS = { se: 'sfx', bgm: 'bgm', ambient: 'ambient', ui: 'ui' };

/** 種別 → チャンネル数。位置を持つ SE・UI はモノラル、BGM・環境音はステレオ。 */
export const KIND_CHANNELS = { se: 1, bgm: 2, ambient: 2, ui: 1 };

/** 種別 → 既定の Opus ビットレート（kbps）。 */
export const KIND_BITRATE_KBPS = { se: 48, bgm: 96, ambient: 64, ui: 48 };

/** 総容量の予算（バイト）。仕様書 10 章: 8MB 以内。 */
export const AUDIO_BUDGET_BYTES = 8 * 1024 * 1024;

/** 予算に対するこの比率を超えたら警告。 */
export const BUDGET_WARN_RATIO = 0.8;

/** 変換元として受け付ける拡張子。 */
export const SOURCE_EXTENSIONS = ['.wav', '.flac', '.ogg', '.mp3', '.aif', '.aiff'];

/** ライセンス表で許可する区分。CC0 以外は取り込まない。 */
export const ALLOWED_LICENSE = /^(CC0(?:[ -]1\.0)?|自作（CC0 として公開）)$/;

const ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** dB → 振幅ゲイン。 */
export function gainDbToLinear(db) {
  return 10 ** (db / 20);
}

/** ソースの相対パスが `assets-src/audio/` の外へ出ない安全な形か。 */
function isSafeRelativePath(p) {
  if (
    typeof p !== 'string' ||
    p === '' ||
    p.startsWith('/') ||
    p.includes('\\') ||
    p.includes('\0')
  ) {
    return false;
  }
  return !p.split('/').some((seg) => seg === '..' || seg === '' || seg === '.');
}

function checkLoop(prefix, s, errors, { allowEqualEnd }) {
  const loop = s.loop;
  if (loop !== undefined && typeof loop !== 'boolean') errors.push(`${prefix}: loop は boolean`);
  const hasPoints = s.loopStart !== undefined || s.loopEnd !== undefined;
  if (hasPoints && loop !== true)
    errors.push(`${prefix}: loopStart/loopEnd は loop: true のときだけ指定できる`);
  if (s.loopStart !== undefined && (!isNum(s.loopStart) || s.loopStart < 0)) {
    errors.push(`${prefix}: loopStart は 0 以上の秒数`);
  }
  if (s.loopEnd !== undefined && (!isNum(s.loopEnd) || s.loopEnd <= 0)) {
    errors.push(`${prefix}: loopEnd は 0 より大きい秒数`);
  }
  if (isNum(s.loopStart) && isNum(s.loopEnd)) {
    const ok = allowEqualEnd ? s.loopStart <= s.loopEnd : s.loopStart < s.loopEnd;
    if (!ok) errors.push(`${prefix}: loopStart は loopEnd より小さい`);
  }
}

/** 共通フィールド（id / kind / bus / loop / priority）の検査。 */
function checkCommon(prefix, s, errors) {
  if (typeof s.id !== 'string' || !ID_PATTERN.test(s.id)) {
    errors.push(`${prefix}: id は小文字英数と . _ - の組み合わせ（例: sfx.sword-light1）`);
  }
  if (!KINDS.includes(s.kind)) {
    errors.push(`${prefix}: kind は ${KINDS.join(' / ')} のいずれか`);
  } else if (s.bus !== undefined && s.bus !== KIND_BUS[s.kind]) {
    errors.push(`${prefix}: kind=${s.kind} のバスは ${KIND_BUS[s.kind]}（bus=${String(s.bus)}）`);
  }
  if (!Number.isInteger(s.priority) || s.priority < 0 || s.priority > 100) {
    errors.push(`${prefix}: priority は 0〜100 の整数（大きいほど優先）`);
  }
}

/**
 * 元データ側の設定（assets-src/audio/audio.json）の検証。エラーメッセージの配列を返す（空なら OK）。
 * @param {unknown} config
 * @returns {string[]}
 */
export function validateSourceConfig(config) {
  const errors = [];
  if (!isObject(config)) return ['設定はオブジェクトである必要がある'];
  if (config.version !== 1) errors.push('version は 1');
  if (!Array.isArray(config.sounds)) return [...errors, 'sounds は配列'];
  const ids = new Set();
  config.sounds.forEach((s, i) => {
    if (!isObject(s)) {
      errors.push(`sounds[${i}]: オブジェクトではない`);
      return;
    }
    const prefix = `sounds[${i}]${typeof s.id === 'string' ? ` (${s.id})` : ''}`;
    checkCommon(prefix, s, errors);
    if (typeof s.id === 'string') {
      if (ids.has(s.id)) errors.push(`${prefix}: id が重複している`);
      ids.add(s.id);
    }
    if (!isSafeRelativePath(s.source)) {
      errors.push(`${prefix}: source は assets-src/audio/ からの相対パス（.. や絶対パスは不可）`);
    } else if (!SOURCE_EXTENSIONS.some((e) => s.source.toLowerCase().endsWith(e))) {
      errors.push(`${prefix}: source の拡張子は ${SOURCE_EXTENSIONS.join(' ')} のいずれか`);
    }
    checkLoop(prefix, s, errors, { allowEqualEnd: false });
    if (s.gainDb !== undefined && (!isNum(s.gainDb) || s.gainDb < -40 || s.gainDb > 12)) {
      errors.push(`${prefix}: gainDb は -40〜12 の数値`);
    }
    if (
      s.bitrateKbps !== undefined &&
      (!Number.isInteger(s.bitrateKbps) || s.bitrateKbps < 16 || s.bitrateKbps > 256)
    ) {
      errors.push(`${prefix}: bitrateKbps は 16〜256 の整数`);
    }
    if (typeof s.license !== 'string' || s.license === '') {
      errors.push(`${prefix}: license（docs/audio-assets.md の表のキー）が必要`);
    }
  });
  return errors;
}

/**
 * 出力側のマニフェスト（public/assets/audio/manifest.json、ランタイムのローダが読む）の検証。
 * @param {unknown} manifest
 * @returns {string[]}
 */
export function validateRuntimeManifest(manifest) {
  const errors = [];
  if (!isObject(manifest)) return ['マニフェストはオブジェクトである必要がある'];
  if (manifest.version !== 1) errors.push('version は 1');
  if (manifest.format !== 'ogg-opus') errors.push('format は ogg-opus');
  if (!isNum(manifest.totalBytes) || manifest.totalBytes < 0)
    errors.push('totalBytes は 0 以上の数値');
  if (!isNum(manifest.budgetBytes) || manifest.budgetBytes <= 0)
    errors.push('budgetBytes は正の数値');
  if (!Array.isArray(manifest.sounds)) return [...errors, 'sounds は配列'];
  const ids = new Set();
  let sum = 0;
  manifest.sounds.forEach((s, i) => {
    if (!isObject(s)) {
      errors.push(`sounds[${i}]: オブジェクトではない`);
      return;
    }
    const prefix = `sounds[${i}]${typeof s.id === 'string' ? ` (${s.id})` : ''}`;
    checkCommon(prefix, s, errors);
    if (typeof s.id === 'string') {
      if (ids.has(s.id)) errors.push(`${prefix}: id が重複している`);
      ids.add(s.id);
    }
    if (s.bus !== undefined && typeof s.bus !== 'string') errors.push(`${prefix}: bus は文字列`);
    if (s.bus === undefined) errors.push(`${prefix}: bus が無い`);
    if (!isSafeRelativePath(s.file) || !s.file.endsWith('.ogg')) {
      errors.push(`${prefix}: file は .ogg の相対パス`);
    }
    if (
      s.fallbackFile !== undefined &&
      (!isSafeRelativePath(s.fallbackFile) || !s.fallbackFile.endsWith('.m4a'))
    ) {
      errors.push(`${prefix}: fallbackFile は .m4a の相対パス`);
    }
    if (typeof s.loop !== 'boolean') errors.push(`${prefix}: loop は boolean`);
    checkLoop(prefix, s, errors, { allowEqualEnd: true });
    if (!isNum(s.duration) || s.duration <= 0) errors.push(`${prefix}: duration は正の秒数`);
    else if (isNum(s.loopEnd) && s.loopEnd > s.duration + 0.05) {
      errors.push(`${prefix}: loopEnd が duration を超えている`);
    }
    if (!isNum(s.gain) || s.gain <= 0 || s.gain > 4)
      errors.push(`${prefix}: gain は 0 より大きく 4 以下の線形ゲイン`);
    if (KINDS.includes(s.kind) && s.channels !== KIND_CHANNELS[s.kind]) {
      errors.push(`${prefix}: kind=${s.kind} のチャンネル数は ${KIND_CHANNELS[s.kind]}`);
    }
    if (!Number.isInteger(s.bytes) || s.bytes <= 0) errors.push(`${prefix}: bytes は正の整数`);
    else sum += s.bytes;
  });
  if (isNum(manifest.totalBytes) && manifest.totalBytes !== sum) {
    errors.push(`totalBytes (${manifest.totalBytes}) が各ファイルの合計 (${sum}) と一致しない`);
  }
  return errors;
}

/**
 * 容量予算の判定。
 * @param {number} totalBytes
 * @param {number} [budgetBytes]
 * @returns {{ status: 'ok' | 'warn' | 'fail', ratio: number }}
 */
export function checkBudget(totalBytes, budgetBytes = AUDIO_BUDGET_BYTES) {
  const ratio = totalBytes / budgetBytes;
  if (totalBytes > budgetBytes) return { status: 'fail', ratio };
  if (ratio >= BUDGET_WARN_RATIO) return { status: 'warn', ratio };
  return { status: 'ok', ratio };
}

/**
 * docs/audio-assets.md のライセンス表をパースする。
 * 表の行は `| \`キー\` | 用途 | 出典 URL | 作者 | ライセンス | 取得日 | 元ファイル |`。
 * キーがバッククォートで始まる行だけを対象にする。
 * @param {string} markdown
 * @returns {Map<string, { license: string, url: string, author: string, date: string }>}
 */
export function parseLicenseTable(markdown) {
  const rows = new Map();
  for (const line of markdown.split('\n')) {
    if (!/^\|\s*`/.test(line)) continue;
    const cells = line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim());
    const key = /^`([^`]+)`$/.exec(cells[0] ?? '')?.[1];
    if (!key || cells.length < 6) continue;
    rows.set(key, {
      license: cells[4] ?? '',
      url: cells[2] ?? '',
      author: cells[3] ?? '',
      date: cells[5] ?? '',
    });
  }
  return rows;
}

/**
 * 設定の各 license キーがライセンス表にあり、CC0（または自作）であることを検査する。
 * @param {{ sounds: { id: string, license: string }[] }} config
 * @param {string} markdown
 * @returns {string[]}
 */
export function checkLicenses(config, markdown) {
  const table = parseLicenseTable(markdown);
  const errors = [];
  for (const s of config.sounds) {
    const row = table.get(s.license);
    if (!row) {
      errors.push(`${s.id}: license キー "${s.license}" が docs/audio-assets.md の表に無い`);
      continue;
    }
    if (!ALLOWED_LICENSE.test(row.license)) {
      errors.push(`${s.id}: ライセンス "${row.license}" は不可（CC0 のみ取り込める）`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      errors.push(`${s.id}: ライセンス表の取得日が YYYY-MM-DD でない`);
    }
    if (row.url === '' || row.author === '') {
      errors.push(`${s.id}: ライセンス表の出典 URL / 作者が空`);
    }
  }
  return errors;
}

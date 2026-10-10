import type { AudioBufferLike } from './playbackTypes';
import type { AudioManifest, SoundManifestEntry } from './manifest';
import { variantGroupOf } from './variants';

/**
 * 再生に使うファイルを選ぶ。Ogg Opus が再生できるなら `file`、できない環境（古い iOS Safari 等）では
 * `fallbackFile`（AAC `.m4a`）があればそれを使う。
 */
export function chooseFile(entry: SoundManifestEntry, opusSupported: boolean): string {
  if (!opusSupported && entry.fallbackFile) return entry.fallbackFile;
  return entry.file;
}

/** `canPlayType` の結果（`''` / `'maybe'` / `'probably'`）から Ogg Opus 対応かを判定する。 */
export function isOpusSupported(canPlayTypeResult: string): boolean {
  return canPlayTypeResult !== '';
}

/** ブラウザで Ogg Opus が再生できるか。判定できない環境では true（Opus が主、判定失敗で退化させない）。 */
export function detectOggOpusSupport(): boolean {
  try {
    if (typeof document === 'undefined') return true;
    return isOpusSupported(document.createElement('audio').canPlayType('audio/ogg; codecs=opus'));
  } catch {
    return true;
  }
}

export type SoundSelector = readonly string[] | ((entry: SoundManifestEntry) => boolean);

/** プリロードのグループ（仕様書 10.2 節: タイトル中に BGM・UI・環境音、フィールド進入前に敵・ボス SE）。 */
export const PRELOAD_GROUPS = {
  // 足音（`sfx.footstep-*`）は開始直後から鳴るので title で先読みする（未ロードの要求は見送られる）。
  title: (e: SoundManifestEntry): boolean =>
    e.kind === 'bgm' || e.kind === 'ui' || e.kind === 'ambient' || e.id.startsWith('sfx.footstep-'),
  field: (e: SoundManifestEntry): boolean =>
    e.kind === 'se' && (e.id.startsWith('sfx.enemy') || e.id.startsWith('sfx.boss')),
} as const satisfies Record<string, (e: SoundManifestEntry) => boolean>;

export interface SoundLibraryOptions {
  readonly decode: (data: ArrayBuffer) => Promise<AudioBufferLike>;
  /** 素材の置き場（末尾 `/`）。例: `${BASE_URL}assets/audio/`。 */
  readonly baseUrl: string;
  readonly opusSupported: boolean;
  /** テスト用に差し替え可能。既定は `fetch`。 */
  readonly fetchBytes?: (url: string) => Promise<ArrayBuffer>;
}

async function defaultFetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.arrayBuffer();
}

/**
 * マニフェストからの遅延ロードとデコード済みバッファのキャッシュ。
 * 失敗した素材は再試行せず（ループ防止）、警告を 1 回だけ出して再生要求を無視させる。
 */
export class SoundLibrary {
  private readonly entries = new Map<string, SoundManifestEntry>();
  private readonly groups = new Map<string, SoundManifestEntry[]>();
  private readonly buffers = new Map<string, AudioBufferLike>();
  private readonly pending = new Map<string, Promise<AudioBufferLike | undefined>>();
  private readonly failed = new Set<string>();
  private readonly fetchBytes: (url: string) => Promise<ArrayBuffer>;

  constructor(private readonly opts: SoundLibraryOptions) {
    this.fetchBytes = opts.fetchBytes ?? defaultFetchBytes;
  }

  get loadedCount(): number {
    return this.buffers.size;
  }

  get failedCount(): number {
    return this.failed.size;
  }

  get size(): number {
    return this.entries.size;
  }

  /** マニフェスト JSON を取得して登録する。失敗したら例外（呼び出し側が警告して無音で続行する）。 */
  async loadManifest(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    this.setManifest((await res.json()) as AudioManifest);
  }

  setManifest(manifest: Pick<AudioManifest, 'sounds'>): void {
    this.entries.clear();
    this.groups.clear();
    const sounds: unknown = manifest.sounds;
    if (!Array.isArray(sounds)) throw new Error('invalid audio manifest');
    for (const e of sounds as SoundManifestEntry[]) {
      this.entries.set(e.id, e);
      const g = variantGroupOf(e.id);
      const list = this.groups.get(g);
      if (list) list.push(e);
      else this.groups.set(g, [e]);
    }
  }

  get(id: string): SoundManifestEntry | undefined {
    return this.entries.get(id);
  }

  /** `cue` が素材 ID ならその 1 件、バリエーショングループ名ならグループ全件（ID 順）。 */
  variantsOf(cue: string): readonly SoundManifestEntry[] {
    const exact = this.entries.get(cue);
    if (exact) return [exact];
    return this.groups.get(cue) ?? [];
  }

  /** デコード済みバッファ（未ロードなら undefined）。 */
  buffer(id: string): AudioBufferLike | undefined {
    return this.buffers.get(id);
  }

  /** ロード（キャッシュ・並行要求の集約つき）。失敗時は undefined。 */
  load(id: string): Promise<AudioBufferLike | undefined> {
    const cached = this.buffers.get(id);
    if (cached) return Promise.resolve(cached);
    if (this.failed.has(id)) return Promise.resolve(undefined);
    const inflight = this.pending.get(id);
    if (inflight) return inflight;
    const entry = this.entries.get(id);
    if (!entry) return Promise.resolve(undefined);
    const p = this.fetchAndDecode(entry).then(
      (buf) => {
        this.pending.delete(id);
        this.buffers.set(id, buf);
        return buf;
      },
      (e: unknown) => {
        this.pending.delete(id);
        this.failed.add(id);
        console.warn(`audio: failed to load "${id}"`, e);
        return undefined;
      },
    );
    this.pending.set(id, p);
    return p;
  }

  /** セレクタ（ID 配列 or 述語）に合う素材をすべてロードする。 */
  async preload(selector: SoundSelector): Promise<void> {
    const ids =
      typeof selector === 'function'
        ? [...this.entries.values()].filter(selector).map((e) => e.id)
        : selector.flatMap((c) => this.variantsOf(c).map((e) => e.id));
    await Promise.all(ids.map((id) => this.load(id)));
  }

  private async fetchAndDecode(entry: SoundManifestEntry): Promise<AudioBufferLike> {
    const primary = chooseFile(entry, this.opts.opusSupported);
    try {
      return await this.decodeFile(primary);
    } catch (e) {
      // 判定が外れて Opus をデコードできなかった場合の保険（iOS の版差など）。
      if (primary === entry.file && entry.fallbackFile) return this.decodeFile(entry.fallbackFile);
      throw e;
    }
  }

  private async decodeFile(file: string): Promise<AudioBufferLike> {
    const data = await this.fetchBytes(this.opts.baseUrl + file);
    return this.opts.decode(data);
  }
}

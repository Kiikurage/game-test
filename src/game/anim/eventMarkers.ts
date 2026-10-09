/**
 * アニメーションイベントマーカー表（docs/anim-event-markers.md、仕様書 0.3 節）。
 *
 * マーカーは 60Hz シミュレーションフレーム基準（動作開始の次のフレームが F1、0.2 節）で記述し、
 * クリップは再生範囲と再生速度（playbackRate）を合わせて使う。`game` 層なので three には依存しない
 * （クリップ名は文字列。`ClipName` との一致は呼び出し側で検証する）。
 */

/** シミュレーションのフレームレート（Hz）。 */
export const SIM_FPS = 60;

export const MARKER_TYPES = [
  'hitStart',
  'hitEnd',
  'cancelOpen',
  'invulnStart',
  'invulnEnd',
  'footstep',
  'healApply',
] as const;

export type MarkerType = (typeof MARKER_TYPES)[number];

export interface AnimEventMarker {
  readonly type: MarkerType;
  /** シミュレーションフレーム（F1 起点、1 以上 total 以下の整数）。そのフレームの開始時点でイベントが起きる。 */
  readonly frame: number;
}

export interface ClipEventEntry {
  /** 動作 ID（例: `player.light1`）。表内で一意。 */
  readonly id: string;
  /** アニメーションクリップ名。 */
  readonly clip: string;
  /** クリップ自身のフレームレート（クリップ内フレーム ⇔ 秒の変換に使う）。 */
  readonly clipFps: number;
  /** クリップ内の再生範囲（クリップのフレーム番号、0 起点。start < end）。 */
  readonly clipRange: { readonly startFrame: number; readonly endFrame: number };
  /**
   * クリップ内で攻撃が当たる（振り抜く）フレーム（クリップのフレーム番号）。範囲内で start より後。
   * 省略すると、判定を持たない動作（ロール・移動など）として再生範囲の全体を「全体フレーム」に合わせる。
   */
  readonly clipHitFrame?: number;
  /** true で再生範囲を終端から先頭へ逆再生する（バックステップなど）。 */
  readonly reverse?: boolean;
  /** 仕様上のフレームデータ（仕様書 2.3 節）。 */
  readonly spec: { readonly startup: number; readonly active: number; readonly recovery: number };
  /** フレーム昇順（同一フレームは記述順）。 */
  readonly markers: readonly AnimEventMarker[];
}

export interface ClipEventTable {
  readonly version: 1;
  readonly entries: readonly ClipEventEntry[];
}

/** 不正データ。`path` は `$.entries[0].markers[2].frame` のような位置。 */
export class AnimDataError extends Error {
  constructor(
    readonly path: string,
    message: string,
  ) {
    super(`${path}: ${message}`);
    this.name = 'AnimDataError';
  }
}

// ---- 派生値 ----

/** 全体フレーム = 発生 + 持続 + 硬直。 */
export function totalFrames(entry: ClipEventEntry): number {
  return entry.spec.startup + entry.spec.active + entry.spec.recovery;
}

/**
 * `playbackRate = クリップ内の当たり（秒換算）÷ 仕様の発生（秒換算）`。クリップが 60fps なら「当たりフレーム ÷ 発生フレーム」。
 * `clipHitFrame` がない動作は、再生範囲の長さ ÷ 全体フレーム（秒換算）。
 */
export function playbackRate(entry: ClipEventEntry): number {
  if (entry.clipHitFrame === undefined) {
    const rangeSeconds = (entry.clipRange.endFrame - entry.clipRange.startFrame) / entry.clipFps;
    return rangeSeconds / (totalFrames(entry) / SIM_FPS);
  }
  const clipHitSeconds = (entry.clipHitFrame - entry.clipRange.startFrame) / entry.clipFps;
  return clipHitSeconds / (entry.spec.startup / SIM_FPS);
}

/**
 * シミュレーションフレーム `frame`（F1 起点）の開始時点に対応するクリップ時間（秒、クリップ先頭起点の絶対位置）。
 * 再生範囲の外は端に丸める。
 */
export function simFrameToClipTime(entry: ClipEventEntry, frame: number): number {
  const start = entry.clipRange.startFrame / entry.clipFps;
  const end = entry.clipRange.endFrame / entry.clipFps;
  const travelled = ((frame - 1) / SIM_FPS) * playbackRate(entry);
  const t = entry.reverse ? end - travelled : start + travelled;
  return Math.min(Math.max(t, start), end);
}

/** `simFrameToClipTime` の逆変換。クリップ時間（秒）から、シミュレーションフレーム（小数、F1 起点）へ。 */
export function clipTimeToSimFrame(entry: ClipEventEntry, clipTime: number): number {
  const start = entry.clipRange.startFrame / entry.clipFps;
  const end = entry.clipRange.endFrame / entry.clipFps;
  const travelled = entry.reverse ? end - clipTime : clipTime - start;
  return 1 + (travelled / playbackRate(entry)) * SIM_FPS;
}

/** マーカーのクリップ時間（秒）。 */
export function markerClipTime(entry: ClipEventEntry, marker: AnimEventMarker): number {
  return simFrameToClipTime(entry, marker.frame);
}

/** 動作開始からの経過シミュレーションフレーム数（0 起点）に対する、クリップ再生位置（秒）。 */
export function elapsedFramesToClipTime(entry: ClipEventEntry, elapsedFrames: number): number {
  return simFrameToClipTime(entry, elapsedFrames + 1);
}

/** 指定種別のマーカーを昇順で返す。 */
export function markersOfType(entry: ClipEventEntry, type: MarkerType): readonly AnimEventMarker[] {
  return entry.markers.filter((m) => m.type === type);
}

// ---- バリデーション ----

type Json = Record<string, unknown>;

function asObject(v: unknown, path: string): Json {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new AnimDataError(path, 'オブジェクトが必要です');
  }
  return v as Json;
}

function asString(v: unknown, path: string): string {
  if (typeof v !== 'string' || v === '') throw new AnimDataError(path, '空でない文字列が必要です');
  return v;
}

function asNumber(
  v: unknown,
  path: string,
  min: number,
  integer: boolean,
  exclusiveMin = false,
): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new AnimDataError(path, '数値が必要です');
  if (integer && !Number.isInteger(v)) throw new AnimDataError(path, `整数が必要です（${v}）`);
  if (exclusiveMin ? v <= min : v < min) {
    throw new AnimDataError(
      path,
      `${min} ${exclusiveMin ? 'より大きい' : '以上の'}値が必要です（${v}）`,
    );
  }
  return v;
}

const PAIRS: readonly (readonly [MarkerType, MarkerType])[] = [
  ['hitStart', 'hitEnd'],
  ['invulnStart', 'invulnEnd'],
];

function parseMarkers(v: unknown, path: string, total: number): AnimEventMarker[] {
  if (!Array.isArray(v)) throw new AnimDataError(path, '配列が必要です');
  const markers: AnimEventMarker[] = [];
  let prevFrame = 0;
  v.forEach((raw: unknown, i) => {
    const p = `${path}[${i}]`;
    const o = asObject(raw, p);
    const type = o.type;
    if (typeof type !== 'string' || !(MARKER_TYPES as readonly string[]).includes(type)) {
      throw new AnimDataError(`${p}.type`, `未知のマーカー種別です（${String(type)}）`);
    }
    const frame = asNumber(o.frame, `${p}.frame`, 1, true);
    if (frame > total) {
      throw new AnimDataError(`${p}.frame`, `全体フレーム ${total} を超えています（${frame}）`);
    }
    if (frame < prevFrame) {
      throw new AnimDataError(
        `${p}.frame`,
        `マーカーがフレーム昇順ではありません（${frame} < ${prevFrame}）`,
      );
    }
    prevFrame = frame;
    markers.push({ type: type as MarkerType, frame });
  });
  // 開始/終了マーカーは「開始 → 終了」の交互、終了は開始と同一フレーム以降（窓は両端を含む）。
  for (const [open, close] of PAIRS) {
    let isOpen = false;
    let openFrame = 0;
    for (const m of markers) {
      if (m.type === open) {
        if (isOpen) {
          throw new AnimDataError(path, `${open} が ${close} なしで連続しています（F${m.frame}）`);
        }
        isOpen = true;
        openFrame = m.frame;
      } else if (m.type === close) {
        if (!isOpen) {
          throw new AnimDataError(path, `${close} の前に ${open} がありません（F${m.frame}）`);
        }
        isOpen = false;
      }
    }
    if (isOpen) {
      throw new AnimDataError(path, `${open}（F${openFrame}）に対応する ${close} がありません`);
    }
  }
  return markers;
}

function parseEntry(raw: unknown, path: string): ClipEventEntry {
  const o = asObject(raw, path);
  const id = asString(o.id, `${path}.id`);
  const clip = asString(o.clip, `${path}.clip`);
  const clipFps = asNumber(o.clipFps, `${path}.clipFps`, 0, false, true);

  const range = asObject(o.clipRange, `${path}.clipRange`);
  const startFrame = asNumber(range.startFrame, `${path}.clipRange.startFrame`, 0, true);
  const endFrame = asNumber(range.endFrame, `${path}.clipRange.endFrame`, 0, true);
  if (endFrame <= startFrame) {
    throw new AnimDataError(
      `${path}.clipRange`,
      `endFrame は startFrame より大きい必要があります（${startFrame}–${endFrame}）`,
    );
  }

  let clipHitFrame: number | undefined;
  if (o.clipHitFrame !== undefined) {
    clipHitFrame = asNumber(o.clipHitFrame, `${path}.clipHitFrame`, 0, false);
    if (clipHitFrame <= startFrame || clipHitFrame > endFrame) {
      throw new AnimDataError(
        `${path}.clipHitFrame`,
        `再生範囲 ${startFrame}–${endFrame} 内（開始より後）である必要があります（${clipHitFrame}）`,
      );
    }
  }
  if (o.reverse !== undefined && typeof o.reverse !== 'boolean') {
    throw new AnimDataError(`${path}.reverse`, '真偽値が必要です');
  }
  const reverse = o.reverse === true;

  const spec = asObject(o.spec, `${path}.spec`);
  const startup = asNumber(spec.startup, `${path}.spec.startup`, 1, true);
  const active = asNumber(spec.active, `${path}.spec.active`, 0, true);
  const recovery = asNumber(spec.recovery, `${path}.spec.recovery`, 0, true);
  const total = startup + active + recovery;

  const markers = parseMarkers(o.markers, `${path}.markers`, total);

  // 当たり窓は仕様のフレームデータ（発生・持続）と一致していること。
  const firstHit = markers.find((m) => m.type === 'hitStart');
  const lastHit = markers.findLast((m) => m.type === 'hitEnd');
  if (firstHit && firstHit.frame !== startup + 1) {
    throw new AnimDataError(
      `${path}.markers`,
      `最初の hitStart は F${startup + 1}（発生 ${startup} の次）である必要があります（F${firstHit.frame}）`,
    );
  }
  if (lastHit && lastHit.frame !== startup + active) {
    throw new AnimDataError(
      `${path}.markers`,
      `最後の hitEnd は F${startup + active}（発生 + 持続）である必要があります（F${lastHit.frame}）`,
    );
  }

  return {
    id,
    clip,
    clipFps,
    clipRange: { startFrame, endFrame },
    ...(clipHitFrame !== undefined && { clipHitFrame }),
    ...(reverse && { reverse }),
    spec: { startup, active, recovery },
    markers,
  };
}

/** JSON を検証して `ClipEventTable` にする。不正なら `AnimDataError`。 */
export function parseClipEventTable(json: unknown): ClipEventTable {
  const root = asObject(json, '$');
  if (root.version !== 1) {
    throw new AnimDataError('$.version', `未対応のバージョンです（${String(root.version)}）`);
  }
  if (!Array.isArray(root.entries)) throw new AnimDataError('$.entries', '配列が必要です');
  const seen = new Set<string>();
  const entries = root.entries.map((raw: unknown, i) => {
    const entry = parseEntry(raw, `$.entries[${i}]`);
    if (seen.has(entry.id)) {
      throw new AnimDataError(`$.entries[${i}].id`, `id が重複しています（${entry.id}）`);
    }
    seen.add(entry.id);
    return entry;
  });
  return { version: 1, entries };
}

/** 表を id で引けるようにする。存在しない id は例外。 */
export function indexClipEvents(table: ClipEventTable): (id: string) => ClipEventEntry {
  const map = new Map(table.entries.map((e) => [e.id, e]));
  return (id) => {
    const e = map.get(id);
    if (!e) throw new Error(`イベントマーカー表に動作 ${id} がありません`);
    return e;
  };
}

/** 表を id で引く。存在しない id は undefined（状態に対応する動作表があるかを調べるとき用）。 */
export function lookupClipEvents(
  table: ClipEventTable,
): (id: string) => ClipEventEntry | undefined {
  const map = new Map(table.entries.map((e) => [e.id, e]));
  return (id) => map.get(id);
}

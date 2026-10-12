// 状態の正本: フィールドごとの型付き配列（SoA）。容量固定（#383 spike）。
// 1 つの状態は 1 本の ArrayBuffer / SharedArrayBuffer に全フィールドを並べる。
// 同じバッファをそのまま Worker に渡せ（SAB なら共有、ArrayBuffer なら Transferable）、
// 各フィールドの配列はそのまま GPU のストレージバッファの中身にできる。DOM / three 非依存。

export type FieldType = 'f32' | 'u32' | 'i32';

export type StateSchema = Readonly<Record<string, FieldType>>;

type ArrayOf<T extends FieldType> = T extends 'f32'
  ? Float32Array
  : T extends 'u32'
    ? Uint32Array
    : Int32Array;

/** スキーマ → フィールド名ごとの型付き配列。 */
export type StateArrays<S extends StateSchema> = { readonly [K in keyof S]: ArrayOf<S[K]> };

export interface StateDef<S extends StateSchema> {
  readonly name: string;
  readonly schema: S;
  /** 要素数（全フィールド共通・固定）。 */
  readonly capacity: number;
  /** 全フィールドを並べたバイト数（各フィールドは 4 バイト × capacity）。 */
  readonly byteLength: number;
}

/** 状態の宣言。実体は `allocState` / `viewState` で作る。 */
export function defineState<const S extends StateSchema>(
  name: string,
  schema: S,
  capacity: number,
): StateDef<S> {
  if (!(capacity > 0) || !Number.isInteger(capacity)) throw new RangeError('capacity');
  return { name, schema, capacity, byteLength: Object.keys(schema).length * 4 * capacity };
}

export interface StateStore<S extends StateSchema> {
  readonly def: StateDef<S>;
  readonly buffer: ArrayBufferLike;
  readonly arrays: StateArrays<S>;
}

const CTORS = { f32: Float32Array, u32: Uint32Array, i32: Int32Array } as const;

/** 既存のバッファ（の `byteOffset` から）を状態として読む。Worker 側・SAB の受け側で使う。 */
export function viewState<S extends StateSchema>(
  def: StateDef<S>,
  buffer: ArrayBufferLike,
  byteOffset = 0,
): StateStore<S> {
  const arrays: Record<string, Float32Array | Uint32Array | Int32Array> = {};
  let offset = byteOffset;
  for (const [field, type] of Object.entries(def.schema)) {
    arrays[field] = new CTORS[type](buffer as ArrayBuffer, offset, def.capacity);
    offset += 4 * def.capacity;
  }
  return { def, buffer, arrays: arrays as unknown as StateArrays<S> };
}

/** 新しいバッファに状態を確保する。`shared` なら SharedArrayBuffer（crossOriginIsolated が必要）。 */
export function allocState<S extends StateSchema>(
  def: StateDef<S>,
  { shared = false }: { shared?: boolean } = {},
): StateStore<S> {
  const buffer = shared ? new SharedArrayBuffer(def.byteLength) : new ArrayBuffer(def.byteLength);
  return viewState(def, buffer);
}

/** 全フィールドを丸ごと写す（同じ定義の状態どうし）。 */
export function copyState<S extends StateSchema>(src: StateStore<S>, dst: StateStore<S>): void {
  new Uint8Array(dst.buffer, byteOffsetOf(dst), dst.def.byteLength).set(
    new Uint8Array(src.buffer, byteOffsetOf(src), src.def.byteLength),
  );
}

function byteOffsetOf(store: StateStore<StateSchema>): number {
  const first = Object.values(store.arrays)[0];
  return first ? first.byteOffset : 0;
}

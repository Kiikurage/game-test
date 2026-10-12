/**
 * JSON データの実行時スキーマ検証（依存ライブラリなしの小さなコンビネータ）。
 *
 * スキーマは値を検証して型付きの値を返す関数の入れ物。`Infer<typeof schema>` で TypeScript の型を取り出せる。
 * オブジェクトは既定で未知のキーを拒否する（データの打ち間違いを早く見つけるため）。
 *
 *   const Point = s.object({ x: s.number(), z: s.number(), label: s.optional(s.string()) });
 *   type Point = Infer<typeof Point>;
 *   const p = parseData(Point, json, 'points.json'); // 不正なら SchemaError（`points.json: $.label: expected string`）
 *
 * 検証は値をコピーせず、そのまま返す（読み込み時に 1 回だけ走らせる前提。大きなレベルでも 1ms 未満）。
 */

/** 検証エラー。`path` は `$.props[3].height` の形。 */
export class SchemaError extends Error {
  constructor(
    readonly path: string,
    readonly detail: string,
    readonly source?: string,
  ) {
    super(`${source ? `${source}: ` : ''}${path}: ${detail}`);
    this.name = 'SchemaError';
  }
}

export interface Schema<T> {
  /** 検証して値を返す。不正なら `SchemaError` を投げる。`path` はエラー表示用。 */
  readonly check: (value: unknown, path: string) => T;
  /** エラー表示用の型の説明。 */
  readonly describe: string;
  /** `s.optional` が付けた印（オブジェクトのキーを省略可能にする）。 */
  readonly optional?: true;
}

export type Infer<S> = S extends Schema<infer T> ? T : never;

function fail(path: string, detail: string): never {
  throw new SchemaError(path, detail);
}

function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function schema<T>(describe: string, check: (value: unknown, path: string) => T): Schema<T> {
  return { describe, check };
}

type Shape = Record<string, Schema<unknown>>;
type OptionalKeys<S extends Shape> = {
  [K in keyof S]: S[K] extends { readonly optional: true } ? K : never;
}[keyof S];
type RequiredKeys<S extends Shape> = Exclude<keyof S, OptionalKeys<S>>;
type Simplify<T> = { [K in keyof T]: T[K] } & {};
export type InferShape<S extends Shape> = Simplify<
  { readonly [K in RequiredKeys<S>]: Infer<S[K]> } & {
    readonly [K in OptionalKeys<S>]?: Infer<S[K]>;
  }
>;

type Literal = string | number | boolean | null;

export const s = {
  /** 有限の数（NaN・Infinity は JSON に現れないが、念のため拒否）。 */
  number(opts: { min?: number; max?: number; integer?: boolean } = {}): Schema<number> {
    return schema('number', (v, path) => {
      if (typeof v !== 'number' || !Number.isFinite(v))
        fail(path, `expected number, got ${typeName(v)}`);
      if (opts.integer && !Number.isInteger(v)) fail(path, `expected integer, got ${v}`);
      if (opts.min !== undefined && v < opts.min) fail(path, `expected >= ${opts.min}, got ${v}`);
      if (opts.max !== undefined && v > opts.max) fail(path, `expected <= ${opts.max}, got ${v}`);
      return v;
    });
  },
  string(): Schema<string> {
    return schema('string', (v, path) =>
      typeof v === 'string' ? v : fail(path, `expected string, got ${typeName(v)}`),
    );
  },
  boolean(): Schema<boolean> {
    return schema('boolean', (v, path) =>
      typeof v === 'boolean' ? v : fail(path, `expected boolean, got ${typeName(v)}`),
    );
  },
  /** 列挙（文字列リテラルの和など）。 */
  literal<const L extends readonly Literal[]>(...values: L): Schema<L[number]> {
    const describe = values.map((x) => JSON.stringify(x)).join(' | ');
    return schema(describe, (v, path) =>
      values.includes(v as Literal)
        ? (v as L[number])
        : fail(path, `expected ${describe}, got ${JSON.stringify(v)}`),
    );
  },
  array<T>(item: Schema<T>, opts: { minLength?: number } = {}): Schema<readonly T[]> {
    return schema(`${item.describe}[]`, (v, path) => {
      if (!Array.isArray(v)) fail(path, `expected array, got ${typeName(v)}`);
      if (opts.minLength !== undefined && v.length < opts.minLength) {
        fail(path, `expected at least ${opts.minLength} items, got ${v.length}`);
      }
      for (let i = 0; i < v.length; i++) item.check(v[i], `${path}[${i}]`);
      return v as readonly T[];
    });
  },
  tuple<const T extends readonly Schema<unknown>[]>(
    ...items: T
  ): Schema<{ readonly [K in keyof T]: Infer<T[K]> }> {
    return schema(`[${items.map((i) => i.describe).join(', ')}]`, (v, path) => {
      if (!Array.isArray(v) || v.length !== items.length) {
        fail(path, `expected tuple of ${items.length}, got ${typeName(v)}`);
      }
      items.forEach((item, i) => item.check(v[i], `${path}[${i}]`));
      return v as unknown as { readonly [K in keyof T]: Infer<T[K]> };
    });
  },
  /** オブジェクト。未知のキーはエラー。省略可能なキーは `s.optional(...)` で包む。 */
  object<S extends Shape>(shape: S): Schema<InferShape<S>> {
    const keys = Object.keys(shape);
    return schema(`{ ${keys.join(', ')} }`, (v, path) => {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) {
        fail(path, `expected object, got ${typeName(v)}`);
      }
      const record = v as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        if (!(key in shape)) fail(`${path}.${key}`, 'unknown key');
      }
      for (const key of keys) {
        const field = shape[key] as Schema<unknown>;
        const value = record[key];
        if (value === undefined) {
          if (!field.optional) fail(`${path}.${key}`, `missing (expected ${field.describe})`);
          continue;
        }
        field.check(value, `${path}.${key}`);
      }
      return v as InferShape<S>;
    });
  },
  /** オブジェクトのキーを省略可能にする（`s.object` の中でだけ意味を持つ）。 */
  optional<T>(inner: Schema<T>): Schema<T> & { readonly optional: true } {
    return { ...inner, describe: `${inner.describe}?`, optional: true };
  },
  nullable<T>(inner: Schema<T>): Schema<T | null> {
    return schema(`${inner.describe} | null`, (v, path) =>
      v === null ? null : inner.check(v, path),
    );
  },
  /**
   * `key` の値で分岐するオブジェクトの和。各分岐のスキーマは `key` を `s.literal` で持つこと。
   * 分岐が決まってからその分岐だけを検証するので、エラーが読みやすい。
   */
  union<const M extends Record<string, Schema<unknown>>>(
    key: string,
    variants: M,
  ): Schema<Infer<M[keyof M]>> {
    const names = Object.keys(variants);
    return schema(names.join(' | '), (v, path) => {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) {
        fail(path, `expected object, got ${typeName(v)}`);
      }
      const tag = (v as Record<string, unknown>)[key];
      const variant = typeof tag === 'string' ? variants[tag] : undefined;
      if (!variant)
        fail(`${path}.${key}`, `expected one of ${names.join(', ')}, got ${JSON.stringify(tag)}`);
      return variant.check(v, path) as Infer<M[keyof M]>;
    });
  },
  /** 任意の検証を足す（値の範囲の相互関係など）。`refine` が文字列を返したらエラー。 */
  refine<T>(inner: Schema<T>, refine: (value: T) => string | undefined): Schema<T> {
    return schema(inner.describe, (v, path) => {
      const value = inner.check(v, path);
      const error = refine(value);
      if (error !== undefined) fail(path, error);
      return value;
    });
  },
} as const;

/**
 * JSON データを検証して型付きで返す。`source` はエラーメッセージに付くファイル名など。
 * 失敗すると `SchemaError`（`source: $.path: 理由`）を投げる。
 */
export function parseData<T>(schemaDef: Schema<T>, value: unknown, source?: string): T {
  try {
    return schemaDef.check(value, '$');
  } catch (e) {
    if (e instanceof SchemaError && source !== undefined && e.source === undefined) {
      throw new SchemaError(e.path, e.detail, source);
    }
    throw e;
  }
}

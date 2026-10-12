// ゲームシステム（篝火・ボス・ロールなど、Game に組み込む機能）の登録口。
//
// 新しい機能は `src/game/<feature>/<feature>.system.ts` を作り、`registerGameSystem` を呼ぶだけでよい。
// `src/game/**/*.system.ts` は game.ts が自動で読み込む（game.ts を編集しない）。
//
//   export const bonfireSystem = registerGameSystem(
//     'bonfire',
//     (game) => {
//       const bonfires = new BonfireController(game);
//       return {
//         state: bonfires,                // ほかのシステム・描画・dev フックへ公開する状態（任意）
//         update: (dt) => { ... },        // 毎ステップ（プレイヤー・敵の更新後、判定の解決前）
//         onImpact: (e) => { ... },       // 命中のたび（反応・ヒットストップなどの標準処理と `impact` 発行の後）
//       };
//     },
//     { before: ['hud'] },                // 実行順の宣言（任意。ほかのシステムの id）
//   );
//
//   game.systems.get(bonfireSystem)       // → BonfireController（型付き）
//
// - システムは `Game` のインスタンスごとに作る（ファクトリが `Game` を受け取る）。ファクトリの中で
//   `game.systems.get(other)` を呼んでよい（まだ作っていなければその場で作る。循環はエラー）。
// - `update` / `onImpact` を呼ぶ順（と一括生成の順）は `after` / `before` の宣言から決める（トポロジカル順）。
//   宣言で決まらない同士は登録順（ファイル名順）。順序が意味を持つ組は必ず宣言する。
// - このファイルから `Game` の実体を import しない（循環参照を避けるため type import のみ）。
import type { GameEventMap } from '../core/gameEvents';
import type { HitEvent } from './combat';
import type { Game } from './game';

export interface GameSystem {
  /** 毎ステップ、プレイヤー・敵の更新と被弾側の同期の後、`combat.step()` の前に呼ばれる。 */
  update?(dt: number): void;
  /**
   * 命中のたびに、標準の処理（強靭度・敵への反映・ヒットストップ）と `impact` イベントの発行の後に呼ばれる。
   * 受け取るのは発行した `impact` そのもの（元の判定結果 `hit` 付き）。
   */
  onImpact?(e: ImpactEvent): void;
}

/** `impact` イベントに元の判定結果（ダメージ・ガード削りなど）を添えたもの。game 内のシステムが受け取る。 */
export type ImpactEvent = GameEventMap['impact'] & { readonly hit: HitEvent };

/** 実行順の宣言。値はほかのシステムの id。 */
export interface GameSystemOrder {
  /** これらのシステムの後に実行する。 */
  readonly after?: readonly string[];
  /** これらのシステムの前に実行する。 */
  readonly before?: readonly string[];
}

/** 登録したシステムの取得口。`game.systems.get(handle)` が型 `T` の状態を返す。 */
export interface GameSystemHandle<T> {
  readonly id: string;
  /** 型だけの印（実体は無い）。 */
  readonly __state?: T;
}

/** 登録の中身（テストが直接 `GameSystems` に渡せるよう公開）。 */
export interface GameSystemEntry {
  readonly id: string;
  readonly index: number;
  readonly after: readonly string[];
  readonly before: readonly string[];
  readonly create: (game: Game) => GameSystem & { readonly state?: unknown };
}

const entries: GameSystemEntry[] = [];

/**
 * システムを登録する。`id` の重複はエラー。ファクトリが `state` を返すと、戻り値のハンドルで型付きに取れる。
 */
export function registerGameSystem<T>(
  id: string,
  create: (game: Game) => GameSystem & { readonly state: T },
  order?: GameSystemOrder,
): GameSystemHandle<T>;
export function registerGameSystem(
  id: string,
  create: (game: Game) => GameSystem,
  order?: GameSystemOrder,
): GameSystemHandle<undefined>;
export function registerGameSystem(
  id: string,
  create: (game: Game) => GameSystem & { readonly state?: unknown },
  order: GameSystemOrder = {},
): GameSystemHandle<unknown> {
  if (entries.some((e) => e.id === id)) throw new Error(`game system "${id}" already registered`);
  entries.push({
    id,
    index: entries.length,
    after: order.after ?? [],
    before: order.before ?? [],
    create,
  });
  return { id };
}

/**
 * 宣言（after / before）を満たす順に並べる（トポロジカル順）。宣言で決まらない同士は `index`（登録順）が小さい方が先。
 * 未知の id・循環はエラー。
 */
export function sortGameSystems<
  E extends {
    readonly id: string;
    readonly index: number;
    readonly after: readonly string[];
    readonly before: readonly string[];
  },
>(list: readonly E[]): E[] {
  const byId = new Map(list.map((e) => [e.id, e]));
  const preds = new Map<string, Set<string>>(list.map((e) => [e.id, new Set<string>()]));
  const edge = (from: string, to: string, owner: string): void => {
    if (!byId.has(from) || !byId.has(to)) {
      const unknown = byId.has(from) ? to : from;
      throw new Error(`game system "${owner}" declares order against unknown system "${unknown}"`);
    }
    preds.get(to)?.add(from);
  };
  for (const e of list) {
    for (const a of e.after) edge(a, e.id, e.id);
    for (const b of e.before) edge(e.id, b, e.id);
  }
  const done = new Set<string>();
  const out: E[] = [];
  const pending = [...list].sort((a, b) => a.index - b.index);
  while (pending.length > 0) {
    const i = pending.findIndex((e) => [...(preds.get(e.id) ?? [])].every((p) => done.has(p)));
    if (i < 0) {
      throw new Error(
        `game system order has a cycle among: ${pending.map((e) => e.id).join(', ')}`,
      );
    }
    const [next] = pending.splice(i, 1);
    if (!next) break;
    done.add(next.id);
    out.push(next);
  }
  return out;
}

/**
 * `Game` 1 つ分のシステム。生成時点の登録を宣言順に並べて持つ。`init()` で全部を作り、`get` は未生成なら
 * その場で作る（ファクトリ同士が互いを参照できる）。
 */
export class GameSystems {
  private readonly order: readonly GameSystemEntry[];
  private readonly instances = new Map<string, GameSystem & { readonly state?: unknown }>();
  private readonly creating = new Set<string>();
  private ordered: (GameSystem & { readonly state?: unknown })[] = [];

  constructor(
    private readonly game: Game,
    registered: readonly GameSystemEntry[] = entries,
  ) {
    this.order = sortGameSystems(registered);
  }

  /** 実行順に並べた id（テスト・デバッグ用）。 */
  get ids(): readonly string[] {
    return this.order.map((e) => e.id);
  }

  /** 全システムを実行順に作る（Game のコンストラクタの最後に呼ぶ）。 */
  init(): void {
    this.ordered = this.order.map((e) => this.instantiate(e));
  }

  /** システムの状態を型付きで取る。まだ作っていなければ作る。 */
  get<T>(handle: GameSystemHandle<T>): T {
    const entry = this.order.find((e) => e.id === handle.id);
    if (!entry) throw new Error(`game system "${handle.id}" is not registered for this game`);
    return this.instantiate(entry).state as T;
  }

  /** 毎ステップの更新（実行順）。 */
  update(dt: number): void {
    for (const s of this.ordered) s.update?.(dt);
  }

  /** 命中のたび（実行順）。 */
  impact(e: ImpactEvent): void {
    for (const s of this.ordered) s.onImpact?.(e);
  }

  private instantiate(entry: GameSystemEntry): GameSystem & { readonly state?: unknown } {
    const existing = this.instances.get(entry.id);
    if (existing) return existing;
    if (this.creating.has(entry.id)) {
      throw new Error(`game system "${entry.id}" depends on itself during creation`);
    }
    this.creating.add(entry.id);
    try {
      const system = entry.create(this.game);
      this.instances.set(entry.id, system);
      return system;
    } finally {
      this.creating.delete(entry.id);
    }
  }
}

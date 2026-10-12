// シーン（起動時に組み立てるワールド）の登録口。`?scene=<id>` で選ぶ。省略時・未知の id は既定のシーン。
//
// 新しいシーンは `src/game/**/<name>.scene.ts` を作り、`registerScene` を呼ぶだけでよい（main.ts が自動で読み込む）。
//
//   registerScene('combat', () => ({ level: null, options: { ... }, cylinders: [...] }));
//
// このファイルは登録と解決だけを持つ（シーンの中身を import しない。循環参照を避けるため）。
import type { GameOptions, StaticCylinderSpec } from './gameOptions';
import type { Level } from './world/level';

/** シーンが組み立てる Game の初期条件。 */
export interface SceneSetup {
  /** 描画・地形の元になるレベル。テストシーンでは null。 */
  readonly level: Level | null;
  /** `Game.create` に渡す設定（入力・セーブは main.ts が足す）。 */
  readonly options: GameOptions;
  /** 生成後に置く静的な円柱。 */
  readonly cylinders: readonly StaticCylinderSpec[];
}

/** `params` は起動 URL のクエリ（シーン固有の切り替えに使ってよい）。 */
export type SceneFactory = (params: URLSearchParams) => SceneSetup;

const scenes = new Map<string, SceneFactory>();
let defaultId: string | undefined;

/** シーンを登録する。`id` の重複・既定の二重指定はエラー。 */
export function registerScene(
  id: string,
  create: SceneFactory,
  opts: { readonly default?: boolean } = {},
): void {
  if (scenes.has(id)) throw new Error(`scene "${id}" already registered`);
  if (opts.default) {
    if (defaultId !== undefined) throw new Error(`default scene already "${defaultId}"`);
    defaultId = id;
  }
  scenes.set(id, create);
}

/** `?scene=` の値から登録済みシーンの id を決める。未指定・未知なら既定のシーン。 */
export function resolveSceneId(search: string): string {
  const requested = new URLSearchParams(search).get('scene');
  if (requested !== null && scenes.has(requested)) return requested;
  if (defaultId === undefined) throw new Error('no default scene registered');
  return defaultId;
}

/** `?scene=` で選んだシーンを組み立てる。 */
export function createScene(search: string): SceneSetup & { readonly id: string } {
  const id = resolveSceneId(search);
  const create = scenes.get(id) as SceneFactory;
  return { id, ...create(new URLSearchParams(search)) };
}

/** 登録済みのシーン id（テスト用）。 */
export function registeredSceneIds(): readonly string[] {
  return [...scenes.keys()];
}

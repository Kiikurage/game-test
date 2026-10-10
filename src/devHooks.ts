// 開発・E2E 用フック（`window.__game.dev`）と、キャラクター確認表示（showcase）の URL パラメータの登録口。
//
// 各機能は自分のファイルの隣に `*.dev.ts` を置き、`registerDevHooks` を呼ぶだけでよい。
// `src/**/*.dev.ts` は main.ts が自動で読み込む（main.ts を編集しない）。
// フックの型は `DevHooks` へ宣言マージで足す（e2e から `window.__game.dev.xxx` が型付きで呼べる）:
//
//   declare module '../devHooks' {
//     interface DevHooks { bonfire(id: string): void }
//   }
//   registerDevHooks('bonfire', ({ game }) => ({ bonfire: (id) => { ... } }));
//
// `*.dev.ts` は開発用のつなぎなので、例外的に game / render / input の型を import してよい（type import のみ）。
import type { Game } from './game/game';
import type { InputSystem } from './input';
import type { PlayerView } from './render/playerView';
import type { GameView } from './render/gameView';

/** フックの組み立てに使える、main.ts が持つオブジェクト。 */
export interface DevContext {
  readonly game: Game;
  readonly view: GameView;
  readonly input: InputSystem;
  /** プレイヤーの描画（読み込み失敗・showcase では undefined）。 */
  readonly playerView: () => PlayerView | undefined;
  /** メインループのシミュレーション進行を止める / 再開する。 */
  readonly setPaused: (paused: boolean) => void;
}

/** `window.__game.dev` の型。各 `*.dev.ts` が宣言マージでメンバーを足す。 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DevHooks {}

type DevHookFactory = (ctx: DevContext) => Partial<DevHooks>;

const hookFactories: { name: string; factory: DevHookFactory }[] = [];
const showcaseParams = new Set<string>();

/** デバッグフックを登録する。`name` は識別用（重複登録はエラー）。 */
export function registerDevHooks(name: string, factory: DevHookFactory): void {
  if (hookFactories.some((h) => h.name === name)) {
    throw new Error(`dev hooks "${name}" already registered`);
  }
  hookFactories.push({ name, factory });
}

/** 登録済みのフックを 1 つのオブジェクトにまとめる（main.ts が `window.__game.dev` に使う）。 */
export function createDevHooks(ctx: DevContext): DevHooks {
  const dev: Partial<DevHooks> = {};
  for (const { factory } of hookFactories) Object.assign(dev, factory(ctx));
  return dev as DevHooks;
}

/** showcase（キャラクター確認表示）を起動する URL パラメータ名を登録する。 */
export function registerShowcaseParams(...keys: string[]): void {
  for (const k of keys) showcaseParams.add(k);
}

/** 登録済みの showcase 用パラメータが URL にあるか。 */
export function isShowcaseRequested(search: string): boolean {
  const params = new URLSearchParams(search);
  return [...showcaseParams].some((k) => params.has(k));
}

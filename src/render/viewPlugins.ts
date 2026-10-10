// 描画側の機能（HUD 以外のシーン表示：篝火の炎・ボスの演出など）の登録口。
//
// 新しい描画機能は `src/render/<feature>/<feature>.view.ts` を作り、`registerViewPlugin` を呼ぶだけでよい。
// `src/render/**/*.view.ts` は gameView.ts が自動で読み込む（gameView.ts / main.ts を編集しない）。
//
//   registerViewPlugin('bonfire', ({ view, game }) => {
//     const root = new Group();
//     view.scene.add(root);
//     game.events.on('hitStop', ...);          // game のイベント購読もここで行う
//     return {
//       load: async () => { /* アセット読み込み。失敗してもゲームは続行する */ },
//       update: (dt) => { /* 毎フレーム（dt は秒） */ },
//     };
//   });
//
// このファイルから `GameView` の実体を import しない（循環参照を避けるため type import のみ）。
import type { Game } from '../game/game';
import type { Level } from '../game/world/level';
import type { GameRenderer } from './renderer';
import type { GameView } from './gameView';

export interface ViewPluginContext {
  readonly game: Game;
  readonly view: GameView;
  readonly gameRenderer: GameRenderer;
  /** レベルを描いているときだけ（`?scene=test` では undefined）。 */
  readonly level: Level | undefined;
}

export interface ViewPlugin {
  /** 起動時の非同期読み込み（main.ts が `view.loadPlugins()` で待つ。失敗は握りつぶしてログに出す）。 */
  load?(): Promise<void>;
  /** 毎フレーム、描画の直前（パーティクル・予告の更新後）に呼ばれる。`dt` は直前フレームからの秒数。 */
  update?(dt: number): void;
}

export type ViewPluginFactory = (ctx: ViewPluginContext) => ViewPlugin;

const factories: { id: string; create: ViewPluginFactory }[] = [];

/** 描画機能を登録する。`id` の重複はエラー。 */
export function registerViewPlugin(id: string, create: ViewPluginFactory): void {
  if (factories.some((f) => f.id === id)) throw new Error(`view plugin "${id}" already registered`);
  factories.push({ id, create });
}

/** 登録済みの描画機能を生成する（GameView のコンストラクタが呼ぶ）。 */
export function createViewPlugins(ctx: ViewPluginContext): readonly ViewPlugin[] {
  return factories.map((f) => f.create(ctx));
}

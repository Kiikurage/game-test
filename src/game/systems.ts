// ゲームシステム（篝火・ボス・ロールなど、Game に組み込む機能）の登録口。
//
// 新しい機能は `src/game/<feature>/<feature>.system.ts` を作り、`registerGameSystem` を呼ぶだけでよい。
// `src/game/**/*.system.ts` は game.ts が自動で読み込む（game.ts を編集しない）。
//
//   registerGameSystem('bonfire', (game) => ({
//     update: (dt) => { ... },          // 毎ステップ（プレイヤー・敵の更新後、判定の解決前）
//     onHit: (e) => { ... },            // 命中のたび（反応・ヒットストップなどの標準処理の後）
//   }));
//
// システムは `Game` のインスタンスごとに作る（ファクトリが `Game` を受け取る）。生成順は登録順（ファイル名順）。
// このファイルから `Game` の実体を import しない（循環参照を避けるため type import のみ）。
import type { HitEvent } from './combat';
import type { Game } from './game';

export interface GameSystem {
  /** 毎ステップ、プレイヤー・敵の更新と被弾側の同期の後、`combat.step()` の前に呼ばれる。 */
  update?(dt: number): void;
  /** 命中のたびに、標準の処理（強靭度・敵への反映・ヒットストップ・SE）の後に呼ばれる。 */
  onHit?(e: HitEvent): void;
}

export type GameSystemFactory = (game: Game) => GameSystem;

const factories: { id: string; create: GameSystemFactory }[] = [];

/** システムを登録する。`id` の重複はエラー。 */
export function registerGameSystem(id: string, create: GameSystemFactory): void {
  if (factories.some((f) => f.id === id)) throw new Error(`game system "${id}" already registered`);
  factories.push({ id, create });
}

/** 登録済みのシステムを `game` 用に生成する（Game のコンストラクタが呼ぶ）。 */
export function createGameSystems(game: Game): readonly GameSystem[] {
  return factories.map((f) => f.create(game));
}

import { Game } from '../game';
import { ASHEN_FOUNDATION } from '../world/ashenFoundation';
import { createLevel, levelGameOptions, type EnemySpawn, type Level } from '../world/level';
import { FakeInput } from './fakeInput';

/** シミュレーションの固定ステップ（60Hz）。 */
export const HEADLESS_DT = 1 / 60;

export interface HeadlessGameOptions {
  /** 敵の配置。省略時はレベルデータどおり。`[]` で敵なし。 */
  readonly enemies?: readonly EnemySpawn[];
  /** プレイヤーの開始位置と向き（ヨー）。省略時はレベルの開始位置。 */
  readonly at?: { readonly x: number; readonly z: number; readonly yaw?: number };
}

export interface HeadlessGame {
  readonly game: Game;
  readonly input: FakeInput;
  readonly level: Level;
  /** `steps` ステップ進める（各ステップの後に入力の押下・離上を消す）。 */
  readonly run: (steps: number) => void;
}

let cachedLevel: Level | undefined;

/**
 * 実レベル「灰の礎」をブラウザ無し（Node / Vitest）で動かす。描画・DOM・three/webgpu に依存しない。
 * 本番（main.ts）と同じく `levelGameOptions` と円柱コライダを使い、入力は `FakeInput`。
 */
export async function createHeadlessGame(options: HeadlessGameOptions = {}): Promise<HeadlessGame> {
  cachedLevel ??= createLevel(ASHEN_FOUNDATION);
  const level = cachedLevel;
  const input = new FakeInput();
  const base = levelGameOptions(level);
  const at = options.at;
  const game = await Game.create({
    input,
    ...base,
    ...(options.enemies && { enemies: options.enemies }),
    ...(at && { spawn: { x: at.x, z: at.z, yaw: at.yaw ?? base.spawn.yaw } }),
  });
  game.addStaticCylinders(level.cylinders);
  return {
    game,
    input,
    level,
    run: (steps: number): void => {
      for (let i = 0; i < steps; i++) {
        game.update(HEADLESS_DT);
        input.endStep();
      }
    },
  };
}

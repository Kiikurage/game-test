import type { Action } from '../../core/input';
import { SaveStore, type KeyValueStorage } from '../../core/persistence';
import { createDevHooks, type DevContext, type DevHooks } from '../../devHooks';
import { simDebugState, type SimDebugState } from '../debug/stats.system';
import { Game } from '../game';
import { ASHEN_FOUNDATION } from '../world/ashenFoundation';
import { createLevel, levelGameOptions, type EnemySpawn, type Level } from '../world/level';
import { FakeInput } from './fakeInput';

// game 側の開発フック（`window.__game.dev` のうち game だけに依存するもの）を読み込む。
// E2E から移したテストが同じフック（teleport / bonfire() / fogGate() など）をそのまま使えるようにする。
import.meta.glob('../**/*.dev.ts', { eager: true });

/** シミュレーションの固定ステップ（60Hz）。 */
export const HEADLESS_DT = 1 / 60;

export interface HeadlessGameOptions {
  /** 敵の配置。省略時はレベルデータどおり。`[]` で敵なし。 */
  readonly enemies?: readonly EnemySpawn[];
  /** プレイヤーの開始位置と向き（ヨー）。省略時はレベルの開始位置。 */
  readonly at?: { readonly x: number; readonly z: number; readonly yaw?: number };
  /**
   * セーブの保存先（本番の localStorage の代わり）。同じ `MemoryStorage` を渡して作り直すと「再読み込み」になる。
   * 省略時は保存しない（`SaveStore(null)`）。
   */
  readonly storage?: KeyValueStorage;
}

export interface HeadlessGame {
  readonly game: Game;
  readonly input: FakeInput;
  readonly level: Level;
  /** `steps` ステップ進める（各ステップの後に入力の押下・離上を消す）。 */
  readonly run: (steps: number) => void;
  /**
   * game 側の開発フック（E2E の `window.__game.dev` のうち `src/game/**\/*.dev.ts` の分）。
   * 描画・入力デバイス・ループのフック（`advance` など）は無い。進めるのは `run`。
   */
  readonly dev: DevHooks;
  /** E2E の `window.__game.sim` と同じ状態のスナップショット。 */
  readonly sim: () => SimDebugState;
}

let cachedLevel: Level | undefined;

const unavailable = (what: string) =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(`${what} is not available in the headless game`);
      },
    },
  );

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
    ...(options.storage && { save: new SaveStore(options.storage) }),
    ...(options.enemies && { enemies: options.enemies }),
    ...(at && { spawn: { x: at.x, z: at.z, yaw: at.yaw ?? base.spawn.yaw } }),
  });
  game.addStaticCylinders(level.cylinders);
  // 一部のフックは起動 URL（`?boss` など）を読む。Node には location が無いので、クエリなしとして扱う
  (globalThis as { location?: { search: string } }).location ??= { search: '' };
  const dev = createDevHooks({
    game,
    view: unavailable('view'),
    input: unavailable('input'),
    playerView: () => undefined,
    loop: unavailable('loop'),
    start: () => Promise.reject(new Error('start is not available in the headless game')),
  } as DevContext);
  return {
    game,
    input,
    level,
    dev,
    sim: () => simDebugState(game),
    run: (steps: number): void => {
      for (let i = 0; i < steps; i++) {
        game.update(HEADLESS_DT);
        input.endStep();
      }
    },
  };
}

/**
 * 前進の入力だけで経由点を順に歩く（E2E の `walkThrough` と同じ手順）。各経由点の `tol` m 以内で次へ向きを変え、
 * 4 ステップごとにカメラの向きを補正する。シミュレーション時間 `maxSeconds` 秒で届かなければ失敗する。
 */
export function walkThrough(
  h: HeadlessGame,
  waypoints: readonly (readonly [number, number])[],
  tol = 0.6,
  maxSeconds = 30,
): void {
  const { game, input, run } = h;
  input.setMove(0, 1);
  try {
    for (const [wx, wz] of waypoints) {
      for (let n = 0; ; n += 4) {
        const p = game.player.feet;
        const dx = wx - p.x;
        const dz = wz - p.z;
        if (Math.hypot(dx, dz) < tol) break;
        if (n >= maxSeconds * 60)
          throw new Error(`timed out before (${wx}, ${wz}) at ${JSON.stringify(p)}`);
        const want = Math.atan2(dx, dz);
        const yaw = game.camera.yaw;
        const diff = Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw));
        if (Math.abs(diff) > 0.04) h.dev.view(want - game.player.yaw, 4.2, 15);
        run(4);
      }
    }
  } finally {
    input.setMove(0, 0);
  }
}

/** ボタンの短押し（E2E の `tapKey`）: 1 ステップ押して離す。 */
export function tap(h: HeadlessGame, action: Action): void {
  h.input.press(action);
  h.run(1);
  h.input.release(action);
  h.run(1);
}

/** `read()` が `ok` を満たすまで `chunk` ステップずつ進める（E2E の `stepUntil` と同じ）。満たした値を返す。 */
export function stepUntil<T>(
  h: HeadlessGame,
  read: () => T,
  ok: (value: T) => boolean,
  { maxSteps = 600, chunk = 5 }: { maxSteps?: number; chunk?: number } = {},
): T {
  let value = read();
  for (let n = 0; !ok(value); n += chunk) {
    if (n >= maxSteps)
      throw new Error(`condition not met within ${maxSteps} steps: ${JSON.stringify(value)}`);
    h.run(chunk);
    value = read();
  }
  return value;
}

/** E2E の `bootGame` と同じく、着地するまで進める（最大 10 秒分）。`at` があればそこへ置く。 */
export function settle(
  h: HeadlessGame,
  at?: { readonly x: number; readonly z: number; readonly yaw?: number; readonly y?: number },
): void {
  h.run(30);
  for (let i = 0; i < 600 && !h.game.player.grounded; i++) h.run(1);
  if (!h.game.player.grounded) throw new Error('the player did not land after spawning');
  if (at) {
    h.game.teleportPlayer(at.x, at.z, at.yaw ?? 0, at.y);
    h.run(1);
  }
}

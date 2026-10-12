import type { InputReader, InputSnapshot } from '../core/input';
import type { SaveGateway } from '../core/persistence';
import type { Navigator } from './enemy/navigation';
import type { EnemySpawn, InteractableSpawn } from './world/level';
import type { BoxSpec, DummySpec } from './world/playground';

/** 何も入力しない InputReader（入力システムなしで Game を作るテスト・起動時用）。 */
export const NULL_INPUT: InputReader = (() => {
  const idle = { pressed: false, held: false, released: false };
  const snapshot: InputSnapshot = {
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    sprint: false,
    targetSwitch: 0,
    buttons: {
      lightAttack: idle,
      heavyAttack: idle,
      dodge: idle,
      guard: idle,
      lockOn: idle,
      item: idle,
      interact: idle,
    },
    device: 'kbm',
  };
  return {
    snapshot,
    consumeBuffered: () => false,
    hasBuffered: () => false,
    clearBuffer: () => undefined,
  };
})();

/** 地形の衝突メッシュ（描画と同じ頂点から作ると見た目と当たりが一致する）。 */
export interface TerrainCollisionMesh {
  readonly vertices: Float32Array;
  readonly indices: Uint32Array;
}

export interface GameOptions {
  /** ゲームロジックが読む入力。省略時は何も入力されない。 */
  readonly input?: InputReader;
  /** 地形の衝突メッシュ。省略時は y=0 の平らな地面（半径 100m）。 */
  readonly terrain?: TerrainCollisionMesh;
  /** 地形の高さ関数（ダミーの接地位置に使う）。省略時は 0。 */
  readonly terrainHeight?: (x: number, z: number) => number;
  /** 静的な箱（壁・段差など）。省略時はテストシーンの足場。レベルデータ（`world/level.ts`）はここへ渡す。 */
  readonly boxes?: readonly BoxSpec[];
  /** ロックオン用のダミー。省略時はテストシーンのダミー（レベルでは空配列を渡す）。 */
  readonly dummies?: readonly DummySpec[];
  /** 敵の配置（レベルデータの `enemies`）。省略時は敵なし。 */
  readonly enemies?: readonly EnemySpawn[];
  /** 敵の経路問い合わせ。省略時は直線。レベルでは `levelGameOptions` が格子ナビゲータを渡す。 */
  readonly enemyNavigator?: Navigator;
  /** 暗所か（敵の視覚ゲージ ×0.7）。レベルでは `levelGameOptions` が渡す。省略時は常に明所。 */
  readonly enemyDarkness?: (x: number, z: number) => boolean;
  /** 音の発生位置での聴覚半径の倍率（反響ゾーン ×1.3）。省略時は 1。 */
  readonly hearingScale?: (x: number, y: number, z: number) => number;
  /** 調べる対象の配置（レベルデータの `interactables`。篝火など）。省略時はなし。登録式のシステムが読む。 */
  readonly interactables?: readonly InteractableSpawn[];
  /** セーブ（篝火の点火・休憩の保存先）。省略時はメモリのみ（保存されない）。本番は main.ts が `SaveStore` を渡す。 */
  readonly save?: SaveGateway;
  /** プレイヤーの開始位置と向き（ヨー）。省略時はテストシーンの広場。 */
  readonly spawn?: { readonly x: number; readonly z: number; readonly yaw: number };
}

/** 静的な円柱（柱・岩など）の衝突。`y` は底面の高さ。 */
export interface StaticCylinderSpec {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
  /** XYZ オイラー角（ラジアン）。指定すると倒れた柱として扱い、`y` は中心の高さになる。 */
  readonly euler?: readonly [number, number, number];
}

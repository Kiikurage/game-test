// インタラクトの動作が出すゲームイベント（#123）。`core/gameEvents.ts` の `GameEventMap` へ宣言マージで足す
// （共有ファイルを編集しない）。音は既存の `sound`（cue 名）で出す。

declare module '../../core/gameEvents' {
  interface GameEventMap {
    /**
     * 祈り（`ambientDuck` Effect）: 環境音を `frames` かけて `db` だけ下げる（音側が購読する）。
     * 風と灰の粒が増える（描画側が `ashIntensity`（0..1）を粒の量に使う）。
     */
    ambientDuck: {
      readonly db: number;
      readonly frames: number;
      readonly ashIntensity: number;
    };
    /** 壊せる壁が崩れ始めた（`frames` の演出。描画は破片・粉塵・壁の消去、音は崩落音）。 */
    wallCollapse: {
      readonly id: string;
      readonly position: { readonly x: number; readonly y: number; readonly z: number };
      readonly frames: number;
    };
    /** 腐った床板が割れた（踏んだ。水路の状態・コライダが購読する）。 */
    floorHatchBroken: {
      readonly id: string;
      readonly colliderId?: string;
      readonly position: { readonly x: number; readonly y: number; readonly z: number };
    };
  }
}

export {};

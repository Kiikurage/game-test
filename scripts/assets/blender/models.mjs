// Blender で生成するモデルの一覧（scripts/assets/build-blender.mjs が読む）。
//
// 1 モデル = assets-src/blender/<name>.py の build(ctx) が作るメッシュ（複数可）。
// 各メッシュは glb 上で「<オブジェクト名>」ノード（extras.lodDistances）の子に
// 「<オブジェクト名>_LOD0..n」を持つ形で出る。LOD0 は Blender の出力そのまま。
//   ratio    LOD0 に対する目標のインデックス比（meshoptimizer の simplify）
//   error    許容誤差（メッシュの大きさに対する比）
//   distance このレベルに切り替えるカメラ距離（m。three の LOD.addLevel に渡す）
/** @type {readonly { name: string; seed: number; lods: readonly { ratio: number; error: number; distance: number }[] }[]} */
export const BLENDER_MODELS = [
  {
    name: 'broken_column',
    seed: 327,
    lods: [
      { ratio: 1, error: 0, distance: 0 },
      { ratio: 0.25, error: 0.005, distance: 12 },
      { ratio: 0.06, error: 0.02, distance: 35 },
    ],
  },
];

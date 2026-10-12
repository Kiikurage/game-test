// Blender で生成するモデルの一覧（scripts/assets/build-blender.mjs が読む）。
//
// 1 モデル = assets-src/blender/<name>.py の build(ctx) が作るメッシュ（複数可）。
// 各メッシュは glb 上で「<オブジェクト名>」ノード（extras.lodDistances）の子に
// 「<オブジェクト名>_LOD0..n」を持つ形で出る。LOD0 は Blender の出力そのまま。
//   ratio    LOD0 に対する目標のインデックス比（meshoptimizer の simplify）
//   error    許容誤差（メッシュの大きさに対する比）
//   distance このレベルに切り替えるカメラ距離（m。three の LOD.addLevel に渡す）
//   script   モデルスクリプト名（省略時は name。assets-src/blender/<script>.py）
//   input    入力の名前。Node 側が src/render/levelMeshes/levelMeshes.bake.ts の bakeLevelMeshes(input)
//            で作った JSON のパスをモデルスクリプトに ctx["input"] で渡す（#329 のレベル形状）
//
// レベル形状（level_*）は面がレベル全体に散らばった結合メッシュなので、距離での LOD は持たない（1 段）。
const SINGLE_LOD = [{ ratio: 1, error: 0, distance: 0 }];

/** @type {readonly { name: string; script?: string; input?: string; seed: number; lods: readonly { ratio: number; error: number; distance: number }[] }[]} */
export const BLENDER_MODELS = [
  { name: 'level_crypt', script: 'level_meshes', input: 'crypt', seed: 1, lods: SINGLE_LOD },
  { name: 'level_arena', script: 'level_meshes', input: 'arena', seed: 1, lods: SINGLE_LOD },
  { name: 'level_waterway', script: 'level_meshes', input: 'waterway', seed: 1, lods: SINGLE_LOD },
  // assets-src/blender/broken_column.py（#327 のサンプル。LOD 3 段）はゲームで使わないので配信しない（#329）。
  // 試すときは次の項目をここへ戻して `npm run assets:blender -- broken_column`:
  //   { name: 'broken_column', seed: 327, lods: [
  //     { ratio: 1, error: 0, distance: 0 }, { ratio: 0.25, error: 0.005, distance: 12 },
  //     { ratio: 0.06, error: 0.02, distance: 35 } ] },
];

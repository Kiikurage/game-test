import type { Object3D } from 'three/webgpu';
import { arenaOf } from '../../game/world/arena';
import { ASHEN_FOUNDATION } from '../../game/world/ashenFoundation';
import { createLevel } from '../../game/world/level';
import { buildArenaScene } from '../arena/arenaScene';
import { buildCryptScene } from '../masonry/buildCrypt';
import { buildWaterShellScene } from '../waterway/waterShell';
import { serializeBakedScene } from './bakedScene';

// ベイク時の入口（#329）。scripts/assets/build-blender.mjs が vite の runnerImport で読み、
// models.mjs の `input` の名前ごとに形状の木を JSON にして Blender（assets-src/blender/level_meshes.py）へ渡す。
// blenderModels.test.ts も同じ関数で入力のハッシュを取り、レベルや生成コードの変更で glb が古くなっていないか検査する。

const BAKES: Record<string, () => Object3D> = {
  crypt: () => buildCryptScene(createLevel(ASHEN_FOUNDATION)),
  arena: () => {
    const level = createLevel(ASHEN_FOUNDATION);
    const def = arenaOf(level);
    if (!def) throw new Error('level has no arena');
    return buildArenaScene(level, def);
  },
  waterway: () => {
    const level = createLevel(ASHEN_FOUNDATION);
    const way = level.data.waterways?.[0];
    if (!way) throw new Error('level has no waterway');
    return buildWaterShellScene(level, way);
  },
};

/** `name`（models.mjs の `input`）の形状の木。 */
export function bakeScene(name: string): Object3D {
  const bake = BAKES[name];
  if (!bake) throw new Error(`unknown level mesh bake: ${name}`);
  return bake();
}

/** `name` の形状の木を Blender へ渡す JSON にする。 */
export function bakeLevelMeshes(name: string): string {
  return serializeBakedScene(bakeScene(name));
}

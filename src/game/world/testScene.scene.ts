import { registerScene, type SceneSetup } from '../scenes';
import { COMBAT_DEBUG_ENEMIES } from './combatDebug';
import type { EnemySpawn } from './level';
import { terrainHeight } from './terrain';
import { createTestTerrainCollisionMesh, testSceneColliders } from './testScene';

function testScene(enemies?: readonly EnemySpawn[]): SceneSetup {
  return {
    level: null,
    options: {
      terrain: createTestTerrainCollisionMesh(),
      terrainHeight,
      ...(enemies && { enemies }),
    },
    cylinders: testSceneColliders(),
  };
}

/** `?scene=test`: 従来のテストシーン（雰囲気確認用）。 */
registerScene('test', () => testScene());
/** `?scene=combat`: テストシーンに亡者兵 1 体を置いた戦闘デバッグシーン（`?debug` で UI。combat/combatTool.*）。 */
registerScene('combat', () => testScene(COMBAT_DEBUG_ENEMIES));
/** `?scene=boss`: テストシーンにボスだけを置いた回避検証シーン（`?debug` で UI。boss/bossDebug.*）。 */
registerScene('boss', () => testScene());

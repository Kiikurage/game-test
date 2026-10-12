import { describe, expect, it } from 'vitest';
import { createScene, registeredSceneIds, resolveSceneId } from './scenes';
import './world/ashenFoundation.scene';
import './world/testScene.scene';
import { COMBAT_DEBUG_ENEMIES } from './world/combatDebug';

describe('scenes', () => {
  it('registers the level and the test scenes', () => {
    expect([...registeredSceneIds()].sort()).toEqual([
      'ashen-foundation',
      'boss',
      'combat',
      'test',
    ]);
  });

  it('resolves ?scene= and falls back to the default', () => {
    expect(resolveSceneId('')).toBe('ashen-foundation');
    expect(resolveSceneId('?scene=unknown')).toBe('ashen-foundation');
    expect(resolveSceneId('?quality=low&scene=boss')).toBe('boss');
  });

  it('builds the test scenes without a level', () => {
    const combat = createScene('?scene=combat');
    expect(combat.level).toBeNull();
    expect(combat.options.enemies).toBe(COMBAT_DEBUG_ENEMIES);
    expect(combat.cylinders.length).toBeGreaterThan(0);
    expect(createScene('?scene=test').options.enemies).toBeUndefined();
  });

  it('builds the level scene', () => {
    const scene = createScene('');
    expect(scene.level?.data.id).toBe('ashen-foundation');
    expect(scene.options.enemies).toBe(scene.level?.data.enemies);
    expect(scene.cylinders).toBe(scene.level?.cylinders);
  });
});

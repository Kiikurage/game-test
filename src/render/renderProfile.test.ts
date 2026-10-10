import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
} from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { SHADOW_PROXY_LAYER } from './layers';
import { formatProfile, profileScene, totalProfile } from './renderProfile';

const material = new MeshBasicMaterial();
const BOX_TRIANGLES = 12;

function sceneWithCamera(): {
  scene: Scene;
  camera: PerspectiveCamera;
  shadow: OrthographicCamera;
} {
  const scene = new Scene();
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const shadow = new OrthographicCamera(-20, 20, 20, -20, 0.1, 100);
  shadow.position.set(0, 20, 0);
  shadow.lookAt(0, 0, 0);
  shadow.layers.enable(SHADOW_PROXY_LAYER);
  shadow.updateMatrixWorld();
  return { scene, camera, shadow };
}

describe('profileScene', () => {
  it('counts visible meshes in the main pass and casters in the shadow pass', () => {
    const { scene, camera, shadow } = sceneWithCamera();
    const ground = new Mesh(new BoxGeometry(), material);
    ground.name = 'ground';
    const caster = new Mesh(new BoxGeometry(), material);
    caster.castShadow = true;
    scene.add(ground, caster);
    const p = profileScene(scene, camera, shadow);
    expect(p.terrain).toMatchObject({ draws: 1, tris: BOX_TRIANGLES, shadowDraws: 0 });
    expect(p.other).toMatchObject({ draws: 1, shadowDraws: 1, shadowTris: BOX_TRIANGLES });
  });

  it('skips invisible meshes and meshes outside the frustum', () => {
    const { scene, camera, shadow } = sceneWithCamera();
    const hidden = new Mesh(new BoxGeometry(), material);
    hidden.visible = false;
    const behind = new Mesh(new BoxGeometry(), material);
    behind.position.set(0, 0, 50);
    scene.add(hidden, behind);
    expect(totalProfile(profileScene(scene, camera, shadow))).toEqual({ draws: 0, tris: 0 });
  });

  it('respects layers: shadow-proxy meshes are drawn only by the shadow pass', () => {
    const { scene, camera, shadow } = sceneWithCamera();
    const proxy = new Mesh(new BoxGeometry(), material);
    proxy.castShadow = true;
    proxy.layers.set(SHADOW_PROXY_LAYER);
    scene.add(proxy);
    const p = profileScene(scene, camera, shadow);
    expect(p.other).toMatchObject({ draws: 0, shadowDraws: 1 });
  });

  it('multiplies instanced meshes by their instance count and uses name prefixes for categories', () => {
    const { scene, camera, shadow } = sceneWithCamera();
    const grass = new InstancedMesh(new BoxGeometry(), material, 5);
    grass.name = 'grass:A';
    for (let i = 0; i < 5; i++) grass.setMatrixAt(i, new Matrix4());
    grass.frustumCulled = false;
    const env = new Mesh(new BoxGeometry(), material);
    env.name = 'env:0,0:soft';
    scene.add(grass, env);
    const p = profileScene(scene, camera, shadow);
    expect(p.grass).toMatchObject({ draws: 1, tris: BOX_TRIANGLES * 5 });
    expect(p.environment.draws).toBe(1);
  });
});

describe('formatProfile', () => {
  it('prints one line per non-empty category', () => {
    const { scene, camera, shadow } = sceneWithCamera();
    const ground = new Mesh(new BoxGeometry(), material);
    ground.name = 'ground';
    scene.add(ground);
    const lines = formatProfile(profileScene(scene, camera, shadow));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('terrain');
  });
});

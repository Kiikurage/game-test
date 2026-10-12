import { describe, expect, it } from 'vitest';
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
} from 'three/webgpu';
import { REFLECT_LAYER, SHADOW_PROXY_LAYER } from './layers';
import type { ParticleSystem } from './particles';
import { createViewServices } from './viewServices';

function setup() {
  const scene = new Scene();
  const services = createViewServices({ scene, particles: {} as ParticleSystem });
  return { scene, services };
}

describe('createViewServices', () => {
  it('registers local lights on the scene, visible to the reflection', () => {
    const { scene, services } = setup();
    const l = services.lights.add({
      position: [1, 2, 3],
      color: 0xffffff,
      intensity: 2,
      distance: 5,
    });
    expect(l.light.parent?.parent).toBe(scene);
    expect(l.light.layers.isEnabled(REFLECT_LAYER)).toBe(true);
    expect(createViewServices({ scene, particles: {} as ParticleSystem }).lights).toBe(
      services.lights,
    );
  });

  it('reflectMeshesIn skips shadow-only meshes', () => {
    const { services } = setup();
    const root = new Group();
    const main = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    const proxy = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    proxy.layers.set(SHADOW_PROXY_LAYER);
    root.add(main, proxy);
    services.layers.reflectMeshesIn(root);
    expect(main.layers.isEnabled(0) && main.layers.isEnabled(REFLECT_LAYER)).toBe(true);
    expect(proxy.layers.isEnabled(REFLECT_LAYER)).toBe(false);
  });

  it('setupReflectionCamera sees only the reflect layer and lights every scene light', () => {
    const { services } = setup();
    const l = services.lights.add({
      position: [0, 0, 0],
      color: 0xffffff,
      intensity: 1,
      distance: 3,
    });
    l.light.layers.set(0);
    const cam = new PerspectiveCamera();
    services.layers.setupReflectionCamera(cam);
    expect(cam.layers.isEnabled(0)).toBe(false);
    expect(cam.layers.isEnabled(REFLECT_LAYER)).toBe(true);
    expect(l.light.layers.isEnabled(REFLECT_LAYER)).toBe(true);
  });
});

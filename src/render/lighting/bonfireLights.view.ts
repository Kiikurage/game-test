import { registerViewPlugin } from '../viewPlugins';
import { MAX_BONFIRES } from '../particles';
import type { LocalLight } from './localLights';

/**
 * 篝火の光（#322）。篝火のスロットごとに点光源を 1 つ持ち、灯っている篝火をすべて照らす
 * （以前はプレイヤーに最も近い 1 つだけ）。光の組を変えないよう、スロット数ぶんを起動時に登録し、消灯は強さ 0。
 */
registerViewPlugin('bonfire-lights', ({ gameRenderer, services }) => {
  if (!gameRenderer.quality.preset.particles.bonfireLight) return {};
  const { lights: registry, fx } = services;
  const lights: LocalLight[] = [];
  for (let i = 0; i < MAX_BONFIRES; i++) {
    lights.push(
      registry.add({ position: [0, -1000, 0], color: 0xff8a3c, intensity: 0, distance: 14 }),
    );
  }
  return {
    update: () => {
      const slots = fx.bonfireSlots;
      const t = fx.elapsed;
      lights.forEach((light, i) => {
        const b = slots[i] ?? null;
        if (!b || b.litAmount <= 0.001) {
          light.intensity = 0;
          return;
        }
        light.setPosition(b.position.x, b.position.y + 0.9, b.position.z);
        light.intensity = b.lightIntensity(t);
      });
    },
  };
});

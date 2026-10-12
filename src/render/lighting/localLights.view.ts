import { Color } from 'three/webgpu';
import { registerViewPlugin } from '../viewPlugins';
import { MAX_CLUSTERED_LIGHTS } from './clusteredLighting';
import { localLightsOf } from './localLights';

/** `?lightstress=N` の光を敷く範囲（篝火原点の m。広場〜闘技場）。 */
const STRESS_AREA = { minX: -10, maxX: 130, minZ: -10, maxZ: 95 } as const;

/**
 * 局所光源のゆらぎを毎フレーム進める（光の登録は各 view が `localLightsOf(view.scene).add` で行う）。
 * `?lightstress=N`: 計測用に N 個の点光源（届く距離 8m）を格子状に敷く（`npm run perf -- high '&lightstress=200'`）。
 */
registerViewPlugin('local-lights', ({ view, level }) => {
  const lights = localLightsOf(view.scene);
  const stress = Number(new URLSearchParams(location.search).get('lightstress') ?? 0);
  if (stress > 0) {
    const n = Math.min(Math.floor(stress), MAX_CLUSTERED_LIGHTS - lights.count - 32);
    const w = STRESS_AREA.maxX - STRESS_AREA.minX;
    const h = STRESS_AREA.maxZ - STRESS_AREA.minZ;
    const cols = Math.max(1, Math.round(Math.sqrt((n * w) / h)));
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const x = STRESS_AREA.minX + ((i % cols) + 0.5) * (w / cols);
      const z = STRESS_AREA.minZ + (Math.floor(i / cols) + 0.5) * (h / rows);
      lights.add({
        position: [x, (level?.heightAt(x, z) ?? 0) + 1.5, z],
        color: new Color().setHSL((i * 0.137) % 1, 0.7, 0.5),
        intensity: 6,
        distance: 8,
        flickerPhase: i,
      });
    }
  }
  let time = 0;
  return {
    update: (dt) => {
      time += Math.min(Math.max(dt, 0), 0.1);
      lights.update(time);
    },
  };
});

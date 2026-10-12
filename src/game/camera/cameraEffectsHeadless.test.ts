import { describe, expect, it } from 'vitest';
import { createHeadlessGame, settle } from '../testing/headlessGame';

/** カメラ演出を実レベルで通す（E2E の cameraEffects から移した）。被弾は `dev.hitPlayer` で本物の命中経路に流す。 */
describe('camera effects on the level', () => {
  it('被弾でカメラが振動し、強度 OFF では振動しない', async () => {
    const h = await createHeadlessGame({ enemies: [] });
    settle(h);
    h.game.teleportPlayer(6, 6, 0);
    h.run(5);
    h.dev.cameraFxResetPeaks();
    h.dev.hitPlayer({ from: 'front' });
    h.run(20);
    const hit = h.dev.cameraFx();
    expect(hit.peak.shakeDeg).toBeGreaterThanOrEqual(0.3 - 1e-6);
    expect(hit.output.shakeDeg).toBe(0); // 6F で止まっている

    h.dev.cameraFxStrength(0);
    h.dev.cameraFxResetPeaks();
    h.dev.cameraFxPlay('hitHeavy');
    h.run(20);
    const off = h.dev.cameraFx();
    expect(off.strength).toBe(0);
    expect(off.peak.shakeDeg).toBe(0);
    expect(off.peak.fovOffsetDeg).toBe(0);
  });

  it('フェーズ移行クリップで FOV が動き、終われば戻る', async () => {
    const h = await createHeadlessGame({ enemies: [] });
    settle(h);
    h.dev.cameraFxResetPeaks();
    h.dev.cameraFxPlay('phase');
    h.run(140);
    const after = h.dev.cameraFx();
    expect(after.clips).toEqual([]);
    expect(after.peak.fovOffsetDeg).toBeCloseTo(6, 3);
    expect(after.peak.shakeDeg).toBeGreaterThan(0.5);
    expect(after.output.fovOffsetDeg).toBe(0);
  });
});

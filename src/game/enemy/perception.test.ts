import { describe, expect, it } from 'vitest';
import { ENEMY_VISION, NOISE_RADIUS } from '../data';
import {
  NoiseField,
  angleScale,
  bearing,
  distanceRate,
  hearingGainPerSecond,
  inVisionCone,
  loudestAudible,
  motionNoise,
  playerMotion,
  visualGainPerSecond,
} from './perception';

describe('vision', () => {
  it('uses range 14m and horizontal FOV 140 degrees (+-70)', () => {
    expect(inVisionCone(14, 0)).toBe(true);
    expect(inVisionCone(14.01, 0)).toBe(false);
    expect(inVisionCone(5, 70)).toBe(true);
    expect(inVisionCone(5, 70.5)).toBe(false);
    expect(inVisionCone(5, 180)).toBe(false);
  });

  it('measures distance and angle from the enemy facing (yaw: forward = (sin, cos))', () => {
    // 正面（+z）にいる
    expect(bearing({ x: 0, z: 0 }, 0, { x: 0, z: 5 })).toEqual({ distance: 5, angleDeg: 0 });
    // 右（+x）90 度
    const right = bearing({ x: 0, z: 0 }, 0, { x: 5, z: 0 });
    expect(right.angleDeg).toBeCloseTo(90, 5);
    // 敵が +x を向いていれば、+x は正面
    expect(bearing({ x: 0, z: 0 }, Math.PI / 2, { x: 5, z: 0 }).angleDeg).toBeCloseTo(0, 5);
    // 背後
    expect(bearing({ x: 0, z: 0 }, 0, { x: 0, z: -3 }).angleDeg).toBeCloseTo(180, 5);
  });

  it('gain bands follow section 14.3.1', () => {
    expect(distanceRate(2)).toBe(240);
    expect(distanceRate(3)).toBe(240);
    expect(distanceRate(5)).toBe(120);
    expect(distanceRate(8)).toBe(120);
    expect(distanceRate(10)).toBe(40);
    expect(distanceRate(14)).toBe(40);
    expect(distanceRate(14.5)).toBe(0);
    expect(angleScale(30)).toBe(1);
    expect(angleScale(40)).toBe(1);
    expect(angleScale(60)).toBe(0.4);
    expect(angleScale(71)).toBe(0);
  });

  it('multiplies distance x angle x motion x environment, and is zero without line of sight', () => {
    const base = { distance: 5, angleDeg: 0, motion: 'run', lineOfSight: true } as const;
    expect(visualGainPerSecond(base)).toBe(120);
    expect(visualGainPerSecond({ ...base, motion: 'dash' })).toBeCloseTo(168, 5);
    expect(visualGainPerSecond({ ...base, motion: 'walk' })).toBeCloseTo(72, 5);
    expect(visualGainPerSecond({ ...base, angleDeg: 60 })).toBeCloseTo(48, 5);
    expect(visualGainPerSecond({ ...base, dark: true })).toBeCloseTo(84, 5);
    expect(visualGainPerSecond({ ...base, suspicious: true })).toBeCloseTo(180, 5);
    // 遮蔽
    expect(visualGainPerSecond({ ...base, lineOfSight: false })).toBe(0);
    expect(ENEMY_VISION.range).toBe(14);
  });
});

describe('hearing', () => {
  const ear = { x: 0, y: 1.6, z: 0 };

  it('hears a noise only inside its radius (3D distance)', () => {
    const field = new NoiseField();
    field.emit({ x: 4, y: 1.6, z: 0 }, 'walk'); // 2m
    expect(loudestAudible(field.active, ear)).toBeNull();
    field.emit({ x: 4, y: 1.6, z: 0 }, 'run'); // 5m
    expect(loudestAudible(field.active, ear)).not.toBeNull();
    field.clear();
    field.emit({ x: 7.9, y: 1.6, z: 0 }, 'dash'); // 8m
    expect(loudestAudible(field.active, ear)).not.toBeNull();
    field.clear();
    field.emit({ x: 8.1, y: 1.6, z: 0 }, 'dash');
    expect(loudestAudible(field.active, ear)).toBeNull();
    // 高さも距離に含める
    field.clear();
    field.emit({ x: 0, y: 11, z: 0 }, 'dash');
    expect(loudestAudible(field.active, ear)).toBeNull();
  });

  it('uses the radius table from the spec and scales for echo', () => {
    expect(NOISE_RADIUS).toMatchObject({ walk: 2, run: 5, dash: 8, combat: 8, bell: 15 });
    const field = new NoiseField();
    field.emit({ x: 0, y: 0, z: 0 }, 'walk', { radiusScale: 1.3 });
    expect(field.active[0]?.radius).toBeCloseTo(2.6, 5);
  });

  it('gives +120 per second while audible', () => {
    const field = new NoiseField();
    field.emit({ x: 1, y: 1.6, z: 0 }, 'walk');
    expect(hearingGainPerSecond(loudestAudible(field.active, ear))).toBe(120);
    expect(hearingGainPerSecond(null)).toBe(0);
  });

  it('expires noises after their duration', () => {
    const field = new NoiseField();
    field.emit({ x: 0, y: 0, z: 0 }, 'bell'); // 一発もの: 0.5 秒
    field.emit({ x: 0, y: 0, z: 0 }, 'walk', { duration: 1 / 60 });
    field.advance(1 / 60);
    expect(field.active).toHaveLength(1);
    for (let i = 0; i < 30; i++) field.advance(1 / 60);
    expect(field.active).toHaveLength(0);
  });
});

describe('player motion', () => {
  it('classifies dash / roll / backstep as dash, speed decides walk and run, idle is silent', () => {
    expect(playerMotion('dash', 6.5)).toBe('dash');
    expect(playerMotion('roll', 5)).toBe('dash');
    expect(playerMotion('backstep', 3)).toBe('dash');
    expect(playerMotion('move', 4.5)).toBe('run');
    expect(playerMotion('move', 1.8)).toBe('walk');
    expect(playerMotion('idle', 0)).toBe('still');
    expect(playerMotion('move', 0.1)).toBe('still');
    expect(motionNoise('still')).toBeNull();
    expect(motionNoise('walk')).toBe('walk');
    expect(motionNoise('run')).toBe('run');
    expect(motionNoise('dash')).toBe('dash');
  });
});

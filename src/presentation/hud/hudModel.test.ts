import { describe, expect, it } from 'vitest';
import { AFTERIMAGE, Afterimage } from './afterimage';
import {
  FLASK_GLOW_FRAMES,
  HUD_FADE_FRAMES,
  HudModel,
  isStaminaBlinkOn,
  shouldStartStaminaBlink,
} from './hudModel';

function run(a: Afterimage, current: number, frames: number): void {
  for (let i = 0; i < frames; i++) a.step(current);
}

describe('Afterimage', () => {
  it('has no ghost without damage', () => {
    const a = new Afterimage(1);
    run(a, 1, 10);
    expect(a.ghost).toBe(1);
  });

  it('holds the old value for 36F, then shrinks and is gone at 60F', () => {
    const a = new Afterimage(1);
    a.step(0.6); // damage frame = frame 1
    expect(a.ghost).toBe(1);
    run(a, 0.6, AFTERIMAGE.delayFrames - 1);
    expect(a.ghost).toBe(1); // still holding at 36F
    a.step(0.6);
    expect(a.ghost).toBeLessThan(1); // starts to shrink after the delay
    expect(a.ghost).toBeGreaterThan(0.6);
    run(a, 0.6, AFTERIMAGE.totalFrames - AFTERIMAGE.delayFrames - 1);
    expect(a.ghost).toBeCloseTo(0.6, 10);
  });

  it('restarts the delay on another hit while keeping the top of the ghost', () => {
    const a = new Afterimage(1);
    a.step(0.8);
    run(a, 0.8, 20);
    a.step(0.5);
    expect(a.ghost).toBe(1);
    run(a, 0.5, AFTERIMAGE.delayFrames - 1);
    expect(a.ghost).toBe(1);
    run(a, 0.5, 30);
    expect(a.ghost).toBeCloseTo(0.5, 10);
  });

  it('follows current when healing past the ghost', () => {
    const a = new Afterimage(1);
    a.step(0.4);
    a.step(1);
    expect(a.ghost).toBe(1);
  });
});

describe('stamina blink', () => {
  it('starts only on the transition to 0', () => {
    expect(shouldStartStaminaBlink(10, 0)).toBe(true);
    expect(shouldStartStaminaBlink(0, 0)).toBe(false);
    expect(shouldStartStaminaBlink(0, 5)).toBe(false);
    expect(shouldStartStaminaBlink(50, 20)).toBe(false);
  });

  it('blinks exactly twice', () => {
    const on: number[] = [];
    for (let f = 0; f < 60; f++) if (isStaminaBlinkOn(f)) on.push(f);
    const edges = on.filter((f) => !on.includes(f - 1));
    expect(edges).toEqual([0, 20]);
    expect(isStaminaBlinkOn(40)).toBe(false);
  });
});

describe('HudModel', () => {
  function make() {
    const src = {
      hp: { current: 300, max: 300 },
      stamina: { current: 100, max: 100 },
      flask: { count: 3, max: 3 },
    };
    return { src, model: new HudModel(src) };
  }

  it('tracks ratios and shows an afterimage after damage', () => {
    const { src, model } = make();
    src.hp.current = 150;
    model.step();
    expect(model.hpRatio).toBe(0.5);
    expect(model.hpGhostRatio).toBe(1);
  });

  it('blinks when stamina hits 0 and flags regeneration', () => {
    const { src, model } = make();
    src.stamina.current = 0;
    model.step();
    expect(model.staminaBlinkOn).toBe(true);
    for (let i = 0; i < 45; i++) model.step();
    expect(model.staminaBlinkOn).toBe(false);
    src.stamina.current = 0.7;
    model.step();
    expect(model.staminaRegenerating).toBe(true);
    model.step();
    expect(model.staminaRegenerating).toBe(false);
  });

  it('glows when a flask is used', () => {
    const { src, model } = make();
    model.step();
    expect(model.flaskGlow).toBe(0);
    src.flask.count = 2;
    model.step();
    expect(model.flaskGlow).toBeGreaterThan(0.9);
    for (let i = 0; i < FLASK_GLOW_FRAMES; i++) model.step();
    expect(model.flaskGlow).toBe(0);
    expect(model.flaskCount).toBe(2);
  });

  it('fades out over 30F and back in', () => {
    const { model } = make();
    model.setVisible(false);
    for (let i = 0; i < HUD_FADE_FRAMES / 2; i++) model.step();
    expect(model.opacity).toBeCloseTo(0.5, 5);
    for (let i = 0; i < HUD_FADE_FRAMES / 2; i++) model.step();
    expect(model.opacity).toBeCloseTo(0, 5);
    model.setVisible(true);
    for (let i = 0; i < HUD_FADE_FRAMES; i++) model.step();
    expect(model.opacity).toBeCloseTo(1, 5);
  });
});

import { describe, expect, it } from 'vitest';
import { EventBus, type GameEventMap } from '../../core/gameEvents';
import { BOSS_AFTERIMAGE } from './afterimage';
import { BOSS_BAR, BossBarModel } from './bossBarModel';

function make() {
  const events = new EventBus<GameEventMap>();
  const model = new BossBarModel();
  model.attach(events);
  const steps = (n: number) => {
    for (let i = 0; i < n; i++) model.step();
  };
  const engage = () => {
    events.emit('bossEngaged', {
      id: 'boss',
      hp: 2400,
      maxHp: 2400,
      phase: 1,
      boundaries: [1200],
    });
  };
  const hit = (hp: number, damage: number) => {
    events.emit('bossHpChanged', { id: 'boss', hp, maxHp: 2400, damage, phase: 1 });
  };
  return { events, model, steps, engage, hit };
}

describe('BossBarModel visibility', () => {
  it('is hidden until the boss engages, then fades in', () => {
    const { model, steps, engage } = make();
    steps(5);
    expect(model.opacity).toBe(0);
    engage();
    expect(model.visible).toBe(true);
    steps(BOSS_BAR.fadeFrames / 2);
    expect(model.opacity).toBeCloseTo(0.5, 5);
    steps(BOSS_BAR.fadeFrames);
    expect(model.opacity).toBe(1);
  });

  it.each([
    [
      'bossDefeated',
      (m: ReturnType<typeof make>) => {
        m.events.emit('bossDefeated', { id: 'boss', position: { x: 0, y: 0, z: 0 } });
      },
    ],
    [
      'bossReset',
      (m: ReturnType<typeof make>) => {
        m.events.emit('bossReset', { id: 'boss', cause: 'rest', hp: 2400, maxHp: 2400 });
      },
    ],
    [
      'death start',
      (m: ReturnType<typeof make>) => {
        m.events.emit('death', {
          phase: 'start',
          frame: 0,
          skipped: false,
          position: { x: 0, y: 0, z: 0 },
        });
      },
    ],
  ])('fades out on %s', (_name, emit) => {
    const m = make();
    m.engage();
    m.steps(BOSS_BAR.fadeFrames + 1);
    expect(m.model.opacity).toBe(1);
    emit(m);
    expect(m.model.visible).toBe(false);
    m.steps(BOSS_BAR.fadeFrames);
    expect(m.model.opacity).toBe(0);
  });

  it('shows again with a full bar when it re-engages after a reset', () => {
    const m = make();
    m.engage();
    m.hit(1200, 1200);
    m.steps(200);
    m.events.emit('bossReset', { id: 'boss', cause: 'death', hp: 2400, maxHp: 2400 });
    m.engage();
    m.steps(1);
    expect(m.model.visible).toBe(true);
    expect(m.model.hpRatio).toBe(1);
    expect(m.model.ghostRatio).toBe(1);
  });
});

describe('BossBarModel ticks', () => {
  it('puts the phase boundary at 50%', () => {
    const { model, engage } = make();
    engage();
    expect(model.boundaries).toEqual([0.5]);
  });
});

describe('BossBarModel afterimage', () => {
  it('holds the lost HP for 60F, then shrinks onto the HP', () => {
    const { model, steps, engage, hit } = make();
    engage();
    steps(1);
    hit(1800, 600); // 75%
    model.step();
    expect(model.hpRatio).toBeCloseTo(0.75, 10);
    expect(model.ghostRatio).toBe(1);
    steps(BOSS_AFTERIMAGE.delayFrames - 1);
    expect(model.ghostRatio).toBe(1); // 60F の間は動かない
    model.step();
    expect(model.ghostRatio).toBeLessThan(1);
    expect(model.ghostRatio).toBeGreaterThan(0.75);
    steps(BOSS_AFTERIMAGE.totalFrames - BOSS_AFTERIMAGE.delayFrames);
    expect(model.ghostRatio).toBeCloseTo(0.75, 10);
  });

  it('keeps the top of the ghost across consecutive hits and restarts the delay', () => {
    const { model, steps, engage, hit } = make();
    engage();
    hit(2000, 400);
    steps(40);
    hit(1600, 400);
    steps(BOSS_AFTERIMAGE.delayFrames);
    expect(model.ghostRatio).toBe(1);
    steps(BOSS_AFTERIMAGE.totalFrames - BOSS_AFTERIMAGE.delayFrames);
    expect(model.ghostRatio).toBeCloseTo(1600 / 2400, 10);
  });
});

describe('BossBarModel phase glow', () => {
  it('glows for exactly 20F on bossPhaseBoundary, then stops', () => {
    const { model, events, steps, engage } = make();
    engage();
    steps(40);
    expect(model.glow).toBe(0);
    events.emit('bossPhaseBoundary', {
      id: 'boss',
      from: 1,
      to: 2,
      hp: 1200,
      transitionFrames: 120,
    });
    let lit = 0;
    let prev = 2;
    for (let i = 0; i < 60; i++) {
      model.step();
      if (model.glow > 0) {
        lit++;
        expect(model.glow).toBeLessThan(prev);
        prev = model.glow;
      }
    }
    expect(lit).toBe(BOSS_BAR.glowFrames);
    expect(model.glow).toBe(0);
  });

  it('starts at full brightness on the first step after the event', () => {
    const { model, events, steps, engage } = make();
    engage();
    steps(1);
    events.emit('bossPhaseBoundary', {
      id: 'boss',
      from: 1,
      to: 2,
      hp: 1200,
      transitionFrames: 120,
    });
    model.step();
    expect(model.glow).toBe(1);
  });
});

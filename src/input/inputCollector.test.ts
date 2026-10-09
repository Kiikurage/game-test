import { describe, expect, it } from 'vitest';
import { InputCollector } from './inputCollector';

describe('InputCollector', () => {
  it('reports pressed once and held until release', () => {
    const c = new InputCollector();
    c.setButton('keyboard', 'lightAttack', true);
    const f1 = c.drain();
    expect(f1.buttons.lightAttack).toEqual({ pressed: true, held: true, released: false });
    const f2 = c.drain();
    expect(f2.buttons.lightAttack).toEqual({ pressed: false, held: true, released: false });
    c.setButton('keyboard', 'lightAttack', false);
    const f3 = c.drain();
    expect(f3.buttons.lightAttack).toEqual({ pressed: false, held: false, released: true });
  });

  it('does not lose a press and release that happen between two steps', () => {
    const c = new InputCollector();
    c.setButton('touch', 'heavyAttack', true);
    c.setButton('touch', 'heavyAttack', false);
    const f = c.drain();
    expect(f.buttons.heavyAttack).toEqual({ pressed: true, held: false, released: true });
  });

  it('ORs sources: stays held until every source releases', () => {
    const c = new InputCollector();
    c.setButton('keyboard', 'guard', true);
    c.setButton('gamepad', 'guard', true);
    c.drain();
    c.setButton('keyboard', 'guard', false);
    const f = c.drain();
    expect(f.buttons.guard).toEqual({ pressed: false, held: true, released: false });
    c.setButton('gamepad', 'guard', false);
    expect(c.drain().buttons.guard.released).toBe(true);
  });

  it('sums movement from sources and clamps to unit length', () => {
    const c = new InputCollector();
    c.setMove('keyboard', 1, 0);
    c.setMove('touch', 1, 1);
    const m = c.drain().move;
    expect(Math.hypot(m.x, m.y)).toBeCloseTo(1);
    c.setMove('touch', 0, 0);
    expect(c.drain().move).toEqual({ x: 1, y: 0 });
  });

  it('accumulates look deltas until drained', () => {
    const c = new InputCollector();
    c.addLook(0.1, 0.2);
    c.addLook(0.05, -0.1);
    const f = c.drain();
    expect(f.look.x).toBeCloseTo(0.15);
    expect(f.look.y).toBeCloseTo(0.1);
    expect(c.drain().look).toEqual({ x: 0, y: 0 });
  });

  it('delivers the target switch for one step only', () => {
    const c = new InputCollector();
    c.requestTargetSwitch(1);
    expect(c.drain().targetSwitch).toBe(1);
    expect(c.drain().targetSwitch).toBe(0);
  });

  it('releaseSource clears held buttons and movement of that source only', () => {
    const c = new InputCollector();
    c.setButton('touch', 'dodge', true);
    c.setButton('keyboard', 'guard', true);
    c.setMove('touch', 0, 1);
    c.drain();
    c.releaseSource('touch');
    const f = c.drain();
    expect(f.buttons.dodge.held).toBe(false);
    expect(f.buttons.dodge.released).toBe(true);
    expect(f.buttons.guard.held).toBe(true);
    expect(f.move).toEqual({ x: 0, y: 0 });
  });
});

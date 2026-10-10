import { describe, expect, it, vi } from 'vitest';
import { INTERACT } from '../data/bonfire';
import { InteractionManager, type Interactable } from './interaction';

function item(id: string, x: number, z: number, extra: Partial<Interactable> = {}): Interactable {
  return { id, kind: 'test', x, z, label: () => id, interact: () => undefined, ...extra };
}

describe('InteractionManager.select', () => {
  it('picks the nearest target within the radius', () => {
    const m = new InteractionManager();
    m.register(item('far', 1.4, 0));
    m.register(item('near', 0.5, 0));
    expect(m.select(0, 0)?.id).toBe('near');
  });

  it('includes the radius boundary and excludes just beyond it', () => {
    const m = new InteractionManager();
    m.register(item('a', INTERACT.defaultRadiusM, 0));
    expect(m.select(0, 0)?.id).toBe('a');
    expect(m.select(-0.001, 0)).toBeNull();
  });

  it('uses each target own radius', () => {
    const m = new InteractionManager();
    m.register(item('wide', 3, 0, { radius: 3.5 }));
    m.register(item('tight', 1, 0, { radius: 0.5 }));
    expect(m.select(0, 0)?.id).toBe('wide'); // tight は半径外
    expect(m.select(0.8, 0)?.id).toBe('tight'); // 近い方が勝つ
  });

  it('prefers the earlier registration on equal distance and skips unavailable targets', () => {
    const m = new InteractionManager();
    let taken = false;
    m.register(item('first', 1, 0, { available: () => !taken }));
    m.register(item('second', -1, 0));
    expect(m.select(0, 0)?.id).toBe('first');
    taken = true;
    expect(m.select(0, 0)?.id).toBe('second');
  });

  it('rejects a duplicate id and can unregister', () => {
    const m = new InteractionManager();
    const off = m.register(item('a', 0, 0));
    expect(() => m.register(item('a', 1, 1))).toThrow();
    off();
    expect(m.select(0, 0)).toBeNull();
  });
});

describe('InteractionManager.step', () => {
  it('publishes the prompt of the nearest target and clears it when out of range or unable to act', () => {
    const m = new InteractionManager();
    m.register(item('bonfire', 0, 0, { kind: 'bonfire', label: () => '休む' }));
    const seen: (string | null)[] = [];
    m.onPromptChange((p) => seen.push(p && p.label));

    m.step({ x: 5, z: 0, canAct: true, pressed: false });
    expect(m.prompt).toBeNull();
    m.step({ x: 1, z: 0, canAct: true, pressed: false });
    expect(m.prompt).toEqual({ id: 'bonfire', kind: 'bonfire', label: '休む' });
    m.step({ x: 1, z: 0, canAct: false, pressed: false });
    expect(m.prompt).toBeNull();
    expect(seen).toEqual(['休む', null]);
  });

  it('notifies when the label of the same target changes, but not when unchanged', () => {
    const m = new InteractionManager();
    let label = '火を灯す';
    m.register(item('b', 0, 0, { label: () => label }));
    const listener = vi.fn();
    m.onPromptChange(listener);
    m.step({ x: 0, z: 0, canAct: true, pressed: false });
    m.step({ x: 0, z: 0, canAct: true, pressed: false });
    label = '休む';
    m.step({ x: 0, z: 0, canAct: true, pressed: false });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('runs interact only for the nearest target, once per press, and only when able to act', () => {
    const m = new InteractionManager();
    const nearUse = vi.fn();
    const farUse = vi.fn();
    m.register(item('far', 1, 0, { interact: farUse }));
    m.register(item('near', 0.3, 0, { interact: nearUse }));

    m.step({ x: 0, z: 0, canAct: false, pressed: true });
    expect(nearUse).not.toHaveBeenCalled();
    expect(m.step({ x: 0, z: 0, canAct: true, pressed: true })?.id).toBe('near');
    expect(nearUse).toHaveBeenCalledTimes(1);
    expect(farUse).not.toHaveBeenCalled();
    m.step({ x: 0, z: 0, canAct: true, pressed: false });
    expect(nearUse).toHaveBeenCalledTimes(1);
  });

  it('blocks everything while locked, and unlock is idempotent', () => {
    const m = new InteractionManager();
    const use = vi.fn();
    m.register(item('a', 0, 0, { interact: use }));
    const unlock = m.lock();
    expect(m.busy).toBe(true);
    m.step({ x: 0, z: 0, canAct: true, pressed: true });
    expect(use).not.toHaveBeenCalled();
    expect(m.prompt).toBeNull();
    unlock();
    unlock();
    expect(m.busy).toBe(false);
    m.step({ x: 0, z: 0, canAct: true, pressed: true });
    expect(use).toHaveBeenCalledTimes(1);
  });
});

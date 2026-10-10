import { Object3D, Vector3 } from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';
import { ThrownShield } from './thrownShield';

function fly(shield: ThrownShield, maxSeconds = 5): number {
  let t = 0;
  while (!shield.landed && t < maxSeconds) {
    shield.update(1 / 60);
    t += 1 / 60;
  }
  return t;
}

describe('ThrownShield', () => {
  it('放物線を描いて地面に着き、そこで止まる', () => {
    const object = new Object3D();
    object.position.set(0, 2.5, 0);
    const onLand = vi.fn();
    const shield = new ThrownShield(object, {
      velocity: new Vector3(0, 4, 12),
      spin: new Vector3(0, 0, 14),
      onLand,
    });
    const t = fly(shield);
    expect(shield.landed).toBe(true);
    expect(t).toBeGreaterThan(0.3);
    expect(t).toBeLessThan(2);
    expect(onLand).toHaveBeenCalledTimes(1);
    expect(object.position.z).toBeGreaterThan(4);
    const landedAt = object.position.clone();
    shield.update(1 / 60);
    expect(object.position.equals(landedAt)).toBe(true);
    expect(onLand).toHaveBeenCalledTimes(1);
  });

  it('地形の高さに合わせて刺さる', () => {
    const flat = new Object3D();
    flat.position.set(0, 3, 0);
    const high = new Object3D();
    high.position.set(0, 3, 0);
    const a = new ThrownShield(flat, { velocity: new Vector3(0, 2, 8) });
    const b = new ThrownShield(high, { velocity: new Vector3(0, 2, 8), groundHeight: () => 1 });
    fly(a);
    fly(b);
    expect(b.object.position.y - a.object.position.y).toBeCloseTo(1, 5);
  });

  it('縁が地面に少し埋まる高さで止まり、水平方向の進行方向を向く', () => {
    const object = new Object3D();
    object.position.set(0, 2, 0);
    const shield = new ThrownShield(object, { velocity: new Vector3(6, 1, 0), radius: 1 });
    fly(shield);
    expect(object.position.y).toBeGreaterThan(0.2);
    expect(object.position.y).toBeLessThan(0.55);
    // +X へ飛んだので、表面（ローカル +Z）の水平成分は +X を向く
    const normal = new Vector3(0, 0, 1).applyQuaternion(object.quaternion);
    expect(normal.x).toBeGreaterThan(0.5);
  });
});

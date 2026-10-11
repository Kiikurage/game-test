import { Vector3 } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import type { PlayerMotion } from '../data';
import type { EnemyInit } from './enemy';
import { FlatEnemyBody } from './enemyBody';
import { EnemyManager } from './enemyManager';
import type { Navigator, NavPoint } from './navigation';
import { motionNoise, NoiseField } from './perception';

const DT = 1 / 60;

const soldier: EnemyInit = {
  id: 'e1',
  type: 'undead_soldier',
  x: 0,
  z: 0,
  yaw: 0,
  behavior: 'wait',
};

/** 衝突のない平らな世界。敵は原点で +z を向いて待機し、プレイヤーは背後（-z）から近付く。 */
function setup(navigator?: Navigator) {
  const player = { position: new Vector3(0, 0, -50), motion: 'still' as PlayerMotion };
  const manager = new EnemyManager({
    lineOfSight: () => true,
    ...(navigator && { navigator }),
    createBody: (init) => new FlatEnemyBody(init.x, init.z),
    random: () => () => 0.5,
  });
  const enemy = manager.spawn(soldier);
  const step = (): void => {
    const kind = motionNoise(player.motion);
    if (kind) manager.noises.emit(player.position, kind, { duration: DT });
    manager.update(DT, player);
  };
  return { player, manager, enemy, step };
}

/** 敵の背後 `from` m から `to` m まで、`speed` m/s で近付く（Idle のままの間だけ）。 */
function approachBehind(motion: PlayerMotion, speed: number, from: number, to: number) {
  const s = setup();
  s.player.motion = motion;
  let z = -from;
  s.player.position.set(0, 0, z);
  let frames = 0;
  while (z < -to && s.enemy.state !== 'alert') {
    z = Math.min(-to, z + speed * DT);
    s.player.position.z = z;
    s.step();
    frames++;
  }
  return { ...s, frames };
}

describe('stealth approach times (spec 14.3.1)', () => {
  it('walking up to 1.6m behind never alerts the soldier', () => {
    const { enemy, player } = approachBehind('walk', 2, 3, 1.6);
    expect(player.position.z).toBeCloseTo(-1.6, 3);
    expect(enemy.state).toBe('idle');
    expect(enemy.gauge).toBeLessThan(50);
  });

  it('running from 5m to 1.5m takes about 0.78s and just misses Alert (about +93)', () => {
    const { enemy, frames } = approachBehind('run', 4.5, 5, 1.5);
    expect(frames / 60).toBeGreaterThan(0.75);
    expect(frames / 60).toBeLessThan(0.82);
    expect(enemy.gauge).toBeGreaterThan(88);
    expect(enemy.gauge).toBeLessThan(100);
    expect(enemy.state).toBe('suspicious');
  });

  it('dashing from 8m is always spotted before reaching striking distance', () => {
    const { enemy, player } = approachBehind('dash', 7, 8, 1.6);
    expect(enemy.state).toBe('alert');
    expect(player.position.z).toBeLessThan(-1.6);
  });
});

/** 鐘の音を一発鳴らす（反響なし）。 */
function ringBell(manager: EnemyManager, z: number): void {
  manager.noises.emitRadius({ x: 0, y: 0, z }, 15, undefined, 'bell');
}

describe('bell sound (spec 14.3.1)', () => {
  it('makes an idle enemy Suspicious (not Alert) and it walks up to 15m to the sound', () => {
    const { manager, enemy, step } = setup();
    ringBell(manager, 14);
    for (let i = 0; i < 30; i++) step();
    expect(enemy.state).toBe('suspicious');
    for (let i = 0; i < 600; i++) step();
    expect(enemy.state).not.toBe('alert');
    expect(enemy.position.z).toBeGreaterThan(13);
    expect(enemy.position.z).toBeLessThanOrEqual(14.3);
  });

  it('walks to the nearest navigable point of the sound, not into a wall', () => {
    const snapping: Navigator = {
      nextPoint: (_from, to, out) => {
        out.x = to.x;
        out.z = to.z;
        return out;
      },
      nearestWalkablePoint: (x: number, z: number, out: NavPoint) => {
        out.x = x;
        out.z = Math.min(z, 9);
        return out;
      },
    };
    const { manager, enemy, step } = setup(snapping);
    ringBell(manager, 14);
    for (let i = 0; i < 30; i++) step();
    for (let i = 0; i < 380; i++) step();
    expect(enemy.position.z).toBeGreaterThan(8.5);
    expect(enemy.position.z).toBeLessThan(9.4);
  });

  it('applies the echo-zone scale at the sound position to every radius (x1.3)', () => {
    const field = new NoiseField((x) => (x > 10 ? 1.3 : 1));
    field.emit({ x: 0, y: 0, z: 0 }, 'bell');
    field.emitRadius({ x: 20, y: 0, z: 0 }, 12, undefined, 'wallCollapse');
    expect(field.active[0]?.radius).toBeCloseTo(15, 5);
    expect(field.active[0]?.kind).toBe('bell');
    expect(field.active[1]?.radius).toBeCloseTo(15.6, 5);
  });
});

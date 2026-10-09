import { Vector3 } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { validateStateGraph } from '../anim/characterFsm';
import { ENEMY_AI } from '../data';
import type { PlayerMotion } from '../data';
import type { Enemy, EnemyAttackBehavior, EnemyInit } from './enemy';
import { FlatEnemyBody } from './enemyBody';
import { EnemyManager } from './enemyManager';
import { ENEMY_STATE_GRAPH, type EnemyStateId } from './enemyStates';
import { motionNoise, type LineOfSight } from './perception';

const DT = 1 / 60;

/** 衝突のない平らな世界での AI 検証（物理なし）。プレイヤーは位置と動作の分類だけを持つ。 */
class Harness {
  readonly player = { position: new Vector3(0, 0, 500), motion: 'still' as PlayerMotion };
  /** false にすると全ての視線が遮られる（壁）。 */
  sight = true;
  readonly manager: EnemyManager;
  readonly history: EnemyStateId[][] = [];

  constructor(inits: readonly EnemyInit[]) {
    const los: LineOfSight = () => this.sight;
    this.manager = new EnemyManager({
      lineOfSight: los,
      createBody: (init) => new FlatEnemyBody(init.x, init.z),
      random: () => () => 0.5,
    });
    for (const init of inits) this.manager.spawn(init);
  }

  get enemy(): Enemy {
    return this.manager.enemies[0] as Enemy;
  }

  /** `frames` ステップ進める。プレイヤーの足音はゲームと同じく毎ステップ出す。 */
  run(frames: number, each?: (frame: number) => void): void {
    for (let i = 0; i < frames; i++) {
      each?.(i);
      const kind = motionNoise(this.player.motion);
      if (kind) this.manager.noises.emit(this.player.position, kind, { duration: DT });
      this.manager.update(DT, this.player);
      this.history.push(this.manager.enemies.map((e) => e.state));
    }
  }

  /** 条件が成り立つまで進めてステップ数を返す。 */
  until(cond: () => boolean, max = 3000): number {
    for (let i = 0; i < max; i++) {
      if (cond()) return i;
      this.run(1);
    }
    throw new Error(`条件が ${max} ステップ内に成立しなかった`);
  }

  /** 敵の正面（yaw 0 = +z）`distance` m にプレイヤーを置く。 */
  placeInFront(distance: number, enemy = this.enemy): void {
    this.player.position.set(enemy.position.x, 0, enemy.position.z + distance);
  }
}

const soldier = (over: Partial<EnemyInit> = {}): EnemyInit => ({
  id: 'e1',
  type: 'undead_soldier',
  x: 0,
  z: 0,
  yaw: 0,
  behavior: 'wait',
  ...over,
});

describe('enemy state graph', () => {
  it('is consistent and lets every state reach Staggered / Dead', () => {
    expect(validateStateGraph(ENEMY_STATE_GRAPH)).toEqual([]);
    for (const [id, spec] of Object.entries(ENEMY_STATE_GRAPH)) {
      if (id === 'dead' || id === 'staggered') continue;
      expect(spec.to, id).toContain('staggered');
      expect(spec.to, id).toContain('dead');
    }
  });
});

describe('noticing the player', () => {
  it('ignores a player who stands still and silent behind it', () => {
    const h = new Harness([soldier()]);
    h.player.position.set(0, 0, -4); // 背後 4m（FOV 外・足音なし）
    h.run(300);
    expect(h.enemy.state).toBe('idle');
    expect(h.enemy.gauge).toBe(0);
  });

  it('does not see beyond 14m, even when facing the player', () => {
    const h = new Harness([soldier()]);
    h.placeInFront(14.5);
    h.player.motion = 'dash'; // 足音は届かない距離
    h.run(300);
    expect(h.enemy.gauge).toBe(0);
    expect(h.enemy.state).toBe('idle');
  });

  it('does not see through walls (line of sight blocked)', () => {
    const h = new Harness([soldier()]);
    h.placeInFront(5);
    h.sight = false;
    h.run(300);
    expect(h.enemy.gauge).toBe(0);
    expect(h.enemy.state).toBe('idle');
  });

  it('does not see outside the 140 degree FOV, but notices inside it', () => {
    // 正面から 80 度（FOV 外）
    const out = new Harness([soldier()]);
    out.player.position.set(
      Math.sin((80 * Math.PI) / 180) * 5,
      0,
      Math.cos((80 * Math.PI) / 180) * 5,
    );
    out.player.motion = 'run';
    out.run(60);
    // 走りの足音は 5m まで届く（5m ちょうどで聞こえる）ので、足音を除いて視覚だけを見る
    const seen = new Harness([soldier()]);
    seen.player.position.set(
      Math.sin((60 * Math.PI) / 180) * 6,
      0,
      Math.cos((60 * Math.PI) / 180) * 6,
    );
    seen.player.motion = 'run';
    seen.run(60);
    expect(seen.enemy.gauge).toBeGreaterThan(0);
    const blind = new Harness([soldier()]);
    blind.player.position.set(
      Math.sin((80 * Math.PI) / 180) * 6,
      0,
      Math.cos((80 * Math.PI) / 180) * 6,
    );
    blind.player.motion = 'run';
    blind.run(60);
    expect(blind.enemy.gauge).toBe(0);
  });

  it('goes Idle -> Suspicious -> Alert -> Chase when a running player approaches in view', () => {
    const h = new Harness([soldier()]);
    h.placeInFront(7);
    h.player.motion = 'run';
    h.run(200);
    const seq = h.history.map((s) => s[0]).filter((s, i, a) => s !== a[i - 1]);
    expect(seq.slice(0, 4)).toEqual(['idle', 'suspicious', 'alert', 'chase']);
  });

  it('a walking player is not noticed from behind until within 2m (hearing radius)', () => {
    const h = new Harness([soldier()]);
    h.player.motion = 'walk';
    h.player.position.set(0, 0, -2.5);
    h.run(300);
    expect(h.enemy.state).toBe('idle');
    h.player.position.set(0, 0, -1.8);
    h.run(120);
    expect(['alert', 'chase', 'approach']).toContain(h.enemy.state);
  });

  it('hears through walls: a dash within 8m behind a wall raises the gauge', () => {
    const h = new Harness([soldier()]);
    h.sight = false;
    h.player.position.set(0, 0, -7);
    h.player.motion = 'dash';
    h.run(80);
    expect(h.enemy.state).not.toBe('idle');
    // 9m では聞こえない
    const far = new Harness([soldier()]);
    far.sight = false;
    far.player.position.set(0, 0, -9);
    far.player.motion = 'dash';
    far.run(300);
    expect(far.enemy.state).toBe('idle');
  });

  it('reaches the alert gauge in the times quoted in the spec (dash from 8m: about 0.83s)', () => {
    const h = new Harness([soldier()]);
    h.player.position.set(0, 0, -7.5);
    h.player.motion = 'dash';
    const frames = h.until(() => h.enemy.state === 'alert');
    expect(frames).toBeGreaterThanOrEqual(48);
    expect(frames).toBeLessThanOrEqual(52);
  });
});

describe('alert', () => {
  it('freezes the enemy for exactly 24 frames before the chase begins', () => {
    const h = new Harness([soldier()]);
    h.placeInFront(3);
    h.player.motion = 'dash';
    h.until(() => h.enemy.state === 'alert');
    h.player.motion = 'still';
    const start = h.enemy.position.clone();
    h.history.length = 0;
    h.run(40);
    const alertFrames = h.history.filter((s) => s[0] === 'alert').length;
    // until() で最初の Alert 1 ステップを消化済みなので、残りは 23
    expect(alertFrames).toBe(ENEMY_AI.alertFrames - 1);
    expect(h.enemy.state).not.toBe('alert');
    // Alert 中は動かない
    expect(h.enemy.position.distanceTo(start)).toBeLessThan(0.5);
  });

  it('alerts allies within 8m (not those farther), including ones that cannot see the player', () => {
    const h = new Harness([
      soldier({ id: 'a', x: 0, z: 0 }),
      soldier({ id: 'near', x: 6, z: 0, yaw: Math.PI }), // 背を向けている
      soldier({ id: 'far', x: 15.5, z: 0 }),
    ]);
    h.player.position.set(0, 0, 4);
    h.player.motion = 'dash';
    h.until(() => h.manager.enemies[0]?.state === 'alert');
    // 同じステップで味方も Alert（Suspicious を経ない）
    expect(h.manager.enemies[1]?.state).toBe('alert');
    expect(h.manager.enemies[2]?.state).toBe('idle');
  });

  it('propagates through a chain of allies', () => {
    const h = new Harness([
      soldier({ id: 'a', x: 0, z: 0 }),
      soldier({ id: 'b', x: 7, z: 0 }),
      soldier({ id: 'c', x: 14, z: 0 }),
    ]);
    h.player.position.set(0, 0, 4);
    h.player.motion = 'dash';
    h.until(() => h.manager.enemies[0]?.state === 'alert');
    expect(h.manager.enemies[2]?.state).toBe('alert');
  });
});

/** 敵が追跡中になるまで進める（プレイヤーは正面 `distance` m）。 */
function startChase(h: Harness, distance = 8): void {
  h.placeInFront(distance);
  h.player.motion = 'run';
  h.until(() => h.enemy.state === 'chase');
  h.player.motion = 'still';
}

describe('chase', () => {
  it('moves at 3.5 m/s, slower than the player run speed (4.5 m/s)', () => {
    const h = new Harness([soldier()]);
    startChase(h, 12);
    const keep = () => {
      h.player.position.set(h.enemy.position.x, 0, h.enemy.position.z + 12);
    };
    h.run(30, keep); // 加速
    const p0 = h.enemy.position.clone();
    h.run(60, keep);
    const speed = h.enemy.position.distanceTo(p0) / 1;
    expect(speed).toBeCloseTo(ENEMY_AI.chaseSpeed, 1);
    expect(speed).toBeLessThan(4.5);
  });

  it('closes in and stops 3m away (Approach), then waits without attacking by default', () => {
    const h = new Harness([soldier()]);
    startChase(h, 10);
    h.run(600);
    expect(h.enemy.state).toBe('approach');
    const d = h.enemy.position.distanceTo(h.player.position);
    expect(d).toBeLessThanOrEqual(ENEMY_AI.holdRange + 0.05);
    expect(d).toBeGreaterThan(2.5);
    // 対象の方を向いている
    expect(h.enemy.yaw).toBeCloseTo(0, 1);
  });

  it('hands over to the attack behavior when one is installed (Attack -> Recover -> Approach)', () => {
    const h = new Harness([soldier()]);
    let started = 0;
    let running = 0;
    const attack: EnemyAttackBehavior = {
      tryStart: () => {
        started++;
        running = 0;
        return true;
      },
      update: () => ++running >= 40,
    };
    h.enemy.attackBehavior = attack;
    startChase(h, 10);
    h.run(500);
    expect(started).toBeGreaterThanOrEqual(2);
    const states = new Set(h.history.map((s) => s[0]));
    expect(states).toContain('attack');
    expect(states).toContain('recover');
  });

  it('turns at 240 degrees per second', () => {
    const h = new Harness([soldier()]);
    startChase(h, 6);
    h.run(120); // Approach で正面を向いて待機
    // プレイヤーが敵の真後ろへ回り込む（距離 3m を保つ）
    h.player.position.set(0, 0, -3);
    h.run(30); // 0.5 秒 → 最大 120 度
    const turned = Math.abs(((h.enemy.yaw + Math.PI) % (Math.PI * 2)) - Math.PI);
    // 0 から ±π へ向かって 120 度ぶん（±誤差）まで回っている
    expect(turned).toBeGreaterThan((100 * Math.PI) / 180);
    expect(turned).toBeLessThan((125 * Math.PI) / 180);
  });
});

describe('losing sight and returning', () => {
  it('returns after 6 seconds without sight or sound', () => {
    const h = new Harness([soldier()]);
    startChase(h, 8);
    h.run(60);
    // 視線も足音も届かない所へ
    h.sight = false;
    h.player.position.set(0, 0, 60);
    h.history.length = 0;
    const frames = h.until(() => h.enemy.state === 'return');
    expect(frames).toBe(ENEMY_AI.lostSightFrames);
    expect(ENEMY_AI.lostSightFrames).toBe(360);
  });

  it('does not return while it keeps hearing the player (sound refreshes the timer)', () => {
    const h = new Harness([soldier()]);
    startChase(h, 8);
    h.sight = false;
    h.player.motion = 'dash';
    h.player.position.set(h.enemy.position.x, 0, h.enemy.position.z + 6);
    h.run(900);
    expect(h.enemy.state).not.toBe('return');
  });

  it('leashes: returns once it is more than 25m from its start point', () => {
    const h = new Harness([soldier()]);
    startChase(h, 10);
    // 常に 10m 先で見え続ける相手を追わせる
    let returnedAt: number | null = null;
    h.run(2000, () => {
      h.player.position.set(h.enemy.position.x + 10, 0, h.enemy.position.z);
      if (returnedAt === null && h.enemy.state === 'return') returnedAt = h.enemy.homeDistance;
    });
    expect(returnedAt).not.toBeNull();
    expect(returnedAt as unknown as number).toBeGreaterThan(ENEMY_AI.leashRadius);
    expect(returnedAt as unknown as number).toBeLessThan(ENEMY_AI.leashRadius + 0.5);
  });

  it('walks home at 3.0 m/s while healing 20% of max HP per second, then idles at home', () => {
    const h = new Harness([soldier()]);
    startChase(h, 8);
    h.run(240, () => {
      h.player.position.set(h.enemy.position.x, 0, h.enemy.position.z + 8);
    });
    h.sight = false;
    h.player.position.set(0, 0, 80);
    h.until(() => h.enemy.state === 'return');
    expect(h.enemy.homeDistance).toBeGreaterThan(8);
    h.enemy.hp = 20;
    h.run(100); // 向き直しと加速を待つ
    const hp0 = h.enemy.hp;
    const p0 = h.enemy.position.clone();
    h.run(60);
    expect(h.enemy.hp - hp0).toBeCloseTo(h.enemy.maxHp * ENEMY_AI.returnHealPerSecond, 1);
    expect(h.enemy.position.distanceTo(p0)).toBeCloseTo(ENEMY_AI.returnSpeed, 1);
    h.until(() => h.enemy.state === 'idle');
    expect(h.enemy.homeDistance).toBeLessThan(0.5);
    expect(h.enemy.hp).toBeGreaterThan(20);
  });

  it('ignores the player while returning (no ping-pong at the leash boundary)', () => {
    const h = new Harness([soldier()]);
    startChase(h, 8);
    h.sight = false;
    h.player.position.set(0, 0, 80);
    h.until(() => h.enemy.state === 'return');
    h.sight = true;
    h.player.motion = 'dash';
    h.player.position.set(h.enemy.position.x, 0, h.enemy.position.z + 3);
    h.run(60);
    expect(h.enemy.state).toBe('return');
  });
});

describe('suspicious', () => {
  it('investigates the source (at most 6m), looks around for 180 frames, then goes back to idle at home', () => {
    const h = new Harness([soldier()]);
    h.sight = false;
    // 10m 先の音: ゲージを 50〜100 の間に留めるため、短い間だけ鳴らす（0.6 秒 = ゲージ 72）
    h.manager.noises.emit({ x: 0, y: 0, z: 10 }, 'wallCollapse', { duration: 0.6 });
    h.run(60);
    expect(h.enemy.state).toBe('suspicious');
    h.run(300);
    // 音源の方へ 6m までしか歩かない
    expect(h.enemy.position.z).toBeGreaterThan(5);
    expect(h.enemy.position.z).toBeLessThanOrEqual(6.3);
    expect(h.enemy.state).toBe('suspicious');
    h.run(120);
    // 見回しを終えるとゲージが下がり Idle へ。持ち場へ歩いて戻る
    expect(h.enemy.state).toBe('idle');
    h.run(600);
    expect(h.enemy.homeDistance).toBeLessThan(0.5);
    expect(h.enemy.yaw).toBeCloseTo(0, 1);
  });

  it('decays the gauge at 40 per second when nothing is sensed', () => {
    const h = new Harness([soldier()]);
    h.sight = false;
    h.manager.noises.emit({ x: 0, y: 0, z: 1 }, 'walk', { duration: 0.3 }); // ゲージ 36（Suspicious 未満）
    h.run(18);
    const g = h.enemy.gauge;
    expect(g).toBeCloseTo(36, 0);
    h.run(60);
    expect(h.enemy.gauge).toBeCloseTo(0, 0);
  });
});

describe('patrol and idle', () => {
  it('patrols along its facing direction and back, pausing at the ends', () => {
    const h = new Harness([soldier({ behavior: 'patrol', patrolRadius: 6, yaw: Math.PI / 2 })]);
    let maxX = 0;
    h.run(1500, () => {
      maxX = Math.max(maxX, h.enemy.position.x);
    });
    expect(maxX).toBeGreaterThan(5.5);
    expect(maxX).toBeLessThan(6.5);
    // 戻ってくる
    expect(h.enemy.position.x).toBeLessThan(maxX);
  });

  it('stands still when waiting', () => {
    const h = new Harness([soldier({ behavior: 'idle_back', yaw: Math.PI })]);
    h.run(300);
    expect(h.enemy.position.length()).toBeLessThan(0.01);
    expect(h.enemy.yaw).toBeCloseTo(Math.PI, 3);
  });
});

describe('lifecycle hooks for later tickets', () => {
  it('staggers and resumes the chase, and a killed enemy stops being a lock-on target', () => {
    const h = new Harness([soldier()]);
    startChase(h, 8);
    h.enemy.stagger(30);
    expect(h.enemy.state).toBe('staggered');
    h.run(31);
    expect(h.enemy.state).toBe('chase');
    h.enemy.kill();
    expect(h.enemy.alive).toBe(false);
    h.run(10);
    expect(h.enemy.state).toBe('dead');
  });

  it('provoke() puts an idle enemy into Alert at the given position', () => {
    const h = new Harness([soldier()]);
    h.enemy.provoke(3, 4);
    expect(h.enemy.state).toBe('alert');
    expect(h.enemy.knownPosition).toEqual({ x: 3, z: 4 });
  });

  it('shield bearers turn slower than soldiers', () => {
    const h = new Harness([soldier({ type: 'undead_shield' })]);
    expect(h.enemy.stats.turnDegPerSecond).toBe(150);
  });
});

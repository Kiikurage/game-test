import { gameStats } from '../debug/stats.system';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, PLAYER_STATS, PLUNGE, attackDamage, totalFrames } from '../data';
import {
  Health,
  HitResolver,
  circleShape,
  sectorHitsHeart,
  vec3,
  type Capsule,
  type HitTarget,
} from '../combat';
import { bossSystemOf } from '../boss/boss.system';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { playerAttackProfile } from '../combat/debugSwing';
import type { EnemySpawn } from '../world/level';
import type { BoxSpec } from '../world/playground';
import {
  airCorrection,
  canStartPlunge,
  landStiffnessFrames,
  plungeDamage,
  plungeMultiplier,
} from './plunge';

const DT = 1 / 60;

describe('落下攻撃の倍率（有効な落下高さ 1.0〜3.0m）', () => {
  it('1.5m 以上は 2.2（直剣 88）、1.0〜1.5m は 1.6（64）、範囲外は発生しない', () => {
    expect(plungeMultiplier(0.99)).toBeNull();
    expect(plungeMultiplier(1.0)).toBe(1.6);
    expect(plungeMultiplier(1.49)).toBe(1.6);
    expect(plungeMultiplier(1.5)).toBe(2.2);
    expect(plungeMultiplier(3.0)).toBe(2.2);
    expect(plungeMultiplier(3.01)).toBeNull();
    expect(plungeDamage(2.2, false)).toBe(88);
    expect(plungeDamage(1.6, false)).toBe(64);
  });

  it('未発見の敵には ×1.5（3.3 = 直剣 132）', () => {
    expect(plungeDamage(2.2, true)).toBe(132);
    expect(plungeDamage(1.6, true)).toBe(96);
    expect(attackDamage(PLAYER_STATS.attackPower, 3.3)).toBe(132);
  });
});

describe('落下攻撃を始められる条件', () => {
  const base = { stamina: 100, clearance: 1.0, height: 2.0, descending: true };

  it('スタミナ 19 は不可、20 は可（入力時に消費）', () => {
    expect(canStartPlunge({ ...base, stamina: 19 })).toBe(false);
    expect(canStartPlunge({ ...base, stamina: 20 })).toBe(true);
    expect(PLAYER_ACTIONS.plunge.staminaCost).toBe(20);
  });

  it('地面から 0.6m 以上離れて下降中でなければ不可', () => {
    expect(canStartPlunge({ ...base, clearance: 0.59 })).toBe(false);
    expect(canStartPlunge({ ...base, clearance: 0.6 })).toBe(true);
    expect(canStartPlunge({ ...base, clearance: null })).toBe(false);
    expect(canStartPlunge({ ...base, descending: false })).toBe(false);
  });

  it('有効な落下高さ（1.0〜3.0m）の外は不可', () => {
    expect(canStartPlunge({ ...base, height: 0.99 })).toBe(false);
    expect(canStartPlunge({ ...base, height: 1.0 })).toBe(true);
    expect(canStartPlunge({ ...base, height: 3.0 })).toBe(true);
    expect(canStartPlunge({ ...base, height: 3.1 })).toBe(false);
  });
});

describe('着地硬直（攻撃しない着地）', () => {
  it('2.0m 以上は 10F、2.0m 未満は硬直なし', () => {
    expect(landStiffnessFrames(1.99)).toBe(0);
    expect(landStiffnessFrames(2.0)).toBe(10);
    expect(landStiffnessFrames(3.0)).toBe(10);
  });

  it('落下攻撃の着地は 判定 4F + 硬直 24F = 28F', () => {
    expect(PLAYER_ACTIONS.plunge.active).toBe(4);
    expect(PLAYER_ACTIONS.plunge.recovery).toBe(24);
    expect(totalFrames(PLAYER_ACTIONS.plunge)).toBe(28);
    expect(PLAYER_ACTIONS.plunge.poiseDamage).toBe(60);
  });
});

describe('空中補正', () => {
  const out = { x: 0, y: 0 };

  it('入力は ±1.5 m/s まで（斜めでも 1.5 を超えない）', () => {
    airCorrection({ x: 1, y: 0 }, null, 2.5, out);
    expect(out.x).toBeCloseTo(1.5, 9);
    airCorrection({ x: 1, y: 1 }, null, 2.5, out);
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(1.5, 9);
    airCorrection({ x: 0.5, y: 0 }, null, 2.5, out);
    expect(out.x).toBeCloseTo(0.75, 9);
    airCorrection({ x: 0, y: 0 }, null, 2.5, out);
    expect(Math.hypot(out.x, out.y)).toBe(0);
  });

  it('ロックオン対象へは最大 2.5 m/s（強の入力補助は 3.5）、近いほど弱まる', () => {
    airCorrection({ x: 0, y: 0 }, { dx: 5, dz: 0 }, 2.5, out);
    expect(out.x).toBeCloseTo(2.5, 9);
    airCorrection({ x: 0, y: 0 }, { dx: 5, dz: 0 }, PLUNGE.airLockCorrectionAssist, out);
    expect(out.x).toBeCloseTo(3.5, 9);
    airCorrection({ x: 0, y: 0 }, { dx: 0.25, dz: 0 }, 2.5, out);
    expect(out.x).toBeCloseTo(1.0, 9);
    // 入力を足しても 2.5 を超えない
    airCorrection({ x: 1, y: 0 }, { dx: 5, dz: 0 }, 2.5, out);
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(2.5, 9);
  });
});

describe('判定の円（半径 1.4m・着地点中心）', () => {
  // 点に近いハートボックス（半径 0.001m）で、円の境界を見る
  const heart = (x: number, z: number): Capsule => ({
    a: { x, y: 0.5, z },
    b: { x, y: 1.5, z },
    radius: 0.001,
  });
  const circle = circleShape(vec3(), PLUNGE.radius);
  const contact = vec3();

  it('1.39m は当たり、1.41m は外れる', () => {
    expect(sectorHitsHeart(circle, heart(1.39, 0), contact)).toBe(true);
    expect(sectorHitsHeart(circle, heart(0, -1.39), contact)).toBe(true);
    expect(sectorHitsHeart(circle, heart(1.41, 0), contact)).toBe(false);
    expect(sectorHitsHeart(circle, heart(0, 1.41), contact)).toBe(false);
  });
});

describe('上方からの攻撃のためガード不能', () => {
  it('盾持ちの正面ガードが有効でも、落下攻撃はガードされない', () => {
    const resolver = new HitResolver();
    const target: HitTarget = {
      id: 'shield',
      team: 'enemy',
      health: new Health(200),
      invulnerable: false,
      staggered: false,
      heartboxes: [{ a: { x: 0.5, y: 0.2, z: 0 }, b: { x: 0.5, y: 1.6, z: 0 }, radius: 0.4 }],
      guard: () => 'guard',
    };
    resolver.addTarget(target);
    const origin = vec3();
    const shape = circleShape(origin, PLUNGE.radius);
    // 落下攻撃（ガード不能）
    const plunge = resolver.startAttack('player', 'player', playerAttackProfile('plunge'));
    const [hit] = resolver.resolve(plunge, shape);
    expect(hit?.guard).toBe('none');
    expect(hit?.damage).toBe(88);
    // 比べる: 通常の攻撃（軽攻撃 1）は同じ盾にガードされる
    target.health.refill();
    const light = resolver.startAttack('player', 'player', playerAttackProfile('light1'));
    const [guarded] = resolver.resolve(light, shape);
    expect(guarded?.guard).toBe('guard');
  });
});

describe('落下攻撃の結合（Rapier）', () => {
  // 高さ 2.2m の台（x, z: −3..3）。北（+Z）の縁から降りる。
  const PLATFORM: BoxSpec = { id: 'plat', x: 0, y: 1.1, z: 0, hx: 3, hy: 1.1, hz: 3 };
  const platformTop = 2.2;
  const soldier = (id: string, x: number, z: number): EnemySpawn => ({
    id,
    type: 'undead_soldier',
    area: 'A',
    x,
    z,
    yaw: 0, // +Z を向く（台の上のプレイヤーに背を向ける = 未発見のまま）
    behavior: 'wait',
  });

  beforeAll(async () => {
    await Game.create();
  });

  async function setup(options: { enemies?: EnemySpawn[]; boxes?: BoxSpec[] } = {}) {
    resetTuning();
    tuning.camera.autoFollow = false;
    const input = new FakeInput();
    const game = await Game.create({
      input,
      boxes: options.boxes ?? [PLATFORM],
      dummies: [],
      enemies: options.enemies ?? [soldier('e1', 0, 5.2)],
    });
    const tick = (): void => {
      game.update(DT);
      input.endStep();
    };
    const run = (frames: number): void => {
      for (let i = 0; i < frames; i++) tick();
    };
    /** 台の北縁の手前から、ゆっくり歩いて縁を踏み出し、落下状態に入るまで進める。 */
    const stepOff = (): void => {
      game.teleportPlayer(0, 2.3, 0, platformTop + 0.02);
      run(10);
      input.setMove(0, 0.4);
      for (let i = 0; i < 120 && game.player.state !== 'fall'; i++) tick();
      expect(game.player.state).toBe('fall');
    };
    /** 落下中、地面から 0.6m 以上離れるまで進めて攻撃を押す。 */
    const attackInAir = (button: 'lightAttack' | 'heavyAttack' = 'lightAttack'): void => {
      for (let i = 0; i < 60 && game.player.state === 'fall'; i++) {
        tick();
        if (game.player.feet.y < platformTop - 0.7) break;
      }
      input.press(button);
      tick();
    };
    return { game, input, run, tick, stepOff, attackInAir };
  }

  it('2.2m の台から亡者兵（未発見）へ落下攻撃 → 132（即死）、ヒットストップ 10F', async () => {
    const { game, run, stepOff, attackInAir } = await setup();
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('no enemy');
    expect(['idle', 'suspicious']).toContain(enemy.state);
    stepOff();
    const stamina = game.player.stamina.current;
    attackInAir();
    expect(game.player.state).toBe('plungeFall');
    expect(game.player.stamina.current).toBeLessThanOrEqual(stamina - 20 + 1);
    // 着地まで
    for (let i = 0; i < 60 && game.player.state === 'plungeFall'; i++) run(1);
    expect(game.player.state).toBe('plunge');
    expect(game.player.stateFrame).toBe(1);
    expect(game.player.attack?.hitActive).toBe(true);
    run(1);
    const hit = gameStats(game).hitLog.find((e) => e.attackId === 'plunge');
    expect(hit?.targetId).toBe('e1');
    expect(hit?.damage).toBe(132);
    expect(hit?.guard).toBe('none');
    expect(hit?.attackPoiseDamage).toBe(60);
    expect(hit?.killed).toBe(true); // 亡者兵（HP 120）は即死
  });

  it('発見済み（Alert）の敵には 88', async () => {
    const { game, run, stepOff, attackInAir } = await setup();
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('no enemy');
    enemy.provoke(0, 0);
    run(2);
    stepOff();
    attackInAir('heavyAttack'); // 強攻撃入力でも同じ
    for (let i = 0; i < 60 && game.player.state === 'plungeFall'; i++) run(1);
    run(1);
    const hit = gameStats(game).hitLog.find((e) => e.attackId === 'plunge');
    expect(hit?.damage).toBe(88);
    expect(hit?.killed).toBe(false);
    // 強靭度削り 60 で亡者兵（強靭度 50）が崩れる
    expect(enemy.state).toBe('staggered');
    expect(gameStats(game).lastHitStopFrames).toBe(10);
  });

  it('着地後 24F は行動不能（ロール不可）で、28F 後に戻る', async () => {
    const { game, input, run, tick, stepOff, attackInAir } = await setup();
    stepOff();
    attackInAir();
    for (let i = 0; i < 60 && game.player.state === 'plungeFall'; i++) run(1);
    expect(game.player.state).toBe('plunge');
    run(10);
    input.press('dodge');
    input.setMove(0, 1);
    tick();
    expect(game.player.state).toBe('plunge');
    expect(game.player.isActionable).toBe(false);
    input.setMove(0, 0);
    // F13 → F28 まで
    const seen: number[] = [];
    for (let i = 0; i < 40 && game.player.state === 'plunge'; i++) {
      seen.push(game.player.stateFrame);
      tick();
    }
    expect(Math.max(...seen)).toBe(28);
    expect(['idle', 'move']).toContain(game.player.state);
  });

  it('下に敵がいなければ落下攻撃は出ない（通常の着地: 2.2m は硬直 10F）', async () => {
    const { game, run, stepOff, attackInAir } = await setup({ enemies: [] });
    stepOff();
    attackInAir();
    expect(game.player.state).toBe('fall');
    const stamina = game.player.stamina.current;
    expect(stamina).toBeGreaterThan(PLAYER_STATS.stamina - 20);
    for (let i = 0; i < 60 && game.player.state === 'fall'; i++) run(1);
    expect(game.player.state).toBe('land');
    expect(gameStats(game).hitLog.some((e) => e.attackId === 'plunge')).toBe(false);
  });

  it('ボスには発生しない（下にいるのがボスだけなら落下攻撃は出ない）', async () => {
    const { game, stepOff, attackInAir } = await setup({ enemies: [] });
    bossSystemOf(game).spawn({ x: 0, z: 5.2, yaw: 0, y: 0.02, engage: true });
    stepOff();
    attackInAir();
    expect(game.player.state).toBe('fall');
  });

  it('スタミナ 19 では落下攻撃に入れない', async () => {
    const { game, stepOff, attackInAir } = await setup();
    stepOff();
    game.player.stamina.current = 5; // 入力までの回復を見込んで低めにする
    attackInAir();
    expect(game.player.state).toBe('fall');
  });

  it('1.0m 未満の段差では落下攻撃にならない', async () => {
    const low: BoxSpec = { id: 'low', x: 0, y: 0.45, z: 0, hx: 3, hy: 0.45, hz: 3 };
    const { game, input, tick, run } = await setup({ boxes: [low] });
    game.teleportPlayer(0, 2.3, 0, 0.92);
    run(10);
    input.setMove(0, 0.4);
    for (let i = 0; i < 120 && game.player.feet.y > 0.5; i++) tick();
    input.press('lightAttack');
    tick();
    expect(game.player.state).not.toBe('plungeFall');
  });

  it('落下中に被弾すると仰け反り、着地まで落下攻撃は出ない', async () => {
    const { game, input, run, tick, stepOff } = await setup();
    stepOff();
    run(6);
    game.debugHitPlayer({ from: 'front', damage: 10, poiseDamage: 100 });
    expect(['flinch', 'knockdown']).toContain(game.player.state);
    input.press('lightAttack');
    tick();
    expect(game.player.state).not.toBe('plungeFall');
  });
});

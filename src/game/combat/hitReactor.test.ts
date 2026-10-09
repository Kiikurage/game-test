import { beforeEach, describe, expect, it } from 'vitest';
import { KNOCKBACK, POISE, PLAYER_ACTIONS } from '../data';
import { resetTuning } from '../tuning';
import {
  BOSS_REACTOR,
  HOLLOW_SOLDIER_REACTOR,
  HitReactor,
  PLAYER_REACTOR,
  Poise,
  SHIELDBEARER_REACTOR,
  Slide,
  knockdownInvulnerable,
  vec3,
  type GuardOutcome,
  type HitEvent,
} from './index';

function event(
  poiseDamage: number,
  guard: GuardOutcome = 'none',
  extra: Partial<HitEvent> = {},
): HitEvent {
  return {
    attackerId: 'a',
    targetId: 't',
    attackId: 'x',
    attackInstanceId: 1,
    damage: 10,
    baseDamage: 10,
    multiplier: 1,
    poiseDamage: guard === 'none' ? poiseDamage : 0,
    attackPoiseDamage: poiseDamage,
    attackerPosition: vec3(),
    guard,
    guardStaminaCost: 0,
    position: vec3(0, 1, 1),
    hurtboxIndex: 0,
    targetHp: 100,
    killed: false,
    kind: guard === 'none' ? 'light' : 'guard',
    ...extra,
  };
}

function steps(r: { step(): void }, n: number): void {
  for (let i = 0; i < n; i++) r.step();
}

describe('Poise（強靭度メーター）', () => {
  it('P がちょうど 0 になった被弾で崩れる（49 では崩れない）', () => {
    const a = new Poise(50);
    expect(a.hit(49, 54).broke).toBe(false);
    expect(a.current).toBe(1);
    const b = new Poise(50);
    expect(b.hit(50, 54).broke).toBe(true);
  });

  it('崩れると P は最大値に戻り、崩しの硬直フレームの間 staggered になる', () => {
    const p = new Poise(50);
    p.hit(50, 54);
    expect(p.current).toBe(50);
    expect(p.staggered).toBe(true);
    steps(p, 53);
    expect(p.staggered).toBe(true);
    p.step();
    expect(p.staggered).toBe(false);
  });

  it('崩し中は新たな強靭度ダメージを受けない（連続で崩れ直さない）', () => {
    const p = new Poise(50);
    p.hit(50, 54);
    const r = p.hit(50, 54);
    expect(r).toEqual({ broke: false, ignored: true });
    expect(p.current).toBe(50);
    steps(p, 54);
    expect(p.hit(20, 54).ignored).toBe(false);
    expect(p.current).toBe(30);
  });

  it('最後の被弾から 300F で最大値に戻る（299F ではまだ）', () => {
    const p = new Poise(50);
    p.hit(20, 54);
    steps(p, POISE.recoverFrames - 1);
    expect(p.current).toBe(30);
    p.step();
    expect(p.current).toBe(50);
  });

  it('被弾のたびに 300F のカウントが仕切り直される', () => {
    const p = new Poise(50);
    p.hit(10, 54);
    steps(p, 200);
    p.hit(10, 54);
    steps(p, 299);
    expect(p.current).toBe(30);
    p.step();
    expect(p.current).toBe(50);
  });

  it('一時加算は先に削られ、窓の終わりに残りが消える（スーパーアーマー +40）', () => {
    const p = new Poise(40);
    p.grant(40);
    // 40 + 40 = 80 までは崩れない
    expect(p.hit(60, 24).broke).toBe(false);
    expect(p.current).toBe(20);
    p.clearBonus();
    expect(p.bonus).toBe(0);
    expect(p.hit(20, 24).broke).toBe(true);
  });

  it('加算込みでもちょうど 0 で崩れる', () => {
    const p = new Poise(50);
    p.grant(POISE.enemyAttackingBonus);
    expect(p.hit(79, 54).broke).toBe(false);
    const q = new Poise(50);
    q.grant(POISE.enemyAttackingBonus);
    expect(q.hit(80, 54).broke).toBe(true);
  });

  it('breakEnabled = false では崩れない（ボスのフェーズ内 1 回制限用の口）', () => {
    const p = new Poise(400);
    p.breakEnabled = false;
    expect(p.hit(500, 120).broke).toBe(false);
    expect(p.current).toBe(0);
  });
});

describe('Slide（押し戻し）', () => {
  it('指定距離ぴったり進み、速度は減衰する', () => {
    const s = new Slide();
    s.start(0, 2, 1.5, 14);
    const out = { x: 0, z: 0 };
    let total = 0;
    let prev = Infinity;
    for (let i = 0; i < 14; i++) {
      s.consume(out);
      expect(out.x).toBeCloseTo(0, 9);
      expect(out.z).toBeLessThan(prev);
      prev = out.z;
      total += out.z;
    }
    expect(total).toBeCloseTo(1.5, 9);
    expect(s.active).toBe(false);
    s.consume(out);
    expect(out.z).toBe(0);
  });
});

describe('HitReactor: プレイヤー', () => {
  beforeEach(() => {
    resetTuning();
  });

  it('軽い被弾（削り 49）は仰け反り 24F・後退 0.5m、重い被弾（削り 50）は転倒 48F・後退 1.5m', () => {
    const light = new HitReactor(PLAYER_REACTOR).react(event(49), 0, 1);
    expect(light).toMatchObject({
      kind: 'flinch',
      frames: 24,
      knockback: 0.5,
      heavy: false,
      blocksAction: true,
      interruptsAction: true,
    });
    const heavy = new HitReactor(PLAYER_REACTOR).react(event(50), 0, 1);
    expect(heavy).toMatchObject({ kind: 'knockdown', frames: 48, knockback: 1.5, heavy: true });
  });

  it('押し戻しは攻撃側から離れる向きに指定距離だけ進む', () => {
    const r = new HitReactor(PLAYER_REACTOR);
    r.react(event(30), 3, 4);
    const out = { x: 0, z: 0 };
    let x = 0;
    let z = 0;
    for (let i = 0; i < 30; i++) {
      r.consumeSlide(out);
      x += out.x;
      z += out.z;
    }
    expect(Math.hypot(x, z)).toBeCloseTo(KNOCKBACK.player.light.distance, 6);
    expect(x / Math.hypot(x, z)).toBeCloseTo(0.6, 6);
    expect(z / Math.hypot(x, z)).toBeCloseTo(0.8, 6);
  });

  it('被弾後無敵は被弾の次のステップから 18F（19F 目で解ける）', () => {
    const r = new HitReactor(PLAYER_REACTOR);
    expect(r.invulnerable).toBe(false);
    r.react(event(20), 0, 1);
    // 同じステップの別の攻撃も防ぐ
    expect(r.invulnerable).toBe(true);
    let invulnerableSteps = 0;
    for (let i = 0; i < 30; i++) {
      r.step();
      if (r.invulnerable) invulnerableSteps++;
    }
    expect(invulnerableSteps).toBe(KNOCKBACK.postHitInvulnFrames);
    const q = new HitReactor(PLAYER_REACTOR);
    q.react(event(20), 0, 1);
    steps(q, 18);
    expect(q.invulnerable).toBe(true);
    q.step();
    expect(q.invulnerable).toBe(false);
  });

  it('ガード成功では被弾後無敵を付与せず、強靭度も減らない。押し戻しは軽 0.6m / 重 1.2m', () => {
    const r = new HitReactor(PLAYER_REACTOR);
    const light = r.react(event(20, 'guard'), 0, 1);
    expect(r.invulnerable).toBe(false);
    expect(r.poise.current).toBe(40);
    expect(light).toMatchObject({ kind: 'guardPush', knockback: 0.6, blocksAction: false });
    const heavy = r.react(event(50, 'guard'), 0, 1);
    expect(heavy.knockback).toBe(1.2);
    expect(r.react(event(50, 'just'), 0, 1).kind).toBe('none');
    expect(r.invulnerable).toBe(false);
  });

  it('スーパーアーマー中は崩れない限り仰け反らない。崩れたら仰け反る', () => {
    const r = new HitReactor(PLAYER_REACTOR);
    r.poise.grant(PLAYER_ACTIONS.heavy.superArmor.poiseBonus);
    // 加算分（40）が 40 削られて 0、残り 10 で P は 30
    expect(r.react(event(50), 0, 1).kind).toBe('none');
    expect(r.poise.current).toBe(30);
    r.poise.clearBonus();
    const broke = r.react(event(30), 0, 1);
    expect(broke).toMatchObject({ kind: 'flinch', broke: true });
    expect(r.poise.current).toBe(40);
  });

  it('転倒の起き上がり無敵は F36 まで', () => {
    expect(knockdownInvulnerable(36)).toBe(true);
    expect(knockdownInvulnerable(37)).toBe(false);
  });

  it('死亡した被弾は反応しない', () => {
    const r = new HitReactor(PLAYER_REACTOR);
    expect(r.react(event(60, 'none', { killed: true }), 0, 1).kind).toBe('none');
  });
});

describe('HitReactor: 敵', () => {
  beforeEach(() => {
    resetTuning();
  });

  it('崩れない被弾は加算の軽い仰け反り 12F（行動継続）・後退 0.3m、重いと 0.8m', () => {
    const r = new HitReactor(HOLLOW_SOLDIER_REACTOR);
    const light = r.react(event(20), 0, 1);
    expect(light).toMatchObject({
      kind: 'flinch',
      frames: 12,
      knockback: 0.3,
      blocksAction: false,
      interruptsAction: false,
    });
    expect(r.flinchRemaining).toBe(12);
    steps(r, 12);
    expect(r.flinchRemaining).toBe(0);
    const heavy = new HitReactor(SHIELDBEARER_REACTOR).react(event(50), 0, 1);
    expect(heavy.knockback).toBe(0.8);
  });

  it('崩れると 54F の硬直・後退 0.8m。ボスは 120F', () => {
    const r = new HitReactor(HOLLOW_SOLDIER_REACTOR);
    const reaction = r.react(event(50), 0, 1);
    expect(reaction).toMatchObject({
      kind: 'stagger',
      frames: 54,
      knockback: 0.8,
      broke: true,
      blocksAction: true,
    });
    expect(r.staggered).toBe(true);
    const boss = new HitReactor(BOSS_REACTOR).react(event(400), 0, 1);
    expect(boss).toMatchObject({ kind: 'stagger', frames: 120 });
  });

  it('崩し中の追撃は強靭度を削らず、反応もしない。硬直が終わると再び削れる', () => {
    const r = new HitReactor(HOLLOW_SOLDIER_REACTOR);
    r.react(event(50), 0, 1);
    expect(r.react(event(20), 0, 1).kind).toBe('none');
    steps(r, 54);
    expect(r.staggered).toBe(false);
    expect(r.react(event(20), 0, 1).kind).toBe('flinch');
    expect(r.poise.current).toBe(30);
  });

  it('敵は被弾後無敵を持たない', () => {
    const r = new HitReactor(HOLLOW_SOLDIER_REACTOR);
    r.react(event(20), 0, 1);
    expect(r.invulnerable).toBe(false);
  });

  it('シミュレーション: 軽攻撃（削り 20）の連打で亡者兵（強靭度 50）が崩れるのは 3 ヒット目', () => {
    const light = PLAYER_ACTIONS.light1.poiseDamage;
    const r = new HitReactor(HOLLOW_SOLDIER_REACTOR);
    let hits = 0;
    let broke = false;
    // 軽攻撃の連打: おおよそ 30F ごとに 1 ヒット
    while (!broke && hits < 20) {
      steps(r, 30);
      broke = r.react(event(light), 0, 1).broke;
      hits++;
    }
    expect(hits).toBe(3);
  });

  it('シミュレーション: 間隔が 300F 以上空くと強靭度が戻り、崩れない', () => {
    const r = new HitReactor(HOLLOW_SOLDIER_REACTOR);
    for (let i = 0; i < 10; i++) {
      steps(r, POISE.recoverFrames);
      expect(r.react(event(20), 0, 1).broke).toBe(false);
    }
  });

  it('盾持ち（強靭度 80）は軽攻撃 4 ヒットで崩れる', () => {
    const r = new HitReactor(SHIELDBEARER_REACTOR);
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) results.push(r.react(event(20), 0, 1).broke);
    expect(results).toEqual([false, false, false, true]);
  });
});

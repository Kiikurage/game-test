import { Vector3 } from 'three/webgpu';
import { describe, expect, it } from 'vitest';
import { PLAYER_HEARTBOXES, HitResolver, UprightTarget, type HitEvent } from '../combat';
import { ENEMY_AI, UNDEAD_ATTACK_RULES, UNDEAD_SOLDIER_ATTACKS, trackEndFrame } from '../data';
import type { PlayerMotion } from '../data';
import { findEnemyClipEvents } from '../anim/enemyClips';
import { AttackRunner, AttackTokens, pickWeighted, type AttackPlanner } from './attackRunner';
import type { Enemy, EnemyInit } from './enemy';
import { FlatEnemyBody } from './enemyBody';
import { EnemyManager, seededRandom } from './enemyManager';
import type { EnemyStateId } from './enemyStates';
import { UNDEAD_PLANNER, createUndeadAttack } from './undeadAttack';

const DT = 1 / 60;
const DEG = Math.PI / 180;
const seededBy = (seed: string) => (id: string) => seededRandom(seed + id);
const wrap = (a: number): number =>
  ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

/** 常に `id` を選ぶ（ダミー攻撃）。距離に関わらず出す。 */
const always = (id: string): AttackPlanner => ({ choose: () => id });

interface HarnessOptions {
  readonly planner?: AttackPlanner;
  readonly tokens?: AttackTokens;
  readonly seed?: string;
}

/** 平らな世界・実際の `HitResolver` とプレイヤーの被弾側（HP は大きく、反応は適用しない）。 */
class Harness {
  readonly player = {
    position: new Vector3(0, 0, 500),
    motion: 'still' as PlayerMotion,
    recentRoll: false,
  };
  readonly combat = new HitResolver();
  readonly playerTarget = new UprightTarget('player', 'player', 100000, PLAYER_HEARTBOXES);
  readonly tokens: AttackTokens;
  readonly manager: EnemyManager;
  readonly runners = new Map<string, AttackRunner>();
  readonly hits: HitEvent[] = [];
  readonly states = new Map<string, EnemyStateId[]>();
  /** 1 ステップに Attack 状態だった敵の数の最大。 */
  maxAttacking = 0;

  constructor(inits: readonly EnemyInit[], options: HarnessOptions = {}) {
    this.tokens = options.tokens ?? new AttackTokens();
    this.combat.addTarget(this.playerTarget);
    this.combat.onHit((e) => this.hits.push(e));
    this.manager = new EnemyManager({
      lineOfSight: () => true,
      createBody: (init) => new FlatEnemyBody(init.x, init.z),
      ...(options.seed !== undefined && { random: seededBy(options.seed) }),
      createAttack: (init, random) => {
        const runner = options.planner
          ? new AttackRunner({
              combat: this.combat,
              tokens: this.tokens,
              random,
              planner: options.planner,
              attacks: UNDEAD_SOLDIER_ATTACKS,
              actionPrefix: 'enemy.undead.',
              entryOf: findEnemyClipEvents,
            })
          : createUndeadAttack({ combat: this.combat, tokens: this.tokens, random });
        this.runners.set(init.id, runner);
        return runner;
      },
    });
    for (const init of inits) {
      const e = this.manager.spawn(init);
      this.states.set(e.id, []);
    }
  }

  get enemies(): readonly Enemy[] {
    return this.manager.enemies;
  }

  get enemy(): Enemy {
    return this.manager.enemies[0] as Enemy;
  }

  run(frames: number, each?: (frame: number) => void): void {
    for (let i = 0; i < frames; i++) {
      each?.(i);
      const p = this.player.position;
      this.playerTarget.place(p.x, p.y, p.z, 0);
      this.manager.update(DT, this.player);
      this.combat.step();
      let attacking = 0;
      for (const e of this.enemies) {
        this.states.get(e.id)?.push(e.state);
        if (e.state === 'attack') attacking++;
        // 敵の本体が許す同時攻撃数（トークン）を超えない
        expect(this.tokens.count).toBeLessThanOrEqual(this.tokens.max);
      }
      this.maxAttacking = Math.max(this.maxAttacking, attacking);
    }
  }

  until(cond: () => boolean, max = 3000): number {
    for (let i = 0; i < max; i++) {
      if (cond()) return i;
      this.run(1);
    }
    throw new Error(`条件が ${max} ステップ内に成立しなかった`);
  }

  /** 全員を Alert にして戦闘へ入れる。 */
  provokeAll(): void {
    for (const e of this.enemies) e.provoke(this.player.position.x, this.player.position.z);
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

describe('weighted attack selection', () => {
  const choices = [
    { id: 'a', weight: 60 },
    { id: 'b', weight: 40 },
  ] as const;

  it('follows the weights with an injected random source', () => {
    expect(pickWeighted(choices, () => 0.0)).toBe('a');
    expect(pickWeighted(choices, () => 0.59)).toBe('a');
    expect(pickWeighted(choices, () => 0.61)).toBe('b');
    expect(pickWeighted(choices, () => 0.999)).toBe('b');
  });

  it('distributes by the weights over many seeded draws', () => {
    const random = seededRandom('pick');
    let a = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) if (pickWeighted(choices, random) === 'a') a++;
    expect(a / n).toBeGreaterThan(0.57);
    expect(a / n).toBeLessThan(0.63);
  });

  it('never picks the same attack three times in a row (injectable constraint)', () => {
    const random = seededRandom('repeat');
    const history: ('a' | 'b')[] = [];
    for (let i = 0; i < 500; i++) {
      const id = pickWeighted(choices, random, { history, maxConsecutive: 2 });
      expect(id).not.toBeNull();
      history.push(id as 'a' | 'b');
    }
    for (let i = 2; i < history.length; i++) {
      expect(history[i] === history[i - 1] && history[i] === history[i - 2]).toBe(false);
    }
  });

  it('returns null when nothing is eligible, or when the idle weight wins', () => {
    expect(
      pickWeighted([{ id: 'a', weight: 1 }], () => 0, { history: ['a', 'a'], maxConsecutive: 2 }),
    ).toBeNull();
    expect(pickWeighted([{ id: 'a', weight: 70 }], () => 0.9, { idleWeight: 30 })).toBeNull();
    expect(pickWeighted([{ id: 'a', weight: 70 }], () => 0.5, { idleWeight: 30 })).toBe('a');
  });
});

describe('undead soldier attack selection (5.2)', () => {
  const ctx = (distance: number, history: string[] = [], recentRoll = false, r = 0.5) => ({
    distance,
    recentRoll,
    history,
    random: () => r,
  });

  it('uses A1 / A2 up close, A3 at mid range, and nothing in between or far away', () => {
    expect(UNDEAD_PLANNER.choose(ctx(2.0, [], false, 0.0))).toBe('a1');
    expect(UNDEAD_PLANNER.choose(ctx(2.0, [], false, 0.9))).toBe('a2');
    expect(UNDEAD_PLANNER.choose(ctx(3.0, [], false, 0.1))).toBe('a3');
    expect(UNDEAD_PLANNER.choose(ctx(3.0, [], false, 0.9))).toBeNull(); // 30% は選ばず接近
    expect(UNDEAD_PLANNER.choose(ctx(2.35))).toBeNull();
    expect(UNDEAD_PLANNER.choose(ctx(6))).toBeNull();
  });

  it('does not use A2 right after A1, and never picks the same attack 3 times in a row', () => {
    // A1 の直後は A2 を選ばない（乱数が A2 の側でも A1）
    expect(UNDEAD_PLANNER.choose(ctx(2.0, ['a1'], false, 0.9))).toBe('a1');
    // A1 が 2 回続いたら、3 回目の A1 は選ばない（立ち尽くさないよう A2 を許す）
    expect(UNDEAD_PLANNER.choose(ctx(2.0, ['a1', 'a1'], false, 0.0))).toBe('a2');
    // A3 も 3 回連続は選ばない
    expect(UNDEAD_PLANNER.choose(ctx(3.0, ['a3', 'a3'], false, 0.0))).toBeNull();
  });

  it('raises A1 to 70% and skips the hold right after a roll at close range', () => {
    expect(UNDEAD_PLANNER.choose(ctx(2.0, [], true, 0.69))).toBe('a1');
    expect(UNDEAD_PLANNER.choose(ctx(2.0, [], true, 0.71))).toBe('a2');
    expect(UNDEAD_PLANNER.skipHold?.({ distance: 2.0, recentRoll: true })).toBe(true);
    expect(UNDEAD_PLANNER.skipHold?.({ distance: 2.0, recentRoll: false })).toBe(false);
    expect(UNDEAD_PLANNER.skipHold?.({ distance: 3.0, recentRoll: true })).toBe(false);
  });

  it('chains A1 into A1 40% of the time, at most once', () => {
    const f = (chain: number, r: number) =>
      UNDEAD_PLANNER.followUp?.({ lastId: 'a1', chain, random: () => r });
    expect(f(0, 0.39)).toBe('a1b');
    expect(f(0, 0.41)).toBeNull();
    expect(f(1, 0.0)).toBeNull(); // 連続は最大 2 発
    expect(UNDEAD_PLANNER.followUp?.({ lastId: 'a2', chain: 0, random: () => 0 })).toBeNull();
    expect(UNDEAD_ATTACK_RULES.a1ChainChance).toBe(0.4);
  });
});

describe('attack token pool', () => {
  it('hands out at most 2 tokens and frees them on release', () => {
    const t = new AttackTokens();
    expect(t.max).toBe(2);
    expect(t.tryAcquire('a')).toBe(true);
    expect(t.tryAcquire('b')).toBe(true);
    expect(t.tryAcquire('c')).toBe(false);
    expect(t.tryAcquire('a')).toBe(true); // 持っている敵は再取得できる（数は増えない）
    expect(t.count).toBe(2);
    t.release('a');
    expect(t.tryAcquire('c')).toBe(true);
    expect(t.count).toBe(2);
    expect(t.has('a')).toBe(false);
  });
});

describe('attack execution', () => {
  /** 敵 1 体を Approach まで進め、Attack に入った瞬間のステップで止める。 */
  function intoAttack(h: Harness): void {
    h.player.position.set(0, 0, 2);
    h.provokeAll();
    h.until(() => h.enemy.state === 'attack');
  }

  it('follows the player for the first 60% of the startup at 120 deg/s, then holds its facing', () => {
    const h = new Harness([soldier()], { planner: always('a1'), seed: 'track' });
    intoAttack(h);
    expect(h.enemy.fsm.actionId).toBe('enemy.undead.a1');
    const def = UNDEAD_SOLDIER_ATTACKS.a1;
    const trackEnd = trackEndFrame(def);
    expect(trackEnd).toBe(Math.floor(def.startup * 0.6));
    // プレイヤーが真横（+x。yaw +90°）へ回り込む。敵は 120°/s で追う
    h.player.position.set(2, 0, 0);
    const yaw0 = h.enemy.yaw;
    const yawAt: number[] = [];
    for (let f = 1; f <= def.startup; f++) {
      h.run(1);
      yawAt[f] = h.enemy.yaw;
    }
    const perFrame = 120 * DEG * DT;
    // 追尾の間は 1 フレームあたり 2° 回る
    expect((yawAt[trackEnd] ?? 0) - yaw0).toBeGreaterThan(perFrame * (trackEnd - 1));
    expect((yawAt[trackEnd] ?? 0) - yaw0).toBeLessThanOrEqual(perFrame * (trackEnd + 1) + 1e-6);
    for (let f = 2; f <= trackEnd; f++) {
      expect((yawAt[f] ?? 0) - (yawAt[f - 1] ?? 0)).toBeLessThanOrEqual(perFrame + 1e-9);
    }
    // 以降は向き固定（発生まで 1 ミリも回らない）
    for (let f = trackEnd + 1; f <= def.startup; f++) {
      expect(yawAt[f]).toBeCloseTo(yawAt[trackEnd] ?? 0, 9);
    }
    // 90° には届かない（追いきれていない）
    expect(yawAt[def.startup] ?? 0).toBeLessThan(Math.PI / 2);
  });

  it('hits only during the hitStart-hitEnd window and only once per swing', () => {
    const h = new Harness([soldier()], { planner: always('a1'), seed: 'window' });
    intoAttack(h);
    const def = UNDEAD_SOLDIER_ATTACKS.a1;
    let firstHit = -1;
    for (let f = 1; f <= def.startup + def.active + def.recovery; f++) {
      const before = h.hits.length;
      h.run(1);
      if (h.hits.length > before && firstHit < 0) firstHit = f;
    }
    expect(h.hits.length).toBe(1);
    expect(h.hits[0]?.attackerId).toBe('e1');
    expect(h.hits[0]?.baseDamage).toBe(def.damage);
    expect(h.hits[0]?.attackPoiseDamage).toBe(def.poiseDamage);
    // 最初の判定フレームは F(発生 + 1)
    expect(firstHit).toBe(def.startup + 1);
  });

  it('misses a player who has moved out of the arc/range before the active frames', () => {
    const h = new Harness([soldier()], { planner: always('a1'), seed: 'miss' });
    intoAttack(h);
    const def = UNDEAD_SOLDIER_ATTACKS.a1;
    h.run(def.startup - 4);
    h.player.position.set(0, 0, 6); // 十分離れた
    h.run(def.active + def.recovery + 8);
    expect(h.hits).toHaveLength(0);
  });

  it('does not hit a player who is invulnerable during the active frames (dodge)', () => {
    const h = new Harness([soldier()], { planner: always('a1'), seed: 'invuln' });
    intoAttack(h);
    const def = UNDEAD_SOLDIER_ATTACKS.a1;
    h.run(def.startup - 2);
    h.playerTarget.invulnerable = true;
    h.run(def.active + 2);
    h.playerTarget.invulnerable = false;
    h.run(def.recovery);
    expect(h.hits).toHaveLength(0);
  });

  it('gives +30 poise from the start of the startup until the active frames end', () => {
    const poise = { value: 0, grants: 0, clears: 0 };
    const h = new Harness([soldier()], { seed: 'poise' });
    const enemy = h.enemy;
    // poiseOf を差し込んだ実行を作り直す
    const runner = new AttackRunner({
      combat: h.combat,
      tokens: h.tokens,
      random: seededRandom('poise-r'),
      planner: always('a1'),
      attacks: UNDEAD_SOLDIER_ATTACKS,
      actionPrefix: 'enemy.undead.',
      entryOf: findEnemyClipEvents,
      poiseOf: () =>
        ({
          grant: (n: number) => {
            poise.value = n;
            poise.grants++;
          },
          clearBonus: () => {
            poise.value = 0;
            poise.clears++;
          },
        }) as never,
    });
    enemy.attackBehavior = runner;
    intoAttack(h);
    const def = UNDEAD_SOLDIER_ATTACKS.a1;
    expect(poise.value).toBe(30);
    h.run(def.startup + def.active - 1);
    expect(poise.value).toBe(30);
    h.run(1);
    expect(poise.value).toBe(0);
  });

  it('releases the token and ends the attack when staggered mid-swing', () => {
    const h = new Harness([soldier()], { planner: always('a1'), seed: 'cancel' });
    intoAttack(h);
    expect(h.tokens.has('e1')).toBe(true);
    h.run(10);
    h.enemy.stagger(54);
    expect(h.tokens.has('e1')).toBe(false);
    expect(h.combat.activeAttacks.size).toBe(0);
    h.run(80);
    expect(h.hits).toHaveLength(0);
  });

  it('chains A1 into the shortened A1 (startup 20F) within the Attack state', () => {
    // 連続の乱数が必ず当たる（0）計画
    const planner: AttackPlanner = {
      choose: () => 'a1',
      followUp: ({ lastId, chain }) => (lastId === 'a1' && chain < 1 ? 'a1b' : null),
    };
    const h = new Harness([soldier()], { planner, seed: 'chain' });
    intoAttack(h);
    const first = UNDEAD_SOLDIER_ATTACKS.a1;
    const second = UNDEAD_SOLDIER_ATTACKS.a1b;
    const total1 = first.startup + first.active + first.recovery;
    h.run(total1);
    expect(h.enemy.state).toBe('attack');
    expect(h.enemy.fsm.actionId).toBe('enemy.undead.a1b');
    const before = h.hits.length;
    let hitFrame = -1;
    for (let f = 1; f <= second.startup + second.active + second.recovery; f++) {
      const n = h.hits.length;
      h.run(1);
      if (h.hits.length > n && hitFrame < 0) hitFrame = f;
    }
    expect(h.hits.length - before).toBe(1);
    expect(hitFrame).toBe(second.startup + 1);
    h.run(2);
    expect(h.enemy.state).toBe('recover');
  });

  it('A3 lunges 2.5m over its active frames', () => {
    const h = new Harness([soldier()], { planner: always('a3'), seed: 'lunge' });
    h.player.position.set(0, 0, 3);
    h.provokeAll();
    h.until(() => h.enemy.state === 'attack');
    const def = UNDEAD_SOLDIER_ATTACKS.a3;
    h.run(def.startup);
    const z0 = h.enemy.position.z;
    h.run(def.active);
    expect(h.enemy.position.z - z0).toBeCloseTo(def.moveDistance, 1);
    // 突進中の移動は発生までと硬直には出ない
    const z1 = h.enemy.position.z;
    h.run(10);
    expect(Math.abs(h.enemy.position.z - z1)).toBeLessThan(0.05);
  });
});

describe('attack cooldown', () => {
  /** 敵 1 体が行った Recover の長さ（フレーム）の一覧。 */
  function recoverDurations(h: Harness, steps: number): number[] {
    h.run(steps);
    const states = h.states.get('e1') ?? [];
    const out: number[] = [];
    let n = 0;
    for (const s of states) {
      if (s === 'recover') n++;
      else if (n > 0) {
        out.push(n);
        n = 0;
      }
    }
    return out;
  }

  it('waits 30-90F after Recover (seeded), and 30-60F at 25% HP or less', () => {
    const h = new Harness([soldier()], { planner: always('a1'), seed: 'cooldown' });
    h.player.position.set(0, 0, 3);
    h.provokeAll();
    // 近くに立つ標的は攻撃を受けても倒れない（HP を大きくしている）。何度も攻撃させる
    const normal = recoverDurations(h, 4000);
    expect(normal.length).toBeGreaterThan(8);
    for (const d of normal) {
      expect(d).toBeGreaterThanOrEqual(ENEMY_AI.cooldownFrames[0]);
      expect(d).toBeLessThanOrEqual(ENEMY_AI.cooldownFrames[1]);
    }
    expect(new Set(normal).size).toBeGreaterThan(3); // 乱数でばらつく

    const low = new Harness([soldier()], { planner: always('a1'), seed: 'cooldown' });
    low.player.position.set(0, 0, 3);
    low.provokeAll();
    low.enemy.hp = low.enemy.maxHp * 0.2;
    const desperate = recoverDurations(low, 4000);
    expect(desperate.length).toBeGreaterThan(8);
    for (const d of desperate) {
      expect(d).toBeGreaterThanOrEqual(ENEMY_AI.cooldownFramesDesperate[0]);
      expect(d).toBeLessThanOrEqual(ENEMY_AI.cooldownFramesDesperate[1]);
    }
  });
});

describe('attack tokens in a group (simulation)', () => {
  const trio = (): EnemyInit[] => [
    soldier({ id: 'e1', x: -3, z: 0 }),
    soldier({ id: 'e2', x: 0, z: -3 }),
    soldier({ id: 'e3', x: 3, z: 0 }),
  ];

  it('never lets more than 2 of 3 enemies attack at once, yet all of them get to attack', () => {
    const h = new Harness(trio(), { planner: always('a1'), seed: 'trio' });
    h.player.position.set(0, 0, 0);
    h.provokeAll();
    const attacked = new Set<string>();
    h.run(3000, () => {
      for (const e of h.enemies) if (e.state === 'attack') attacked.add(e.id);
    });
    expect(h.maxAttacking).toBe(2); // 上限まで使われ、超えない
    expect(attacked.size).toBe(3); // 待たされた敵にも順番が回る
  });

  it('keeps a token-less enemy circling at about 4m (at most 1.5 m/s) while it waits', () => {
    // 2 体がずっと攻撃中の想定でトークンを使い切っておく
    const h = new Harness([soldier({ id: 'e3', x: 0, z: 6 })], {
      planner: always('a2'),
      seed: 'orbit',
    });
    h.tokens.tryAcquire('ghost1');
    h.tokens.tryAcquire('ghost2');
    h.player.position.set(0, 0, 0);
    h.provokeAll();
    const e3 = h.enemy;
    const radii: number[] = [];
    const speeds: number[] = [];
    const angles: number[] = [];
    let prev = e3.position.clone();
    h.run(900, () => {
      const waiting = h.runners.get('e3')?.isWaiting() === true && e3.state === 'approach';
      const d = e3.position.distanceTo(prev);
      const r = Math.hypot(e3.position.x, e3.position.z);
      if (waiting && r > 3.5 && r < 4.6) {
        radii.push(r);
        speeds.push(d / DT);
        angles.push(Math.atan2(e3.position.x, e3.position.z));
      }
      prev = e3.position.clone();
    });
    expect(h.tokens.has('e3')).toBe(false);
    expect(h.states.get('e3')).not.toContain('attack');
    expect(radii.length).toBeGreaterThan(300);
    for (const s of speeds) expect(s).toBeLessThanOrEqual(ENEMY_AI.orbitSpeed + 0.3);
    // 円周付近に居続ける
    const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
    expect(mean).toBeGreaterThan(3.7);
    expect(mean).toBeLessThan(4.3);
    // 実際に回っている（円周上を 1.5m/s で 5 秒なら 2 rad 近く動く）
    const total = angles
      .slice(1)
      .reduce((acc, v, i) => acc + Math.abs(wrap(v - (angles[i] ?? 0))), 0);
    expect(total).toBeGreaterThan(0.5);

    // トークンが空くとすぐ攻撃に入る
    h.tokens.release('ghost1');
    h.until(() => h.enemy.state === 'attack', 120);
  });

  it('hands the token over when an attacker is killed mid-swing', () => {
    const h = new Harness(trio(), { planner: always('a2'), seed: 'handover' });
    h.player.position.set(0, 0, 0);
    h.provokeAll();
    h.until(() => h.tokens.count === 2);
    const holder = h.enemies.find((e) => h.tokens.has(e.id)) as Enemy;
    holder.kill();
    expect(h.tokens.has(holder.id)).toBe(false);
    expect(h.tokens.count).toBe(1);
  });
});

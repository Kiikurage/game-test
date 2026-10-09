import { describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, PLAYER_STATS, guardChipDamage } from '../data';
import {
  DebugSwing,
  HitResolver,
  UprightTarget,
  WEAPON_CAPSULE,
  capsule,
  capsuleShape,
  circleShape,
  playerAttackProfile,
  sectorOverlapsCircle,
  sectorShape,
  uprightHeartbox,
  vec3,
  type AttackProfile,
  type GuardOutcome,
  type HeartboxSpec,
} from './index';

const DEG = Math.PI / 180;

function enemy(x: number, z: number, hp = 120, specs?: readonly HeartboxSpec[]): UprightTarget {
  const t = new UprightTarget('e1', 'enemy', hp, specs ?? [uprightHeartbox(0.35, 1.8)]);
  t.place(x, 0, z, 0);
  return t;
}

const SWORD: AttackProfile = { id: 'sword', damage: 40, poiseDamage: 20 };

/** 前方（+z）へ伸びる武器カプセル。`x` は横位置。 */
function blade(x: number, z: number, y = 1.2) {
  return capsuleShape(
    capsule(vec3(x, y, z), vec3(x, y, z + WEAPON_CAPSULE.length), WEAPON_CAPSULE.radius),
    vec3(0, 0, 0),
  );
}

describe('スイープ判定', () => {
  it('高速移動でもすり抜けない（前フレームと現在の姿勢の間に対象がある）', () => {
    const r = new HitResolver();
    const t = enemy(0, 0);
    r.addTarget(t);
    const attack = r.startAttack('player', 'player', SWORD);
    // 1 フレームで x=-3 から x=+3 まで動く: どちらの姿勢も対象に触れていないが、軌跡は通過する
    r.prime(attack, blade(-3, -0.5));
    const events = r.resolve(attack, blade(3, -0.5));
    expect(events).toHaveLength(1);
    expect(events[0]?.targetId).toBe('e1');
  });

  it('prime がなければ現在の姿勢のみで判定する（すり抜け側は当たらない）', () => {
    const r = new HitResolver();
    r.addTarget(enemy(0, 0));
    const attack = r.startAttack('player', 'player', SWORD);
    expect(r.resolve(attack, blade(3, -0.5))).toHaveLength(0);
  });

  it('軌跡が対象に届かなければ当たらない', () => {
    const r = new HitResolver();
    r.addTarget(enemy(0, 0));
    const attack = r.startAttack('player', 'player', SWORD);
    r.prime(attack, blade(-3, 3));
    expect(r.resolve(attack, blade(3, 3))).toHaveLength(0);
  });

  it('カプセル半径の和（0.25 + 0.35）が当たりの境界', () => {
    const r = new HitResolver();
    r.addTarget(enemy(0, 0));
    const hitAt = (x: number) => {
      const attack = r.startAttack('player', 'player', SWORD);
      const out = r.resolve(attack, blade(x, 0));
      r.endAttack(attack);
      return out.length > 0;
    };
    expect(hitAt(0.599)).toBe(true);
    expect(hitAt(0.601)).toBe(false);
  });

  it('剣先の高さが対象の頭上を外れると当たらない', () => {
    const r = new HitResolver();
    r.addTarget(enemy(0, 0));
    const attack = r.startAttack('player', 'player', SWORD);
    expect(r.resolve(attack, blade(0, 0, 2.3))).toHaveLength(0);
    expect(r.resolve(attack, blade(0, 0, 2.0))).toHaveLength(1);
  });
});

describe('1 スイング 1 ヒット', () => {
  it('同じ攻撃で同じ対象に複数ヒットしない', () => {
    const r = new HitResolver();
    const t = enemy(0, 0);
    r.addTarget(t);
    const attack = r.startAttack('player', 'player', SWORD);
    let total = 0;
    for (let i = 0; i < 4; i++) total += r.resolve(attack, blade(0, 0)).length;
    expect(total).toBe(1);
    expect(t.health.current).toBe(80);
  });

  it('別のスイング（攻撃インスタンス）なら再び当たる', () => {
    const r = new HitResolver();
    const t = enemy(0, 0);
    r.addTarget(t);
    for (let i = 0; i < 2; i++) {
      const attack = r.startAttack('player', 'player', SWORD);
      r.resolve(attack, blade(0, 0));
      r.resolve(attack, blade(0, 0));
      r.endAttack(attack);
    }
    expect(t.health.current).toBe(40);
  });

  it('ハートボックスが複数あっても 1 スイングで 1 回（ボスの脚部と胴）', () => {
    const r = new HitResolver();
    const boss = enemy(0, 0, 400, [
      { radius: 0.6, y0: 0.6, y1: 1.2 },
      { radius: 0.8, y0: 1.8, y1: 2.8 },
    ]);
    r.addTarget(boss);
    const attack = r.startAttack('player', 'player', SWORD);
    // 脚部と胴の両方に触れる縦長の姿勢
    const shape = capsuleShape(capsule(vec3(0, 0.8, 0), vec3(0, 2.6, 0), 0.25), vec3(0, 0, 0));
    expect(r.resolve(attack, shape)).toHaveLength(1);
    expect(boss.health.current).toBe(360);
  });

  it('頭より上（胴の上端を越えた高さ）には判定がない', () => {
    const r = new HitResolver();
    const boss = enemy(0, 0, 400, [
      { radius: 0.6, y0: 0.6, y1: 1.2 },
      { radius: 0.8, y0: 1.8, y1: 2.8 },
    ]);
    r.addTarget(boss);
    const attack = r.startAttack('player', 'player', SWORD);
    const shape = capsuleShape(capsule(vec3(0, 4.5, 0), vec3(0, 5.2, 0), 0.25), vec3(0, 0, 0));
    expect(r.resolve(attack, shape)).toHaveLength(0);
  });
});

describe('無敵・陣営・遮蔽', () => {
  it('無敵中は素通りし、無敵が切れた後のフレームで当たる', () => {
    const r = new HitResolver();
    const t = enemy(0, 0);
    r.addTarget(t);
    const attack = r.startAttack('player', 'player', SWORD);
    t.invulnerable = true;
    expect(r.resolve(attack, blade(0, 0))).toHaveLength(0);
    expect(t.health.current).toBe(120);
    t.invulnerable = false;
    expect(r.resolve(attack, blade(0, 0))).toHaveLength(1);
  });

  it('同じ陣営には当たらない', () => {
    const r = new HitResolver();
    const ally = new UprightTarget('ally', 'player', 100, [uprightHeartbox(0.35, 1.8)]);
    ally.place(0, 0, 0, 0);
    r.addTarget(ally);
    const attack = r.startAttack('player', 'player', SWORD);
    expect(r.resolve(attack, blade(0, 0))).toHaveLength(0);
  });

  it('壁に遮られていれば当たらない（isBlocked）', () => {
    const r = new HitResolver({ isBlocked: () => true });
    r.addTarget(enemy(0, 0));
    const attack = r.startAttack('player', 'player', SWORD);
    expect(r.resolve(attack, blade(0, 0))).toHaveLength(0);
  });
});

describe('ダメージ解決（4.2 節）', () => {
  it('通常は攻撃のダメージ値そのまま（整数、乱数なし）', () => {
    const r = new HitResolver();
    const t = enemy(0, 0);
    r.addTarget(t);
    const attack = r.startAttack('player', 'player', playerAttackProfile('light1'));
    const [e] = r.resolve(attack, blade(0, 0));
    expect(e?.damage).toBe(40);
    expect(e?.multiplier).toBe(1);
    expect(e?.poiseDamage).toBe(PLAYER_ACTIONS.light1.poiseDamage);
    expect(t.health.current).toBe(80);
  });

  it('強靭度崩し中・ガード崩し中は 1.5 倍', () => {
    const r = new HitResolver();
    const t = enemy(0, 0);
    t.staggered = true;
    r.addTarget(t);
    const attack = r.startAttack('player', 'player', SWORD);
    const [e] = r.resolve(attack, blade(0, 0));
    expect(e?.damage).toBe(60);
    expect(e?.multiplier).toBe(1.5);
    expect(t.health.current).toBe(60);
  });

  it('HP が 0 以下になった瞬間に死亡確定（killed は 1 回だけ）', () => {
    const r = new HitResolver();
    const t = enemy(0, 0, 80);
    r.addTarget(t);
    const first = r.startAttack('player', 'player', SWORD);
    const [e1] = r.resolve(first, blade(0, 0));
    expect(e1?.killed).toBe(false);
    expect(t.health.dead).toBe(false);
    const second = r.startAttack('player', 'player', SWORD);
    const [e2] = r.resolve(second, blade(0, 0));
    expect(e2?.killed).toBe(true);
    expect(t.health.current).toBe(0);
    expect(t.health.dead).toBe(true);
    // 死亡済みの対象には当たらない
    const third = r.startAttack('player', 'player', SWORD);
    expect(r.resolve(third, blade(0, 0))).toHaveLength(0);
  });

  it('HP は 0 を下回らない', () => {
    const r = new HitResolver();
    const t = enemy(0, 0, 10);
    r.addTarget(t);
    const attack = r.startAttack('player', 'player', SWORD);
    const [e] = r.resolve(attack, blade(0, 0));
    expect(t.health.current).toBe(0);
    expect(e?.targetHp).toBe(0);
  });

  it('命中イベントを購読できる（攻撃側・被弾側・ダメージ・強靭度・位置）', () => {
    const r = new HitResolver();
    r.addTarget(enemy(0, 0));
    const seen: string[] = [];
    r.onHit((e) => {
      seen.push(`${e.attackerId}->${e.targetId}:${e.damage}/${e.poiseDamage}`);
      expect(e.position.y).toBeGreaterThan(0);
    });
    const attack = r.startAttack('player', 'player', SWORD);
    r.resolve(attack, blade(0, 0));
    expect(seen).toEqual(['player->e1:40/20']);
  });
});

describe('ガード（E2-6 が呼び出す口）', () => {
  function playerWith(outcome: GuardOutcome): { r: HitResolver; p: UprightTarget } {
    const r = new HitResolver();
    const p = new UprightTarget('player', 'player', PLAYER_STATS.hp, [uprightHeartbox(0.35, 1.8)]);
    p.place(0, 0, 0, 0);
    p.guard = () => outcome;
    r.addTarget(p);
    return { r, p };
  }
  const swing = (damage: number, guardStaminaCost = 22): AttackProfile => ({
    id: 'a1',
    damage,
    poiseDamage: 25,
    guardStaminaCost,
  });
  const enemyBlade = capsuleShape(capsule(vec3(0, 1.0, 0), vec3(0, 1.0, 1), 0.25), vec3(0, 0, 0));

  it('ガード成功は攻撃ダメージの 10%（切り捨て）', () => {
    expect(guardChipDamage(45)).toBe(4);
    expect(guardChipDamage(55)).toBe(5);
    expect(guardChipDamage(70)).toBe(7);
    expect(guardChipDamage(9)).toBe(0);
    const { r, p } = playerWith('guard');
    const attack = r.startAttack('e1', 'enemy', swing(45));
    const [e] = r.resolve(attack, enemyBlade);
    expect(e?.guard).toBe('guard');
    expect(e?.damage).toBe(4);
    expect(e?.poiseDamage).toBe(0);
    expect(e?.guardStaminaCost).toBe(22);
    expect(e?.kind).toBe('guard');
    expect(p.health.current).toBe(PLAYER_STATS.hp - 4);
  });

  it('ジャストガードは削り 0・スタミナ消費 50%', () => {
    const { r, p } = playerWith('just');
    const attack = r.startAttack('e1', 'enemy', swing(70, 35));
    const [e] = r.resolve(attack, enemyBlade);
    expect(e?.damage).toBe(0);
    expect(e?.guardStaminaCost).toBe(18); // 17.5 → 四捨五入
    expect(p.health.current).toBe(PLAYER_STATS.hp);
  });

  it('ガード不能の攻撃は guard 判定を無視する', () => {
    const { r, p } = playerWith('guard');
    const attack = r.startAttack('e1', 'enemy', { ...swing(70), unblockable: true });
    const [e] = r.resolve(attack, enemyBlade);
    expect(e?.guard).toBe('none');
    expect(e?.damage).toBe(70);
    expect(p.health.current).toBe(PLAYER_STATS.hp - 70);
  });

  it('ガードしていなければ通常ダメージ', () => {
    const { r } = playerWith('none');
    const attack = r.startAttack('e1', 'enemy', swing(45));
    const [e] = r.resolve(attack, enemyBlade);
    expect(e?.damage).toBe(45);
    expect(e?.kind).toBe('light');
  });

  it('プレイヤーのロール無敵中は敵の攻撃が素通りする', () => {
    const { r, p } = playerWith('none');
    p.invulnerable = true;
    const attack = r.startAttack('e1', 'enemy', swing(45));
    expect(r.resolve(attack, enemyBlade)).toHaveLength(0);
  });
});

describe('扇形・突進・全周の形状（5.2 節 A1/A2/A3）', () => {
  const tiny = 0.001;
  // 頂点を原点、前方 +z（yaw 0）に置いた細いターゲット（半径 ≒ 0）を、距離 d・方位 deg に置いて判定する
  const sector = (arcDeg: number, range: number, d: number, deg: number) => {
    const rad = deg * DEG;
    return sectorOverlapsCircle(0, 0, 0, arcDeg, range, Math.sin(rad) * d, Math.cos(rad) * d, tiny);
  };

  it('A1 横斬り: 前方 100°・射程 1.8m', () => {
    expect(sector(100, 1.8, 1.79, 0)).toBe(true);
    expect(sector(100, 1.8, 1.81, 0)).toBe(false);
    expect(sector(100, 1.8, 1.0, 49.9)).toBe(true);
    expect(sector(100, 1.8, 1.0, 50.1)).toBe(false);
    expect(sector(100, 1.8, 1.0, -49.9)).toBe(true);
    expect(sector(100, 1.8, 1.0, -50.1)).toBe(false);
    expect(sector(100, 1.8, 1.0, 180)).toBe(false);
  });

  it('A2 縦斬り: 前方 60°・射程 2.0m', () => {
    expect(sector(60, 2.0, 1.99, 0)).toBe(true);
    expect(sector(60, 2.0, 2.01, 0)).toBe(false);
    expect(sector(60, 2.0, 1.5, 29.9)).toBe(true);
    expect(sector(60, 2.0, 1.5, 30.1)).toBe(false);
  });

  it('対象の半径ぶん境界が広がる（半径 0.35m のハートボックス）', () => {
    const r = 0.35;
    expect(sectorOverlapsCircle(0, 0, 0, 100, 1.8, 0, 1.8 + r - 0.001, r)).toBe(true);
    expect(sectorOverlapsCircle(0, 0, 0, 100, 1.8, 0, 1.8 + r + 0.001, r)).toBe(false);
    // 扇形の外側の辺に半径ぶん触れる
    const d = 1.0;
    const edge = 50 * DEG;
    const offset = r - 0.001; // 辺からの垂直距離
    const x = Math.sin(edge) * d + Math.cos(edge) * offset;
    const z = Math.cos(edge) * d - Math.sin(edge) * offset;
    expect(sectorOverlapsCircle(0, 0, 0, 100, 1.8, x, z, r)).toBe(true);
    expect(sectorOverlapsCircle(0, 0, 0, 100, 1.8, x * 1.02, z * 1.02, r - 0.02)).toBe(false);
  });

  it('向き（yaw）に追従する', () => {
    const yaw = 90 * DEG; // +x を向く
    expect(sectorOverlapsCircle(0, 0, yaw, 60, 2, 1.5, 0, tiny)).toBe(true);
    expect(sectorOverlapsCircle(0, 0, yaw, 60, 2, 0, 1.5, tiny)).toBe(false);
  });

  it('扇形のハートボックス判定: 高さ範囲の外は当たらない', () => {
    const r = new HitResolver();
    const t = enemy(0, 1.0);
    r.addTarget(t);
    const hit = (yMin: number, yMax: number) => {
      const a = r.startAttack('e0', 'player', SWORD);
      const out = r.resolve(a, sectorShape(vec3(0, 0, 0), 0, 100, 1.8, yMin, yMax));
      r.endAttack(a);
      return out.length > 0;
    };
    expect(hit(-0.3, 2.2)).toBe(true);
    expect(hit(2.2, 3.0)).toBe(false); // 全高 1.8m のハートボックスより上
    t.invulnerable = false;
  });

  it('A3 突進突き: 前方 30°・突進 2.5m（動きながらの判定をスイープする）', () => {
    const r = new HitResolver();
    const t = new UprightTarget('p', 'player', 300, [uprightHeartbox(0.35, 1.8)]);
    t.place(0, 0, 3, 0); // 開始位置の 3m 先（射程 1.2m は届かない）
    r.addTarget(t);
    const dashTo = (z: number) => sectorShape(vec3(0, 0, z), 0, 30, 1.2);
    const attack = r.startAttack('e1', 'enemy', { id: 'a3', damage: 55, poiseDamage: 30 });
    r.prime(attack, dashTo(0));
    // 突進 2.5m 進んだ先の判定。現在位置の扇形だけでは 3 - 2.5 = 0.5m で射程内だが、途中でも当たる
    const events = r.resolve(attack, dashTo(2.5));
    expect(events).toHaveLength(1);
    expect(events[0]?.damage).toBe(55);
  });

  it('A3 突進: 軌道の横（30° の外）にいる相手には当たらない', () => {
    const r = new HitResolver();
    const t = new UprightTarget('p', 'player', 300, [uprightHeartbox(0.35, 1.8)]);
    t.place(2.0, 0, 1.5, 0); // 軌道（x=0）から 2m 横
    r.addTarget(t);
    const attack = r.startAttack('e1', 'enemy', { id: 'a3', damage: 55, poiseDamage: 30 });
    r.prime(attack, sectorShape(vec3(0, 0, 0), 0, 30, 1.2));
    expect(r.resolve(attack, sectorShape(vec3(0, 0, 2.5), 0, 30, 1.2))).toHaveLength(0);
  });

  it('全周 360°: 方向によらず射程 + 半径まで届く', () => {
    const radius = 3;
    const rangeOf = (x: number, z: number) => {
      const t = new UprightTarget('p', 'player', 300, [uprightHeartbox(0.35, 1.8)]);
      t.place(x, 0, z, 0);
      const local = new HitResolver();
      local.addTarget(t);
      const a = local.startAttack('b', 'enemy', { id: 'slam', damage: 80, poiseDamage: 60 });
      return local.resolve(a, circleShape(vec3(0, 0, 0), radius)).length > 0;
    };
    for (const deg of [0, 90, 180, 270, 33]) {
      const rad = deg * DEG;
      const edge = radius + 0.35;
      expect(rangeOf(Math.sin(rad) * (edge - 0.01), Math.cos(rad) * (edge - 0.01))).toBe(true);
      expect(rangeOf(Math.sin(rad) * (edge + 0.01), Math.cos(rad) * (edge + 0.01))).toBe(false);
    }
  });
});

describe('デバッグ用の横斬り（DebugSwing）', () => {
  it('軽攻撃 1 の発生 12F・持続 4F で、正面のダミーに 1 回だけ当たる', () => {
    const r = new HitResolver();
    const t = enemy(0, 1.2, 9999);
    r.addTarget(t);
    const swing = new DebugSwing(r);
    swing.start();
    const hitFrames: number[] = [];
    for (let f = 1; f <= 30; f++) {
      const before = swing.hits.length;
      swing.update(vec3(0, 0, 0), 0);
      if (swing.hits.length > before) hitFrames.push(f);
    }
    expect(swing.hits).toHaveLength(1);
    const { startup, active } = PLAYER_ACTIONS.light1;
    expect(hitFrames[0]).toBeGreaterThan(startup);
    expect(hitFrames[0]).toBeLessThanOrEqual(startup + active);
    expect(swing.active).toBe(false);
    expect(t.health.current).toBe(9999 - 40);
  });
});

import { describe, expect, it } from 'vitest';
import { CharacterFsm, type StateGraph } from '../anim/characterFsm';
import { tuning, resetTuning } from '../tuning';
import {
  FreezeCounter,
  decideHitStop,
  playerAttackFrames,
  vec3,
  type GuardOutcome,
  type HitEvent,
  type HitStopInput,
} from './index';

function event(attackId: string, guard: GuardOutcome = 'none', killed = false): HitEvent {
  return {
    attackerId: 'a',
    targetId: 't',
    attackId,
    attackInstanceId: 1,
    damage: 10,
    baseDamage: 10,
    multiplier: 1,
    poiseDamage: 20,
    attackPoiseDamage: 20,
    attackerPosition: vec3(),
    guard,
    guardStaminaCost: 0,
    position: vec3(0, 1, 1),
    hurtboxIndex: 0,
    targetHp: 100,
    killed,
    kind: guard === 'none' ? 'light' : 'guard',
  };
}

const PLAYER_ATTACKS: Pick<HitStopInput, 'attackerIsPlayer' | 'targetIsPlayer'> & {
  attackerIsBoss: false;
  targetIsBoss: false;
} = { attackerIsPlayer: true, targetIsPlayer: false, attackerIsBoss: false, targetIsBoss: false };
const ENEMY_ATTACKS = {
  attackerIsPlayer: false,
  targetIsPlayer: true,
  attackerIsBoss: false,
  targetIsBoss: false,
};

describe('decideHitStop（4.1 節の表）', () => {
  const cfg = () => {
    resetTuning();
    return tuning.hitStop;
  };

  it('プレイヤーの軽攻撃 4F / 強攻撃（溜めなし）8F / 強攻撃（フル溜め）12F', () => {
    const c = cfg();
    for (const id of ['light1', 'light2', 'light3']) {
      expect(decideHitStop({ event: event(id), ...PLAYER_ATTACKS }, c).frames).toBe(4);
    }
    expect(decideHitStop({ event: event('heavy'), ...PLAYER_ATTACKS }, c).frames).toBe(8);
    expect(decideHitStop({ event: event('heavyCharged'), ...PLAYER_ATTACKS }, c).frames).toBe(12);
  });

  it('フル溜め強攻撃だけ画面振動 0.4°', () => {
    const c = cfg();
    expect(decideHitStop({ event: event('heavyCharged'), ...PLAYER_ATTACKS }, c).shake).toEqual({
      amplitudeDeg: 0.4,
      frames: c.chargedShakeFrames,
    });
    expect(decideHitStop({ event: event('heavy'), ...PLAYER_ATTACKS }, c).shake).toBeNull();
    expect(decideHitStop({ event: event('light1'), ...PLAYER_ATTACKS }, c).shake).toBeNull();
  });

  it('その他のプレイヤー動作（走り攻撃・ガードカウンターなど）は強攻撃（溜めなし）と同じ 8F', () => {
    const c = cfg();
    for (const id of ['runAttack', 'guardCounter', 'backstab', 'plunge']) {
      expect(playerAttackFrames(id, c)).toBe(8);
    }
  });

  it('敵の攻撃がプレイヤーに命中 6F（赤フラッシュ 4F）、ボスなら 8F', () => {
    const c = cfg();
    const enemy = decideHitStop({ event: event('swing'), ...ENEMY_ATTACKS }, c);
    expect(enemy.frames).toBe(6);
    expect(enemy.flash).toEqual({ kind: 'red', frames: 4 });
    const boss = decideHitStop({ event: event('slam'), ...ENEMY_ATTACKS, attackerIsBoss: true }, c);
    expect(boss.frames).toBe(8);
  });

  it('ガード成功 4F、ジャストガード 8F（白い閃光 2F）。攻撃側が誰でも同じ', () => {
    const c = cfg();
    expect(decideHitStop({ event: event('swing', 'guard'), ...ENEMY_ATTACKS }, c).frames).toBe(4);
    const just = decideHitStop({ event: event('swing', 'just'), ...ENEMY_ATTACKS }, c);
    expect(just.frames).toBe(8);
    expect(just.flash).toEqual({ kind: 'white', frames: 2 });
    expect(
      decideHitStop({ event: event('slam', 'guard'), ...ENEMY_ATTACKS, attackerIsBoss: true }, c)
        .frames,
    ).toBe(4);
  });

  it('撃破（トドメ）は 12F + 0.3 倍速 30F、ボスは 60F。軽攻撃の 4F より長い方を採用する', () => {
    const c = cfg();
    const kill = decideHitStop({ event: event('light1', 'none', true), ...PLAYER_ATTACKS }, c);
    expect(kill.frames).toBe(12);
    expect(kill.slowMotion).toEqual({ scale: 0.3, frames: 30 });
    const boss = decideHitStop(
      { event: event('light1', 'none', true), ...PLAYER_ATTACKS, targetIsBoss: true },
      c,
    );
    expect(boss.slowMotion).toEqual({ scale: 0.3, frames: 60 });
    // 溜め強攻撃のトドメは 12F のまま（max）
    expect(
      decideHitStop({ event: event('heavyCharged', 'none', true), ...PLAYER_ATTACKS }, c).frames,
    ).toBe(12);
  });

  it('プレイヤーが倒されても自動ではスローにしない（死亡演出が TimeScale を使う）', () => {
    const c = cfg();
    const d = decideHitStop({ event: event('swing', 'none', true), ...ENEMY_ATTACKS }, c);
    expect(d.slowMotion).toBeNull();
    expect(d.frames).toBe(6);
  });

  it('enabled = false なら何も起きない', () => {
    const c = { ...cfg(), enabled: false };
    expect(decideHitStop({ event: event('light1', 'none', true), ...PLAYER_ATTACKS }, c)).toEqual({
      frames: 0,
      slowMotion: null,
      shake: null,
      flash: null,
    });
  });

  it('tuning の数値を変えると反映される', () => {
    resetTuning();
    tuning.hitStop.playerLight = 7;
    expect(
      decideHitStop({ event: event('light1'), ...PLAYER_ATTACKS }, tuning.hitStop).frames,
    ).toBe(7);
    resetTuning();
  });
});

describe('FreezeCounter', () => {
  it('重ね掛けは長い方を採用し、残りを 1 ステップずつ消費する', () => {
    const c = new FreezeCounter();
    c.freeze(4);
    c.freeze(2);
    expect(c.remaining).toBe(4);
    c.freeze(6);
    expect(c.remaining).toBe(6);
    let frozen = 0;
    while (c.consume()) frozen++;
    expect(frozen).toBe(6);
    expect(c.consume()).toBe(false);
  });
});

describe('攻撃側の硬直がヒットストップぶん遅れて進む（状態機械）', () => {
  type S = 'idle' | 'swing';
  const graph: StateGraph<S> = {
    idle: { kind: 'idle', to: ['swing'] },
    swing: { kind: 'action', to: ['idle'] },
  };
  const SWING_TOTAL = 36;

  /** 軽攻撃（全体 36F）を出し、`hitAtFrame` のステップで命中して `stop` 凍結する。終了までのステップ数を返す。 */
  function swingSteps(hitAtFrame: number | null, stop: number): number {
    const fsm = new CharacterFsm<S>(graph, 'idle');
    fsm.transition('swing');
    let steps = 0;
    for (;;) {
      steps++;
      if (fsm.consumeFreeze()) continue;
      if (fsm.advance() >= SWING_TOTAL) return steps;
      if (fsm.stateFrame === hitAtFrame) fsm.freeze(stop);
    }
  }

  it('軽攻撃（4F）が命中すると、攻撃側の動作は +4F 遅れて終わる', () => {
    expect(swingSteps(null, 4)).toBe(SWING_TOTAL);
    expect(swingSteps(14, 4)).toBe(SWING_TOTAL + 4);
  });

  it('複数ヒットの重ね掛けは長い方（4F と 8F が同時 → 8F）', () => {
    const fsm = new CharacterFsm<S>(graph, 'idle');
    fsm.freeze(8);
    fsm.freeze(4);
    expect(fsm.freezeRemaining).toBe(8);
  });
});

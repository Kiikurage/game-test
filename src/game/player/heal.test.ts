import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { GameEventMap } from '../../core/gameEvents';
import { capsule, capsuleShape, vec3 } from '../combat';
import { HEAL_EMPTY_FRAMES, PLAYER_ACTIONS, PLAYER_STATS, totalFrames } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { Flask } from './flask';

const DT = 1 / 60;

describe('Flask（回復瓶の残数）', () => {
  it('初期 3・最大 3 から始まり、use で 1 ずつ減って 0 で止まる', () => {
    const f = new Flask();
    expect([f.count, f.max]).toEqual([PLAYER_STATS.flask.initial, PLAYER_STATS.flask.initial]);
    expect(f.use()).toBe(true);
    expect(f.use()).toBe(true);
    expect(f.use()).toBe(true);
    expect(f.count).toBe(0);
    expect(f.available).toBe(false);
    expect(f.use()).toBe(false);
    expect(f.count).toBe(0);
  });

  it('refill は最大数まで補充する', () => {
    const f = new Flask();
    f.use();
    f.use();
    f.refill();
    expect(f.count).toBe(f.max);
  });

  it('increaseMax は上限 4 まで（増えた分は残数にも足す）。上限では何もしない', () => {
    const f = new Flask();
    f.use();
    expect(f.increaseMax()).toBe(true);
    expect([f.count, f.max]).toEqual([3, 4]);
    expect(f.increaseMax()).toBe(false);
    f.refill();
    expect(f.count).toBe(4);
  });

  it('restore は範囲に丸め、変化を通知する', () => {
    const f = new Flask();
    const seen: [number, number][] = [];
    f.onChange((c, m) => seen.push([c, m]));
    f.restore(99, 99);
    expect([f.count, f.max]).toEqual([4, 4]);
    f.use();
    expect(seen).toEqual([
      [4, 4],
      [3, 4],
    ]);
  });
});

/**
 * 回復瓶の動作（#48）の結合テスト。F1 は入力と同じステップ。
 * 全体 54F・F26 で HP +120・F26 までロール/攻撃に不可・F30 からロール・先行入力 6F。
 */
describe('heal flask', () => {
  let game: Game;
  let input: FakeInput;

  beforeAll(async () => {
    await Game.create();
  });

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false;
    input = new FakeInput();
    game = await Game.create({ input });
    run(10);
  });

  function run(frames: number): void {
    for (let i = 0; i < frames; i++) {
      game.update(DT);
      input.endStep();
    }
  }

  const hp = () => game.playerTarget.health.current;
  const damage = (n: number): void => {
    game.playerTarget.health.damage(n);
  };
  const stateName = (): string => game.player.state;

  /** 回復ボタンを押して F1 のステップを実行する。 */
  function drink(): void {
    input.press('item');
    run(1);
  }

  /** いま F`from` を実行し終えたところから、F`frame` の直前まで進めて押す（次の `run(1)` が F`frame`）。 */
  function pressBefore(
    action: 'dodge' | 'item' | 'lightAttack',
    frame: number,
    from: number,
  ): void {
    run(frame - from - 1);
    input.press(action);
  }

  /** 敵の 1 ヒット（強靭度削り 30 = 仰け反り）をプレイヤーへ当てる。 */
  function enemyHitsPlayer(): void {
    const p = game.player.feet;
    const attack = game.combat.startAttack('enemy-1', 'enemy', {
      id: 'test-swing',
      damage: 10,
      poiseDamage: 30,
    });
    const shape = capsuleShape(
      capsule(vec3(p.x - 0.3, p.y + 1, p.z), vec3(p.x + 0.3, p.y + 1, p.z), 0.1),
      vec3(p.x, p.y, p.z + 1.5),
    );
    game.combat.resolve(attack, shape);
    game.combat.endAttack(attack);
  }

  describe('動作と HP 加算（F26）', () => {
    it('F1 で瓶を 1 本消費し、F25 まで HP は増えず、F26 で +120 される', () => {
      damage(200); // HP 100
      drink(); // F1
      expect(stateName()).toBe('heal');
      expect(game.player.stateFrame).toBe(1);
      expect(game.player.flask.count).toBe(2);
      expect(game.player.isActionable).toBe(false);
      for (let f = 2; f <= 25; f++) {
        run(1);
        expect(stateName(), `F${f}`).toBe('heal');
        expect(hp(), `F${f}`).toBe(100);
      }
      run(1); // F26
      expect(game.player.stateFrame).toBe(26);
      expect(hp()).toBe(100 + PLAYER_ACTIONS.heal.healAmount);
    });

    it('全体 54F: F54 まで回復動作、F55 で戻る', () => {
      damage(200);
      drink();
      expect(totalFrames(PLAYER_ACTIONS.heal)).toBe(54);
      run(53); // F54
      expect(stateName()).toBe('heal');
      expect(game.player.stateFrame).toBe(54);
      run(1);
      expect(stateName()).toBe('idle');
    });

    it('最大 HP でクランプし、実際に増えた量をイベントで通知する', () => {
      const heals: GameEventMap['heal'][] = [];
      game.events.on('heal', (e) => heals.push(e));
      damage(50);
      drink();
      run(26);
      expect(hp()).toBe(PLAYER_STATS.hp);
      expect(heals).toHaveLength(1);
      expect(heals[0]?.amount).toBe(50);
      expect(heals[0]?.hp).toBe(PLAYER_STATS.hp);
      expect(game.eventCounts.healStart).toBe(1);
      expect(game.eventCounts.healApply).toBe(1);
    });

    it('飲む音（開始）と光の音（F26）を sound イベントで鳴らす', () => {
      const cues: string[] = [];
      game.events.on('sound', (e) => cues.push(e.cue));
      damage(100);
      drink();
      expect(cues).toEqual(['sfx.heal-drink']);
      run(25);
      expect(cues).toEqual(['sfx.heal-drink', 'sfx.heal-glow']);
    });

    it('healApply マーカーが F26 で発火する', () => {
      damage(100);
      drink();
      run(24);
      expect(game.markerCounts.healApply).toBe(0);
      run(1);
      expect(game.markerCounts.healApply).toBe(1);
    });

    it('回復中は 1.0 m/s で動ける', () => {
      damage(100);
      input.setMove(0, 1);
      drink();
      run(20);
      expect(stateName()).toBe('heal');
      expect(game.player.speed).toBeGreaterThan(0.9);
      expect(game.player.speed).toBeLessThanOrEqual(1.0 + 1e-6);
    });
  });

  describe('発動条件', () => {
    it('HP が満タンなら入力しても動作せず、瓶も減らない（入力は消費される）', () => {
      drink();
      expect(stateName()).toBe('idle');
      expect(game.player.flask.count).toBe(3);
      // 先行入力が残って、後で被弾したときに勝手に飲まない
      damage(100);
      run(3);
      expect(stateName()).toBe('idle');
    });

    it('残数 0 では空振り（20F・回復なし・SE のみ）', () => {
      damage(100);
      game.player.flask.restore(0);
      const cues: string[] = [];
      game.events.on('sound', (e) => cues.push(e.cue));
      drink();
      expect(stateName()).toBe('healEmpty');
      expect(game.eventCounts.healEmpty).toBe(1);
      expect(HEAL_EMPTY_FRAMES).toBe(20);
      run(19); // F20
      expect(stateName()).toBe('healEmpty');
      expect(game.player.stateFrame).toBe(20);
      expect(hp()).toBe(200);
      run(1);
      expect(stateName()).toBe('idle');
      expect(hp()).toBe(200);
      expect(game.player.flask.count).toBe(0);
      expect(cues).not.toContain('sfx.heal-glow');
    });

    it('スタミナ 0 でも飲める', () => {
      damage(100);
      game.player.stamina.consume(100);
      drink();
      expect(stateName()).toBe('heal');
    });
  });

  describe('中断（F26 より前の被弾）', () => {
    it('F26 より前に仰け反ると、回復は失われ瓶だけ消費される', () => {
      damage(100);
      drink();
      run(9); // F10
      enemyHitsPlayer();
      expect(stateName()).toBe('flinch');
      const hpAfterHit = hp();
      expect(hpAfterHit).toBe(200 - 10);
      run(120);
      expect(stateName()).not.toBe('flinch');
      expect(hp()).toBe(hpAfterHit);
      expect(game.player.flask.count).toBe(2);
      expect(game.eventCounts.healApply).toBe(0);
    });

    it('F26 以降に仰け反っても、すでに加算された回復は残る', () => {
      damage(200);
      drink();
      run(29); // F30
      expect(hp()).toBe(100 + 120);
      enemyHitsPlayer();
      expect(hp()).toBe(220 - 10);
    });
  });

  describe('キャンセル窓', () => {
    it('F1–F25 はロールへキャンセルできない。F30 から可能', () => {
      damage(100);
      drink();
      for (let f = 2; f <= 29; f++) {
        // F22 以前の入力は F30 まで保持されない（ロール 8F）が、ここでは毎フレーム押し直して窓だけを見る
        input.press('dodge');
        run(1);
        if (f <= 29) expect(stateName(), `F${f}`).toBe('heal');
      }
      run(1); // F30: 先行入力を消費してロール（移動入力なし → バックステップ）
      expect(stateName()).toBe('backstep');
    });

    it('先行入力の境界: F22 の入力は F30 まで届かない（ロール 8F）', () => {
      damage(100);
      drink();
      pressBefore('dodge', 22, 1);
      run(1); // F22（押下と同じステップ）
      run(8); // F30
      expect(game.player.stateFrame).toBe(30);
      expect(stateName()).toBe('heal');
    });

    it('先行入力の境界: F23 の入力は F30 まで届き、窓の最初のフレームでロールへ', () => {
      damage(100);
      drink();
      pressBefore('dodge', 23, 1);
      run(1); // F23
      run(6); // F29: まだ回復
      expect(stateName()).toBe('heal');
      run(1); // F30
      expect(stateName()).toBe('backstep');
    });
  });

  describe('攻撃へのキャンセル（F36）', () => {
    it('F27 の攻撃入力（10F）は F36 まで届き、窓の最初のフレームで軽 1 へ', () => {
      damage(100);
      drink();
      pressBefore('lightAttack', 27, 1);
      run(1); // F27
      run(8); // F35: まだ回復
      expect(stateName()).toBe('heal');
      run(1); // F36
      expect(stateName()).toBe('light1');
      expect(game.player.stateFrame).toBe(1);
    });

    it('F26 の攻撃入力は F36 には届かない', () => {
      damage(100);
      drink();
      pressBefore('lightAttack', 26, 1);
      run(1); // F26
      run(10); // F36
      expect(stateName()).toBe('heal');
    });

    it('F1–F25 は攻撃へキャンセルできない', () => {
      damage(100);
      drink();
      for (let f = 2; f <= 25; f++) {
        input.press('lightAttack');
        run(1);
        expect(stateName(), `F${f}`).toBe('heal');
      }
    });
  });

  describe('先行入力 6F', () => {
    /** ロールを出して、ロールの F`frame` で回復ボタンを押し、F26 以降の状態を見る。 */
    function rollThenItem(frame: number): void {
      damage(100);
      input.setMove(0, 1);
      input.press('dodge');
      run(1); // ロール F1
      input.setMove(0, 0);
      input.hold('dodge', false);
      pressBefore('item', frame, 1);
      run(1); // ロール F`frame`（押下と同じステップ）
    }

    it('ロール F21 の入力は F26 まで保持され（6F）、F26 の窓で回復へ繋がる', () => {
      rollThenItem(21);
      run(4); // F25
      expect(stateName()).toBe('roll');
      run(1); // F26
      expect(stateName()).toBe('heal');
      expect(game.player.stateFrame).toBe(1);
    });

    it('ロール F20 の入力は F26 には届かない（6F を過ぎている）', () => {
      rollThenItem(20);
      run(6); // F26
      expect(stateName()).not.toBe('heal');
    });
  });

  describe('補充 API', () => {
    it('respawn（死亡・篝火の代わり）で瓶が最大数まで補充される', () => {
      game.player.flask.use();
      game.player.flask.use();
      expect(game.player.flask.count).toBe(1);
      game.respawn();
      expect(game.player.flask.count).toBe(game.player.flask.max);
    });
  });
});

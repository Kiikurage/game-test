import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import { ARENA_BONFIRE_ID } from '../data/bonfire';
import { BOSS_ENTRY } from '../data/bossEntry';
import { FOG_GATE } from '../data/fogGate';
import { fogGateOf } from '../fogGate/fogGate.system';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { bossSystemOf } from './boss.system';
import './bossEntry.system';

const DT = 1 / 60;

/** ボスの入場（霧の門 → 闘技場 → 入場演出 90F の無敵 → 戦闘開始）と、死亡時のリセット・撃破済みセーブ（#85）。 */
describe('boss entry', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(options: { defeated?: boolean } = {}) {
    const input = new FakeInput();
    const save = new SaveStore(new MemoryStorage());
    if (options.defeated) save.defeatBoss('boss');
    const game = await Game.create({
      input,
      save,
      boxes: [
        { id: 'fog-gate', x: 10, y: 3, z: 40, hx: 2, hy: 3, hz: 0.3, yawDeg: 0, enabled: false },
      ],
      dummies: [],
      enemies: [],
      interactables: [
        { id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: -30 },
        { id: ARENA_BONFIRE_ID, kind: 'bonfire', area: 'F', x: 10, z: 70 },
        { id: 'fog-gate', kind: 'gate', area: 'E', x: 10, z: 40, target: { x: 10, z: 54, yaw: 0 } },
      ],
      spawn: { x: 10, z: 38, yaw: 0 },
    });
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    run(2);
    const gate = fogGateOf(game);
    if (!gate) throw new Error('no fog gate');
    const events: string[] = [];
    game.events.on('bossIntro', () => events.push('intro'));
    game.events.on('bossEngaged', () => events.push('engaged'));
    game.events.on('bossReset', () => events.push('reset'));
    game.events.on('bgmChange', (e) => events.push(e.track));
    return { game, gate, run, events, boss: bossSystemOf(game) };
  }

  it('waits dormant at home; invulnerable for 90F after arrival, then engages (HP bar event)', async () => {
    const { gate, run, events, boss } = await setup();
    const b = boss.boss;
    if (!b) throw new Error('no boss');
    expect(b.state).toBe('dormant');
    expect(b.invulnerable).toBe(false);
    expect(gate.enter()).toBe(true);
    run(FOG_GATE.enterFrames - 1);
    expect(events).toEqual([]);
    run(1); // 入場演出の完了 = 闘技場へ着いた
    expect(gate.state).toBe('sealed');
    expect(events).toEqual(['intro', 'bgm.boss']);
    expect(b.invulnerable).toBe(true);
    expect(b.introFrame).toBeGreaterThanOrEqual(0);
    run(BOSS_ENTRY.introFrames - 2);
    expect(b.isEngaged).toBe(false);
    expect(b.invulnerable).toBe(true);
    run(2);
    expect(b.isEngaged).toBe(true);
    expect(b.invulnerable).toBe(false);
    expect(events).toEqual(['intro', 'bgm.boss', 'engaged']);
    expect(gate.blocked).toBe(true); // 戦闘中は封鎖
  });

  it('cannot be damaged during the intro', async () => {
    const { gate, run, boss } = await setup();
    gate.enter();
    run(FOG_GATE.enterFrames + 5);
    const hp = boss.boss?.hp ?? 0;
    expect(boss.boss?.invulnerable).toBe(true);
    expect(hp).toBeGreaterThan(0);
  });

  it('resets on the player death: boss back to full HP at home, gate closed, BGM back', async () => {
    const { game, gate, run, events, boss } = await setup();
    gate.enter();
    run(FOG_GATE.enterFrames + BOSS_ENTRY.introFrames + 5);
    const b = boss.boss;
    if (!b) throw new Error('no boss');
    expect(b.isEngaged).toBe(true);
    boss.damage(1000);
    expect(b.hp).toBeLessThan(b.maxHp);
    game.playerTarget.health.damage(10_000);
    run(400);
    expect(events).toContain('reset');
    expect(events).toContain('bgm.area');
    expect(b.isEngaged).toBe(false);
    expect(b.state).toBe('dormant');
    expect(b.hp).toBe(b.maxHp);
    expect(gate.state).toBe('closed');
    // 再挑戦できる
    expect(gate.enter()).toBe(true);
  });

  it('aborts the intro when the player dies during it', async () => {
    const { game, gate, run, boss } = await setup();
    gate.enter();
    run(FOG_GATE.enterFrames + 20);
    const b = boss.boss;
    expect(b?.invulnerable).toBe(true);
    game.playerTarget.health.damage(10_000);
    run(400);
    expect(b?.invulnerable).toBe(false);
    expect(b?.isEngaged).toBe(false);
  });

  it('does not spawn the boss when the defeat is in the save (the gate is open, no rematch)', async () => {
    const { gate, run, boss, events } = await setup({ defeated: true });
    expect(boss.boss).toBeNull();
    expect(gate.state).toBe('open');
    run(30);
    expect(events).toEqual([]);
  });
});

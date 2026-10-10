import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import { FOG_GATE } from '../data/fogGate';
import { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { FakeInput } from '../testing/fakeInput';
import { entryVeil } from './fogGate';
import { fogGateOf } from './fogGate.system';

const DT = 1 / 60;
/** 門は (10, 10)、北（+z）へ通り抜ける。闘技場の入場位置は (10, 30) で北を向く。 */
const GATE = { x: 10, z: 10 };
const TARGET = { x: 10, z: 30, yaw: 0 };

/** 霧の門（状態遷移・入場演出・封鎖・撃破済みセーブ）の結合テスト。平らな地面。 */
describe('fog gate', () => {
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
        {
          id: 'fog-gate',
          x: GATE.x,
          y: 3,
          z: GATE.z,
          hx: 2.2,
          hy: 3,
          hz: 0.3,
          yawDeg: 0,
          enabled: false,
        },
      ],
      dummies: [],
      enemies: [],
      interactables: [{ id: 'fog-gate', kind: 'gate', area: 'E', ...GATE, target: TARGET }],
      spawn: { x: GATE.x, z: GATE.z - 2, yaw: 0 },
    });
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    const gate = fogGateOf(game);
    if (!gate) throw new Error('no fog gate');
    const enteredAt: number[] = [];
    let frame = 0;
    gate.onEntered(() => enteredAt.push(frame));
    const runCounted = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        frame++;
        run(1);
      }
    };
    return { game, input, save, gate, run: runCounted, enteredAt };
  }

  it('is null for a level without a fog gate', async () => {
    const game = await Game.create({ boxes: [], dummies: [], enemies: [] });
    expect(fogGateOf(game)).toBeNull();
  });

  it('starts closed: shows the prompt near the gate and blocks the way', async () => {
    const { game, input, gate, run } = await setup();
    expect(gate.state).toBe('closed');
    expect(gate.blocked).toBe(true);
    run(5);
    expect(interactionOf(game).prompt).toEqual({
      id: 'fog-gate',
      kind: 'gate',
      label: '霧へ入る',
    });
    input.setMove(0, 1);
    run(120);
    expect(game.player.feet.z).toBeLessThan(GATE.z);
  });

  it('plays a 90F entry: input is disabled, the player moves to the arena at F70, then it seals', async () => {
    const { game, input, gate, run, enteredAt } = await setup();
    run(5);
    input.press('interact');
    run(1);
    expect(gate.state).toBe('entering');
    expect(gate.entering).toBe(true);
    expect(game.player.forcedWalking).toBe(true);
    expect(interactionOf(game).prompt).toBeNull();

    // 入力は効かない: 後ろ向きの移動・攻撃・ロールを押しても、門の向こうへ歩く
    input.setMove(0, -1);
    input.press('lightAttack');
    run(1);
    input.press('dodge');
    run(1);
    expect(game.player.state).not.toBe('roll');
    expect(game.player.state).not.toMatch(/^light/);
    run(30);
    expect(game.player.feet.z).toBeGreaterThan(GATE.z - 2);
    // 門のコライダは演出中は無効（霧へ歩み入る）
    expect(gate.blocked).toBe(false);

    // F70 で闘技場の入場位置へ移る
    const before = enteredAt.length;
    expect(gate.entryProgress).toBeLessThan(FOG_GATE.teleportFrame);
    while (gate.entryProgress <= FOG_GATE.teleportFrame) run(1);
    expect(game.player.feet.z).toBeGreaterThan(TARGET.z - 3);
    expect(game.player.feet.z).toBeLessThan(TARGET.z + 2);
    expect(Math.abs(game.player.feet.x - TARGET.x)).toBeLessThan(1);
    expect(gate.state).toBe('entering');
    expect(enteredAt.length).toBe(before);

    // F90 で完了: 操作が戻り、背後の門は封鎖される
    while (gate.entering) run(1);
    expect(gate.entryProgress).toBe(FOG_GATE.enterFrames);
    expect(enteredAt).toHaveLength(1);
    expect(gate.state).toBe('sealed');
    expect(gate.blocked).toBe(true);
    expect(game.player.forcedWalking).toBe(false);
    input.setMove(0, 0);
    run(30);
    expect(interactionOf(game).busy).toBe(false);
    expect(['idle', 'move']).toContain(game.player.state);
  });

  it('cannot go back through a sealed gate, and can once unsealed', async () => {
    const { game, input, gate, run } = await setup();
    run(2);
    expect(gate.seal()).toBe(true);
    expect(gate.seal()).toBe(false);
    expect(gate.state).toBe('sealed');
    // 闘技場側から戻ろうとしても通れない
    game.teleportPlayer(GATE.x, GATE.z + 2, Math.PI);
    input.setMove(0, 1);
    run(120);
    expect(game.player.feet.z).toBeGreaterThan(GATE.z);

    expect(gate.unseal()).toBe(true);
    expect(gate.unseal()).toBe(false);
    expect(gate.state).toBe('open');
    expect(gate.blocked).toBe(false);
    run(120);
    expect(game.player.feet.z).toBeLessThan(GATE.z - 1);
  });

  it('closes again when the player dies (fog returns), and reopens the entry', async () => {
    const { game, input, gate, run } = await setup();
    run(5);
    input.press('interact');
    run(FOG_GATE.enterFrames + 5);
    expect(gate.state).toBe('sealed');
    game.playerTarget.health.damage(10_000);
    run(3);
    expect(gate.state).toBe('closed');
    expect(gate.blocked).toBe(true);
    expect(gate.enter()).toBe(true);
  });

  it('aborts the entry when the player dies during it, releasing the interaction lock', async () => {
    const { game, input, gate, run } = await setup();
    run(5);
    input.press('interact');
    run(10);
    expect(gate.state).toBe('entering');
    game.playerTarget.health.damage(10_000);
    run(3);
    expect(gate.state).toBe('closed');
    expect(interactionOf(game).busy).toBe(false);
    expect(game.player.forcedWalking).toBe(false);
  });

  it('unseal during the entry cancels it', async () => {
    const { game, gate, run, input } = await setup();
    run(5);
    input.press('interact');
    run(10);
    expect(gate.unseal()).toBe(true);
    expect(gate.state).toBe('open');
    expect(game.player.forcedWalking).toBe(false);
    expect(interactionOf(game).busy).toBe(false);
  });

  it('with a defeated boss in the save the gate is open: passable, no prompt, no rematch', async () => {
    const { game, input, gate, run, enteredAt } = await setup({ defeated: true });
    expect(gate.state).toBe('open');
    expect(gate.blocked).toBe(false);
    run(5);
    expect(interactionOf(game).prompt).toBeNull();
    expect(gate.enter()).toBe(false);
    input.setMove(0, 1);
    run(120);
    expect(game.player.feet.z).toBeGreaterThan(GATE.z + 1);
    expect(enteredAt).toHaveLength(0);
    // 死亡しても霧は戻らない
    game.playerTarget.health.damage(10_000);
    run(3);
    expect(gate.state).toBe('open');
  });

  it('opens when the boss defeat is recorded after the fact', async () => {
    const { game, gate, run } = await setup();
    run(2);
    expect(gate.state).toBe('closed');
    game.save.defeatBoss('boss');
    run(2);
    expect(gate.state).toBe('open');
  });

  it('notifies state changes', async () => {
    const { gate, run } = await setup();
    const seen: string[] = [];
    gate.onStateChange((s, p) => seen.push(`${p}>${s}`));
    run(1);
    gate.seal();
    gate.unseal();
    expect(seen).toEqual(['closed>sealed', 'sealed>open']);
  });
});

describe('entryVeil', () => {
  it('rises to 1 by the teleport frame and clears by the end', () => {
    expect(entryVeil(-1)).toBe(0);
    expect(entryVeil(0)).toBe(0);
    expect(entryVeil(FOG_GATE.veilStartFrame)).toBe(0);
    expect(entryVeil(FOG_GATE.teleportFrame)).toBe(1);
    expect(entryVeil(FOG_GATE.veilClearFrame)).toBe(0);
    expect(entryVeil(FOG_GATE.veilClearFrame + 10)).toBe(0);
    let prev = 0;
    for (let f: number = FOG_GATE.veilStartFrame; f <= FOG_GATE.veilFullFrame; f++) {
      const v = entryVeil(f);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

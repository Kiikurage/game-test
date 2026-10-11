import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import { SHORTCUT } from '../data/shortcut';
import { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { FakeInput } from '../testing/fakeInput';
import { shortcutOf } from './shortcut.system';

const DT = 1 / 60;
/** 鉄門は (0, 10)、北（+z）が中庭側。レバーは門の北東 (2, 14)。 */
const GATE = { x: 0, z: 10 };
const LEVER = { x: 2, z: 14 };
const TOTAL = SHORTCUT.gateStartFrame + SHORTCUT.gateFrames;

/** ショートカット（鉄門 G1・レバー・開通のセーブ）の結合テスト。平らな地面。 */
describe('shortcut (iron gate G1 and lever)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(
    options: {
      storage?: MemoryStorage;
      spawn?: { x: number; z: number };
      lever?: { x: number; z: number };
      withBox?: boolean;
    } = {},
  ) {
    const input = new FakeInput();
    const storage = options.storage ?? new MemoryStorage();
    const save = new SaveStore(storage);
    const lever = options.lever ?? LEVER;
    const game = await Game.create({
      input,
      save,
      boxes:
        options.withBox === false
          ? []
          : [
              {
                id: 'G1',
                x: GATE.x,
                y: 1.8,
                z: GATE.z,
                hx: 2.6,
                hy: 1.8,
                hz: 0.3,
                yawDeg: 0,
                enabled: true,
              },
            ],
      dummies: [],
      enemies: [],
      interactables: [
        { id: 'G1', kind: 'gate', area: null, ...GATE },
        { id: 'lever-g1', kind: 'lever', area: null, ...lever },
      ],
      spawn: { ...(options.spawn ?? { x: LEVER.x, z: LEVER.z - 1 }), yaw: 0 },
    });
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    const sc = shortcutOf(game);
    if (!sc) throw new Error('no shortcut');
    return { game, input, save, storage, sc, run };
  }

  it('is null for a level without an iron gate', async () => {
    const game = await Game.create({ boxes: [], dummies: [], enemies: [] });
    expect(shortcutOf(game)).toBeNull();
  });

  it('starts closed and blocks the road', async () => {
    const { game, input, sc, run } = await setup({ spawn: { x: 0, z: 6 } });
    expect(sc.state).toBe('closed');
    expect(sc.blocked).toBe(true);
    input.setMove(0, 1);
    run(120);
    expect(game.player.feet.z).toBeLessThan(GATE.z);
  });

  it('shows the lever prompt only from the north (courtyard) side', async () => {
    // 北側（レバーの近く）: 「押す」が出る
    const north = await setup();
    north.run(5);
    expect(interactionOf(north.game).prompt).toEqual({
      id: 'lever-g1',
      kind: 'lever',
      label: '押す',
    });
    // 南側: レバーが鉄門のすぐ北にあって半径内でも、門の南からは候補にならない
    const south = await setup({
      withBox: false,
      lever: { x: 0, z: 10.4 },
      spawn: { x: 0, z: 9.4 },
    });
    south.run(5);
    expect(south.game.player.feet.z).toBeLessThan(GATE.z);
    expect(interactionOf(south.game).prompt).toBeNull();
    // 同じ配置でも、北側へ回れば出る
    south.game.teleportPlayer(0, 11.4, 0);
    south.run(5);
    expect(interactionOf(south.game).prompt?.id).toBe('lever-g1');
    // 遠い（南の A 側の道）では出ない
    north.game.teleportPlayer(0, 4, 0);
    north.run(5);
    expect(interactionOf(north.game).prompt).toBeNull();
  });

  it('pulls the lever, opens the gate in ~3s, saves, and disables the collider at the end', async () => {
    const { game, input, save, sc, run } = await setup();
    let opened = 0;
    game.events.on('shortcutOpened', () => opened++);
    run(5);
    input.press('interact');
    run(1);
    expect(sc.state).toBe('opening');
    expect(game.player.state).toBe('interact');
    expect(opened).toBe(1);
    // 開通は操作の瞬間にセーブされる
    expect(save.get().shortcuts).toEqual(['G1']);
    expect(interactionOf(game).prompt).toBeNull();

    // 開く途中は塞いだまま。進み具合は単調に増える
    let last = 0;
    for (let i = 0; i < TOTAL - 5; i++) {
      run(1);
      expect(sc.gateProgress).toBeGreaterThanOrEqual(last);
      last = sc.gateProgress;
    }
    expect(sc.state).toBe('opening');
    expect(sc.blocked).toBe(true);
    expect(sc.gateProgress).toBeGreaterThan(0.9);
    run(10);
    expect(sc.state).toBe('open');
    expect(sc.blocked).toBe(false);
    expect(sc.gateProgress).toBe(1);
    expect(sc.leverProgress).toBe(1);
    // 二度目の操作はない
    expect(sc.open()).toBe(false);
    run(5);
    expect(interactionOf(game).prompt).toBeNull();
    expect(opened).toBe(1);
  });

  it('lets the player run through G1 from the south once open', async () => {
    const { game, input, sc, run } = await setup();
    run(5);
    input.press('interact');
    run(TOTAL + 5);
    expect(sc.state).toBe('open');
    game.teleportPlayer(GATE.x, GATE.z - 4, 0);
    input.setMove(0, 1);
    run(120);
    expect(game.player.feet.z).toBeGreaterThan(GATE.z + 2);
  });

  it('restores the open state from the save (starts open, no collider, no prompt)', async () => {
    const storage = new MemoryStorage();
    const first = await setup({ storage });
    first.run(5);
    first.input.press('interact');
    first.run(2);
    expect(first.save.get().shortcuts).toContain('G1');

    // 同じストレージから始め直す（ロード）
    const second = await setup({ storage, spawn: { x: 0, z: 6 } });
    expect(second.sc.state).toBe('open');
    expect(second.sc.blocked).toBe(false);
    expect(second.sc.gateProgress).toBe(1);
    second.input.setMove(0, 1);
    second.run(120);
    expect(second.game.player.feet.z).toBeGreaterThan(GATE.z + 2);
    second.game.teleportPlayer(LEVER.x, LEVER.z - 1, 0);
    second.run(5);
    expect(interactionOf(second.game).prompt).toBeNull();
  });
});

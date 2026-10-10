import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore, SAVE_KEY } from '../../core/persistence';
import type { GameEventMap } from '../../core/gameEvents';
import { bonfiresOf } from '../bonfire/bonfire';
import { sectorShape } from '../combat';
import { ARENA_BONFIRE_ID } from '../data/bonfire';
import { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { FakeInput } from '../testing/fakeInput';
import { bossSystemOf, BOSS_ID } from './boss.system';
import { BOSS_MOVE_IDS } from './bossData';
import { BossMoveRegistry } from './bossMove';
import { bossDefeatOf } from './bossDefeat.system';

const DT = 1 / 60;
const ARENA_AT = { x: 20, z: 20 };

/** ボス撃破演出（#86 / 8.4 節）: 各 F のイベント・撃破のセーブ・台座の篝火・再起動でボスが出ない。 */
describe('boss defeat cutscene (Rapier)', () => {
  beforeAll(async () => {
    await Game.create();
  });

  const quietMoves = (): BossMoveRegistry => {
    const reg = new BossMoveRegistry();
    for (const id of BOSS_MOVE_IDS) {
      reg.register({
        id,
        name: id,
        phases: [1, 2],
        stages: [
          {
            id: `${id}.1`,
            startup: 40,
            active: 8,
            recovery: 40,
            damage: 0,
            poiseDamage: 0,
            guardStaminaCost: 0,
            moveDistance: 0,
            arcDeg: 120,
            range: 5,
            trackEndFrame: 20,
          },
        ],
      });
    }
    return reg;
  };

  async function setup(storage = new MemoryStorage(), options: { spawn?: boolean } = {}) {
    const input = new FakeInput();
    const game = await Game.create({
      input,
      save: new SaveStore(storage),
      boxes: [],
      dummies: [],
      enemies: [],
      interactables: [
        { id: 'bonfire', kind: 'bonfire', area: 'A', x: 0, z: -30 },
        { id: ARENA_BONFIRE_ID, kind: 'bonfire', area: 'F', x: ARENA_AT.x, z: ARENA_AT.z },
      ],
      spawn: { x: 0, z: 2.5, yaw: Math.PI },
    });
    let step = 0;
    const log: { step: number; name: string; payload: Record<string, unknown> }[] = [];
    for (const name of [
      'bossDefeatCue',
      'bossDefeated',
      'bgmFadeOut',
      'bossSlam',
      'sound',
      'verticalSliceEnd',
      'rest',
    ] as const) {
      game.events.on(name, (payload: GameEventMap[typeof name]) =>
        log.push({ step, name, payload: payload }),
      );
    }
    const system = bossSystemOf(game);
    const boss =
      options.spawn === false
        ? null
        : system.spawnUnlessDefeated({ x: 0, z: 0, yaw: 0, moves: quietMoves(), engage: true });
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        step++;
        game.update(DT);
        input.endStep();
      }
    };
    /** トドメの 1 発（HP を超えるダメージ）。 */
    const finish = () => {
      const attack = game.combat.startAttack('player', 'player', {
        id: 'test',
        damage: 100000,
        poiseDamage: 0,
      });
      game.combat.resolve(attack, sectorShape({ x: 0, y: 0, z: 3.2 }, Math.PI, 90, 3));
      game.combat.endAttack(attack);
      run(1);
      return step;
    };
    const cues = (cue: string) =>
      log.filter((e) => e.name === 'bossDefeatCue' && e.payload['cue'] === cue);
    return { game, input, storage, boss, system, run, finish, log, cues, stepNow: () => step };
  }

  const savedBosses = (storage: MemoryStorage): string[] => {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as { data: { bosses: string[] } }).data.bosses;
  };

  it('emits the cues at F0 / F62 / F72 / F150 / F300 / F360 after the finishing blow', async () => {
    const { game, run, finish, cues, boss } = await setup();
    run(3);
    expect(bossDefeatOf(game).frame).toBe(-1);
    const t0 = finish();
    expect(boss?.alive).toBe(false);
    // 撃破のステップ（combat.step の中）が F0、その次のステップが F1
    expect(bossDefeatOf(game).frame).toBe(1);
    run(365);
    const at = (c: string) => cues(c).map((e) => e.step - t0 + 1);
    expect(at('defeat')).toEqual([0]);
    expect(at('touchdown')).toEqual([62]);
    expect(at('collapse')).toEqual([72]);
    expect(at('text')).toEqual([150]);
    expect(at('fogClear')).toEqual([300]);
    expect(at('bonfire')).toEqual([300]);
    expect(at('control')).toEqual([360]);
    // ペイロードに F が入る
    expect(cues('text')[0]?.payload['frame']).toBe(150);
  });

  it('starts the 0.3x slow motion after the 12F hit stop and sends the BGM fade at F72', async () => {
    const { game, run, finish, log } = await setup();
    run(3);
    const t0 = finish();
    expect(game.timeScale.active).toBe(true);
    expect(game.timeScale.remainingFrames).toBe(60);
    run(80);
    expect(game.timeScale.active).toBe(false);
    const fade = log.filter((e) => e.name === 'bgmFadeOut');
    expect(fade.map((e) => [e.step - t0 + 1, e.payload['frames']])).toEqual([[72, 90]]);
    const slam = log.filter((e) => e.name === 'bossSlam');
    expect(slam.map((e) => e.step - t0 + 1)).toEqual([62]);
    const sounds = log
      .filter((e) => e.name === 'sound')
      .map((e) => [e.step - t0 + 1, e.payload['cue']]);
    expect(sounds).toContainEqual([0, 'sfx.boss.defeat']);
    expect(sounds).toContainEqual([72, 'sfx.defeat-ash']);
  });

  it('saves the defeat at F0 and never respawns the boss after a restart', async () => {
    const storage = new MemoryStorage();
    const { game, run, finish, system } = await setup(storage);
    run(3);
    expect(savedBosses(storage)).toEqual([]);
    finish();
    expect(savedBosses(storage)).toEqual([BOSS_ID]);
    expect(game.save.get().bosses).toEqual([BOSS_ID]);
    expect(system.isDefeated).toBe(true);
    // 再起動（同じストレージから新しいゲーム）: ボスは出ない
    const again = await setup(storage);
    expect(again.boss).toBeNull();
    expect(again.system.boss).toBeNull();
    expect(again.system.isDefeated).toBe(true);
    expect(again.game.bossIds.size).toBe(0);
    // 確認用の spawn はセーブを見ない
    expect(again.system.spawn({ x: 0, z: 0, moves: quietMoves() })).toBeTruthy();
  });

  it('keeps the defeated boss down after resting at a bonfire (only normal enemies come back)', async () => {
    const { game, run, finish, system } = await setup(undefined, {});
    run(3);
    finish();
    run(200);
    game.events.emit('rest', {
      cause: 'rest',
      bonfireId: 'bonfire',
      position: { x: 0, y: 0, z: 0 },
      defeatedBosses: game.save.get().bosses,
    });
    expect(system.boss?.alive).toBe(false);
  });

  it('lights the arena bonfire at F300 (saved, usable from F360)', async () => {
    const { game, run, finish, storage, input } = await setup();
    const bonfire = bonfiresOf(game);
    run(3);
    // 撃破前は存在しない
    expect(bonfire.ids).toEqual(['bonfire']);
    const t0 = finish();
    run(290);
    expect(bonfire.ids).toEqual(['bonfire']);
    run(11); // F300
    expect(bonfire.ids).toEqual(['bonfire', ARENA_BONFIRE_ID]);
    expect(bonfire.isLit(ARENA_BONFIRE_ID)).toBe(true);
    expect(game.save.get().bonfires).toContain(ARENA_BONFIRE_ID);
    const raw = JSON.parse(storage.getItem(SAVE_KEY) ?? '{}') as { data: { bonfires: string[] } };
    expect(raw.data.bonfires).toContain(ARENA_BONFIRE_ID);
    expect(bossDefeatOf(game).frame).toBeGreaterThanOrEqual(300);
    expect(t0).toBeGreaterThan(0);
    // 操作可能になる F360 までは「休む」を出さない
    game.teleportPlayer(ARENA_AT.x, ARENA_AT.z - 1.2, 0);
    run(5);
    expect(bossDefeatOf(game).controlRestored).toBe(false);
    expect(interactionOf(game).prompt).toBeNull();
    run(60);
    expect(bossDefeatOf(game).controlRestored).toBe(true);
    expect(interactionOf(game).prompt).toEqual({
      id: ARENA_BONFIRE_ID,
      kind: 'bonfire',
      label: '休む',
    });
    input.press('interact');
    run(1);
    expect(game.player.resting || game.player.state === 'sitDown').toBe(true);
  });

  it('emits verticalSliceEnd when resting at the arena bonfire, not at the others', async () => {
    const { game, run, finish, log } = await setup();
    run(3);
    finish();
    run(370);
    game.events.emit('rest', {
      cause: 'rest',
      bonfireId: 'bonfire',
      position: { x: 0, y: 0, z: 0 },
      defeatedBosses: [BOSS_ID],
    });
    expect(log.filter((e) => e.name === 'verticalSliceEnd')).toHaveLength(0);
    game.events.emit('rest', {
      cause: 'rest',
      bonfireId: ARENA_BONFIRE_ID,
      position: { x: ARENA_AT.x, y: 0, z: ARENA_AT.z },
      defeatedBosses: [BOSS_ID],
    });
    expect(log.filter((e) => e.name === 'verticalSliceEnd')).toHaveLength(1);
  });

  it('has the arena bonfire lit and usable from the start when the boss is already defeated', async () => {
    const storage = new MemoryStorage();
    const first = await setup(storage);
    first.run(3);
    first.finish();
    const again = await setup(storage);
    const bonfire = bonfiresOf(again.game);
    expect(bonfire.ids).toEqual(['bonfire', ARENA_BONFIRE_ID]);
    expect(bonfire.isLit(ARENA_BONFIRE_ID)).toBe(true);
    again.game.teleportPlayer(ARENA_AT.x, ARENA_AT.z - 1.2, 0);
    again.run(5);
    expect(interactionOf(again.game).prompt?.label).toBe('休む');
    expect(bossDefeatOf(again.game).frame).toBe(-1);
    expect(bossDefeatOf(again.game).controlRestored).toBe(true);
  });

  it('does not add the arena bonfire before the boss is defeated', async () => {
    const { game } = await setup();
    expect(bonfiresOf(game).ids).toEqual(['bonfire']);
    expect(interactionOf(game).get(ARENA_BONFIRE_ID)).toBeUndefined();
  });
});

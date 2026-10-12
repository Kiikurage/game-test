import { describe, expect, it } from 'vitest';
import { MemoryStorage, SAVE_KEY } from '../../core/persistence';
import {
  createHeadlessGame,
  settle,
  stepUntil,
  tap,
  type HeadlessGame,
} from '../testing/headlessGame';

/**
 * 実レベルの篝火・死亡・回復瓶の通し（E2E の bonfire / death / item から移した）。敵は置かない。
 * 個々の数値（点火の 2 秒、休憩の効果、死亡タイムラインの各フレーム）は bonfire.test / death.test / item.test が見ている。
 */
const boot = async (storage = new MemoryStorage()): Promise<HeadlessGame> => {
  const h = await createHeadlessGame({ enemies: [], storage });
  settle(h);
  return h;
};

const savedBonfires = (storage: MemoryStorage): string[] => {
  const raw = storage.getItem(SAVE_KEY);
  return raw ? (JSON.parse(raw) as { data: { bonfires: string[] } }).data.bonfires : [];
};

const until = <T>(h: HeadlessGame, read: () => T, ok: (v: T) => boolean, maxSteps = 600): T =>
  stepUntil(h, read, ok, { maxSteps });

const playerState = (h: HeadlessGame) => h.dev.bonfire().playerState;
const prompt = (h: HeadlessGame) => h.dev.bonfire().prompt?.label;

describe('bonfire on the level', () => {
  it('ignites the bonfire, rests, stands up, and the save reflects it', async () => {
    const storage = new MemoryStorage();
    const h = await boot(storage);
    expect(h.dev.bonfire().lit).toEqual([]);
    expect(savedBonfires(storage)).toEqual([]);

    // 篝火の 1.5m 以内（南 1.2m）へ。状況アクション「火を灯す」が出る
    h.game.teleportPlayer(0, -1.2, 0);
    until(
      h,
      () => prompt(h),
      (v) => v === '火を灯す',
    );

    // 点火: 動作中は interact、完了で点火・セーブ
    tap(h, 'interact');
    until(
      h,
      () => playerState(h),
      (v) => v === 'interact',
    );
    until(
      h,
      () => h.dev.bonfire().lit.join(),
      (v) => v === 'bonfire',
      1200,
    );
    expect(savedBonfires(storage)).toEqual(['bonfire']);
    until(
      h,
      () => playerState(h),
      (v) => v === 'idle',
      1200,
    );
    until(
      h,
      () => prompt(h),
      (v) => v === '休む',
    );

    // 傷ついてから休む: HP が回復し、座って保持
    h.dev.damage(120);
    const hurt = h.dev.bonfire().hp;
    tap(h, 'interact');
    until(
      h,
      () => playerState(h),
      (v) => v === 'sitDown',
    );
    expect(h.dev.bonfire().hp).toBeGreaterThan(hurt);
    until(
      h,
      () => playerState(h),
      (v) => v === 'rest',
      1200,
    );
    until(
      h,
      () => prompt(h),
      (v) => v === '立ち上がる',
    );
    expect(savedBonfires(storage)).toEqual(['bonfire']);

    // 再入力で立ち上がる
    tap(h, 'interact');
    until(
      h,
      () => playerState(h),
      (v) => v === 'standUp',
    );
    until(
      h,
      () => playerState(h),
      (v) => v === 'idle',
      1200,
    );
  });

  it('respawns 1.5m south of the bonfire, standing up facing it', async () => {
    const h = await boot();
    h.game.teleportPlayer(30, 10, 2);
    expect(h.dev.respawnAtBonfire()).toBe(true);
    until(
      h,
      () => playerState(h),
      (v) => v === 'standUp',
    );
    const p = h.sim().player;
    expect(p.position.x).toBeCloseTo(0, 1);
    expect(p.position.z).toBeCloseTo(-1.5, 1);
    expect(p.yaw).toBeCloseTo(0, 1);
    until(
      h,
      () => playerState(h),
      (v) => v === 'idle',
      1200,
    );
  });

  it('picks up the flask in the chapel; the max stays 4 after resting at the bonfire', async () => {
    const h = await boot();
    expect(h.dev.items().flasks.max).toBe(3);
    expect(h.dev.items().placed).toEqual(['item-flask-c']);

    // 礼拝堂の奥 (54, 26) で拾う
    h.game.teleportPlayer(54, 25, 0);
    until(
      h,
      () => prompt(h),
      (v) => v === '拾う',
    );
    tap(h, 'interact');
    until(
      h,
      () => h.dev.items().flasks.max,
      (v) => v === 4,
    );
    expect(h.dev.items().saved).toEqual({ flask_up: 1 });
    expect(h.dev.items().placed).toEqual([]);

    // 篝火で休憩しても最大数は 4
    h.game.teleportPlayer(0, -1.2, 0);
    until(
      h,
      () => prompt(h),
      (v) => v === '火を灯す',
    );
    tap(h, 'interact');
    until(
      h,
      () => h.dev.bonfire().lit.includes('bonfire'),
      (v) => v,
      1200,
    );
    until(
      h,
      () => prompt(h),
      (v) => v === '休む',
      1200,
    );
    tap(h, 'interact');
    until(
      h,
      () => h.dev.bonfire().resting,
      (v) => v,
      1200,
    );
    expect(h.dev.items().flasks).toEqual({ count: 4, max: 4 });
  });
});

describe('death on the level', () => {
  const phases = (h: HeadlessGame) => h.dev.death().log.map((e) => e.phase);

  it('dies from damage and respawns at the bonfire after the full timeline', async () => {
    const h = await boot();
    h.game.teleportPlayer(6, 6, 0);
    h.dev.damage(10_000);
    stepUntil(
      h,
      () => h.dev.death().active,
      (v) => v,
      { chunk: 1 },
    );
    stepUntil(
      h,
      () => playerState(h),
      (v) => v === 'dead',
      { chunk: 1 },
    );

    stepUntil(
      h,
      () => h.dev.death().frame,
      (v) => v >= 120,
      { chunk: 1 },
    );
    expect(h.dev.death().visual.grade).toBe(1);

    until(
      h,
      () => phases(h).includes('respawn'),
      (v) => v,
    );
    const after = h.dev.death();
    expect(after.log.map((e) => [e.phase, e.frame])).toEqual([
      ['start', 0],
      ['anim', 12],
      ['grade', 30],
      ['text', 60],
      ['skippable', 90],
      ['hold', 120],
      ['fadeOut', 240],
      ['respawn', 300],
    ]);
    expect(after.visual.grade).toBe(0);
    const b = h.dev.bonfire();
    expect(b.hp).toBeGreaterThan(0);
    expect(['standUp', 'idle']).toContain(b.playerState);
  });

  it('skips the death sequence with a button press after F90', async () => {
    const h = await boot();
    h.dev.damage(10_000);
    stepUntil(
      h,
      () => h.dev.death().frame,
      (v) => v >= 90,
      { chunk: 1 },
    );
    tap(h, 'interact');
    until(
      h,
      () => phases(h).includes('respawn'),
      (v) => v,
    );
    const after = h.dev.death();
    expect(after.skipped).toBe(true);
    expect(after.log.find((e) => e.phase === 'respawn')?.frame).toBeLessThan(300);
  });
});

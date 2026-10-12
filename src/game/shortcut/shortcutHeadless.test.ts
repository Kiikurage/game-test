import { describe, expect, it } from 'vitest';
import { MemoryStorage, SAVE_KEY } from '../../core/persistence';
import {
  createHeadlessGame,
  settle,
  stepUntil,
  tap,
  type HeadlessGame,
} from '../testing/headlessGame';

/** 実レベルの鉄門 G1 (78, 32) とレバー (80, 36)（E2E の shortcut から移した）。レバーは中庭側（北）。 */
const GATE = { x: 78, z: 32 };
/** 門を通り抜ける向き（A 側 → 中庭側）のヨー。A 側から (68, 8) → G1 の道に沿う。 */
const YAW = Math.atan2(GATE.x - 68, GATE.z - 8);
const FWD = { x: Math.sin(YAW), z: Math.cos(YAW) };

const boot = async (storage: MemoryStorage): Promise<HeadlessGame> => {
  const h = await createHeadlessGame({ enemies: [], storage });
  settle(h);
  return h;
};

const shortcut = (h: HeadlessGame) => {
  const s = h.dev.shortcut();
  if (!s) throw new Error('no shortcut');
  return s;
};

const holdForward = (h: HeadlessGame, steps: number): void => {
  h.input.setMove(0, 1);
  h.run(steps);
  h.input.setMove(0, 0);
};

/** レバーの手前（中庭側）で押して、門が開き切るまで進める。 */
const pullLever = (h: HeadlessGame): void => {
  h.game.teleportPlayer(80.2, 37, Math.atan2(80 - 80.2, 36 - 37));
  stepUntil(
    h,
    () => shortcut(h).prompt,
    (p) => p === '押す',
  );
  tap(h, 'interact');
  stepUntil(
    h,
    () => shortcut(h).state,
    (s) => s === 'opening',
  );
  stepUntil(
    h,
    () => shortcut(h).state,
    (s) => s === 'open',
    { maxSteps: 1800 },
  );
};

describe('shortcut G1 on the level', () => {
  it('pulls the lever from the courtyard side, then runs south through G1 to area A', async () => {
    const storage = new MemoryStorage();
    const h = await boot(storage);
    expect(shortcut(h)).toMatchObject({ state: 'closed', blocked: true });

    // 閉じた門は北から南へ歩いても門の北側に留まる
    h.game.teleportPlayer(GATE.x + FWD.x * 3, GATE.z + FWD.z * 3, YAW + Math.PI);
    holdForward(h, 120);
    expect(h.game.player.feet.z).toBeGreaterThan(GATE.z);

    pullLever(h);
    expect(shortcut(h)).toMatchObject({ blocked: false, gateProgress: 1 });
    const raw = storage.getItem(SAVE_KEY);
    expect((JSON.parse(raw ?? '{}') as { data: { shortcuts: string[] } }).data.shortcuts).toEqual([
      'G1',
    ]);

    // 北から G1 を南へ抜けて、A への道（南南西）へ出る
    h.game.teleportPlayer(GATE.x + FWD.x * 3, GATE.z + FWD.z * 3, YAW + Math.PI);
    holdForward(h, 150);
    expect(h.game.player.feet.z).toBeLessThan(GATE.z - 3);
  });

  it('an opened shortcut stays open after reloading', async () => {
    const storage = new MemoryStorage();
    pullLever(await boot(storage));

    // 同じ保存先で作り直す（再読み込み）
    const h = await boot(storage);
    expect(shortcut(h)).toMatchObject({ state: 'open', blocked: false, prompt: null });
    // 南（A 側）から G1 を北へ通り抜けられる
    h.game.teleportPlayer(GATE.x - FWD.x * 5, GATE.z - FWD.z * 5, YAW);
    holdForward(h, 150);
    expect(h.game.player.feet.z).toBeGreaterThan(GATE.z + 2);
  });
});

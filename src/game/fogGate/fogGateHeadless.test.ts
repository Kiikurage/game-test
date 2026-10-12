import { describe, expect, it } from 'vitest';
import {
  createHeadlessGame,
  settle,
  stepUntil,
  tap,
  type HeadlessGame,
} from '../testing/headlessGame';

/** 実レベルの霧の門 (104, 68) と闘技場のボス（E2E の fogGate / bossEntry から移した）。通り抜ける向きは北東（yaw 45°）。 */
const GATE = { x: 104, z: 68 };
const DEG = Math.PI / 180;

/** 門の前方（北東 = 闘技場側）への距離（m）。正なら闘技場側。 */
const along = (p: { x: number; z: number }): number =>
  (p.x - GATE.x) * Math.sin(45 * DEG) + (p.z - GATE.z) * Math.cos(45 * DEG);

const boot = async (): Promise<HeadlessGame> => {
  const h = await createHeadlessGame({ enemies: [] });
  settle(h);
  return h;
};

const fogGate = (h: HeadlessGame) => {
  const g = h.dev.fogGate();
  if (!g) throw new Error('no fog gate');
  return g;
};

const teleport = (h: HeadlessGame, x: number, z: number, yawDeg: number): void => {
  h.game.teleportPlayer(x, z, yawDeg * DEG);
};

const holdForward = (h: HeadlessGame, steps: number): void => {
  h.input.setMove(0, 1);
  h.run(steps);
  h.input.setMove(0, 0);
};

/** 中庭側の門の前で「霧へ入る」を待って押す。 */
const enterFog = (h: HeadlessGame): void => {
  teleport(h, 102.4, 66.4, 45);
  stepUntil(
    h,
    () => fogGate(h).prompt,
    (v) => v === '霧へ入る',
  );
  tap(h, 'interact');
};

describe('fog gate on the level', () => {
  it('walks into the fog gate from the courtyard and reaches the arena; the gate seals behind', async () => {
    const h = await boot();
    // 閉じた霧の門は通れず、状況アクション「霧へ入る」が出る
    teleport(h, 102.4, 66.4, 45);
    stepUntil(
      h,
      () => fogGate(h).prompt,
      (v) => v === '霧へ入る',
    );
    expect(fogGate(h).state).toBe('closed');
    holdForward(h, 60);
    expect(along(fogGate(h).player)).toBeLessThan(0);

    // 入場演出: 操作不能のあと、闘技場の入場位置へ
    enterFog(h);
    stepUntil(
      h,
      () => fogGate(h).state,
      (v) => v === 'entering',
      { chunk: 1 },
    );
    // 演出中はボタンを押しても動作に入らない
    tap(h, 'dodge');
    stepUntil(
      h,
      () => fogGate(h).entered,
      (v) => v === 1,
    );
    const entered = fogGate(h);
    expect(entered.state).toBe('sealed');
    expect(entered.blocked).toBe(true);
    expect(Math.hypot(entered.player.x - 122, entered.player.z - 86)).toBeLessThan(16);

    // 封鎖中は戻れない
    teleport(h, 106.4, 70.4, 225);
    h.run(5);
    holdForward(h, 90);
    expect(along(fogGate(h).player)).toBeGreaterThan(0);

    // 解除（ボス撃破）で霧が消え、通れる
    h.dev.fogGateControl('unseal');
    expect(fogGate(h).state).toBe('open');
    teleport(h, 106.4, 70.4, 225);
    h.run(5);
    holdForward(h, 120);
    expect(along(fogGate(h).player)).toBeLessThan(0);
  });

  it('enters the fog gate: the boss is invulnerable during its intro, then engages; death resets it', async () => {
    const h = await boot();
    expect(h.dev.bossEntry()).toMatchObject({ exists: true, state: 'dormant', engaged: false });

    enterFog(h);
    // 闘技場へ着くと入場演出（無敵）が始まり、HP バーはまだ出ない
    stepUntil(
      h,
      () => h.dev.bossEntry().intros,
      (v) => v === 1,
      { chunk: 1 },
    );
    const intro = h.dev.bossEntry();
    expect(intro.invulnerable).toBe(true);
    expect(intro.engaged).toBe(false);
    expect(intro.bgm).toBe('bgm.boss');
    expect(fogGate(h).state).toBe('sealed');

    // 約 90F 後に戦闘開始。無敵が解ける
    stepUntil(
      h,
      () => h.dev.bossEntry().engages,
      (v) => v === 1,
    );
    const fight = h.dev.bossEntry();
    expect(fight.engaged).toBe(true);
    expect(fight.invulnerable).toBe(false);
    expect(fight.hp).toBe(fight.maxHp);

    // 死亡: ボスは満タン・フェーズ 1・待機へ。霧の門は閉じ直し、篝火で再開する
    h.dev.bossDamage(1000);
    h.dev.damage(10_000);
    stepUntil(
      h,
      () => h.dev.bossEntry().engaged,
      (v) => !v,
    );
    stepUntil(
      h,
      () => fogGate(h).state,
      (v) => v === 'closed',
      { maxSteps: 1200 },
    );
    stepUntil(
      h,
      () => h.dev.death().active,
      (v) => !v,
      { maxSteps: 1200 },
    );
    const reset = h.dev.bossEntry();
    expect(reset).toMatchObject({ state: 'dormant', engaged: false, phase: 1 });
    expect(reset.hp).toBe(reset.maxHp);
    expect(reset.bgm).toBe('bgm.area');
  });
});

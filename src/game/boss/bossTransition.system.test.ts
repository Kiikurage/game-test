import { beforeAll, describe, expect, it } from 'vitest';
import { sectorShape } from '../combat';
import { cameraEffectsOf } from '../camera/cameraEffects.system';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { bossSystemOf, BOSS_ID } from './boss.system';
import { BOSS_MOVE_IDS } from './bossData';
import { BossMoveRegistry } from './bossMove';
import { bossTransitionOf } from './bossTransition.system';

const DT = 1 / 60;

/** フェーズ移行の演出（#84 / 6.5 節）のタイムライン: 各 F のイベント・無敵・戦闘再開・移行中の操作。 */
describe('boss phase transition cutscene (Rapier)', () => {
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

  async function setup() {
    const input = new FakeInput();
    const game = await Game.create({ input, boxes: [], dummies: [], enemies: [] });
    game.teleportPlayer(0, 2.5, Math.PI);
    const boss = bossSystemOf(game).spawn({
      x: 0,
      z: 0,
      yaw: 0,
      moves: quietMoves(),
      engage: true,
    });
    const heart = game.combat.allTargets.get(BOSS_ID);
    if (!heart) throw new Error('no boss target');
    // 移行の F ごとの発行（step ごとに記録する）
    let step = 0;
    const log: { step: number; name: string; payload: Record<string, unknown> }[] = [];
    const cues = ['bossPhaseBoundary', 'bossTransition', 'bgmDuck', 'bgmLayer', 'sound'] as const;
    for (const name of cues) {
      game.events.on(name, (payload) => log.push({ step, name, payload: payload }));
    }
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        step++;
        game.update(DT);
        input.endStep();
      }
    };
    const hit = (damage: number) => {
      const attack = game.combat.startAttack('player', 'player', {
        id: 'test',
        damage,
        poiseDamage: 0,
      });
      game.combat.resolve(attack, sectorShape({ x: 0, y: 0, z: 3.2 }, Math.PI, 90, 3));
      game.combat.endAttack(attack);
      run(1);
    };
    /** 移行が始まるまで進める。始まったステップを返す。 */
    const untilTransition = () => {
      hit(1300);
      for (let i = 0; i < 600 && boss.state !== 'transition'; i++) run(1);
      expect(boss.state).toBe('transition');
      return log.find((e) => e.name === 'bossPhaseBoundary')?.step ?? -1;
    };
    return { game, boss, heart, input, run, hit, log, untilTransition, stepNow: () => step };
  }

  it('emits the cues at F0 / F12 / F13 / F60 / F100 / F120 in sync with the boss', async () => {
    const { run, log, untilTransition, boss, game } = await setup();
    const t0 = untilTransition();
    expect(boss.transitionFrame).toBe(0);
    expect(bossTransitionOf(game).frame).toBe(0);
    run(125);
    const cue = (c: string) =>
      log.filter((e) => e.name === 'bossTransition' && e.payload.cue === c);
    const at = (c: string) => cue(c).map((e) => e.step - t0);
    expect(at('start')).toEqual([0]);
    expect(at('flinchEnd')).toEqual([12]);
    expect(at('shieldThrow')).toEqual([13]);
    expect(at('roar')).toEqual([60]);
    expect(at('roarEnd')).toEqual([100]);
    expect(at('end')).toEqual([120]);
    expect(cue('end')[0]?.payload.aborted).toBe(false);
    // 節目の F がペイロードにも入る
    expect(cue('roar')[0]?.payload.frame).toBe(60);
    // BGM: レイヤーは F13、ダッキング -6dB は F60、解除は F100
    const bgm = log.filter((e) => e.name === 'bgmLayer').map((e) => e.step - t0);
    expect(bgm).toEqual([13]);
    const duck = log.filter((e) => e.name === 'bgmDuck');
    expect(duck.map((e) => [e.step - t0, e.payload.db, e.payload.frames])).toEqual([
      [60, -6, 30],
      [100, 0, 30],
    ]);
    // 咆哮の SE は F60
    const roar = log.filter((e) => e.name === 'sound' && e.payload.cue === 'sfx.boss.roar');
    expect(roar.map((e) => e.step - t0)).toEqual([60]);
    expect(boss.phase).toBe(2);
    expect(bossTransitionOf(game).frame).toBe(-1);
  });

  it('starts the camera clip at F0 (peak at F60) and stops it when the boss is reset', async () => {
    const { game, run, untilTransition } = await setup();
    const fx = cameraEffectsOf(game);
    untilTransition();
    expect(fx.playingClips).toContain('phaseTransition');
    run(61);
    expect(fx.output.armOffsetM).toBeCloseTo(1.5, 1);
    expect(fx.output.fovOffsetDeg).toBeCloseTo(6, 1);
    // 中断（プレイヤーの死亡 → ボスのリセット）
    game.events.emit('death', {
      phase: 'start',
      frame: 0,
      skipped: false,
      position: { x: 0, y: 0, z: 2.5 },
    });
    run(2);
    expect(fx.playingClips).not.toContain('phaseTransition');
    expect(bossTransitionOf(game).frame).toBe(-1);
  });

  it('keeps the boss invulnerable until F120, and the first move afterwards is leap or ashWave', async () => {
    const { boss, heart, run, hit, untilTransition } = await setup();
    untilTransition();
    const hp = heart.health.current;
    for (let f = 1; f < 120; f += 7) {
      expect(heart.invulnerable).toBe(true);
      hit(100);
      expect(heart.health.current).toBe(hp);
      run(6);
    }
    for (let i = 0; i < 40 && boss.phase === 1; i++) run(1);
    expect(boss.phase).toBe(2);
    expect(heart.invulnerable).toBe(false);
    // 戦闘再開後、最初に選ばれる技（プレイヤーは近距離 2.5m にいても遠距離帯の技）
    let first: string | null = null;
    for (let i = 0; i < 200 && !first; i++) {
      run(1);
      first = boss.debugInfo.move;
    }
    expect(['leap', 'ashWave']).toContain(first);
  });

  it('lets the player move during the transition', async () => {
    const { game, input, run, untilTransition } = await setup();
    untilTransition();
    run(10);
    const before = { x: game.player.feet.x, z: game.player.feet.z };
    input.setMove(1, 0);
    run(30);
    const moved = Math.hypot(game.player.feet.x - before.x, game.player.feet.z - before.z);
    expect(moved).toBeGreaterThan(1);
  });
});

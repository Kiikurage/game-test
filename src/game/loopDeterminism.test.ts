import { beforeAll, describe, expect, it } from 'vitest';
import { MainLoop } from '../core/mainLoop';
import { gameStats } from './debug/stats.system';
import { Game } from './game';
import { FakeInput } from './testing/fakeInput';

/** ステップ番号ごとの入力（前進しながら攻撃。途中で撃破スロー相当のタイムスケールを掛ける）。 */
function script(step: number, game: Game, input: FakeInput): void {
  input.setMove(step >= 5 && step < 80 ? 0.3 : 0, step >= 5 && step < 80 ? 1 : 0);
  if (step === 20 || step === 60) input.press('lightAttack');
  if (step === 21 || step === 61) input.release('lightAttack');
  if (step === 30) game.timeScale.start(0.4, 40);
}

/** main.ts と同じ組み立て（入力を確定してから game.update）のループ。 */
async function setup(): Promise<{ game: Game; loop: MainLoop }> {
  const input = new FakeInput();
  const game = await Game.create({ input });
  const loop = new MainLoop(
    {
      update: (dt) => {
        script(loop.stepCount, game, input);
        game.update(dt);
        input.endStep();
      },
      render: () => undefined,
    },
    { timeScale: () => game.timeScale.current },
  );
  return { game, loop };
}

function snapshot(game: Game): unknown {
  const s = game.debugState;
  const stats = gameStats(game);
  return {
    player: s.player,
    camera: s.camera,
    hits: stats.hitCount,
    hitStops: stats.hitStopCount,
    events: { ...stats.eventCounts },
    timeScale: s.combat.timeScale,
  };
}

/** `dev.advance`（`MainLoop.step` / `frame`）が rAF と同じ経路で進むこと。 */
describe('MainLoop manual advance', () => {
  beforeAll(async () => {
    await Game.create();
  });

  it('reaches the same state by step() as by per-frame advance with time scale', async () => {
    const STEPS = 140;
    const a = await setup();
    const start = { ...a.game.debugState.player.position };
    a.loop.step(STEPS);

    const b = await setup();
    // rAF と同じ処理: 実時間 1/60 秒のフレームを、タイムスケールを掛けて固定ステップへ
    let frames = 0;
    while (b.loop.stepCount < STEPS) {
      b.loop.frame(1 / 60, { render: false });
      frames++;
    }

    expect(b.loop.stepCount).toBe(STEPS);
    // スロー中はフレームあたりのステップが減る（タイムスケールが効いている）
    expect(frames).toBeGreaterThan(STEPS);
    expect(snapshot(b.game)).toEqual(snapshot(a.game));
    // 入力が実際に効いている（移動・攻撃）
    expect(gameStats(a.game).eventCounts.attackStart).toBeGreaterThan(0);
    const end = a.game.debugState.player.position;
    expect(Math.hypot(end.x - start.x, end.z - start.z)).toBeGreaterThan(1);
  });

  it('advances by manual steps and frames even while paused', () => {
    let rendered = 0;
    const l = new MainLoop({
      update: () => undefined,
      render: () => {
        rendered++;
      },
    });
    l.paused = true;
    expect(l.frame(1 / 60)).toBe(1); // 手動の frame は paused でも進む
    l.step(3, { render: true });
    expect(l.stepCount).toBe(4);
    expect(rendered).toBe(2);
  });
});

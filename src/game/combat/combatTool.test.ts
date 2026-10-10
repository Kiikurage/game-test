import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS } from '../data';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { resetTuning, tuning } from '../tuning';
import { describePlayerAction } from './actionDebug';
import { combatToolOf } from './combatTool.system';

const DT = 1 / 60;

const sample = (state: string, frame: number, extra: { actionId?: string; poise?: number } = {}) =>
  describePlayerAction({
    state,
    actionId: extra.actionId ?? null,
    frame,
    invulnerable: false,
    poiseBonus: extra.poise ?? 0,
    frozen: false,
  });

describe('describePlayerAction', () => {
  it('splits an attack into startup / active / recovery with the frame data totals', () => {
    const a = PLAYER_ACTIONS.light1;
    expect(sample('light1', 1).segment).toBe('startup');
    expect(sample('light1', a.startup).segment).toBe('startup');
    expect(sample('light1', a.startup + 1).segment).toBe('active');
    expect(sample('light1', a.startup + a.active).segment).toBe('active');
    expect(sample('light1', a.startup + a.active + 1).segment).toBe('recovery');
    expect(sample('light1', 1).total).toBe(36);
  });

  it('opens a cancel window exactly on its inclusive boundaries', () => {
    const next = (f: number) =>
      sample('light1', f).cancels.find((c) => c.to === 'lightAttack')?.open;
    expect(next(19)).toBe(false);
    expect(next(20)).toBe(true);
    expect(next(48)).toBe(true);
    expect(next(49)).toBe(false);
  });

  it('reports the roll invulnerability window and the heavy super armor window', () => {
    const roll = PLAYER_ACTIONS.roll.invuln;
    expect(sample('roll', roll.start).invuln?.open).toBe(true);
    expect(sample('roll', roll.end + 1).invuln?.open).toBe(false);
    expect(sample('heavy', 5).superArmor?.open).toBe(false);
    expect(sample('heavy', 6).superArmor?.open).toBe(true);
    expect(sample('heavy', 6).superArmor?.poiseBonus).toBe(40);
  });

  it('has no frame data for states without an action entry', () => {
    const a = sample('idle', 3);
    expect(a.actionId).toBeNull();
    expect(a.segment).toBeNull();
    expect(a.cancels).toEqual([]);
  });
});

describe('combat debug tool', () => {
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
  });

  function tick(): void {
    game.update(DT);
    input.endStep();
  }

  it('advances the player action one frame per step', () => {
    const tool = combatToolOf(game);
    input.press('lightAttack');
    tick();
    const frames: number[] = [tool.info().action.frame];
    for (let i = 0; i < 5; i++) {
      tick();
      frames.push(tool.info().action.frame);
    }
    expect(frames).toEqual([1, 2, 3, 4, 5, 6]);
    expect(tool.info().action.actionId).toBe('light1');
    expect(tool.info().action.segment).toBe('startup');
  });

  it('restores player resources and resets dummies', () => {
    const tool = combatToolOf(game);
    game.playerTarget.health.damage(40);
    game.player.stamina.consume(30);
    const dummy = game.dummies[0];
    expect(dummy).toBeDefined();
    if (!dummy) return;
    game.combat.allTargets.get(dummy.id)?.health.damage(50);
    expect(tool.info().player.hp).toBeLessThan(tool.info().player.maxHp);
    tool.restorePlayer();
    tool.resetDummies();
    const info = tool.info();
    expect(info.player.hp).toBe(info.player.maxHp);
    expect(info.player.stamina).toBe(info.player.staminaMax);
    expect(info.dummy?.hp).toBe(info.dummy?.maxHp);
  });

  it('slow motion scales the time scale and clears back to normal', () => {
    const tool = combatToolOf(game);
    tool.setSlow(0.25);
    expect(game.timeScale.current).toBe(0.25);
    expect(tool.info().slow).toBe(0.25);
    tool.setSlow(1);
    expect(game.timeScale.current).toBe(1);
  });
});

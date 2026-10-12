import { describe, expect, it } from 'vitest';
import { bonfireSystem } from './bonfire/bonfire.system';
import { bossSystem } from './boss/boss.system';
import type { Game } from './game';
import { hudSystem } from './hud/hud.system';
import { GameSystems, sortGameSystems, type GameSystemEntry } from './systems';
import { createHeadlessGame } from './testing/headlessGame';

const entry = (
  id: string,
  index: number,
  order: { after?: string[]; before?: string[] } = {},
  create: GameSystemEntry['create'] = () => ({}),
): GameSystemEntry => ({
  id,
  index,
  after: order.after ?? [],
  before: order.before ?? [],
  create,
});

const ids = (list: readonly { id: string }[]): string[] => list.map((e) => e.id);

describe('sortGameSystems', () => {
  it('keeps registration order when nothing is declared', () => {
    expect(ids(sortGameSystems([entry('a', 0), entry('b', 1), entry('c', 2)]))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('runs a system after the ones it declares in `after`', () => {
    const sorted = sortGameSystems([entry('a', 0, { after: ['c'] }), entry('b', 1), entry('c', 2)]);
    expect(ids(sorted)).toEqual(['b', 'c', 'a']);
  });

  it('runs a system before the ones it declares in `before`', () => {
    const sorted = sortGameSystems([
      entry('a', 0),
      entry('b', 1),
      entry('c', 2, { before: ['a'] }),
    ]);
    expect(ids(sorted)).toEqual(['c', 'a', 'b']);
  });

  it('follows chains of declarations regardless of registration order', () => {
    const sorted = sortGameSystems([
      entry('hud', 0, { after: ['bonfire'] }),
      entry('bonfire', 1, { after: ['boss'] }),
      entry('boss', 2),
    ]);
    expect(ids(sorted)).toEqual(['boss', 'bonfire', 'hud']);
  });

  it('rejects cycles and unknown ids', () => {
    expect(() =>
      sortGameSystems([entry('a', 0, { after: ['b'] }), entry('b', 1, { after: ['a'] })]),
    ).toThrow(/cycle/);
    expect(() => sortGameSystems([entry('a', 0, { after: ['missing'] })])).toThrow(/unknown/);
  });
});

describe('GameSystems', () => {
  const game = {} as Game;

  it('calls update / onImpact in declared order and creates lazily on get', () => {
    const calls: string[] = [];
    const make =
      (id: string): GameSystemEntry['create'] =>
      () => {
        calls.push(`create:${id}`);
        return { state: id, update: () => calls.push(`update:${id}`) };
      };
    const systems = new GameSystems(game, [
      entry('a', 0, { after: ['b'] }, make('a')),
      entry('b', 1, {}, make('b')),
    ]);
    expect(systems.get<string>({ id: 'a' })).toBe('a');
    systems.init();
    systems.update(1 / 60);
    expect(calls).toEqual(['create:a', 'create:b', 'update:b', 'update:a']);
    expect(systems.ids).toEqual(['b', 'a']);
  });

  it('lets a factory get another system, and rejects self-dependency during creation', () => {
    let systems: GameSystems | null = null;
    systems = new GameSystems(game, [
      entry('x', 0, {}, () => ({ state: systems?.get<number>({ id: 'y' }) })),
      entry('y', 1, {}, () => ({ state: 2 })),
      entry('loop', 2, {}, () => ({ state: systems?.get({ id: 'loop' }) })),
    ]);
    expect(systems.get<number>({ id: 'x' })).toBe(2);
    expect(() => systems.get({ id: 'loop' })).toThrow(/itself/);
    expect(() => systems.get({ id: 'nope' })).toThrow(/not registered/);
  });
});

describe('registered game systems (headless game)', () => {
  it('runs in the declared order, which matches the previous file-name order', async () => {
    const { game } = await createHeadlessGame({ enemies: [] });
    // 宣言（after / before）を足す前の登録順（ファイル名順）。挙動を変えないため、宣言はこの順と矛盾させていない
    expect(game.systems.ids).toEqual([
      'bonfire',
      'boss',
      'bossDebug',
      'boss-defeat',
      'boss-entry',
      'boss-impact',
      'boss-moves-67',
      'boss-telegraph',
      'boss-transition',
      'cameraEffects',
      'combatTool',
      'death',
      'debugStats',
      'detection',
      'enemy-telegraph',
      'enemy-kill-feedback',
      'fieldBgm',
      'fogGate',
      'guide',
      'bossBar',
      'hud',
      'interactable',
      'interaction',
      'item',
      'ambush',
      'heavy-charge-cue',
      'plunge',
      'shortcut',
      'textPanel',
      'waterWake',
      'waterway',
    ]);
  });

  it('returns per-game typed state from handles', async () => {
    const a = await createHeadlessGame({ enemies: [] });
    const b = await createHeadlessGame({ enemies: [] });
    expect(a.game.systems.get(hudSystem)).toBe(a.game.systems.get(hudSystem));
    expect(a.game.systems.get(hudSystem)).not.toBe(b.game.systems.get(hudSystem));
    expect(a.game.systems.get(bossSystem).boss).toBeDefined();
    expect(typeof a.game.systems.get(bonfireSystem).respawn).toBe('function');
  });
});

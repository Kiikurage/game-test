import { describe, expect, it } from 'vitest';
import { bonfireSystem } from './bonfire/bonfire.system';
import { bossSystem } from './boss/boss.system';
import type { Game } from './game';
import { GameSystems, sortGameSystems, type GameSystemEntry } from './systems';
import { createHeadlessGame } from './testing/headlessGame';

const entry = (
  id: string,
  order: { after?: string[]; before?: string[] } = {},
  create: GameSystemEntry['create'] = () => ({}),
): GameSystemEntry => ({
  id,
  after: order.after ?? [],
  before: order.before ?? [],
  create,
});

const ids = (list: readonly { id: string }[]): string[] => list.map((e) => e.id);

describe('sortGameSystems', () => {
  it('orders undeclared systems by id, not by registration order', () => {
    expect(ids(sortGameSystems([entry('c'), entry('a'), entry('b')]))).toEqual(['a', 'b', 'c']);
  });

  it('runs a system after the ones it declares in `after`', () => {
    const sorted = sortGameSystems([entry('a', { after: ['c'] }), entry('b'), entry('c')]);
    expect(ids(sorted)).toEqual(['b', 'c', 'a']);
  });

  it('runs a system before the ones it declares in `before`', () => {
    const sorted = sortGameSystems([entry('a'), entry('b'), entry('c', { before: ['b'] })]);
    expect(ids(sorted)).toEqual(['a', 'c', 'b']);
  });

  it('follows chains of declarations regardless of registration order', () => {
    const sorted = sortGameSystems([
      entry('hud', { after: ['bonfire'] }),
      entry('bonfire', { after: ['boss'] }),
      entry('boss'),
    ]);
    expect(ids(sorted)).toEqual(['boss', 'bonfire', 'hud']);
  });

  it('rejects cycles and unknown ids', () => {
    expect(() =>
      sortGameSystems([entry('a', { after: ['b'] }), entry('b', { after: ['a'] })]),
    ).toThrow(/cycle/);
    expect(() => sortGameSystems([entry('a', { after: ['missing'] })])).toThrow(/unknown/);
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
      entry('a', { after: ['b'] }, make('a')),
      entry('b', {}, make('b')),
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
      entry('x', {}, () => ({ state: systems?.get<number>({ id: 'y' }) })),
      entry('y', {}, () => ({ state: 2 })),
      entry('loop', {}, () => ({ state: systems?.get({ id: 'loop' }) })),
    ]);
    expect(systems.get<number>({ id: 'x' })).toBe(2);
    expect(() => systems.get({ id: 'loop' })).toThrow(/itself/);
    expect(() => systems.get({ id: 'nope' })).toThrow(/not registered/);
  });
});

describe('registered game systems (headless game)', () => {
  it('runs in the order derived from the declarations', async () => {
    const { game } = await createHeadlessGame({ enemies: [] });
    const order = game.systems.ids;
    // 宣言した前後関係（データの受け渡しがある組）。いずれも宣言を足す前の実行順（import の順で決まっていた）と同じ
    const declared: [string, string][] = [
      ['boss', 'boss-defeat'],
      ['boss', 'boss-entry'],
      ['boss', 'boss-impact'],
      ['boss', 'boss-moves-67'],
      ['boss', 'boss-telegraph'],
      ['boss', 'boss-transition'],
      ['boss', 'bossDebug'],
      ['cameraEffects', 'boss-defeat'],
      ['cameraEffects', 'boss-impact'],
      ['cameraEffects', 'boss-moves-67'],
      ['cameraEffects', 'boss-transition'],
      ['cameraEffects', 'plunge'],
      ['heavy-charge-cue', 'bonfire'],
      ['bonfire', 'death'],
      ['death', 'cameraEffects'],
      ['fogGate', 'boss-defeat'],
      ['fogGate', 'boss-entry'],
      ['textPanel', 'interactable'],
      ['interactable', 'interaction'],
      ['interactable', 'shortcut'],
      ['interactable', 'waterway'],
    ];
    for (const [first, then] of declared) {
      expect(order.indexOf(first), `${first} before ${then}`).toBeLessThan(order.indexOf(then));
    }
    // 全体の順（宣言で決まらない同士は id の辞書順）。変わったら、意図した変更かを確かめて更新する
    expect(order).toEqual([
      'ambush',
      'boss',
      'boss-telegraph',
      'bossDebug',
      'combatTool',
      'debugStats',
      'detection',
      'enemy-kill-feedback',
      'enemy-telegraph',
      'fieldBgm',
      'fogGate',
      'boss-entry',
      'heavy-charge-cue',
      'bonfire',
      'death',
      'cameraEffects',
      'boss-defeat',
      'boss-impact',
      'boss-moves-67',
      'boss-transition',
      'item',
      'plunge',
      'textPanel',
      'interactable',
      'interaction',
      'shortcut',
      'waterWake',
      'waterway',
    ]);
  });

  it('returns per-game typed state from handles', async () => {
    const a = await createHeadlessGame({ enemies: [] });
    const b = await createHeadlessGame({ enemies: [] });
    expect(a.game.systems.get(bonfireSystem)).toBe(a.game.systems.get(bonfireSystem));
    expect(a.game.systems.get(bonfireSystem)).not.toBe(b.game.systems.get(bonfireSystem));
    expect(a.game.systems.get(bossSystem).boss).toBeDefined();
    expect(typeof a.game.systems.get(bonfireSystem).respawn).toBe('function');
  });
});

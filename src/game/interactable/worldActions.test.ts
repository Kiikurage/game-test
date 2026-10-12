import { beforeAll, describe, expect, it } from 'vitest';
import { MemoryStorage, SaveStore } from '../../core/persistence';
import type { GameEventMap } from '../../core/gameEvents';
import { BREAKABLE } from '../data/world/lootTuning';
import { WORLD_INTERACTABLES } from '../data/world/interactables';
import type { Interactable } from '../data/world/types';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { textPanelSystem } from '../text/textPanel.system';
import { interactionSystem } from '../interaction/interaction.system';
import { interactableSystem } from './interactable.system';
import { waterwaySystem } from '../world/waterway.system';

const DT = 1 / 60;

const def = (id: string): Interactable => {
  const d = WORLD_INTERACTABLES.find((i) => i.id === id);
  if (!d) throw new Error(`no data for ${id}`);
  return d;
};

/** 平らな地面に、配置データの位置のまま対象を置く（`ids` の spawn）。 */
describe('world actions (bell / pray / talk / push / breakable / floorHatch)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(
    ids: readonly string[],
    at: { x: number; z: number; yaw?: number },
    storage = new MemoryStorage(),
  ) {
    const input = new FakeInput();
    const save = new SaveStore(storage);
    const game = await Game.create({
      input,
      save,
      boxes: [],
      dummies: [],
      enemies: [],
      interactables: ids.map((id) => {
        const d = def(id);
        return { id, kind: d.kind, area: null, x: d.x, z: d.z };
      }),
      spawn: { x: at.x, z: at.z, yaw: at.yaw ?? 0 },
    });
    const texts: GameEventMap['showText'][] = [];
    const sounds: GameEventMap['sound'][] = [];
    const ducks: GameEventMap['ambientDuck'][] = [];
    const picked: GameEventMap['itemPicked'][] = [];
    game.events.on('showText', (e) => texts.push(e));
    game.events.on('sound', (e) => sounds.push(e));
    game.events.on('ambientDuck', (e) => ducks.push(e));
    game.events.on('itemPicked', (e) => picked.push(e));
    const run = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        game.update(DT);
        input.endStep();
      }
    };
    const press = (action: Parameters<FakeInput['press']>[0] = 'interact') => {
      input.press(action);
      run(1);
    };
    return { game, input, save, storage, texts, sounds, ducks, picked, run, press };
  }

  describe('bell', () => {
    const bell = def('bell_c');

    it('rings at F20 as a 15m hearing event, with a 1800F cooldown and the first text only once', async () => {
      const { game, save, texts, sounds, run, press } = await setup(['bell_c'], {
        x: bell.x,
        z: bell.z - 1,
      });
      run(5);
      expect(game.systems.get(interactionSystem).prompt).toMatchObject({
        id: 'bell_c',
        label: '鐘',
      });
      press();
      expect(game.player.state).toBe('interact'); // 90F 動けない
      run(15);
      expect(game.enemies.noises.active).toHaveLength(0); // まだ鳴っていない
      run(10);
      expect(game.enemies.noises.active).toHaveLength(1);
      expect(game.enemies.noises.active[0]).toMatchObject({ radius: 15, kind: 'bell' });
      expect(sounds.some((s) => s.cue === 'sfx.bell')).toBe(true);
      expect(texts).toEqual([{ id: 'bell_first', mode: 'read' }]);
      expect(save.hasFlag('shown.bell_first')).toBe(true);
      run(90);
      expect(game.player.state).not.toBe('interact');

      // クールダウン 30 秒（鳴った F20 から 1800F）
      expect(game.systems.get(interactionSystem).prompt).toBeNull();
      run(1800 - 90 - 30);
      expect(game.systems.get(interactionSystem).prompt).toBeNull();
      run(30);
      expect(game.systems.get(interactionSystem).prompt).toMatchObject({ id: 'bell_c' });
      press();
      run(30);
      expect(texts).toHaveLength(1); // 2 回目は文を出さない
      expect(game.enemies.noises.active.length).toBeGreaterThan(0);
    });

    it('does not ring when the player is hit during the swing', async () => {
      const { game, run, press } = await setup(['bell_c'], { x: bell.x, z: bell.z - 1 });
      run(5);
      press();
      run(5);
      game.debugHitPlayer({ from: 'front', damage: 10, poiseDamage: 100 });
      run(120);
      // 被弾の戦闘音はあっても、鐘の音（15m）は鳴らない
      expect(game.enemies.noises.active.some((n) => n.kind === 'bell')).toBe(false);
      expect(game.systems.get(interactableSystem).usableIds).toContain('bell_c'); // クールダウンも始まらない
    });
  });

  describe('pray', () => {
    it('kneels for 120F, ducks the ambience by -6dB over 180F, and saves pray.gate at the gate statue only', async () => {
      // テストの地面は原点から半径 100m なので、霧の門の脇 (101, 64) から手前へずらして置く
      const gate: Interactable = { ...def('statue_gate'), x: 20, z: 20 };
      const { game, save, texts, ducks, run, press } = await setup([], {
        x: gate.x,
        z: gate.z - 1,
      });
      game.systems.get(interactableSystem).add(gate);
      run(5);
      expect(game.systems.get(interactionSystem).prompt).toMatchObject({
        id: 'statue_gate',
        label: '祈る',
      });
      press();
      expect(game.player.state).toBe('interact');
      run(2);
      expect(ducks).toEqual([{ db: -6, frames: 180, ashIntensity: 1 }]);
      expect(save.hasFlag('pray.gate')).toBe(true);
      expect(texts).toEqual([{ id: 'pray_gate', mode: 'read' }]);
      run(100);
      expect(game.player.state).toBe('interact'); // まだ膝をついている
      run(25);
      expect(game.player.state).not.toBe('interact'); // 120F で終わる
      // 何度でも祈れる
      run(5);
      press();
      run(2);
      expect(ducks).toHaveLength(2);
    });

    it('does not save pray.gate at the chapel statue', async () => {
      const c = def('statue_c');
      const { save, run, press } = await setup(['statue_c'], { x: c.x, z: c.z - 1 });
      run(5);
      press();
      run(5);
      expect(save.hasFlag('pray.gate')).toBe(false);
    });
  });

  describe('talk (dying knight)', () => {
    const knight = def('npc_knight');
    const at = { x: knight.x, z: knight.z - 1 };

    it('plays the 4 lines, hands over the greatsword and the knight dies', async () => {
      const { game, save, texts, picked, run, press } = await setup(
        ['npc_knight', 'corpse_knight'],
        at,
      );
      run(5);
      expect(game.systems.get(interactionSystem).prompt).toMatchObject({
        id: 'npc_knight',
        label: '話す',
      });
      expect(game.systems.get(interactableSystem).usableIds).toEqual(['npc_knight']); // 遺体はまだ調べられない
      press();
      expect(texts).toHaveLength(1);
      expect(texts[0]?.mode).toBe('conversation');
      expect(texts[0]?.text).toHaveLength(4);
      expect(game.systems.get(textPanelSystem).current).toMatchObject({ index: 0, total: 4 });
      for (let line = 1; line < 4; line++) {
        run(3);
        press();
        expect(game.systems.get(textPanelSystem).current?.index).toBe(line);
        expect(save.getCount('sword_gravekeeper')).toBe(0);
      }
      run(3);
      press(); // 4 行目を読み終える
      expect(game.systems.get(textPanelSystem).active).toBe(false);
      run(2);
      expect(save.getCount('sword_gravekeeper')).toBe(1);
      expect(picked[0]).toMatchObject({ itemId: 'sword_gravekeeper', name: '墓守の大剣' });
      expect(save.hasFlag('knight.dead')).toBe(true);
      // 息絶えた: もう話せず、遺体を調べられる
      expect(game.systems.get(interactableSystem).usableIds).toEqual(['corpse_knight']);
    });

    it('can be interrupted by walking away, and talking again restarts from line 1', async () => {
      const { game, save, run, press } = await setup(['npc_knight', 'corpse_knight'], at);
      run(5);
      press();
      run(3);
      press();
      expect(game.systems.get(textPanelSystem).current?.index).toBe(1);
      game.teleportPlayer(at.x, at.z - 3, 0); // 2m を超えて離れる
      run(3);
      expect(game.systems.get(textPanelSystem).active).toBe(false);
      expect(save.getCount('sword_gravekeeper')).toBe(0);
      expect(save.hasFlag('knight.dead')).toBe(false);
      game.teleportPlayer(at.x, at.z, 0);
      run(5);
      press();
      expect(game.systems.get(textPanelSystem).current).toMatchObject({ index: 0, total: 4 });
    });

    it('keeps the knight dead after loading', async () => {
      const first = await setup(['npc_knight', 'corpse_knight'], at);
      first.save.setFlag('knight.dead');
      const second = await setup(['npc_knight', 'corpse_knight'], at, first.storage);
      second.run(5);
      expect(second.game.systems.get(interactableSystem).usableIds).toEqual(['corpse_knight']);
    });
  });

  describe('push (iron grate D)', () => {
    const grate = def('grate_d');

    it('pushes for 90F, opens it at the effect frame and saves world.grateDOpen', async () => {
      const { game, save, run, press } = await setup(['grate_d'], {
        x: grate.x,
        z: grate.z - 1,
        yaw: 0,
      });
      run(5);
      expect(game.systems.get(interactionSystem).prompt).toMatchObject({
        id: 'grate_d',
        label: '押す',
      });
      press();
      expect(game.player.state).toBe('interact');
      expect(save.hasFlag('world.grateDOpen')).toBe(false);
      run(60);
      expect(save.hasFlag('world.grateDOpen')).toBe(true);
      expect(game.systems.get(waterwaySystem).grateOpen).toBe(true);
      run(40);
      expect(game.player.state).not.toBe('interact');
      expect(game.systems.get(interactionSystem).prompt).toBeNull(); // 開いたら出ない
    });

    it('stays open after loading', async () => {
      const first = await setup(['grate_d'], { x: grate.x, z: grate.z - 1 });
      first.run(5);
      first.press();
      first.run(100);
      const second = await setup(['grate_d'], { x: grate.x, z: grate.z - 1 }, first.storage);
      second.run(5);
      expect(second.game.systems.get(waterwaySystem).grateOpen).toBe(true);
      expect(second.game.systems.get(interactionSystem).prompt).toBeNull();
    });
  });

  describe('breakable wall', () => {
    const wall: Interactable = { ...def('wall_g1'), x: 10, z: 10 };

    /** 壁の手前 1.4m（南）に立って北を向く。壁は `dev.placeInteractable` と同じ登録経路（`add`）で置く。 */
    async function setupWall(storage = new MemoryStorage()) {
      const s = await setup([], { x: wall.x, z: wall.z - 1.4, yaw: 0 }, storage);
      s.game.systems.get(interactableSystem).add(wall);
      return s;
    }

    type S = Awaited<ReturnType<typeof setupWall>>;
    /** 1 回攻撃して、動作が終わるまで待つ。 */
    function swing(s: S, action: 'lightAttack' | 'heavyAttack', charge = 0): void {
      s.input.press(action);
      s.run(1);
      if (action === 'heavyAttack') {
        s.run(charge); // 押しっぱなしで溜める
        s.input.release(action);
      }
      s.run(120);
    }

    it('has HP 150 and is broken by 4 light hits (3 are not enough)', async () => {
      const s = await setupWall();
      expect(s.game.systems.get(interactableSystem).wallHp('wall_g1')).toBe(150);
      expect(s.game.systems.get(interactionSystem).prompt).toBeNull(); // 状況ボタンは出ない
      for (let i = 1; i <= 3; i++) {
        swing(s, 'lightAttack');
        expect(s.game.systems.get(interactableSystem).isWallBroken('wall_g1'), `after ${i}`).toBe(
          false,
        );
      }
      expect(s.game.systems.get(interactableSystem).wallHp('wall_g1')).toBeLessThan(150);
      swing(s, 'lightAttack');
      expect(s.game.systems.get(interactableSystem).isWallBroken('wall_g1')).toBe(true);
    });

    it('is broken by 2 heavy hits', async () => {
      const s = await setupWall();
      swing(s, 'heavyAttack');
      expect(s.game.systems.get(interactableSystem).isWallBroken('wall_g1')).toBe(false);
      swing(s, 'heavyAttack');
      expect(s.game.systems.get(interactableSystem).isWallBroken('wall_g1')).toBe(true);
    });

    it('is broken by 2 full-charge heavy hits', async () => {
      const s = await setupWall();
      swing(s, 'heavyAttack', 90);
      expect(s.game.systems.get(interactableSystem).isWallBroken('wall_g1')).toBe(false);
      swing(s, 'heavyAttack', 90);
      expect(s.game.systems.get(interactableSystem).isWallBroken('wall_g1')).toBe(true);
    });

    it('collapses over 60F: hollow sound per hit, a 12m crash sound, and saves world.wallG1Broken', async () => {
      const s = await setupWall();
      const collapses: GameEventMap['wallCollapse'][] = [];
      const heard: { radius: number; kind: string | null }[] = [];
      s.game.events.on('wallCollapse', (e) => {
        collapses.push(e);
        heard.push(
          ...s.game.enemies.noises.active.map((n) => ({ radius: n.radius, kind: n.kind })),
        );
      });
      swing(s, 'heavyAttack');
      expect(s.sounds.filter((x) => x.cue === BREAKABLE.hollowCue)).toHaveLength(1);
      expect(s.save.hasFlag('world.wallG1Broken')).toBe(false);
      expect(s.game.enemies.noises.active.some((n) => n.radius === 12)).toBe(false);
      swing(s, 'heavyAttack');
      expect(s.sounds.filter((x) => x.cue === BREAKABLE.hollowCue)).toHaveLength(2);
      expect(collapses).toHaveLength(1);
      expect(collapses[0]).toMatchObject({ id: 'wall_g1', frames: 60, position: { x: 10, z: 10 } });
      expect(s.sounds.some((x) => x.cue === BREAKABLE.collapseCue)).toBe(true);
      expect(s.save.hasFlag('world.wallG1Broken')).toBe(true);
      // 崩れた瞬間に 12m の聴覚イベント（crash）
      expect(heard).toContainEqual({ radius: 12, kind: 'wallCollapse' });
    });

    it('is already broken after loading, and cannot be hit again', async () => {
      const first = await setupWall();
      swing(first, 'heavyAttack');
      swing(first, 'heavyAttack');
      expect(first.save.hasFlag('world.wallG1Broken')).toBe(true);
      const second = await setupWall(first.storage);
      expect(second.game.systems.get(interactableSystem).isWallBroken('wall_g1')).toBe(true);
      expect(second.game.combat.allTargets.has('wall_g1')).toBe(false);
    });
  });

  describe('floor hatch', () => {
    const hatch = def('hatch_c');

    it('creaks once within 3m, then breaks on contact without damage', async () => {
      const { game, sounds, run } = await setup(['hatch_c'], { x: hatch.x, z: hatch.z - 5 });
      const broken: GameEventMap['floorHatchBroken'][] = [];
      game.events.on('floorHatchBroken', (e) => broken.push(e));
      run(5);
      const creaks = () => sounds.filter((s) => s.cue === 'sfx.hatch-creak').length;
      expect(creaks()).toBe(0);
      game.teleportPlayer(hatch.x, hatch.z - 3.5, 0);
      run(5);
      expect(creaks()).toBe(0); // 3m の外
      game.teleportPlayer(hatch.x, hatch.z - 2.9, 0);
      run(5);
      expect(creaks()).toBe(1);
      game.teleportPlayer(hatch.x, hatch.z - 2, 0);
      run(30);
      expect(creaks()).toBe(1); // 近くにいても 1 回だけ
      expect(broken).toHaveLength(0);
      expect(game.systems.get(interactableSystem).isHatchBroken('hatch_c')).toBe(false);

      // 縁をかすめただけ（半幅 1m から 0.15m 内側の外）では割れない
      game.teleportPlayer(hatch.x, hatch.z - 0.95, 0);
      run(10);
      expect(game.systems.get(interactableSystem).isHatchBroken('hatch_c')).toBe(false);

      const hp = game.playerTarget.health.current;
      game.teleportPlayer(hatch.x, hatch.z, 0);
      run(3);
      expect(game.systems.get(interactableSystem).isHatchBroken('hatch_c')).toBe(true);
      expect(game.systems.get(waterwaySystem).hatchBroken).toBe(true);
      expect(broken).toEqual([
        expect.objectContaining({ id: 'hatch_c', colliderId: 'floor-hatch' }),
      ]);
      expect(sounds.some((s) => s.cue === 'sfx.hatch-break')).toBe(true);
      expect(game.playerTarget.health.current).toBe(hp);
    });

    it('does not save anything: it can break every time', async () => {
      const first = await setup(['hatch_c'], { x: hatch.x, z: hatch.z });
      first.run(5);
      expect(first.game.systems.get(interactableSystem).isHatchBroken('hatch_c')).toBe(true);
      expect(first.save.get().flags).toEqual([]);
      const second = await setup(['hatch_c'], { x: hatch.x, z: hatch.z - 5 }, first.storage);
      second.run(5);
      expect(second.game.systems.get(interactableSystem).isHatchBroken('hatch_c')).toBe(false);
    });
  });
});

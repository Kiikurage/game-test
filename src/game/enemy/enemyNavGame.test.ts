import { beforeAll, describe, expect, it } from 'vitest';
import { Game } from '../game';
import { FakeInput } from '../testing/fakeInput';
import { createFlatLevel, wallProp } from '../testing/flatLevel';
import { levelGameOptions, type EnemySpawn, type GateDef, type Level } from '../world/level';
import { GridNavigator } from './gridNavigator';
import { directNavigator } from './navigation';

const DT = 1 / 60;

function soldier(id: string, x: number, z: number): EnemySpawn {
  return { id, type: 'undead_soldier', area: 'B', x, z, yaw: Math.PI / 2, behavior: 'wait' };
}

/** 敵 AI + 経路探索 + 物理（Rapier）の結合テスト。プレイヤーは動かず、鐘の音（壁越しに聞こえる）で敵を呼ぶ。 */
describe('enemy navigation in the game (Rapier)', () => {
  beforeAll(async () => {
    await Game.create(); // WASM 初期化
  });

  async function setup(level: Level, useNavigator: boolean, playerAt: [number, number]) {
    const input = new FakeInput();
    const options = levelGameOptions(level);
    const game = await Game.create({
      input,
      ...options,
      ...(useNavigator ? {} : { enemyNavigator: directNavigator }),
    });
    const enemy = game.enemies.enemies[0];
    if (!enemy) throw new Error('enemy not spawned');
    game.teleportPlayer(playerAt[0], playerAt[1], -Math.PI / 2);
    const distance = () =>
      Math.hypot(game.player.feet.x - enemy.position.x, game.player.feet.z - enemy.position.z);
    /** 鐘を鳴らし続けて `frames` ステップ進める。`each` は毎ステップ後に呼ぶ。 */
    const callFor = (frames: number, each?: () => void) => {
      for (let i = 0; i < frames; i++) {
        game.emitNoise(
          { x: game.player.feet.x, y: game.player.feet.y, z: game.player.feet.z },
          'bell',
        );
        game.update(DT);
        input.endStep();
        each?.();
      }
    };
    return { game, enemy, distance, callFor };
  }

  describe('around a wall', () => {
    // x=30 の壁（z 0..30）。z 30..60 が通り抜け。敵 (24,20) とプレイヤー (36,20) は壁を挟んで 12m
    const level = createFlatLevel({
      size: 60,
      props: [wallProp('w', 30, 15, 0.5, 15)],
      enemies: [soldier('e1', 24, 20)],
    });

    it('goes around the wall and reaches the player', async () => {
      const { enemy, distance, callFor } = await setup(level, true, [36, 20]);
      let maxZ = 0;
      callFor(2400, () => {
        maxZ = Math.max(maxZ, enemy.position.z);
      });
      expect(enemy.state).toBe('approach');
      expect(distance()).toBeLessThan(3.6);
      expect(maxZ).toBeGreaterThan(30); // 壁の端を回った
      expect(enemy.position.x).toBeGreaterThan(30);
    });

    it('is stuck behind the wall with a straight-line navigator (control)', async () => {
      const { enemy, distance, callFor } = await setup(level, false, [36, 20]);
      callFor(1200);
      expect(enemy.position.x).toBeLessThan(30);
      expect(distance()).toBeGreaterThan(5);
    });
  });

  describe('at a cliff edge', () => {
    // 穴（深さ 3m、x 28..34 × z 18..42）を挟んで敵 (24,30) とプレイヤー (38,30)
    const level = createFlatLevel({
      size: 60,
      pits: [{ minX: 28, maxX: 34, minZ: 18, maxZ: 42, depth: 3 }],
      enemies: [soldier('e1', 24, 30)],
    });

    it('does not fall into the pit while chasing the player across it', async () => {
      const { enemy, distance, callFor } = await setup(level, true, [38, 30]);
      let minY = Infinity;
      callFor(2400, () => {
        minY = Math.min(minY, enemy.position.y);
      });
      expect(minY).toBeGreaterThan(-0.5);
      // 追いついたあとは攻撃（#54）に入るので、接近・攻撃・硬直のどれでもよい
      expect(['approach', 'attack', 'recover']).toContain(enemy.state);
      expect(distance()).toBeLessThan(3.6);
    });

    it('would fall with a straight-line navigator (control)', async () => {
      const { enemy, callFor } = await setup(level, false, [38, 30]);
      let minY = Infinity;
      callFor(900, () => {
        minY = Math.min(minY, enemy.position.y);
      });
      expect(minY).toBeLessThan(-1);
    });
  });

  describe('gates', () => {
    const gate: GateDef = {
      id: 'G',
      kind: 'iron',
      x: 30,
      z: 20,
      yawDeg: 90,
      width: 4,
      height: 3.6,
      blocking: true,
    };
    const level = createFlatLevel({
      size: 60,
      props: [wallProp('w-s', 30, 9, 0.5, 9), wallProp('w-n', 30, 41, 0.5, 19)],
      gates: [gate],
      enemies: [soldier('e1', 24, 20)],
    });

    it('waits at a closed gate and goes through once it opens', async () => {
      const { game, enemy, distance, callFor } = await setup(level, true, [36, 20]);
      callFor(900);
      expect(enemy.position.x).toBeLessThan(30);
      expect(distance()).toBeGreaterThan(5);
      expect(game.setBoxEnabled('G', false)).toBe(true); // 門が開く（コライダと経路の両方）
      const nav = game.enemies.navigator;
      expect(nav).toBeInstanceOf(GridNavigator);
      callFor(900);
      expect(enemy.state).toBe('approach');
      expect(distance()).toBeLessThan(3.6);
      expect(enemy.position.x).toBeGreaterThan(30);
    });
  });
});

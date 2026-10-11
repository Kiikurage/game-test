import { registerDevHooks } from '../../devHooks';

declare module '../../devHooks' {
  interface DevHooks {
    /**
     * `index` 番目の敵の手前（敵の方を向く位置）へプレイヤーを移し、その敵を倒す（死亡演出・ディゾルブの E2E / 計測用）。
     * 倒した敵の足元座標を返す。存在しなければ null。
     */
    killEnemy(index: number, kill?: boolean): { x: number; y: number; z: number } | null;
  }
}

registerDevHooks('enemy', ({ game }) => ({
  killEnemy: (index, kill = true) => {
    const enemy = game.enemies.enemies[index];
    if (!enemy) return null;
    const { x, y, z } = enemy.position;
    game.teleportPlayer(x, z - 4, 0, y);
    game.camera.reset(game.player.feet, 0);
    if (kill) enemy.kill();
    return { x, y, z };
  },
}));

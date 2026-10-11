import { registerDevHooks } from '../../devHooks';

declare module '../../devHooks' {
  interface DevHooks {
    /**
     * プレイヤーモデルの描画上の向き（E2E 用。#256）。`rootYaw` はモデルのルートのワールドのヨー、
     * `chestYaw` は両肩（upperarm_l → upperarm_r）から求めた上半身のワールドのヨー（ラジアン）。
     * 描画前・モデル未読み込みなら null。
     */
    playerFacing(): { rootYaw: number; chestYaw: number } | null;
  }
}

registerDevHooks('playerFacing', ({ playerView }) => ({
  playerFacing: () => {
    const root = playerView()?.root;
    if (!root) return null;
    const q = root.quaternion;
    const l = root.getObjectByName('upperarm_l');
    const r = root.getObjectByName('upperarm_r');
    if (!l || !r) return null;
    root.updateMatrixWorld(true);
    const le = l.matrixWorld.elements;
    const re = r.matrixWorld.elements;
    // 右方向 = (-cos yaw, sin yaw)（前方 = (sin yaw, cos yaw)）
    const rx = re[12] - le[12];
    const rz = re[14] - le[14];
    return { rootYaw: 2 * Math.atan2(q.y, q.w), chestYaw: Math.atan2(rz, -rx) };
  },
}));

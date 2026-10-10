// 描画負荷の計測視点（scripts/perf.mjs と e2e/perf.spec.ts で共有）。
// teleport(x, z, yaw) の後、カメラはプレイヤーの背後に付く。yaw: +Z 基準で (sin, cos) の向き。
export const PERF_VIEWPOINTS = [
  { name: 'bonfire', x: 0, z: 3.5, yaw: Math.PI },
  { name: 'graveyard', x: 14, z: 6, yaw: Math.PI / 2 },
  { name: 'chapel-gate', x: 34, z: 17, yaw: Math.PI / 2 },
  { name: 'chapel-interior', x: 50, z: 22, yaw: Math.PI / 2 },
  // 地下墓所（通路の入口・L 字の角の先）と中庭（西の入口・霧の門側）
  { name: 'crypt-entrance', x: 62, z: 38, yaw: 0 },
  { name: 'crypt-bend', x: 66, z: 48.5, yaw: Math.PI / 2 },
  { name: 'courtyard-entrance', x: 85, z: 51, yaw: 1.2 },
  { name: 'courtyard-gate', x: 99, z: 60, yaw: 0.5 },
];

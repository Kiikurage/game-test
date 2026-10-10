// 描画負荷の計測視点（scripts/perf.mjs と e2e/perf.spec.ts で共有）。
// teleport(x, z, yaw) の後、カメラはプレイヤーの背後に付く。yaw: +Z 基準で (sin, cos) の向き。
export const PERF_VIEWPOINTS = [
  { name: 'bonfire', x: 0, z: 3.5, yaw: Math.PI },
  { name: 'graveyard', x: 14, z: 6, yaw: Math.PI / 2 },
  { name: 'chapel-gate', x: 34, z: 17, yaw: Math.PI / 2 },
  { name: 'chapel-interior', x: 50, z: 22, yaw: Math.PI / 2 },
  // 闘技場の入口（#45: 床・壁・柱・台座・たいまつがすべて視界に入る）
  { name: 'arena', x: 114.5, z: 77.5, yaw: Math.PI / 4 },
];

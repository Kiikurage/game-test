/**
 * 霧の門前に突き立つ 12 本の剣の配置（仕様書 14.7 節: 12 本が半円に突き立つ。11 本は門を向き、1 本だけ少し離れて逆さ）。
 * 純粋なデータ生成（描画・物理に依存しない）。メッシュは `public/assets/exploration.glb` の `PlantedSword`
 * （中心が原点、刃が +Y）で、`src/render/assets/exploration.ts` が InstancedMesh にして並べる。
 *
 * 座標は x, z が地面、y が上。`yaw` は Y 軸まわりの回転（three の `rotation.y`。ローカル +Z が (sin yaw, cos yaw) を向く）。
 * 剣の「向き」は刃の面の法線（ローカル +Z）がどこを向くかで表す（門を向く = 刃の平らな面を門へ見せる）。
 */

/** `PlantedSword` メッシュの寸法（メートル）。scripts/assets/exploration.mjs の `PLANTED_SWORD` と一致させる（テストで検証）。 */
export const PLANTED_SWORD_SIZE = {
  /** 全長（柄頭 〜 切先）。 */
  length: 0.93,
  /** 正立のとき切先が地面に埋まる深さ。 */
  buriedTip: 0.2,
  /** 逆さのとき柄頭が地面に埋まる深さ。 */
  buriedPommel: 0.06,
} as const;

export interface PlantedSwordPlacement {
  /** 剣の中心のワールド座標。 */
  readonly position: readonly [number, number, number];
  /** Y 軸まわりの回転（ラジアン）。 */
  readonly yaw: number;
  /** 地面への刺さり方の傾き（ラジアン）。X 軸まわり（前後）。 */
  readonly tiltX: number;
  /** 傾き。Z 軸まわり（左右）。 */
  readonly tiltZ: number;
  /** true なら刃が上を向き、柄頭が地面に刺さっている（逆さ）。 */
  readonly inverted: boolean;
  /** 刃の面が門を向いているか。 */
  readonly towardGate: boolean;
}

export interface GateSwordOptions {
  /** 門の位置（半円の中心）。 */
  readonly gate: { readonly x: number; readonly z: number };
  /** 門からプレイヤーが来る側への向き（ラジアン。(sin, cos) が方向）。半円はこちら側に開く。 */
  readonly approachYaw: number;
  /** 半円の半径（m）。既定 3.2。 */
  readonly radius?: number;
  /** 地面の高さ。既定 0。 */
  readonly groundY?: number;
}

/** 半円に並べる門向きの剣の本数と、逆さの 1 本を足した総数。 */
export const GATE_SWORD_COUNT = { facing: 11, total: 12 } as const;

/** 半円が張る角度（接近方向を中心に ±）。 */
const ARC_HALF_ANGLE = (80 * Math.PI) / 180;
/** 離れて逆さの 1 本の位置（接近方向からの角度と、半径への加算）。半円の端のさらに外側。 */
const LONE_ANGLE = (-118 * Math.PI) / 180;
const LONE_EXTRA_RADIUS = 1.1;
/** 傾きの最大（ラジアン）。 */
const MAX_TILT = (5 * Math.PI) / 180;

/** 決定的な疑似乱数（0〜1）。配置は毎回同じになる。 */
function hash01(i: number, salt: number): number {
  let h = Math.imul(i + 1, 374761393) ^ Math.imul(salt + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** 剣の中心の高さ。正立は切先、逆さは柄頭が埋まる。 */
export function plantedSwordCenterY(inverted: boolean, groundY = 0): number {
  const buried = inverted ? PLANTED_SWORD_SIZE.buriedPommel : PLANTED_SWORD_SIZE.buriedTip;
  return groundY + PLANTED_SWORD_SIZE.length / 2 - buried;
}

/** 剣の刃の面が向く水平方向の単位ベクトル（ローカル +Z を yaw で回したもの）。 */
export function plantedSwordFacing(placement: Pick<PlantedSwordPlacement, 'yaw'>): {
  readonly x: number;
  readonly z: number;
} {
  return { x: Math.sin(placement.yaw), z: Math.cos(placement.yaw) };
}

/**
 * 霧の門前の 12 本。先頭の 11 本が半円（門を向く）、最後の 1 本が離れて逆さ（門に背を向ける）。
 */
export function gateSwordPlacements(options: GateSwordOptions): PlantedSwordPlacement[] {
  const { gate, approachYaw, radius = 3.2, groundY = 0 } = options;
  const result: PlantedSwordPlacement[] = [];
  const { facing, total } = GATE_SWORD_COUNT;
  for (let i = 0; i < total; i++) {
    const lone = i === facing;
    const angle = lone ? LONE_ANGLE : -ARC_HALF_ANGLE + (i / (facing - 1)) * 2 * ARC_HALF_ANGLE;
    const r = lone ? radius + LONE_EXTRA_RADIUS : radius;
    const a = approachYaw + angle;
    const x = gate.x + Math.sin(a) * r;
    const z = gate.z + Math.cos(a) * r;
    // 門を向く yaw: 剣 → 門の方向。逆さの 1 本は反対（門に背を向ける）
    const toGate = Math.atan2(gate.x - x, gate.z - z);
    result.push({
      position: [x, plantedSwordCenterY(lone, groundY), z],
      yaw: lone ? toGate + Math.PI : toGate,
      tiltX: (hash01(i, 1) * 2 - 1) * MAX_TILT,
      tiltZ: (hash01(i, 2) * 2 - 1) * MAX_TILT,
      inverted: lone,
      towardGate: !lone,
    });
  }
  return result;
}

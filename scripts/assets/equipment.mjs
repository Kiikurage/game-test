// 亡者・ボス用の簡易装備メッシュ（プロシージャル自作。素材由来のライセンスなし）。
// すべてコードで生成する（外部素材・テクスチャなし）。色は頂点カラー（COLOR_0）で錆・汚れを表す。
//
// 座標系
//   手持ち（Sword_Rusty / Axe_Rusty / GreatAxe / GreatShield）: props.mjs の剣・盾と同じ。
//     剣・斧は握りが原点・刃先が +Y・刃の面の法線が ±Z。盾は中心が原点・表面が +Z。
//     取り付けは剣・盾と同じソケット（hand_r / lowerarm_l、src/render/assets/character.ts の SOCKETS と同値）。
//   防具（Cuirass 等）: キャラクター空間（足元が原点、+Y 上、+Z 前、+X がキャラクターの左）の
//     T ポーズ（knight.glb の bind pose）の位置で作り、取り付けボーンの bind ワールド行列の逆行列を
//     ソケットとして計算する。ボーン名とソケット（position / quaternion）は各ノードの extras に入れる。
import { Document } from '@gltf-transform/core';
import {
  box as rawBox,
  countInvertedTriangles,
  emptyGeo,
  loft,
  lathe,
  merge,
  transform,
} from './geometry.mjs';

// ---------------------------------------------------------------- 小道具

export const rotZ = (deg) => {
  const [s, c] = [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];
  return ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
};
/** 変換を右から順に適用する（compose(a, b)(p) = b(a(p))）。 */
export const compose =
  (...fns) =>
  (p) =>
    fns.reduce((q, f) => f(q), p);
export const move = (x, y, z) => (p) => [p[0] + x, p[1] + y, p[2] + z];

/** X 軸ミラー（巻き順も反転する）。 */
export function mirrorX(g) {
  const out = emptyGeo();
  for (let i = 0; i < g.positions.length; i += 3) {
    out.positions.push(-g.positions[i], g.positions[i + 1], g.positions[i + 2]);
    out.normals.push(-g.normals[i], g.normals[i + 1], g.normals[i + 2]);
  }
  for (let i = 0; i < g.indices.length; i += 3) {
    out.indices.push(g.indices[i], g.indices[i + 2], g.indices[i + 1]);
  }
  return out;
}

const box = (...args) => rawBox(...args);

export const ellipse = (rx, rz, cx = 0, cz = 0, n = 14) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cz + Math.sin(a) * rz];
  });

/** 角度範囲つきの回転体（lathe の一部だけ）。a0, a1 はラジアン。 */
export function latheArc(strips, segments, a0, a1) {
  const g = emptyGeo();
  for (const strip of strips) {
    const normals = strip.map((_, i) => {
      const a = strip[Math.max(0, i - 1)];
      const b = strip[Math.min(strip.length - 1, i + 1)];
      const dr = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dr, dy) || 1;
      return [dy / l, -dr / l];
    });
    const base = g.positions.length / 3;
    for (let i = 0; i < strip.length; i++) {
      for (let s = 0; s <= segments; s++) {
        const th = a0 + (s / segments) * (a1 - a0);
        const [r, y] = strip[i];
        const [nr, ny] = normals[i];
        g.positions.push(Math.cos(th) * r, y, Math.sin(th) * r);
        g.normals.push(Math.cos(th) * nr, ny, Math.sin(th) * nr);
      }
    }
    const row = segments + 1;
    for (let i = 0; i < strip.length - 1; i++) {
      for (let s = 0; s < segments; s++) {
        const a = base + i * row + s;
        g.indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
      }
    }
  }
  return g;
}

export function pushTri(g, a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(...n) || 1;
  const base = g.positions.length / 3;
  for (const p of [a, b, c]) {
    g.positions.push(...p);
    g.normals.push(n[0] / l, n[1] / l, n[2] / l);
  }
  g.indices.push(base, base + 1, base + 2);
}

/**
 * XY 平面の星形多角形（反時計回り）を z0〜z1 に押し出す。表面は +Z 側。
 * 中心頂点 (cx, cy) は多角形の重心。凹んでいても星形なら破綻しない。
 */
export function extrude(points, z0, z1) {
  const g = emptyGeo();
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    pushTri(g, [cx, cy, z1], [a[0], a[1], z1], [b[0], b[1], z1]); // 前面 (+Z)
    pushTri(g, [cx, cy, z0], [b[0], b[1], z0], [a[0], a[1], z0]); // 背面 (-Z)
    // 側面
    pushTri(g, [a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1]);
    pushTri(g, [a[0], a[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]);
  }
  return g;
}

/** 前面だけ中央に稜線を持つ押し出し（盾の表面用）。ridge は前面中心の z。 */
export function extrudeRidge(points, z0, z1, ridge) {
  const g = emptyGeo();
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    pushTri(g, [cx, cy, ridge], [a[0], a[1], z1], [b[0], b[1], z1]);
    pushTri(g, [cx, cy, z0], [b[0], b[1], z0], [a[0], a[1], z0]);
    pushTri(g, [a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1]);
    pushTri(g, [a[0], a[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]);
  }
  return g;
}

// ---------------------------------------------------------------- 頂点カラー（錆・汚れ）

export function hash3(ix, iy, iz) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export const fade = (t) => t * t * (3 - 2 * t);
export function noise3(x, y, z) {
  const [ix, iy, iz] = [Math.floor(x), Math.floor(y), Math.floor(z)];
  const [fx, fy, fz] = [fade(x - ix), fade(y - iy), fade(z - iz)];
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}
export const fbm = (x, y, z) => noise3(x, y, z) * 0.6 + noise3(x * 2.3, y * 2.3, z * 2.3) * 0.4;
export const mix3 = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
export const smooth = (e0, e1, x) => fade(Math.min(1, Math.max(0, (x - e0) / (e1 - e0))));

/** 素材ごとの色（リニア RGB）。p はパーツのワールド位置（キャラクター空間 or アイテム空間）。 */
export const COLORS = {
  // 錆びた古い鉄。平面は鈍い青灰の鉄色が主で、錆は「エッジ・凹み・下向きの面・垂直面の雨垂れ」に
  // 集中する（info: 頂点の法線 n と、硬いエッジらしさ edge）。コントラストと彩度は低く、ノイズは部位の大きさに
  // 対して低周波（斑点・迷彩にならない）。擦れた地金はエッジにだけ薄く出る。
  iron(p, seed, info) {
    const [x, y, z] = [p[0] + seed, p[1] + seed * 0.7, p[2] - seed * 0.3];
    const n = info?.n ?? [0, 1, 0];
    const edge = info?.edge ?? 0;
    // 地の鉄: 暗い青灰。ごく緩い明暗のむら
    const tone = 0.85 + 0.3 * fbm(x * 2.2, y * 2.2, z * 2.2);
    const steel = [0.062 * tone, 0.067 * tone, 0.078 * tone];
    // 錆の集まりやすさ: 下向きの面・垂直面（雨垂れ筋）・エッジ・低周波のむら
    const down = Math.max(0, -n[1]);
    const vertical = 1 - Math.abs(n[1]);
    const streak = fbm(x * 4.5, y * 0.9, z * 4.5); // 縦に長い筋
    const patch = fbm(x * 2.6 + 7, y * 2.6, z * 2.6);
    let wet =
      0.3 + 0.5 * down + 0.3 * vertical * smooth(0.4, 0.8, streak) + 0.55 * edge + 0.35 * patch;
    wet = smooth(0.45, 0.95, wet);
    // 錆の色: 彩度を落とした暗い茶〜赤褐色（わずかに濃淡）
    const rust = mix3([0.17, 0.085, 0.048], [0.25, 0.125, 0.066], fbm(x * 3.4, y * 3.4, z * 3.4));
    let c = mix3(steel, rust, wet * 0.85);
    // エッジの擦れ（地金が鈍く光る）
    c = mix3(c, [0.17, 0.175, 0.19], edge * (1 - wet) * 0.45);
    return c;
  },
  // 暗い革・木
  leather(p, seed) {
    const n = fbm(p[0] * 11 + seed, p[1] * 11, p[2] * 11);
    return mix3([0.045, 0.028, 0.02], [0.11, 0.07, 0.045], n);
  },
  // 盾の面（剥げた木）: 暗く彩度を落とした茶。むらは低周波
  wood(p, seed) {
    const n = fbm(p[0] * 5 + seed, p[1] * 3, p[2] * 5);
    const chip = smooth(0.6, 0.8, fbm(p[0] * 9, p[1] * 9 + seed, p[2] * 9));
    return mix3(
      mix3([0.042, 0.03, 0.022], [0.092, 0.064, 0.042], n),
      [0.14, 0.13, 0.115],
      chip * 0.25,
    );
  },
  // ボロ布（灰褐色 + 染み）
  cloth(p, seed) {
    const n = fbm(p[0] * 6 + seed, p[1] * 3, p[2] * 6);
    const stain = smooth(0.5, 0.7, fbm(p[0] * 13, p[1] * 13 + seed, p[2] * 13));
    return mix3(
      mix3([0.05, 0.045, 0.04], [0.13, 0.11, 0.09], n),
      [0.02, 0.015, 0.012],
      stain * 0.7,
    );
  },
};

// ---------------------------------------------------------------- パーツ定義
// 各 build は { parts: [{ geo, kind }] } を返す。kind は COLORS のキー。metal 判定は kind === 'iron'。

function swordRusty() {
  // 刃は左右非対称に欠けた細身の片手剣。先端は折れて鈍い。
  const ring = (wl, wr, t) => [
    [wl, 0],
    [wl * 0.35, t / 2],
    [-wr * 0.35, t / 2],
    [-wr, 0],
    [-wr * 0.35, -t / 2],
    [wl * 0.35, -t / 2],
  ];
  const blade = loft([
    { y: 0.1, ring: ring(0.034, 0.034, 0.016) },
    { y: 0.3, ring: ring(0.03, 0.031, 0.013) },
    { y: 0.42, ring: ring(0.022, 0.03, 0.013) }, // 刃こぼれ
    { y: 0.58, ring: ring(0.029, 0.027, 0.012) },
    { y: 0.7, ring: ring(0.019, 0.026, 0.01) },
    { y: 0.78, ring: ring(0.01, 0.018, 0.009) }, // 折れた先端
    { y: 0.8, ring: ring(0.003, 0.004, 0.003) },
  ]);
  const guard = merge(
    box(0, 0.088, 0, 0.2, 0.024, 0.032),
    box(0.108, 0.082, 0, 0.016, 0.04, 0.034),
    box(-0.1, 0.095, 0, 0.014, 0.034, 0.03),
  );
  const grip = lathe(
    [
      [
        [0.016, -0.085],
        [0.016, 0.075],
      ],
      [
        [0.016, 0.075],
        [0, 0.075],
      ],
      [
        [0, -0.085],
        [0.016, -0.085],
      ],
    ],
    10,
  );
  const pommel = lathe(
    [
      [
        [0, -0.13],
        [0.02, -0.122],
        [0.026, -0.105],
        [0.022, -0.09],
        [0, -0.082],
      ],
    ],
    10,
  );
  return {
    parts: [
      { geo: merge(blade, guard, pommel), kind: 'iron' },
      { geo: grip, kind: 'leather' },
    ],
  };
}

/** 斧の頭: XY 平面（刃が +X、裏が -X）の星形多角形。 */
function axeHead(points, thickness) {
  return extrude(points, -thickness / 2, thickness / 2);
}

function axeRusty() {
  const haft = lathe(
    [
      [
        [0.017, -0.14],
        [0.015, 0.3],
        [0.018, 0.62],
      ],
      [
        [0.018, 0.62],
        [0, 0.64],
      ],
      [
        [0, -0.14],
        [0.017, -0.14],
      ],
    ],
    8,
  );
  const head = axeHead(
    [
      [0.02, 0.48],
      [0.06, 0.5],
      [0.16, 0.56],
      [0.2, 0.53],
      [0.205, 0.43],
      [0.19, 0.36],
      [0.1, 0.4],
      [0.02, 0.4],
      [-0.03, 0.43],
      [-0.03, 0.5],
    ],
    0.024,
  );
  return {
    parts: [
      { geo: merge(head, box(0, 0.64, 0, 0.034, 0.03, 0.034)), kind: 'iron' },
      { geo: haft, kind: 'leather' },
    ],
  };
}

function greatAxe() {
  // 全長約 1.5m の両手大斧。握りは原点（柄の下 1/3 付近）。ボスは 2.2 倍されるので細部は大きめに作る。
  const haft = lathe(
    [
      [
        [0.024, -0.55],
        [0.021, 0.2],
        [0.022, 0.9],
      ],
      [
        [0.022, 0.9],
        [0, 0.92],
      ],
      [
        [0, -0.55],
        [0.024, -0.55],
      ],
    ],
    10,
  );
  const grip = lathe(
    [
      [
        [0.03, -0.12],
        [0.03, 0.14],
      ],
    ],
    10,
  );
  // 三日月形の刃（+X）と、反対側の返しの爪（-X）
  const head = axeHead(
    [
      [0.03, 0.9],
      [0.12, 0.98],
      [0.28, 1.04],
      [0.4, 0.98],
      [0.44, 0.84],
      [0.4, 0.68],
      [0.32, 0.58],
      [0.2, 0.66],
      [0.08, 0.7],
      [0.03, 0.7],
      [-0.12, 0.74],
      [-0.26, 0.8],
      [-0.12, 0.88],
    ],
    0.04,
  );
  const spike = merge(box(0, 0.97, 0, 0.05, 0.1, 0.05), box(0, -0.58, 0, 0.044, 0.06, 0.044));
  const bands = merge(box(0, 0.76, 0, 0.06, 0.07, 0.06), box(0, 0.86, 0, 0.06, 0.05, 0.06));
  return {
    parts: [
      { geo: merge(head, spike, bands), kind: 'iron' },
      { geo: merge(haft, grip), kind: 'leather' },
    ],
  };
}

function greatShield() {
  // ヒーターシールドの大盾（幅 0.62 × 高さ 0.95）。表面 +Z、持ち手は背面。
  const outline = [
    [0.31, 0.45],
    [-0.31, 0.45],
    [-0.31, 0.02],
    [-0.2, -0.26],
    [0, -0.5],
    [0.2, -0.26],
    [0.31, 0.02],
  ];
  // extrude* は反時計回り前提。上の並びは時計回りなので反転する。
  const ccw = [...outline].reverse();
  const face = extrudeRidge(ccw, -0.02, 0.025, 0.065);
  // 縁取りの鉄板（各辺に細い箱を斜めに置く代わりに、少し大きい輪郭を押し出して前に出す）
  const grow = (k) => ccw.map(([x, y]) => [x * k, y * k + (y < 0 ? -0.012 : 0.012)]);
  const rim = extrude(grow(1.045), -0.035, -0.018);
  const strapH = box(0, 0.2, 0.038, 0.64, 0.05, 0.016);
  const strapV = box(0, -0.02, 0.07, 0.05, 0.92, 0.016);
  const rivets = merge(
    ...[
      [-0.2, 0.2],
      [0.2, 0.2],
      [0, 0.38],
      [0, 0.0],
      [0, -0.26],
    ].map(([x, y]) => box(x, y, 0.082, 0.04, 0.04, 0.03)),
  );
  const boss = lathe(
    [
      [
        [0.085, 0.07],
        [0.08, 0.1],
        [0.05, 0.125],
        [0, 0.135],
      ],
    ],
    12,
  );
  const handle = merge(
    box(0, -0.0, -0.05, 0.03, 0.18, 0.03),
    box(0, 0.12, -0.035, 0.05, 0.03, 0.04),
  );
  const strapBack = box(0, 0.0, -0.032, 0.5, 0.04, 0.012);
  return {
    parts: [
      { geo: face, kind: 'wood' },
      {
        geo: merge(
          rim,
          strapH,
          strapV,
          rivets,
          transform(boss, ([x, y, z]) => [x, -z, y]),
        ),
        kind: 'iron',
      },
      { geo: merge(handle, strapBack), kind: 'leather' },
    ],
  };
}

// --- 防具（キャラクター空間・T ポーズ）

function cuirass(heavy) {
  const k = heavy ? 1.12 : 1;
  const ringAt = (y, rx, rz, cz = 0) => ({ y, ring: ellipse(rx * k, rz * k, 0, cz, 16) });
  const shell = loft([
    ringAt(1.0, 0.185, 0.135, 0.0),
    ringAt(1.1, 0.2, 0.145, 0.0),
    ringAt(1.24, 0.235, 0.165, 0.015),
    ringAt(1.38, 0.245, 0.17, 0.01),
    ringAt(1.47, 0.205, 0.14, 0.0),
  ]);
  const belt = loft([ringAt(1.04, 0.2, 0.15), ringAt(1.1, 0.208, 0.155)]);
  const ridge = box(0, 1.28, 0.18 * k, 0.025, 0.3, 0.03);
  const rivets = merge(
    ...[-0.12, 0.12].flatMap((x) => [1.2, 1.34].map((y) => box(x, y, 0.17 * k, 0.03, 0.03, 0.03))),
  );
  const parts = [
    { geo: merge(shell, ridge, rivets), kind: 'iron' },
    { geo: belt, kind: 'leather' },
  ];
  if (heavy) {
    // 喉当て（ゴルジェット）
    const gorget = loft([
      { y: 1.46, ring: ellipse(0.17, 0.13, 0, 0, 16) },
      { y: 1.52, ring: ellipse(0.13, 0.11, 0, 0.0, 16) },
      { y: 1.58, ring: ellipse(0.1, 0.095, 0, -0.01, 16) },
    ]);
    parts.push({ geo: gorget, kind: 'iron' });
  }
  return { parts };
}

/** 左肩の肩当て（T ポーズ、キャラクターの左 = +X）。size で大きさを変える。 */
function pauldronLeft(size, tiers) {
  const dome = (s) =>
    lathe(
      [
        [
          [0.15 * s, 0.0],
          [0.145 * s, 0.03 * s],
          [0.12 * s, 0.075 * s],
          [0.08 * s, 0.108 * s],
          [0.03 * s, 0.125 * s],
          [0, 0.128 * s],
        ],
      ],
      16,
    );
  const parts = [];
  for (let t = 0; t < tiers; t++) {
    const s = size * (1 + t * 0.14);
    parts.push(
      transform(dome(s), compose(move(0, -0.045 * t * size, 0), rotZ(-38), move(0.2, 1.5, 0.0))),
    );
  }
  // 縁の返し
  const rim = lathe(
    [
      [
        [0.152 * size, -0.006],
        [0.158 * size, 0.012],
        [0.15 * size, 0.026],
      ],
    ],
    16,
  );
  parts.push(transform(rim, compose(rotZ(-38), move(0.2, 1.5, 0))));
  return { parts: [{ geo: merge(...parts), kind: 'iron' }] };
}

function vambraceLeft() {
  // 前腕（lowerarm_l: x 0.44 → 0.68）の籠手
  const tube = lathe(
    [
      [
        [0.062, 0.02],
        [0.058, 0.1],
        [0.05, 0.2],
      ],
      [
        [0.07, 0.015],
        [0.07, 0.04],
      ],
    ],
    12,
  );
  const cuff = lathe(
    [
      [
        [0.066, 0.1],
        [0.066, 0.125],
      ],
      [
        [0.058, 0.17],
        [0.058, 0.195],
      ],
    ],
    12,
  );
  return {
    parts: [
      {
        geo: transform(merge(tube, cuff), compose(rotZ(-90), move(0.45, 1.455, -0.07))),
        kind: 'iron',
      },
    ],
  };
}

function greaveLeft() {
  // 脛当て（calf_l: y 0.54 → 0.09, x = 0.091）。足首〜膝を覆う。
  const shin = lathe(
    [
      [
        [0.07, 0.12],
        [0.075, 0.25],
        [0.085, 0.4],
        [0.078, 0.5],
      ],
    ],
    12,
  );
  const knee = lathe(
    [
      [
        [0.1, 0.5],
        [0.098, 0.54],
        [0.07, 0.58],
        [0, 0.595],
      ],
    ],
    12,
  );
  return { parts: [{ geo: transform(merge(shin, knee), move(0.091, 0.0, -0.05)), kind: 'iron' }] };
}

function tassets() {
  // 腰の草摺り（2 段）。pelvis に取り付ける。
  const tier = (y0, y1, r0, r1) =>
    loft([
      { y: y0, ring: ellipse(r1, r1 * 0.78, 0, 0.0, 16) },
      { y: y1, ring: ellipse(r0, r0 * 0.78, 0, 0.0, 16) },
    ]);
  return {
    parts: [{ geo: merge(tier(0.8, 0.92, 0.225, 0.22), tier(0.9, 1.04, 0.21, 0.2)), kind: 'iron' }],
  };
}

function helmPot() {
  // 亡者兵（盾持ち）の錆びた鉢形兜。顔は開き、鼻当てを付ける。
  const dome = lathe(
    [
      [
        [0.128, 1.66],
        [0.13, 1.7],
        [0.118, 1.76],
        [0.085, 1.81],
        [0.04, 1.835],
        [0, 1.84],
      ],
    ],
    16,
  );
  const brim = lathe(
    [
      [
        [0.165, 1.655],
        [0.17, 1.668],
        [0.132, 1.675],
      ],
      [
        [0.128, 1.655],
        [0.165, 1.655],
      ],
    ],
    16,
  );
  const neckGuard = latheArc(
    [
      [
        [0.135, 1.665],
        [0.17, 1.58],
        [0.178, 1.55],
      ],
    ],
    8,
    Math.PI * 0.55,
    Math.PI * 1.45,
  );
  const nasal = box(0, 1.7, 0.145, 0.03, 0.1, 0.014);
  const crest = box(0, 1.82, -0.01, 0.014, 0.03, 0.24);
  return { parts: [{ geo: merge(dome, brim, neckGuard, nasal, crest), kind: 'iron' }] };
}

function helmGreat() {
  // ボスの全頭兜（グレートヘルム）。眼の高さに横スリット。スリットの奥は暗い内側。
  const upper = lathe(
    [
      [
        [0.14, 1.705],
        [0.145, 1.74],
        [0.13, 1.79],
        [0.095, 1.83],
        [0.04, 1.85],
        [0, 1.852],
      ],
    ],
    18,
  );
  const lower = lathe(
    [
      [
        [0.146, 1.5],
        [0.15, 1.56],
        [0.145, 1.64],
        [0.14, 1.675],
      ],
      [
        [0.14, 1.675],
        [0.12, 1.675],
      ],
      [
        [0.12, 1.5],
        [0.146, 1.5],
      ],
    ],
    18,
  );
  // 側面・背面はスリットの隙間を塞ぐ内張り（正面 -70°〜+70° は開けて眼を見せる）
  const backBand = latheArc(
    [
      [
        [0.138, 1.675],
        [0.138, 1.705],
      ],
    ],
    14,
    Math.PI * 0.5 + 0.55,
    Math.PI * 2.5 - 0.55,
  );
  const visorRidge = box(0, 1.69, 0.152, 0.02, 0.04, 0.018);
  const cross = box(0, 1.6, 0.152, 0.016, 0.16, 0.014);
  const crest = box(0, 1.865, -0.01, 0.02, 0.05, 0.3);
  return {
    parts: [{ geo: merge(upper, lower, backBand, visorRidge, cross, crest), kind: 'iron' }],
  };
}

function cape() {
  // ボロ布のマント。肩〜背中に垂れ下がる（キャラクター空間・T ポーズの背面側）。
  const cols = 12;
  const rows = 7;
  const g = emptyGeo();
  const grid = [];
  for (let r = 0; r <= rows; r++) {
    const row = [];
    const v = r / rows; // 0 = 上端
    for (let c = 0; c <= cols; c++) {
      const u = c / cols - 0.5;
      const width = 0.24 + 0.2 * v;
      const x = u * 2 * width;
      // ほつれた裾: 下端ほど列ごとにばらつく
      const tatter =
        r === rows
          ? 0.16 * hash3(c, 11, 3) + (c % 3 === 0 ? 0.1 : 0)
          : r === rows - 1
            ? 0.04 * hash3(c, 7, 5)
            : 0;
      const y = 1.5 - v * 0.82 + tatter * (r >= rows - 1 ? 1 : 0);
      const z =
        -0.16 - v * 0.14 - 0.04 * Math.cos(u * Math.PI) * (1 - v) + 0.03 * Math.sin(c * 1.7 + r);
      row.push([x, y, z]);
    }
    grid.push(row);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = grid[r][c];
      const b = grid[r][c + 1];
      const d = grid[r + 1][c];
      const e = grid[r + 1][c + 1];
      // 背面 (-Z) が表。material は doubleSide。
      pushTri(g, a, b, d);
      pushTri(g, b, e, d);
    }
  }
  const collar = loft([
    { y: 1.46, ring: ellipse(0.2, 0.16, 0, -0.01, 14) },
    { y: 1.54, ring: ellipse(0.16, 0.13, 0, -0.01, 14) },
  ]);
  return {
    parts: [
      { geo: g, kind: 'cloth' },
      { geo: collar, kind: 'cloth' },
    ],
  };
}

// ---------------------------------------------------------------- アイテム定義

const SWORD_SOCKET = {
  bone: 'hand_r',
  position: [0, 0.06, 0],
  quaternion: [0.4304, 0.561, 0.4304, 0.561],
};

/**
 * id → { build(), socket } 。socket が文字列（ボーン名）のものはキャラクター空間で作ってあり、
 * ビルド時に bind pose からソケットを計算する。
 */
export const ITEMS = {
  Sword_Rusty: { build: swordRusty, socket: SWORD_SOCKET },
  Axe_Rusty: { build: axeRusty, socket: SWORD_SOCKET },
  // 大斧: 握り位置は柄の下 1/3。右手ソケット（剣と同じ向き）
  // 待機姿勢（腕を下ろした状態）で柄を立て、刃を前に向けて体の脇に構える（頭の高さまで刃が来て視認できる）
  GreatAxe: {
    build: greatAxe,
    socket: { bone: 'hand_r', position: [0, 0, 0], quaternion: [0.7071, 0, 0.7071, 0] },
  },
  // 待機姿勢で表面が正面（+Z）を向くように前腕の前側へ構える
  GreatShield: {
    build: greatShield,
    socket: { bone: 'lowerarm_l', position: [0, 0.12, 0.13], quaternion: [0, 0, 1, 0] },
  },
  Cuirass: { build: () => cuirass(false), socket: 'spine_03' },
  CuirassHeavy: { build: () => cuirass(true), socket: 'spine_03' },
  Pauldron_L: { build: () => pauldronLeft(0.85, 1), socket: 'upperarm_l' },
  Pauldron_R: { build: () => mirrorParts(pauldronLeft(0.85, 1)), socket: 'upperarm_r' },
  PauldronLarge_L: { build: () => pauldronLeft(1.12, 3), socket: 'upperarm_l' },
  PauldronLarge_R: { build: () => mirrorParts(pauldronLeft(1.12, 3)), socket: 'upperarm_r' },
  Vambrace_L: { build: vambraceLeft, socket: 'lowerarm_l' },
  Vambrace_R: { build: () => mirrorParts(vambraceLeft()), socket: 'lowerarm_r' },
  Greave_L: { build: greaveLeft, socket: 'calf_l' },
  Greave_R: { build: () => mirrorParts(greaveLeft()), socket: 'calf_r' },
  Tassets: { build: tassets, socket: 'pelvis' },
  Helm_Pot: { build: helmPot, socket: 'Head' },
  Helm_Great: { build: helmGreat, socket: 'Head' },
  Cape: { build: cape, socket: 'spine_03' },
};

function mirrorParts(item) {
  return { parts: item.parts.map((p) => ({ ...p, geo: mirrorX(p.geo) })) };
}

/** 敵ごとの装備一覧（仕様書 5.2 / 5.3 / 6.1 節）。 */
export const LOADOUTS = {
  soldier: ['Sword_Rusty', 'Cuirass', 'Pauldron_L', 'Pauldron_R'],
  shieldbearer: ['Axe_Rusty', 'GreatShield', 'Helm_Pot', 'Pauldron_L', 'Pauldron_R'],
  boss: [
    'GreatAxe',
    'GreatShield',
    'Helm_Great',
    'CuirassHeavy',
    'PauldronLarge_L',
    'PauldronLarge_R',
    'Vambrace_L',
    'Vambrace_R',
    'Tassets',
    'Greave_L',
    'Greave_R',
    'Cape',
  ],
};

// ---------------------------------------------------------------- 行列ユーティリティ（ソケット計算）

/** 列優先 4x4（gltf-transform の getWorldMatrix）から、剛体の逆変換を position + quaternion にする。 */
export function inverseRigid(m) {
  // R = 3x3（列 = 軸）、p = 平移。逆: R^T, -R^T p
  const R = [
    [m[0], m[4], m[8]],
    [m[1], m[5], m[9]],
    [m[2], m[6], m[10]],
  ];
  // 軸の長さで正規化（スケールが乗っていても回転だけ取り出す）
  const len = [0, 1, 2].map((c) => Math.hypot(R[0][c], R[1][c], R[2][c]));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r][c] /= len[c];
  const Rt = [0, 1, 2].map((r) => [0, 1, 2].map((c) => R[c][r]));
  const p = [m[12], m[13], m[14]];
  const position = Rt.map((row) => -(row[0] * p[0] + row[1] * p[1] + row[2] * p[2]));
  return { position, quaternion: matToQuat(Rt) };
}

/**
 * キャラクター空間の配置（placement: アイテム → キャラクター空間の position + quaternion）を、
 * ボーン（bind ワールド行列 m）のローカル姿勢に変換する。背中の大剣など、ボーンの bind 姿勢に対して
 * 「キャラクターのこの位置にこの向きで置きたい」ときに使う。
 */
export function placementToSocket(m, placement) {
  const Rb = [
    [m[0], m[4], m[8]],
    [m[1], m[5], m[9]],
    [m[2], m[6], m[10]],
  ];
  const len = [0, 1, 2].map((c) => Math.hypot(Rb[0][c], Rb[1][c], Rb[2][c]));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) Rb[r][c] /= len[c];
  const Rbt = [0, 1, 2].map((r) => [0, 1, 2].map((c) => Rb[c][r]));
  const [x, y, z, w] = placement.quaternion;
  const Rp = [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
  const mul = (A, B) =>
    A.map((row) => [0, 1, 2].map((c) => row[0] * B[0][c] + row[1] * B[1][c] + row[2] * B[2][c]));
  const d = [0, 1, 2].map((i) => placement.position[i] - m[12 + i]);
  const position = Rbt.map((row) => row[0] * d[0] + row[1] * d[1] + row[2] * d[2]);
  return { position, quaternion: matToQuat(mul(Rbt, Rp)) };
}

export function matToQuat(M) {
  const [m00, m01, m02] = M[0];
  const [m10, m11, m12] = M[1];
  const [m20, m21, m22] = M[2];
  const tr = m00 + m11 + m22;
  let x, y, z, w;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    w = 0.25 * s;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }
  return [x, y, z, w];
}

// ---------------------------------------------------------------- glTF 生成

/**
 * 頂点ごとの「硬いエッジらしさ」（0〜1）。同じ位置にある頂点の法線が大きく食い違うほど 1 に近い
 * （フラットシェードの箱や多角形の稜線）。滑らかな面は 0。錆・擦れのマスクに使う。
 */
export function edgeness(geo) {
  const key = (i) => [0, 1, 2].map((c) => Math.round(geo.positions[i * 3 + c] * 2000)).join(',');
  const groups = new Map();
  const count = geo.positions.length / 3;
  for (let i = 0; i < count; i++) {
    const k = key(i);
    const list = groups.get(k);
    if (list) list.push(i);
    else groups.set(k, [i]);
  }
  const out = new Float32Array(count);
  for (const list of groups.values()) {
    let minDot = 1;
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        const [i, j] = [list[a], list[b]];
        const d =
          geo.normals[i * 3] * geo.normals[j * 3] +
          geo.normals[i * 3 + 1] * geo.normals[j * 3 + 1] +
          geo.normals[i * 3 + 2] * geo.normals[j * 3 + 2];
        minDot = Math.min(minDot, d);
      }
    }
    const e = smooth(0.04, 0.4, 1 - minDot);
    for (const i of list) out[i] = e;
  }
  return out;
}

/**
 * @param {Record<string, number[]>} boneWorldMatrices ボーン名 → knight.glb の bind pose ワールド行列（列優先 16 要素）
 * @returns {{ document: Document, triangles: number, items: Record<string, { triangles: number, bone: string }> }}
 */
export function buildEquipmentDocument(boneWorldMatrices) {
  return buildItemsDocument({ defs: ITEMS, sceneName: 'Equipment', boneWorldMatrices });
}

/**
 * アイテム定義（id → { build(), socket, extraSockets? }）から glTF を生成する。
 * 探索用メッシュ（exploration.mjs）も同じ作り方（頂点カラー・金属/柔素材の 2 プリミティブ）で作るために共有する。
 * kind が metalKinds に含まれるパーツは金属マテリアル、それ以外は柔らかい素材のマテリアルにまとめる。
 * extraSockets（名前 → ソケット）は node.extras.sockets に入る（手 / 背中など複数の取り付け先を持つ物用）。
 */
export function buildItemsDocument({
  defs,
  sceneName,
  boneWorldMatrices,
  colors = COLORS,
  metalKinds = new Set(['iron']),
}) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(sceneName);

  const metal = doc
    .createMaterial('RustyMetal')
    .setBaseColorFactor([1, 1, 1, 1])
    .setMetallicFactor(0.4)
    .setRoughnessFactor(0.82)
    .setDoubleSided(true);
  const soft = doc
    .createMaterial('WornSoft')
    .setBaseColorFactor([1, 1, 1, 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(0.92)
    .setDoubleSided(true);

  const resolveSocket = (id, socket) => {
    if (socket === undefined) return undefined;
    const name = typeof socket === 'string' ? socket : socket.placement ? socket.bone : undefined;
    if (name === undefined) return socket;
    const m = boneWorldMatrices[name];
    if (!m) throw new Error(`${id}: bone matrix not found: ${name}`);
    if (typeof socket === 'string') return { bone: name, ...inverseRigid(m) };
    return { bone: name, ...placementToSocket(m, socket.placement) };
  };

  let triangles = 0;
  const items = {};
  let seed = 0;
  for (const [id, def] of Object.entries(defs)) {
    seed += 3.7;
    const { parts } = def.build();
    const mesh = doc.createMesh(id);
    let itemTris = 0;
    // 金属と柔らかい素材ごとに 1 プリミティブへまとめる
    const groups = { iron: emptyGeo(), soft: emptyGeo() };
    const colorsOf = { iron: [], soft: [] };
    for (const { geo, kind } of parts) {
      const key = metalKinds.has(kind) ? 'iron' : 'soft';
      const g = groups[key];
      const base = g.positions.length / 3;
      g.positions.push(...geo.positions);
      g.normals.push(...geo.normals);
      for (const i of geo.indices) g.indices.push(i + base);
      const edge = edgeness(geo);
      for (let i = 0; i < geo.positions.length; i += 3) {
        const c = colors[kind](
          [geo.positions[i], geo.positions[i + 1], geo.positions[i + 2]],
          seed,
          { n: [geo.normals[i], geo.normals[i + 1], geo.normals[i + 2]], edge: edge[i / 3] },
        );
        colorsOf[key].push(...c, 1);
      }
    }
    for (const key of ['iron', 'soft']) {
      const g = groups[key];
      if (g.indices.length === 0) continue;
      const accessor = (type, array) =>
        doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
      const prim = doc
        .createPrimitive()
        .setMaterial(key === 'iron' ? metal : soft)
        .setAttribute('POSITION', accessor('VEC3', new Float32Array(g.positions)))
        .setAttribute('NORMAL', accessor('VEC3', new Float32Array(g.normals)))
        .setAttribute('COLOR_0', accessor('VEC4', new Float32Array(colorsOf[key])))
        .setIndices(accessor('SCALAR', new Uint32Array(g.indices)));
      mesh.addPrimitive(prim);
      itemTris += g.indices.length / 3;
    }
    const node = doc.createNode(id).setMesh(mesh);
    const socket = resolveSocket(id, def.socket);
    const extras = socket
      ? { bone: socket.bone, position: socket.position, quaternion: socket.quaternion }
      : {};
    if (def.extras) Object.assign(extras, def.extras);
    if (def.extraSockets) {
      extras.sockets = Object.fromEntries(
        Object.entries(def.extraSockets).map(([name, s]) => [name, resolveSocket(id, s)]),
      );
    }
    node.setExtras(extras);
    scene.addChild(node);
    items[id] = { triangles: itemTris, bone: socket?.bone };
    triangles += itemTris;
  }
  return { document: doc, triangles, items };
}

/** 検証用: 凸な単体パーツの巻き順チェック（テスト・ビルドから使う）。 */
export function invertedTriangleCount(geo) {
  return countInvertedTriangles(geo);
}

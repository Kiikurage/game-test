// 環境メッシュ（墓地・礼拝堂: エリア A〜C）。プロシージャル自作。素材由来のライセンスなし、テクスチャなし。
// 装備（equipment.mjs）・探索小物（exploration.mjs）と同じ作り方: コードで生成し、色は頂点カラー（COLOR_0）に焼き込む。
// 苔は低い所と上向きの面、汚れは凹みと下向き、石の 1 個ごとの色むらは `tint` で出す。
//
// 座標系（アイテム空間）: 足元（底面中央）が原点、+Y が上、正面が +Z。単位はメートル。
// ランタイム（src/render/assets/environment.ts）は、これを level のコライダ寸法へ合わせて拡縮・回転し、
// 空間バケットごとに 1 メッシュへ結合する（ドローコール削減）。
//
// kind:  stone（石。苔・汚れ） / darkStone（暗い石・凹み） / wood（古い木） / bark（枯れ木の樹皮） /
//        earth（土・灰） / cloth（ぼろ布） / iron（錆びた鉄、金属マテリアル） / glow（発光。ランタン・たいまつの炎）
import { box, emptyGeo, loft, lathe, transform } from './geometry.mjs';
import {
  compose,
  ellipse,
  extrude,
  fbm,
  hash3,
  mix3,
  move,
  pushTri,
  smooth,
  edgeness,
} from './equipment.mjs';
import { Document } from '@gltf-transform/core';

// ---------------------------------------------------------------- 小道具

const rad = (d) => (d * Math.PI) / 180;
export const rotY = (deg) => {
  const [s, c] = [Math.sin(rad(deg)), Math.cos(rad(deg))];
  return ([x, y, z]) => [x * c + z * s, y, -x * s + z * c];
};
const rotX = (deg) => {
  const [s, c] = [Math.sin(rad(deg)), Math.cos(rad(deg))];
  return ([x, y, z]) => [x, y * c - z * s, y * s + z * c];
};
const rotZ = (deg) => {
  const [s, c] = [Math.sin(rad(deg)), Math.cos(rad(deg))];
  return ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
};
const xf = (g, ...fns) => transform(g, compose(...fns));

/** 決定的な乱数（mulberry32）。 */
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** y 軸方向を dir へ向ける回転。 */
function alignY(dir) {
  const l = Math.hypot(...dir);
  const d = dir.map((v) => v / l);
  const ax = [d[2], 0, -d[0]];
  const s = Math.hypot(ax[0], ax[2]);
  const c = d[1];
  if (s < 1e-9) return c > 0 ? (p) => p : ([x, y, z]) => [x, -y, z];
  const k = [ax[0] / s, 0, ax[2] / s];
  return (p) => {
    const kxp = [k[1] * p[2] - k[2] * p[1], k[2] * p[0] - k[0] * p[2], k[0] * p[1] - k[1] * p[0]];
    const kdp = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
    return [0, 1, 2].map((i) => p[i] * c + kxp[i] * s + k[i] * kdp * (1 - c));
  };
}

/** p0 から p1 へ伸びる先細りの n 角柱（枝・脚・棒）。 */
function limb(p0, p1, r0, r1, n = 6, bulge = 1) {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const g = loft([
    { y: 0, ring: ellipse(r0, r0, 0, 0, n) },
    { y: len * 0.5, ring: ellipse(((r0 + r1) / 2) * bulge, ((r0 + r1) / 2) * bulge, 0, 0, n) },
    { y: len, ring: ellipse(r1, r1, 0, 0, n) },
  ]);
  const rot = alignY([p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]);
  return transform(g, compose(rot, move(...p0)));
}

/** 傾き・位置つきの箱（石 1 個・板 1 枚）。 */
function slab(cx, cy, cz, sx, sy, sz, yaw = 0, tiltX = 0, tiltZ = 0) {
  return xf(box(0, 0, 0, sx, sy, sz), rotX(tiltX), rotZ(tiltZ), rotY(yaw), move(cx, cy, cz));
}

/** 角の取れた岩（底面中心）。 */
function rock(cx, cy, cz, rx, h, rz, seed, n = 8) {
  const rnd = rng(seed + 11);
  // 小さな岩（n <= 5）は 2 段だけにして三角形を減らす
  const levels = n <= 5 ? [0, 0.5] : [0, 0.2, 0.55, 0.85];
  const profile = n <= 5 ? [1, 0.7] : [0.9, 1, 0.92, 0.55];
  const rings = levels.map((t, k) => ({
    y: cy + t * h,
    ring: Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const j = 0.78 + 0.4 * rnd();
      return [cx + Math.cos(a) * rx * profile[k] * j, cz + Math.sin(a) * rz * profile[k] * j];
    }),
  }));
  rings.push({ y: cy + h * (0.97 + 0.06 * rnd()), ring: [[cx + (rnd() - 0.5) * rx * 0.2, cz]] });
  return loft(rings);
}

/** XY 平面の凸〜星形多角形を z0〜z1 に押し出す（正面 +Z）。 */
const prism = (pts, z0, z1) => extrude(pts, z0, z1);

const part = (geo, kind, tint = 1) => ({ geo, kind, tint });

// ---------------------------------------------------------------- 色（頂点カラー。リニア RGB）

const grime = (x, y, z, k = 1) => smooth(0.55, 0.8, fbm(x * 9 * k, y * 7 * k, z * 9 * k));

export const ENV_COLORS = {
  // 風化した石: 暖灰と冷灰のむら、低い所と上向き面に苔、凹み・下向きに煤
  stone(p, seed, info) {
    const [x, y, z] = [p[0] + seed, p[1], p[2] - seed];
    const n = info?.n ?? [0, 1, 0];
    const tint = info?.tint ?? 1;
    const warm = fbm(x * 3.1, y * 3.1, z * 3.1);
    let base = mix3([0.1, 0.1, 0.104], [0.235, 0.226, 0.208], warm);
    base = mix3(
      base,
      [0.16, 0.175, 0.2],
      smooth(0.55, 0.8, fbm(x * 1.7 + 5, y * 1.7, z * 1.7)) * 0.4,
    );
    base = base.map((v) => v * tint);
    const up = Math.max(0, n[1]);
    const mossAmt =
      smooth(0.42, 0.66, fbm(x * 4 + 3, y * 3, z * 4)) *
      (0.35 + 0.65 * smooth(1.6, 0.0, y)) *
      (0.35 + 0.65 * up);
    base = mix3(base, [0.045, 0.075, 0.03], mossAmt * 0.85);
    const soot = grime(x, y, z) * (0.35 + 0.4 * Math.max(0, -n[1]) + 0.25 * (info?.edge ?? 0));
    base = mix3(base, [0.035, 0.034, 0.032], Math.min(0.7, soot));
    // エッジの欠けて明るい地肌
    base = mix3(base, [0.3, 0.28, 0.25], (info?.edge ?? 0) * 0.25);
    return base;
  },
  // 蔦・苔: 深い緑に、日の当たる所の黄緑と枯れた茶のむら
  ivy(p, seed, info) {
    const [x, y, z] = [p[0] + seed, p[1], p[2]];
    const n = fbm(x * 9, y * 9, z * 9);
    const tint = info?.tint ?? 1;
    let c = mix3([0.02, 0.04, 0.016], [0.07, 0.1, 0.03], n);
    c = mix3(c, [0.09, 0.07, 0.03], smooth(0.6, 0.85, fbm(x * 5 + 7, y * 5, z * 5)) * 0.5);
    return c.map((v) => v * tint);
  },
  darkStone(p, seed) {
    const n = fbm(p[0] * 5 + seed, p[1] * 5, p[2] * 5);
    return mix3([0.03, 0.03, 0.032], [0.07, 0.066, 0.06], n);
  },
  wood(p, seed, info) {
    const [x, y, z] = [p[0] + seed, p[1], p[2]];
    const grain = fbm(x * 3, y * 30, z * 3);
    const n = fbm(x * 4, y * 4, z * 4);
    let c = mix3([0.05, 0.034, 0.024], [0.15, 0.1, 0.065], 0.35 * grain + 0.5 * n);
    c = mix3(c, [0.11, 0.105, 0.095], smooth(0.62, 0.85, fbm(x * 7, y * 7, z * 7)) * 0.4); // 風化の白茶け
    c = mix3(c, [0.02, 0.016, 0.012], (info?.edge ?? 0) * 0.25);
    return c;
  },
  bark(p, seed, info) {
    const [x, y, z] = [p[0] + seed, p[1], p[2]];
    const n = fbm(x * 6, y * 2.2, z * 6);
    let c = mix3([0.035, 0.028, 0.024], [0.105, 0.085, 0.07], n);
    // 根元に地衣類、枝先ほど白茶けた枯れ枝
    c = mix3(
      c,
      [0.09, 0.1, 0.07],
      smooth(0.5, 0.72, fbm(x * 9 + 2, y * 5, z * 9)) * smooth(0.9, 0.0, y) * 0.55,
    );
    c = mix3(c, [0.14, 0.125, 0.105], smooth(2.2, 4.0, y) * 0.35 * (0.5 + 0.5 * n));
    c = c.map((v) => v * (1 - (info?.edge ?? 0) * 0.15));
    return c;
  },
  earth(p, seed) {
    const n = fbm(p[0] * 5 + seed, p[1] * 5, p[2] * 5);
    const ash = smooth(0.5, 0.75, fbm(p[0] * 9, p[1] * 3 + seed, p[2] * 9));
    return mix3(
      mix3([0.05, 0.036, 0.026], [0.11, 0.08, 0.055], n),
      [0.075, 0.07, 0.066],
      ash * 0.7,
    );
  },
  cloth(p, seed) {
    const n = fbm(p[0] * 7 + seed, p[1] * 7, p[2] * 7);
    const stain = smooth(0.5, 0.7, fbm(p[0] * 13, p[1] * 13 + seed, p[2] * 13));
    return mix3(
      mix3([0.06, 0.012, 0.012], [0.16, 0.035, 0.03], n),
      [0.02, 0.012, 0.01],
      stain * 0.7,
    );
  },
  // 錆びた鉄（柵・ランタン枠）
  iron(p, seed, info) {
    const [x, y, z] = [p[0] + seed, p[1], p[2]];
    const n = info?.n ?? [0, 1, 0];
    const rust = smooth(
      0.35,
      0.8,
      0.35 + 0.5 * fbm(x * 5, y * 5, z * 5) + 0.3 * Math.max(0, -n[1]) + 0.4 * (info?.edge ?? 0),
    );
    return mix3(
      [0.04, 0.042, 0.05],
      mix3([0.15, 0.075, 0.04], [0.22, 0.11, 0.055], fbm(x * 4, y * 4, z * 4)),
      rust * 0.85,
    );
  },
  // 発光（HDR は実行時のマテリアル側で掛ける）。炎: 芯が黄、縁が橙
  glow(p, seed, info) {
    const t = info?.tint ?? 1;
    return mix3([1.0, 0.36, 0.07], [1.0, 0.78, 0.35], Math.min(1, Math.max(0, t - 0.5)));
  },
  // 石碑の刻印の淡い青白い光
  rune() {
    return [0.12, 0.34, 0.46];
  },
};

// ---------------------------------------------------------------- 積み石の壁モジュール（長さ 2m × 厚さ 0.7m）

/**
 * 積み石の壁 1 区画（x 方向に len、厚み t、高さ h）。段ごとに小ぶりの石を running bond で積み（段の高さ・石の幅・
 * 出入りをばらつかせる）、土台の大きな石組み・ruin > 0 で上の石が欠けた凸凹・蔦と苔の塊で変化をつける。
 * window で尖頭アーチ（ゴシックの二心アーチ）の窓を開け、迫石の縁取りを巡らせる。beams で崩れた屋根の梁を突き出す。
 * 原点 = 底面中央。
 */
function wallModule({
  len = 2,
  h = 3.6,
  t = 0.7,
  seed = 1,
  ruin = 0,
  window = false,
  beams = false,
}) {
  const rnd = rng(seed);
  const parts = [];

  // 尖頭窓の寸法（開口の幅 ww、アーチの起点 ys、頂点 ys + 0.866 ww）
  const ww = 0.86;
  const sill = h * 0.34;
  const ys = h * 0.56;
  const hwAt = (y) => {
    // 二心アーチの縁の半幅（y は絶対値）
    const dy = y - ys;
    if (dy <= 0) return ww / 2;
    if (dy >= 0.866 * ww) return 0;
    return Math.max(0, -ww / 2 + Math.sqrt(ww * ww - dy * dy));
  };
  const apex = ys + 0.866 * ww;

  // 窓の開口（アーチ部分は段付きの矩形で近似する）
  const holes = [];
  if (window) {
    holes.push({ x0: -ww / 2, x1: ww / 2, y0: sill, y1: ys });
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const y0 = ys + (i / steps) * 0.866 * ww;
      const y1 = ys + ((i + 1) / steps) * 0.866 * ww;
      const hw = hwAt(y0 + (y1 - y0) * 0.5);
      if (hw > 0.015) holes.push({ x0: -hw, x1: hw, y0, y1 });
    }
  }
  const carve = (a, b, y0, y1) => {
    let pieces = [[a, b]];
    for (const hole of holes) {
      if (y1 <= hole.y0 + 1e-6 || y0 >= hole.y1 - 1e-6) continue;
      const next = [];
      for (const [p, q] of pieces) {
        if (q <= hole.x0 || p >= hole.x1) next.push([p, q]);
        else {
          if (p < hole.x0) next.push([p, hole.x0]);
          if (q > hole.x1) next.push([hole.x1, q]);
        }
      }
      pieces = next;
    }
    return pieces;
  };

  // 芯（石の隙間から見える暗い面）。欠けた上端より低く。窓の開口は抜く
  const coreTop = h * (1 - ruin * 0.93) - 0.12;
  const bands = [0, ...(window ? [sill, ys, apex] : []), coreTop].filter(
    (v, i, a) => v <= coreTop && (i === 0 || v > a[i - 1]),
  );
  for (let i = 0; i + 1 < bands.length; i++) {
    const y0 = bands[i];
    const y1 = bands[i + 1];
    const mid = (y0 + y1) / 2;
    const inWindowBand = window && mid > sill && mid < apex;
    const cut = inWindowBand ? hwAt(y0) + 0.02 : 0;
    const spans = inWindowBand
      ? [
          [-len / 2 + 0.03, -cut],
          [cut, len / 2 - 0.03],
        ]
      : [[-len / 2 + 0.03, len / 2 - 0.03]];
    for (const [a, b] of spans) {
      if (b - a < 0.05) continue;
      parts.push(part(box((a + b) / 2, (y0 + y1) / 2, 0, b - a, y1 - y0, t * 0.74), 'darkStone'));
    }
  }

  // 欠けた上端の高さ（0.35m 幅の列ごと。長い欠けと短い欠けが混ざる）
  const cols = Math.max(1, Math.round(len / 0.35));
  let wave = rnd();
  const colTop = Array.from({ length: cols }, () => {
    wave = Math.min(1, Math.max(0, wave + (rnd() - 0.5) * 0.9));
    return h * (1 - ruin * (0.08 + 0.85 * wave));
  });
  const topAt = (x) =>
    colTop[Math.min(cols - 1, Math.max(0, Math.floor(((x + len / 2) / len) * cols)))];

  let y = 0;
  let row = 0;
  while (y < h - 0.05) {
    // 土台の 1 段目は大きな石、上へ行くほど小さく
    const base = row === 0;
    const rh = Math.min(h - y, base ? 0.46 : 0.24 + 0.17 * rnd());
    const bulge = base ? 1.07 : 1;
    let x = -len / 2;
    let bl = (base ? 0.8 : row % 2 ? 0.18 + 0.3 * rnd() : 0.42 + 0.4 * rnd()) * (0.8 + 0.4 * rnd());
    while (x < len / 2 - 0.02) {
      const x1 = Math.min(len / 2, x + bl);
      for (const [a, b] of carve(x, x1, y, y + rh)) {
        if (b - a < 0.1) continue;
        const cx = (a + b) / 2;
        if (y >= topAt(cx) - 0.02) continue; // 欠けて無い
        const ht = Math.min(rh, topAt(cx) - y);
        // 石ごとに壁面からの出入りと傾きをつけて、積み石の凹凸を出す
        const tt = t * (0.86 + 0.14 * rnd()) * bulge;
        const g = slab(
          cx,
          y + ht / 2,
          (rnd() - 0.5) * 0.07,
          b - a - 0.03,
          ht - 0.025,
          tt,
          (rnd() - 0.5) * 4,
          (rnd() - 0.5) * 2,
          (rnd() - 0.5) * 2,
        );
        parts.push(part(g, 'stone', 0.55 + 0.7 * rnd()));
      }
      x = x1;
      bl = (0.3 + 0.5 * rnd()) * (row % 3 === 0 ? 1.2 : 1);
    }
    y += rh;
    row++;
  }

  if (window) {
    // 尖頭アーチの縁取り（迫石）: 二心アーチの両側の弧に沿って石を並べる
    const n = 6;
    for (const sgn of [-1, 1]) {
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * (Math.PI / 3); // 0..60°
        // 右の弧は左の起点を中心に、左の弧は右の起点を中心に描く
        const cx = sgn * (-ww / 2 + (ww + 0.09) * Math.cos(a));
        const cy = ys + (ww + 0.09) * Math.sin(a);
        const tilt = sgn > 0 ? (a * 180) / Math.PI : 180 - (a * 180) / Math.PI;
        parts.push(
          part(slab(cx, cy, 0.03, 0.2, 0.17, t * 0.96, 0, 0, tilt), 'stone', 1.05 + 0.25 * rnd()),
        );
      }
    }
    // 窓の縦枠（ジャンブ）の石と窓台
    for (const sgn of [-1, 1]) {
      let jy = sill;
      while (jy < ys - 0.05) {
        const jh = Math.min(ys - jy, 0.3 + 0.12 * rnd());
        parts.push(
          part(
            slab(sgn * (ww / 2 + 0.09), jy + jh / 2, 0.03, 0.2, jh - 0.02, t * 0.97),
            'stone',
            1.1,
          ),
        );
        jy += jh;
      }
    }
    parts.push(part(slab(0, sill - 0.05, 0.07, ww + 0.34, 0.11, t * 1.08), 'stone', 1.2));
    // 窓の下の割れた石（外へ張り出す）
    parts.push(part(slab(ww * 0.28, sill - 0.2, 0.2, 0.34, 0.22, 0.2, 14, 0, 6), 'stone', 0.9));
  }

  // 蔦（壁面を這う緑の筋）と、壁の根元・段の上に付く苔の塊
  const ivyCount = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < ivyCount; i++) {
    const ix = (rnd() - 0.5) * (len - 0.3);
    if (window && Math.abs(ix) < ww / 2 + 0.2) continue;
    const ih = Math.min(topAt(ix) - 0.2, 0.7 + h * 0.5 * rnd());
    const side = rnd() < 0.5 ? 1 : -1;
    parts.push(
      part(
        slab(
          ix,
          ih / 2 + 0.05,
          side * t * 0.5,
          0.1 + 0.1 * rnd(),
          ih,
          0.045,
          0,
          (rnd() - 0.5) * 6,
          (rnd() - 0.5) * 18,
        ),
        'ivy',
        0.7 + 0.6 * rnd(),
      ),
    );
    for (let k = 0; k < 2; k++) {
      const ky = 0.15 + (ih - 0.3) * rnd();
      parts.push(
        part(
          rock(
            ix + (rnd() - 0.5) * 0.25,
            ky,
            side * (t * 0.5 + 0.01),
            0.12 + 0.1 * rnd(),
            0.12,
            0.05,
            seed * 13 + i * 3 + k,
            5,
          ),
          'ivy',
          0.8 + 0.5 * rnd(),
        ),
      );
    }
  }
  for (let i = 0; i < 2; i++) {
    const mx = (rnd() - 0.5) * len;
    if (window && Math.abs(mx) < ww / 2 + 0.2) continue;
    parts.push(
      part(
        rock(
          mx,
          -0.04,
          (rnd() < 0.5 ? 1 : -1) * t * 0.5,
          0.28 + 0.15 * rnd(),
          0.2,
          0.14,
          seed * 29 + i,
          6,
        ),
        'ivy',
        0.9,
      ),
    );
  }

  if (beams) {
    // 崩れた屋根の梁: 壁を貫く水平の梁（片側が折れて突き出す）と、斜めに折れた垂木
    const by = h * (0.8 - 0.1 * rnd());
    const bx = (rnd() - 0.5) * 0.7;
    const d = rnd() < 0.5 ? 1 : -1;
    parts.push(
      part(
        limb(
          [bx, by, -d * 0.18],
          [bx + 0.05, by + 0.02, d * (t * 0.5 + 0.9 + 0.5 * rnd())],
          0.115,
          0.1,
          4,
        ),
        'wood',
        1,
      ),
    );
    parts.push(
      part(
        limb([bx, by - 0.01, -d * t], [bx + 0.04, by - 0.02, -d * (t * 0.5 + 0.3)], 0.12, 0.11, 4),
        'wood',
        0.9,
      ),
    );
    const rx = bx + (rnd() < 0.5 ? 0.6 : -0.6);
    parts.push(
      part(
        limb(
          [rx, by + 0.12, d * (t * 0.5 + 0.02)],
          [rx + 0.1, by + 1.05 + 0.35 * rnd(), d * (t * 0.5 + 0.9)],
          0.07,
          0.05,
          4,
        ),
        'wood',
        1.1,
      ),
    );
  }
  return parts;
}

/** 崩れた壁の瓦礫の列（低い積み石）。長さ 2m。 */
function wallRubble(seed) {
  const rnd = rng(seed + 100);
  const parts = [part(box(0, 0.35, 0, 1.9, 0.7, 0.5), 'darkStone')];
  for (let i = 0; i < 9; i++) {
    const x = -0.9 + (i / 8) * 1.8 + (rnd() - 0.5) * 0.2;
    const h = 0.5 + 0.9 * rnd() * (1 - Math.abs(x) / 1.4);
    parts.push(
      part(
        rock(
          x,
          -0.05,
          (rnd() - 0.5) * 0.18,
          0.3 + 0.18 * rnd(),
          h,
          0.3 + 0.12 * rnd(),
          seed + i * 7,
        ),
        'stone',
        0.7 + 0.5 * rnd(),
      ),
    );
  }
  return parts;
}

/** 石の山（瓦礫）。2m × 1m、高さ 1.2m。 */
function rubblePile(seed) {
  const rnd = rng(seed + 300);
  const parts = [];
  for (let i = 0; i < 8; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 0.85;
    const x = Math.cos(a) * r * 0.95;
    const z = Math.sin(a) * r * 0.45;
    const h = (0.35 + 0.8 * (1 - r)) * (0.7 + 0.5 * rnd());
    if (rnd() < 0.35) {
      parts.push(
        part(
          slab(
            x,
            h * 0.4,
            z,
            0.5 + 0.4 * rnd(),
            0.2 + 0.2 * rnd(),
            0.3 + 0.25 * rnd(),
            rnd() * 180,
            (rnd() - 0.5) * 30,
            (rnd() - 0.5) * 30,
          ),
          'stone',
          0.7 + 0.5 * rnd(),
        ),
      );
    } else {
      parts.push(
        part(
          rock(x, -0.06, z, 0.3 + 0.22 * rnd(), h, 0.26 + 0.16 * rnd(), seed + i * 5),
          'stone',
          0.7 + 0.5 * rnd(),
        ),
      );
    }
  }
  return parts;
}

/** 壁際に散らす小石と欠片（1.6m × 0.8m）。 */
function stoneScatter(seed) {
  const rnd = rng(seed + 500);
  const parts = [];
  for (let i = 0; i < 6; i++) {
    const s = 0.08 + 0.14 * rnd();
    parts.push(
      part(
        rock(
          (rnd() - 0.5) * 1.6,
          -0.03,
          (rnd() - 0.5) * 0.8,
          s,
          s * (0.6 + 0.6 * rnd()),
          s * 0.9,
          seed + i,
          5,
        ),
        'stone',
        0.7 + 0.5 * rnd(),
      ),
    );
  }
  return parts;
}

// ---------------------------------------------------------------- 墓石

/** アーチ型の墓石の輪郭（XY、反時計回り）。 */
function archProfile(w, hSide, hTop, segs = 8) {
  const pts = [[w / 2, 0]];
  pts.push([w / 2, hSide]);
  for (let i = 1; i < segs; i++) {
    const a = (i / segs) * Math.PI;
    pts.push([Math.cos(a) * (w / 2), hSide + Math.sin(a) * (hTop - hSide)]);
  }
  pts.push([-w / 2, hSide], [-w / 2, 0]);
  return pts;
}

/** 刻印（正面の凹んだ線）。 */
function inscription(w, y0, y1, seed) {
  const rnd = rng(seed + 900);
  const parts = [];
  const lines = 3 + Math.floor(rnd() * 2);
  for (let i = 0; i < lines; i++) {
    const y = y1 - (i / lines) * (y1 - y0);
    const lw = w * (0.35 + 0.35 * rnd());
    parts.push(part(box((rnd() - 0.5) * 0.06, y, 0.108, lw, 0.018, 0.012), 'darkStone'));
  }
  return parts;
}

function graveRound(seed = 1) {
  const g = prism(archProfile(0.62, 0.66, 1.0), -0.11, 0.11);
  return [
    part(g, 'stone', 1),
    part(box(0, 0.05, 0.02, 0.8, 0.12, 0.34), 'stone', 0.8),
    ...inscription(0.6, 0.52, 0.8, seed),
    part(box(0, 0.88, 0.108, 0.025, 0.14, 0.012), 'darkStone'),
    part(box(0, 0.9, 0.108, 0.1, 0.025, 0.012), 'darkStone'),
  ];
}

function graveCross(seed = 2) {
  return [
    part(box(0, 0.5, 0, 0.2, 1.0, 0.17), 'stone', 1),
    part(box(0, 0.74, 0, 0.64, 0.17, 0.17), 'stone', 1.1),
    part(box(0, 0.07, 0, 0.56, 0.14, 0.34), 'stone', 0.8),
    part(box(0, 0.19, 0, 0.4, 0.1, 0.26), 'stone', 0.9),
    ...inscription(0.18, 0.28, 0.55, seed).map((p) => ({
      ...p,
      geo: xf(p.geo, move(0, 0, -0.025)),
    })),
  ];
}

/** 折れた墓石（上が欠けた切り株 + 倒れた破片）。 */
function graveBroken(seed = 3) {
  const rnd = rng(seed);
  const prof = [
    [0.31, 0],
    [0.31, 0.55],
    [0.22, 0.7 + 0.08 * rnd()],
    [0.05, 0.62],
    [-0.08, 0.78 + 0.1 * rnd()],
    [-0.25, 0.6],
    [-0.31, 0.5],
    [-0.31, 0],
  ];
  return [
    part(prism(prof, -0.11, 0.11), 'stone', 0.9),
    part(box(0, 0.05, 0.02, 0.8, 0.12, 0.34), 'stone', 0.75),
    ...inscription(0.56, 0.3, 0.5, seed),
    // 倒れた破片
    part(slab(0.4, 0.1, 0.5, 0.5, 0.22, 0.2, 35, 0, 8), 'stone', 1.05),
  ];
}

/** 墓の盛り土。1.0 × 1.9m、正面側（+Z）へ細長い。 */
function graveMound(seed = 4) {
  const rnd = rng(seed);
  const rings = [0, 0.5, 0.85].map((t, k) => ({
    y: [0, 0.1, 0.16][k],
    ring: Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      const j = 0.9 + 0.2 * rnd();
      return [Math.cos(a) * 0.5 * (1 - t * 0.5) * j, 0.95 + Math.sin(a) * 0.95 * (1 - t * 0.5) * j];
    }),
  }));
  rings.push({ y: 0.17, ring: [[0, 0.95]] });
  return [part(loft(rings), 'earth')];
}

// ---------------------------------------------------------------- 枯れ木

function deadTree(variant = 0, seed = 1) {
  const rnd = rng(seed * 31 + variant);
  const parts = [];
  // 幹: リングを積み、中心を曲げる
  const bend = [(rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5];
  const trunkTop = variant === 2 ? 2.7 : 2.9;
  const rings = [];
  const steps = 7;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = -0.1 + (trunkTop + 0.1) * t;
    const flare = 1 + 0.9 * Math.pow(1 - t, 5); // 根元の広がり
    const r = 0.28 * (1 - t * 0.55) * flare;
    const cx = bend[0] * t * t;
    const cz = bend[1] * t * t;
    const n = 9;
    rings.push({
      y,
      ring: Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2;
        const j = 0.88 + 0.24 * hash3(k + i * 13, i, seed);
        return [cx + Math.cos(a) * r * j, cz + Math.sin(a) * r * j];
      }),
    });
  }
  rings.push({ y: trunkTop + 0.08, ring: [[bend[0], bend[1]]] });
  parts.push(part(loft(rings), 'bark'));

  // 根
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rnd();
    parts.push(
      part(
        limb(
          [Math.cos(a) * 0.1, 0.35, Math.sin(a) * 0.1],
          [Math.cos(a) * 0.62, -0.05, Math.sin(a) * 0.62],
          0.1,
          0.035,
          5,
        ),
        'bark',
      ),
    );
  }

  const topPoint = [bend[0], trunkTop, bend[1]];
  // 枝: 再帰的に分かれる
  const addBranch = (p0, dir, length, radius, depth) => {
    const p1 = [p0[0] + dir[0] * length, p0[1] + dir[1] * length, p0[2] + dir[2] * length];
    parts.push(part(limb(p0, p1, radius, radius * 0.5, depth > 1 ? 5 : 6), 'bark'));
    if (depth <= 0) return;
    const forks = depth === 2 ? 2 : 2 + (rnd() < 0.4 ? 1 : 0);
    for (let k = 0; k < forks; k++) {
      const a = rnd() * Math.PI * 2;
      const spread = 0.45 + 0.5 * rnd();
      let d = [
        dir[0] + Math.cos(a) * spread,
        dir[1] * 0.85 + 0.15 + (rnd() - 0.4) * 0.2,
        dir[2] + Math.sin(a) * spread,
      ];
      const l = Math.hypot(...d);
      d = d.map((v) => v / l);
      const start = [
        p0[0] + (p1[0] - p0[0]) * (0.55 + 0.45 * rnd()),
        p0[1] + (p1[1] - p0[1]) * (0.55 + 0.45 * rnd()),
        p0[2] + (p1[2] - p0[2]) * (0.55 + 0.45 * rnd()),
      ];
      addBranch(start, d, length * (0.62 + 0.2 * rnd()), radius * 0.55, depth - 1);
    }
  };
  const mainCount = variant === 1 ? 4 : variant === 2 ? 2 : 3;
  for (let i = 0; i < mainCount; i++) {
    const a = (i / mainCount) * Math.PI * 2 + rnd() * 0.8;
    const up = 0.55 + 0.3 * rnd();
    const dir = [Math.cos(a) * (1 - up), up, Math.sin(a) * (1 - up)];
    const l = Math.hypot(...dir);
    addBranch(
      topPoint,
      dir.map((v) => v / l),
      (variant === 2 ? 0.9 : 1.3) + 0.4 * rnd(),
      0.1,
      variant === 2 ? 1 : 2,
    );
  }
  // 幹の中ほどから横へ出る大枝（見た目の非対称）
  if (variant !== 2) {
    const a = rnd() * Math.PI * 2;
    addBranch(
      [bend[0] * 0.3, trunkTop * 0.55, bend[1] * 0.3],
      [Math.cos(a) * 0.85, 0.35, Math.sin(a) * 0.85],
      1.1 + 0.4 * rnd(),
      0.075,
      1,
    );
  }
  return parts;
}

// ---------------------------------------------------------------- 柵（鉄の杭柵。長さ 2m・高さ 1.1m）

function fenceSection(variant = 0) {
  const rnd = rng(40 + variant);
  const parts = [];
  const postAt = (x) => {
    parts.push(part(box(x, 0.55, 0, 0.1, 1.1, 0.1), 'iron'));
    parts.push(part(xf(box(0, 0, 0, 0.14, 0.14, 0.14), rotY(45), move(x, 1.16, 0)), 'iron'));
  };
  postAt(-0.94);
  postAt(0.94);
  parts.push(part(box(0, 0.88, 0, 2, 0.05, 0.05), 'iron'));
  parts.push(part(box(0, 0.26, 0, 2, 0.05, 0.05), 'iron'));
  for (let i = 0; i < 9; i++) {
    const x = -0.8 + i * 0.2;
    if (variant === 1 && (i === 3 || i === 6)) continue; // 欠けた杭
    const lean = variant === 1 && i === 4 ? 14 : (rnd() - 0.5) * 2;
    const h = 0.98 - (variant === 1 && i === 7 ? 0.3 : 0);
    const pic = xf(box(0, h / 2, 0, 0.035, h, 0.035), rotZ(lean), move(x, 0, 0));
    parts.push(part(pic, 'iron'));
    // 槍先
    const tip = emptyGeo();
    const y0 = h;
    const apex = [0, y0 + 0.16, 0];
    const ring = [
      [-0.03, y0, -0.03],
      [0.03, y0, -0.03],
      [0.03, y0, 0.03],
      [-0.03, y0, 0.03],
    ];
    for (let k = 0; k < 4; k++) pushTri(tip, ring[k], ring[(k + 1) % 4], apex);
    // 巻き順（外向き）を確認して反転
    parts.push(part(xf(tip, rotZ(lean), move(x, 0, 0)), 'iron'));
  }
  return parts;
}

/** 倒れた柵（地面に横たわる 2m 区画）。 */
function fenceFallen() {
  return fenceSection(1).map((p) => ({ ...p, geo: xf(p.geo, rotX(-84), move(0, 0.1, 0.5)) }));
}

// ---------------------------------------------------------------- 礼拝堂の内装

function altar() {
  const parts = [];
  parts.push(part(box(0, 0.1, 0, 3.9, 0.2, 1.1), 'stone', 0.8)); // 基壇
  parts.push(part(box(0, 0.55, 0, 3.5, 0.7, 0.9), 'stone', 1)); // 本体
  // 正面の羽目板（凹み）
  for (let i = 0; i < 4; i++) {
    parts.push(part(box(-1.3 + i * 0.87, 0.55, 0.455, 0.7, 0.48, 0.03), 'darkStone'));
    parts.push(part(box(-1.3 + i * 0.87, 0.55, 0.468, 0.6, 0.38, 0.015), 'stone', 0.85));
  }
  parts.push(part(box(0, 0.98, 0, 3.8, 0.2, 1.05), 'stone', 1.15)); // 天板
  // 前の段
  parts.push(part(box(0, 0.07, 0.85, 3.4, 0.14, 0.5), 'stone', 0.85));
  // 天板の欠け
  parts.push(part(slab(1.7, 1.12, 0.1, 0.4, 0.08, 0.5, 15), 'stone', 1.2));
  // 色褪せた布（天板に垂れる）
  parts.push(part(box(-0.3, 1.092, 0, 1.2, 0.012, 0.8), 'cloth'));
  parts.push(part(box(-0.3, 0.62, 0.53, 1.2, 0.8, 0.012), 'cloth'));
  // 倒れた燭台と燃え残りの蝋燭
  parts.push(part(limb([0.9, 1.1, -0.1], [1.45, 1.1, 0.1], 0.04, 0.03, 6), 'iron'));
  parts.push(part(limb([-1.3, 1.09, 0.1], [-1.3, 1.3, 0.1], 0.03, 0.025, 6), 'cloth'));
  parts.push(part(box(-1.3, 1.34, 0.1, 0.03, 0.06, 0.03), 'glow', 1.3));
  return parts;
}

function pew(variant = 0) {
  const parts = [];
  // 3.4 × 0.6、高さ 0.85
  for (const sx of [-1, 1]) {
    // 側板（背もたれの輪郭）
    const prof = [
      [-0.3, 0],
      [0.3, 0],
      [0.3, 0.4],
      [0.25, 0.85],
      [0.05, 0.88],
      [-0.3, 0.5],
    ];
    parts.push(
      part(
        xf(
          prism(
            prof.map(([z, y]) => [z, y]),
            -0.04,
            0.04,
          ),
          rotY(-90),
          move(sx * 1.62, 0, 0),
        ),
        'wood',
        0.9,
      ),
    );
  }
  // 座面・背もたれ・足置き
  parts.push(part(box(0, 0.4, 0.04, 3.2, 0.05, 0.4), 'wood'));
  parts.push(part(box(0, 0.62, -0.26, 3.2, 0.22, 0.04), 'wood', 1.1));
  parts.push(part(box(0, 0.84, -0.22, 3.2, 0.06, 0.06), 'wood', 1.05));
  parts.push(part(box(0, 0.08, 0.2, 3.2, 0.05, 0.14), 'wood', 0.9));
  if (variant === 1) {
    // 折れた座面の板と、外れた背もたれ
    parts.push(part(slab(0.5, 0.18, 0.5, 1.3, 0.04, 0.3, 20, 0, 30), 'wood', 0.8));
  }
  return parts;
}

function column(broken = false, seed = 5) {
  const rnd = rng(seed);
  const h = broken ? 2.1 : 3.2;
  const strips = [
    [
      [0.62, 0],
      [0.62, 0.22],
      [0.56, 0.26],
      [0.5, 0.3],
    ],
    [
      [0.5, 0.3],
      [0.46, 0.45],
      [0.46, h - (broken ? 0.1 : 0.55)],
    ],
  ];
  if (!broken)
    strips.push([
      [0.46, h - 0.55],
      [0.5, h - 0.45],
      [0.6, h - 0.28],
      [0.66, h - 0.18],
      [0.66, h],
    ]);
  const parts = [part(lathe(strips, 14), 'stone', 1)];
  parts.push(part(box(0, 0.11, 0, 1.3, 0.22, 1.3), 'stone', 0.8));
  if (broken) {
    // 欠けた断面（斜めに割れた 3 つの破片）
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rnd();
      parts.push(
        part(
          slab(
            Math.cos(a) * 0.28,
            h - 0.02 + 0.12 * rnd(),
            Math.sin(a) * 0.28,
            0.3,
            0.2 + 0.2 * rnd(),
            0.28,
            rnd() * 90,
            (rnd() - 0.5) * 30,
            (rnd() - 0.5) * 30,
          ),
          'stone',
          0.9,
        ),
      );
    }
  }
  return parts;
}

/** 石碑（A の操作ヒット用）。1.1 × 0.36、高さ 1.7。正面に淡く光る刻印。 */
function stele() {
  const prof = [
    [0.55, 0],
    [0.55, 1.4],
    [0.28, 1.62],
    [-0.1, 1.72],
    [-0.55, 1.5],
    [-0.55, 0],
  ];
  const parts = [part(prism(prof, -0.18, 0.18), 'stone', 1)];
  parts.push(part(box(0, 0.08, 0.04, 1.3, 0.16, 0.5), 'stone', 0.75));
  parts.push(part(box(0.0, 0.5, 0.2, 1.0, 0.04, 0.01), 'darkStone'));
  // 刻印の光（青白く小さな点線）
  for (let i = 0; i < 7; i++) {
    const w = 0.08 + 0.16 * hash3(i, 1, 9);
    parts.push(part(box(-0.38 + i * 0.13, 1.05 - (i % 2) * 0.12, 0.186, w, 0.025, 0.012), 'rune'));
    parts.push(
      part(
        box(-0.35 + (i % 3) * 0.3, 0.78 - Math.floor(i / 3) * 0.1, 0.186, 0.14, 0.02, 0.012),
        'rune',
      ),
    );
  }
  return parts;
}

// ---------------------------------------------------------------- 篝火「灰の炉」

/** 篝火の土台: 石の輪・灰・燃え残りの薪・螺旋の剣（炎はパーティクル）。足元が原点。 */
function bonfire() {
  const rnd = rng(77);
  const parts = [];
  // 灰の盛り土
  const ashRings = [
    [0, 0.62],
    [0.12, 0.5],
    [0.2, 0.28],
  ].map(([y, r]) => ({
    y,
    ring: Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      const j = 0.9 + 0.2 * rnd();
      return [Math.cos(a) * r * j, Math.sin(a) * r * j];
    }),
  }));
  ashRings.push({ y: 0.22, ring: [[0, 0]] });
  parts.push(part(loft(ashRings), 'earth', 1.1));
  // 石の輪
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    const r = 0.78 + 0.06 * rnd();
    parts.push(
      part(
        rock(
          Math.cos(a) * r,
          -0.08,
          Math.sin(a) * r,
          0.2 + 0.07 * rnd(),
          0.28 + 0.14 * rnd(),
          0.17 + 0.06 * rnd(),
          800 + i,
        ),
        'stone',
        0.45 + 0.35 * rnd(),
      ),
    );
  }
  // 燃え残りの薪（組まれた形）
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.5;
    parts.push(
      part(
        limb(
          [Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5],
          [Math.cos(a) * 0.08, 0.5 + 0.1 * rnd(), Math.sin(a) * 0.08],
          0.05,
          0.04,
          6,
        ),
        'bark',
        0.8,
      ),
    );
  }
  // 灰に突き立つ螺旋の剣（古い錆びた剣。刃が上）
  const sword = [
    part(limb([0, 0.1, 0], [0.04, 1.25, 0.02], 0.028, 0.012, 4), 'iron'),
    part(box(0.035, 1.32, 0.02, 0.28, 0.035, 0.05), 'iron'),
    part(limb([0.04, 1.3, 0.02], [0.05, 1.5, 0.02], 0.02, 0.016, 6), 'iron'),
    part(xf(box(0, 0, 0, 0.05, 0.05, 0.05), rotY(45), move(0.05, 1.54, 0.02)), 'iron'),
  ];
  parts.push(...sword.map((p) => ({ ...p, geo: xf(p.geo, rotZ(-4)) })));
  // 螺旋状に絡む細い鉄の帯（剣に巻き付く）
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const a = t * Math.PI * 4;
    const y = 0.2 + t * 0.95;
    parts.push(
      part(
        limb(
          [Math.cos(a) * 0.05, y, Math.sin(a) * 0.05],
          [Math.cos(a + 0.8) * 0.05, y + 0.1, Math.sin(a + 0.8) * 0.05],
          0.012,
          0.012,
          4,
        ),
        'iron',
      ),
    );
  }
  return parts;
}

// ---------------------------------------------------------------- ランタン

/** 吊りランタンの柱（鉄の柱 + 腕 + ランタン）。高さ 2.3m、足元が原点。ランタンは +X 側へ吊る。 */
function lanternPost() {
  const parts = [];
  parts.push(part(limb([0, -0.05, 0], [0, 2.2, 0], 0.06, 0.04, 6), 'iron'));
  parts.push(part(box(0, 0.06, 0, 0.3, 0.14, 0.3), 'stone', 0.8));
  // 腕（先端が下がる曲がり）
  parts.push(part(limb([0, 2.18, 0], [0.45, 2.3, 0], 0.035, 0.028, 5), 'iron'));
  parts.push(part(limb([0.45, 2.3, 0], [0.62, 2.18, 0], 0.028, 0.022, 5), 'iron'));
  // ランタン本体（枠 4 本 + 屋根 + 底 + 発光部）
  const cx = 0.62;
  const y0 = 1.72;
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    parts.push(part(box(cx + dx * 0.085, y0 + 0.2, dz * 0.085, 0.022, 0.4, 0.022), 'iron'));
  }
  parts.push(part(box(cx, y0 + 0.01, 0, 0.22, 0.03, 0.22), 'iron'));
  parts.push(part(box(cx, y0 + 0.4, 0, 0.24, 0.03, 0.24), 'iron'));
  const roof = emptyGeo();
  const ring = [
    [-0.13, y0 + 0.41, -0.13],
    [0.13, y0 + 0.41, -0.13],
    [0.13, y0 + 0.41, 0.13],
    [-0.13, y0 + 0.41, 0.13],
  ];
  const apex = [0, y0 + 0.55, 0];
  for (let k = 0; k < 4; k++) pushTri(roof, ring[(k + 1) % 4], ring[k], apex);
  parts.push(part(xf(roof, move(cx, 0, 0)), 'iron'));
  parts.push(part(limb([cx, y0 + 0.55, 0], [cx, 2.2, 0], 0.012, 0.012, 4), 'iron'));
  parts.push(part(box(cx, y0 + 0.2, 0, 0.14, 0.3, 0.14), 'glow', 1.2));
  return parts;
}

// ---------------------------------------------------------------- 霊廟（4m × 4m、高さ 2.2m、屋根は平ら）

function mausoleum() {
  const parts = [];
  // 本体の石積み（段ごと）
  const rnd = rng(66);
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const y = r * 0.42;
    const hh = 0.42;
    for (const side of [0, 1, 2, 3]) {
      const len = 3.9;
      let x = -len / 2;
      let bl = 0.6 + 0.5 * rnd();
      while (x < len / 2 - 0.05) {
        const x1 = Math.min(len / 2, x + bl);
        const c = (x + x1) / 2;
        const w = x1 - x - 0.03;
        const dist = 2 - 0.05 * rnd();
        const g = slab(c, y + hh / 2, dist, w, hh - 0.03, 0.14, (rnd() - 0.5) * 2);
        const rot = rotY(side * 90);
        parts.push(part(transform(g, rot), 'stone', 0.7 + 0.5 * rnd()));
        x = x1;
        bl = 0.6 + 0.5 * rnd();
      }
    }
  }
  parts.push(part(box(0, 0.9, 0, 3.7, 1.8, 3.7), 'darkStone'));
  // 屋根（平ら。縁の蛇腹と立ち上がり）
  parts.push(part(box(0, 1.88, 0, 4, 0.2, 4), 'stone', 1.1));
  parts.push(part(box(0, 2.07, 0, 3.96, 0.26, 3.96), 'stone', 0.95));
  // 屋根の苔と欠け、落ちた石
  parts.push(part(slab(1.2, 2.2, 1.3, 0.8, 0.1, 0.6, 20), 'stone', 0.7));
  parts.push(part(slab(-1.4, 2.19, -0.9, 0.6, 0.08, 0.5, -35), 'stone', 1.2));
  // 入口（-Z 側）: 暗い戸口、まぐさ、両脇の柱型
  parts.push(part(box(0, 0.78, -2.03, 1.1, 1.56, 0.12), 'darkStone'));
  parts.push(part(box(0, 1.62, -2.1, 1.7, 0.2, 0.22), 'stone', 1.2));
  for (const sx of [-1, 1]) {
    parts.push(part(box(sx * 0.82, 0.8, -2.1, 0.22, 1.6, 0.22), 'stone', 1.1));
    parts.push(part(box(sx * 0.82, 0.12, -2.1, 0.34, 0.24, 0.34), 'stone', 0.85));
  }
  // 戸口の前の段
  parts.push(part(box(0, 0.06, -2.3, 1.6, 0.12, 0.4), 'stone', 0.85));
  // 銘板（刻印）
  parts.push(part(box(0, 1.85, -2.11, 0.9, 0.12, 0.03), 'darkStone'));
  return parts;
}

// ---------------------------------------------------------------- 礼拝堂の塔（6m × 6m、18m。尖塔つき）

function tower() {
  const rnd = rng(7);
  const parts = [];
  const course = (y0, y1, wBottom, wTop, kindTint = 1) => {
    // 4 面の積み石（わずかに先細り）
    const rows = Math.max(1, Math.round((y1 - y0) / 0.9));
    for (let r = 0; r < rows; r++) {
      const t0 = r / rows;
      const y = y0 + (y1 - y0) * t0;
      const hh = (y1 - y0) / rows;
      const w = wBottom + (wTop - wBottom) * (t0 + 0.5 / rows);
      for (const side of [0, 1, 2, 3]) {
        const len = w;
        let x = -len / 2;
        let bl = 1.0 + 0.8 * rnd();
        while (x < len / 2 - 0.05) {
          const x1 = Math.min(len / 2, x + bl);
          const c = (x + x1) / 2;
          const g = slab(
            c,
            y + hh / 2,
            w / 2 - 0.07 - 0.04 * rnd(),
            x1 - x - 0.04,
            hh - 0.04,
            0.16,
            (rnd() - 0.5) * 1.5,
          );
          parts.push(
            part(transform(g, rotY(side * 90)), 'stone', kindTint * (0.65 + 0.55 * rnd())),
          );
          x = x1;
          bl = 1.0 + 0.8 * rnd();
        }
      }
    }
  };
  // 芯
  parts.push(part(box(0, 6, 0, 5.2, 12, 5.2), 'darkStone'));
  parts.push(part(box(0, 0.4, 0, 5.98, 0.8, 5.98), 'stone', 0.7)); // 基壇
  course(0.8, 11.6, 5.7, 4.9);
  // 帯状の出っ張り（段）
  for (const y of [4.6, 8.2, 11.7]) {
    const w = y > 11 ? 5.3 : 5.5;
    parts.push(part(box(0, y, 0, w, 0.22, w), 'stone', 1.15));
  }
  // 控え壁（4 隅）
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    parts.push(part(box(sx * 2.7, 1.4, sz * 2.7, 0.62, 2.8, 0.62), 'stone', 1.05));
    parts.push(part(box(sx * 2.62, 3.4, sz * 2.62, 0.5, 1.6, 0.5), 'stone', 1));
    parts.push(part(box(sx * 2.55, 4.7, sz * 2.55, 0.42, 0.9, 0.42), 'stone', 0.95));
  }
  // 矢狭間（細長い暗い窓）
  for (const side of [0, 1, 2, 3]) {
    const yaw = rotY(side * 90);
    for (const y of [3, 6.4, 9.6]) {
      parts.push(part(transform(box(0, y, 2.74, 0.22, 1.1, 0.12), yaw), 'darkStone'));
      parts.push(part(transform(box(0, y + 0.6, 2.76, 0.4, 0.1, 0.1), yaw), 'stone', 1.2));
    }
    // 大きな扉口（南側 = side 0）
  }
  parts.push(part(box(0, 1.25, 2.78, 1.5, 2.5, 0.1), 'darkStone'));
  parts.push(part(box(0, 2.6, 2.8, 2, 0.24, 0.16), 'stone', 1.2));
  // 鐘楼（11.7〜14.7）: 4 面に尖頭の開口。中は暗く、たいまつの橙が漏れる
  parts.push(part(box(0, 13.2, 0, 3.1, 3, 3.1), 'darkStone'));
  // 4 面それぞれの開口（尖頭は 2 枚の傾いた石で近似）
  for (const side of [0, 1, 2, 3]) {
    const yaw = rotY(side * 90);
    parts.push(part(transform(box(-1.55, 13.2, 2.0, 1.0, 3, 0.4), yaw), 'stone', 1));
    parts.push(part(transform(box(1.55, 13.2, 2.0, 1.0, 3, 0.4), yaw), 'stone', 1));
    parts.push(part(transform(box(0, 14.6, 2.0, 2.2, 0.5, 0.4), yaw), 'stone', 1.1));
    parts.push(
      part(
        transform(xf(box(0, 0, 0, 0.78, 0.22, 0.4), rotZ(42), move(-0.5, 14.0, 2.0)), yaw),
        'stone',
        1.2,
      ),
    );
    parts.push(
      part(
        transform(xf(box(0, 0, 0, 0.78, 0.22, 0.4), rotZ(-42), move(0.5, 14.0, 2.0)), yaw),
        'stone',
        1.2,
      ),
    );
    // 開口の奥のたいまつの灯り（橙。絶対に見える位置）
    parts.push(part(transform(box(0, 13.1, 1.6, 1.5, 1.7, 0.08), yaw), 'glow', 1.0));
    parts.push(part(transform(box(0, 12.9, 1.65, 0.7, 1.0, 0.08), yaw), 'glow', 1.8));
    parts.push(part(transform(limb([0, 11.8, 1.7], [0, 12.35, 1.7], 0.05, 0.06, 5), yaw), 'iron'));
  }
  // 尖塔（14.9〜18）: 軒 + 四角錐 + 先端の飾り
  parts.push(part(box(0, 14.95, 0, 4.9, 0.28, 4.9), 'stone', 1.1));
  parts.push(part(box(0, 15.2, 0, 4.4, 0.3, 4.4), 'stone', 0.95));
  const spire = emptyGeo();
  const sy = 15.35;
  const hw = 2.1;
  const ring = [
    [-hw, sy, -hw],
    [hw, sy, -hw],
    [hw, sy, hw],
    [-hw, sy, hw],
  ];
  const apex = [0, 18, 0];
  for (let k = 0; k < 4; k++) pushTri(spire, ring[(k + 1) % 4], ring[k], apex);
  // 尖塔の面を細かく分けて積み石の段のように見せる（段ごとの色むら）
  parts.push(part(spire, 'stone', 0.9));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    parts.push(
      part(
        limb([Math.cos(a) * hw, sy, Math.sin(a) * hw], [0, 17.95, 0], 0.09, 0.04, 4),
        'stone',
        1.25,
      ),
    );
  }
  parts.push(part(limb([0, 17.8, 0], [0, 18.0, 0], 0.05, 0.02, 5), 'iron'));
  // 屋根の欠け（瓦礫に見える穴 + 落ちた石）
  parts.push(part(slab(2.5, 0.2, 3.5, 0.5, 0.35, 0.4, 20), 'stone', 0.9));
  return parts;
}

// ---------------------------------------------------------------- 草・小石（ばら撒き用の小物）

/** 枯れ草の房（3 枚の細い刃を放射状に）。足元が原点、高さ 0.35〜0.5。 */
function grassTuft(seed) {
  const rnd = rng(seed + 1000);
  const parts = [];
  const g = emptyGeo();
  const blades = 5;
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + rnd();
    const lean = 0.12 + 0.25 * rnd();
    const h = 0.28 + 0.3 * rnd();
    const w = 0.028 + 0.012 * rnd();
    const bx = Math.cos(a) * 0.04;
    const bz = Math.sin(a) * 0.04;
    const tx = bx + Math.cos(a) * lean;
    const tz = bz + Math.sin(a) * lean;
    const px = -Math.sin(a) * w;
    const pz = Math.cos(a) * w;
    pushTri(g, [bx - px, 0, bz - pz], [bx + px, 0, bz + pz], [tx, h, tz]);
  }
  parts.push(part(g, 'earth'));
  return parts;
}

// ---------------------------------------------------------------- アイテム定義

const wallHeights = { Full: 3.6, Mid: 2.8, Low: 2.0 };

/** id → { build(): parts, size: [x, y, z] 概寸 } */
export const ENV_ITEMS = {
  GraveRound: { build: () => graveRound(1) },
  GraveCross: { build: () => graveCross(2) },
  GraveBroken: { build: () => graveBroken(3) },
  GraveMound: { build: () => graveMound(4) },
  DeadTreeA: { build: () => deadTree(0, 1) },
  DeadTreeB: { build: () => deadTree(1, 2) },
  DeadTreeC: { build: () => deadTree(2, 3) },
  FenceSection: { build: () => fenceSection(0) },
  FenceBroken: { build: () => fenceSection(1) },
  FenceFallen: { build: () => fenceFallen() },
  WallFullA: { build: () => wallModule({ h: wallHeights.Full, seed: 1, ruin: 0.18 }) },
  WallFullB: { build: () => wallModule({ h: wallHeights.Full, seed: 2, ruin: 0.3 }) },
  WallFullWindow: {
    build: () => wallModule({ h: wallHeights.Full, seed: 3, ruin: 0.12, window: true }),
  },
  WallFullBeam: {
    build: () => wallModule({ h: wallHeights.Full, seed: 6, ruin: 0.22, beams: true }),
  },
  WallMid: { build: () => wallModule({ h: wallHeights.Mid, seed: 4, ruin: 0.4 }) },
  WallLow: { build: () => wallModule({ h: wallHeights.Low, seed: 5, ruin: 0.35 }) },
  WallRubble: { build: () => wallRubble(1) },
  RubblePile: { build: () => rubblePile(1) },
  StoneScatter: { build: () => stoneScatter(1) },
  Altar: { build: altar },
  PewA: { build: () => pew(0) },
  PewBroken: { build: () => pew(1) },
  ColumnTall: { build: () => column(false, 5) },
  ColumnBroken: { build: () => column(true, 6) },
  Stele: { build: stele },
  Bonfire: { build: bonfire },
  LanternPost: { build: lanternPost },
  Mausoleum: { build: mausoleum },
  Tower: { build: tower },
  GrassTuftA: { build: () => grassTuft(1) },
  GrassTuftB: { build: () => grassTuft(2) },
  GrassTuftC: { build: () => grassTuft(3) },
};

export const ENV_IDS = Object.keys(ENV_ITEMS);

// ---------------------------------------------------------------- glTF 生成

/** kind → マテリアル群。metal は金属、glow は発光、それ以外は soft。 */
const GROUP_OF = (kind) =>
  kind === 'iron' ? 'metal' : kind === 'glow' || kind === 'rune' ? 'glow' : 'soft';

/**
 * @returns {{ document: Document, triangles: number, items: Record<string, { triangles: number }> }}
 */
export function buildEnvironmentDocument() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene('Environment');
  const materials = {
    soft: doc
      .createMaterial('EnvSoft')
      .setBaseColorFactor([1, 1, 1, 1])
      .setMetallicFactor(0)
      .setRoughnessFactor(0.95)
      .setDoubleSided(true),
    metal: doc
      .createMaterial('EnvMetal')
      .setBaseColorFactor([1, 1, 1, 1])
      .setMetallicFactor(0.45)
      .setRoughnessFactor(0.75)
      .setDoubleSided(true),
    glow: doc
      .createMaterial('EnvGlow')
      .setBaseColorFactor([1, 1, 1, 1])
      .setMetallicFactor(0)
      .setRoughnessFactor(1)
      .setDoubleSided(true),
  };
  const accessor = (type, array) =>
    doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);

  let triangles = 0;
  const items = {};
  let seed = 0;
  for (const [id, def] of Object.entries(ENV_ITEMS)) {
    seed += 2.9;
    const parts = def.build();
    const mesh = doc.createMesh(id);
    const groups = { soft: emptyGeo(), metal: emptyGeo(), glow: emptyGeo() };
    const colors = { soft: [], metal: [], glow: [] };
    for (const { geo, kind, tint } of parts) {
      const key = GROUP_OF(kind);
      const g = groups[key];
      const base = g.positions.length / 3;
      g.positions.push(...geo.positions);
      g.normals.push(...geo.normals);
      for (const i of geo.indices) g.indices.push(i + base);
      const edge = edgeness(geo);
      for (let i = 0; i < geo.positions.length; i += 3) {
        const c = ENV_COLORS[kind](
          [geo.positions[i], geo.positions[i + 1], geo.positions[i + 2]],
          seed,
          { n: [geo.normals[i], geo.normals[i + 1], geo.normals[i + 2]], edge: edge[i / 3], tint },
        );
        colors[key].push(...c, 1);
      }
    }
    let itemTris = 0;
    for (const key of ['soft', 'metal', 'glow']) {
      const g = groups[key];
      if (g.indices.length === 0) continue;
      mesh.addPrimitive(
        doc
          .createPrimitive()
          .setMaterial(materials[key])
          .setAttribute('POSITION', accessor('VEC3', new Float32Array(g.positions)))
          .setAttribute('NORMAL', accessor('VEC3', new Float32Array(g.normals)))
          .setAttribute('COLOR_0', accessor('VEC4', new Float32Array(colors[key])))
          .setIndices(accessor('SCALAR', new Uint32Array(g.indices))),
      );
      itemTris += g.indices.length / 3;
    }
    scene.addChild(doc.createNode(id).setMesh(mesh));
    items[id] = { triangles: itemTris };
    triangles += itemTris;
  }
  return { document: doc, triangles, items };
}

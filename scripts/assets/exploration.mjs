// 探索・脇道要素の簡易メッシュ（プロシージャル自作。素材由来のライセンスなし、テクスチャなし）。
// 装備メッシュ（equipment.mjs）と同じ作り方: コードで生成し、色は頂点カラー（COLOR_0）で錆・苔・煤を表す。
// 仕様書 14.4 / 14.5 / 14.7 節。
//
//   GravekeeperGreatsword  墓守の大剣（全長 1.5m、刃こぼれ）。握りが原点、刃が +Y、刃の面の法線が ±Z。
//                          手（hand_r）と背中（spine_03）の 2 つの取り付け先を持つ（持ち替えで表示を切り替える）。
//   OilJar                 獣脂の壺（口に焦げた布）。壺の中心が原点、口が +Y。手（hand_r）のソケット = 投擲で放す位置。
//   Bell                   鐘。梁への吊り金具の上端が原点で、鐘は下（-Y）へ垂れる。クラッパーから引き綱が下がる。
//   PrayingStatue          祈る像（台座つき、膝をつく人型）。台座の底面中央が原点、正面が +Z。
//   Cairn                  石積み（3 段）。底面中央が原点。インスタンシング前提（Y 回転だけ変えて並べる）。
//   PlantedSword           突き立つ剣 1 本。剣の中心が原点、刃が +Y、柄頭が -Y 側（正立で突き立てるときは配置側で 180° 反転）。
//                          インスタンシング前提。extras.length / buriedTip / buriedPommel に埋まる深さを持つ。
//
// 取り付け・配置のないもの（Bell / PrayingStatue / Cairn / PlantedSword）はノードの extras にボーン情報を持たない。
import { box, emptyGeo, loft, lathe, merge, transform } from './geometry.mjs';
import {
  COLORS,
  ITEMS,
  buildItemsDocument,
  compose,
  ellipse,
  fbm,
  hash3,
  mix3,
  move,
  pushTri,
  smooth,
} from './equipment.mjs';

// ---------------------------------------------------------------- 小道具

const rad = (deg) => (deg * Math.PI) / 180;
const rotX = (deg) => {
  const [s, c] = [Math.sin(rad(deg)), Math.cos(rad(deg))];
  return ([x, y, z]) => [x, y * c - z * s, y * s + z * c];
};
const scale = (sx, sy, sz) => (p) => [p[0] * sx, p[1] * sy, p[2] * sz];

/** y 軸方向を dir に向ける回転（Rodrigues）。 */
function alignY(dir) {
  const l = Math.hypot(...dir);
  const d = dir.map((v) => v / l);
  // 回転軸 = Y × d、cos = d.y
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

/** p0 から p1 へ伸びる先細りの 6 角柱（腕・脚の簡易形状）。 */
function limb(p0, p1, r0, r1) {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const g = loft([
    { y: 0, ring: ellipse(r0, r0, 0, 0, 6) },
    { y: len * 0.5, ring: ellipse((r0 + r1) * 0.55, (r0 + r1) * 0.55, 0, 0, 6) },
    { y: len, ring: ellipse(r1, r1, 0, 0, 6) },
  ]);
  const rot = alignY([p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]);
  return transform(g, compose(rot, move(...p0)));
}

/**
 * 角の取れた岩。bottom の平らな面から上へ膨らみ、頂点は 1 点に収束する。ring ごとに半径を乱す。
 * (cx, cy, cz) は底面中心、(rx, h, rz) は最大半径と高さ。
 */
function rock(cx, cy, cz, rx, h, rz, seed, n = 9) {
  const levels = [0, 0.18, 0.5, 0.82];
  const profile = [0.86, 1, 0.97, 0.66];
  const rings = levels.map((t, k) => ({
    y: cy + t * h,
    ring: Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const j = 0.82 + 0.3 * hash3(i + k * 17, k, Math.floor(seed * 10));
      return [cx + Math.cos(a) * rx * profile[k] * j, cz + Math.sin(a) * rz * profile[k] * j];
    }),
  }));
  rings.push({ y: cy + h, ring: [[cx + 0.01 * (hash3(1, 2, Math.floor(seed * 10)) - 0.5), cz]] });
  return loft(rings);
}

// ---------------------------------------------------------------- 色（頂点カラー）

const COLORS_EXPLORATION = {
  ...COLORS,
  // 緑青を吹いた古い青銅（鐘）。縁は打たれて地金が見える
  bronze(p, seed) {
    const [x, y, z] = [p[0] + seed, p[1], p[2]];
    const dark = [0.11, 0.065, 0.03];
    const patina = [0.045, 0.16, 0.12];
    const bare = [0.34, 0.2, 0.07];
    let c = mix3(dark, patina, smooth(0.38, 0.65, fbm(x * 8, y * 6, z * 8)));
    // 下の縁ほど擦れて明るい（打ち鳴らされる部分）
    c = mix3(c, bare, smooth(-0.55, -0.7, y) * 0.8);
    return c;
  },
  // 風化した石（苔つき）。低い所と窪みに苔、全体に灰の汚れ
  stone(p, seed) {
    const [x, y, z] = [p[0] + seed, p[1], p[2] - seed];
    const base = mix3([0.1, 0.098, 0.092], [0.2, 0.19, 0.17], fbm(x * 9, y * 9, z * 9));
    const moss = smooth(0.5, 0.72, fbm(x * 6 + 3, y * 4, z * 6)) * smooth(0.5, 0.0, y);
    const grime = smooth(0.55, 0.8, fbm(x * 17, y * 17, z * 17));
    return mix3(mix3(base, [0.05, 0.1, 0.035], moss * 0.85), [0.04, 0.038, 0.035], grime * 0.5);
  },
  // 素焼きの壺: 赤茶の粘土に、口から垂れた獣脂の黒い筋と煤
  clay(p, seed) {
    const [x, y, z] = [p[0] + seed, p[1], p[2]];
    const base = mix3([0.16, 0.075, 0.04], [0.26, 0.13, 0.065], fbm(x * 25, y * 25, z * 25));
    const streak = smooth(0.52, 0.7, fbm(x * 45, y * 6, z * 45)) * smooth(-0.05, 0.1, y);
    const soot = smooth(0.7, 1.0, y * 8) * 0.5;
    return mix3(base, [0.025, 0.018, 0.012], Math.min(1, streak * 0.9 + soot));
  },
  // 焦げた布（栓）。先端ほど黒く、ところどころ煤けた灰色
  charred(p, seed) {
    const n = fbm(p[0] * 40 + seed, p[1] * 25, p[2] * 40);
    const tip = smooth(0.125, 0.19, p[1]);
    return mix3(mix3([0.1, 0.075, 0.05], [0.035, 0.03, 0.026], n), [0.012, 0.01, 0.009], tip);
  },
  // 古い麻縄
  rope(p, seed) {
    const n = fbm(p[0] * 60 + seed, p[1] * 40, p[2] * 60);
    return mix3([0.08, 0.06, 0.035], [0.2, 0.16, 0.1], n);
  },
};

const METAL_KINDS = new Set(['iron', 'bronze']);

// ---------------------------------------------------------------- 墓守の大剣

/** 刃の断面（六角形に近い扁平形）。wl / wr は左右の半幅、t は厚み。 */
const bladeRing = (wl, wr, t) => [
  [wl, 0],
  [wl * 0.4, t / 2],
  [-wr * 0.4, t / 2],
  [-wr, 0],
  [-wr * 0.4, -t / 2],
  [wl * 0.4, -t / 2],
];

function gravekeeperGreatsword() {
  // 幅広の直刃。長年の戦いで両刃に刃こぼれがあり、先端近くは丸く磨り減っている。
  const blade = loft([
    { y: 0.13, ring: bladeRing(0.05, 0.05, 0.024) }, // リカッソ（刃の根元）
    { y: 0.3, ring: bladeRing(0.054, 0.054, 0.02) },
    { y: 0.5, ring: bladeRing(0.054, 0.052, 0.018) },
    { y: 0.52, ring: bladeRing(0.034, 0.052, 0.018) }, // 左刃の刃こぼれ
    { y: 0.58, ring: bladeRing(0.036, 0.05, 0.018) },
    { y: 0.6, ring: bladeRing(0.05, 0.05, 0.018) },
    { y: 0.78, ring: bladeRing(0.05, 0.048, 0.017) },
    { y: 0.8, ring: bladeRing(0.05, 0.03, 0.017) }, // 右刃の刃こぼれ
    { y: 0.87, ring: bladeRing(0.049, 0.032, 0.016) },
    { y: 0.89, ring: bladeRing(0.048, 0.048, 0.016) },
    { y: 1.05, ring: bladeRing(0.045, 0.045, 0.014) },
    { y: 1.07, ring: bladeRing(0.032, 0.044, 0.014) }, // 左の小さな欠け
    { y: 1.12, ring: bladeRing(0.04, 0.042, 0.013) },
    { y: 1.2, ring: bladeRing(0.034, 0.036, 0.012) },
    { y: 1.26, ring: bladeRing(0.02, 0.024, 0.01) }, // 磨り減った切先
    { y: 1.28, ring: [[0, 0]] },
  ]);
  // 刀身中央の樋（くぼみ）を暗い筋として見せる細い箱
  const fuller = merge(box(0, 0.62, 0.0, 0.012, 0.9, 0.026));
  const guard = merge(
    box(0, 0.11, 0, 0.36, 0.034, 0.05),
    // 先端が下へ垂れる鍔
    box(0.185, 0.085, 0, 0.034, 0.09, 0.05),
    box(-0.185, 0.085, 0, 0.034, 0.09, 0.05),
    box(0, 0.145, 0, 0.1, 0.03, 0.044),
  );
  const grip = lathe(
    [
      [
        [0.02, -0.19],
        [0.02, 0.095],
      ],
      [
        [0.02, 0.095],
        [0, 0.095],
      ],
    ],
    10,
  );
  // 握りに巻いた鉄の輪
  const wraps = merge(
    ...[-0.14, -0.04, 0.06].map((y) =>
      lathe(
        [
          [
            [0.024, y],
            [0.024, y + 0.018],
          ],
        ],
        10,
      ),
    ),
  );
  const pommel = lathe(
    [
      [
        [0, -0.235],
        [0.034, -0.228],
        [0.04, -0.21],
        [0.034, -0.192],
        [0.02, -0.19],
      ],
    ],
    10,
  );
  return {
    parts: [
      { geo: merge(blade, guard, pommel, wraps), kind: 'iron' },
      { geo: fuller, kind: 'ironDark' },
      { geo: grip, kind: 'leather' },
    ],
  };
}

// ---------------------------------------------------------------- 獣脂の壺

function oilJar() {
  // 素焼きの小壺（高さ約 0.23m）。口に焦げた布を詰め、縁に垂らしてある。
  const body = lathe(
    [
      [
        [0.0, -0.115],
        [0.062, -0.112],
        [0.088, -0.085],
        [0.106, -0.03],
        [0.102, 0.02],
        [0.082, 0.065],
        [0.052, 0.092],
        [0.046, 0.108],
        [0.056, 0.116],
        [0.05, 0.124],
      ],
      // 口の内側（暗い穴）
      [
        [0.05, 0.124],
        [0.036, 0.1],
        [0.0, 0.1],
      ],
    ],
    14,
  );
  const band = lathe(
    [
      [
        [0.052, 0.082],
        [0.053, 0.094],
      ],
      [
        [0.056, 0.074],
        [0.057, 0.084],
      ],
    ],
    12,
  );
  // 栓の布: 口から突き出し、先端が焦げて黒い。縁から 1 枚の布端が垂れる
  const plug = lathe(
    [
      [
        [0.038, 0.1],
        [0.034, 0.14],
        [0.026, 0.17],
        [0.014, 0.19],
        [0.0, 0.2],
      ],
    ],
    6,
  );
  const flap = emptyGeo();
  pushTri(flap, [0.04, 0.13, 0.0], [0.062, 0.115, 0.03], [0.075, 0.04, 0.02]);
  pushTri(flap, [0.04, 0.13, 0.0], [0.075, 0.04, 0.02], [0.074, 0.06, -0.03]);
  pushTri(flap, [0.074, 0.06, -0.03], [0.075, 0.04, 0.02], [0.082, 0.015, -0.005]);
  return {
    parts: [
      { geo: body, kind: 'clay' },
      { geo: band, kind: 'rope' },
      { geo: merge(plug, flap), kind: 'charred' },
    ],
  };
}

// ---------------------------------------------------------------- 鐘

function bell() {
  const outer = lathe(
    [
      [
        [0.3, -0.7],
        [0.292, -0.66],
        [0.262, -0.6],
        [0.2, -0.5],
        [0.15, -0.38],
        [0.112, -0.28],
        [0.07, -0.225],
        [0.045, -0.2],
        [0, -0.195],
      ],
      // 鐘の内側
      [
        [0, -0.23],
        [0.1, -0.3],
        [0.2, -0.54],
        [0.255, -0.68],
      ],
      // 縁の厚み
      [
        [0.255, -0.68],
        [0.255, -0.7],
        [0.305, -0.7],
        [0.3, -0.7],
      ],
    ],
    16,
  );
  // 縁の厚い打ち口（サウンドボウ）
  const lip = lathe(
    [
      [
        [0.262, -0.6],
        [0.292, -0.62],
        [0.305, -0.65],
        [0.31, -0.7],
      ],
    ],
    16,
  );
  const crown = lathe(
    [
      [
        [0.05, -0.2],
        [0.04, -0.17],
        [0.036, -0.14],
      ],
    ],
    8,
  );
  // 梁から下がる吊り金具（鉄）
  const hanger = merge(
    box(0, -0.07, 0, 0.1, 0.14, 0.022),
    box(0, 0.015, 0, 0.14, 0.03, 0.05),
    box(0, -0.15, 0, 0.034, 0.05, 0.034),
  );
  const clapper = lathe(
    [
      [
        [0.0, -0.215],
        [0.012, -0.215],
        [0.012, -0.6],
        [0.034, -0.612],
        [0.044, -0.645],
        [0.034, -0.68],
        [0.0, -0.69],
      ],
    ],
    8,
  );
  // クラッパーから垂れる引き綱（途中にこぶ、先は解れた房）
  const rope = merge(
    lathe(
      [
        [
          [0.014, -0.69],
          [0.013, -1.1],
          [0.014, -1.6],
          [0.012, -1.78],
        ],
      ],
      6,
    ),
    lathe(
      [
        [
          [0.0, -1.55],
          [0.032, -1.57],
          [0.034, -1.6],
          [0.0, -1.63],
        ],
      ],
      6,
    ),
    // 房
    lathe(
      [
        [
          [0.012, -1.78],
          [0.03, -1.84],
          [0.014, -1.9],
          [0.0, -1.93],
        ],
      ],
      6,
    ),
  );
  return {
    parts: [
      { geo: merge(outer, lip, crown), kind: 'bronze' },
      { geo: merge(hanger, clapper), kind: 'iron' },
      { geo: rope, kind: 'rope' },
    ],
  };
}

// ---------------------------------------------------------------- 祈る像

function prayingStatue() {
  // 膝をつき、頭を垂れて胸の前で手を合わせた人型。長い年月で縁が丸く削れた石像。
  const plinth = merge(box(0, 0.06, 0, 0.9, 0.12, 0.8), box(0, 0.145, -0.02, 0.76, 0.05, 0.66));
  const top = 0.17;
  // 衣（腰より下は膝と脛を覆って広がり、上半身は前へ傾く）
  const robe = loft([
    { y: top, ring: ellipse(0.32, 0.46, 0, 0.04, 14) },
    { y: top + 0.14, ring: ellipse(0.29, 0.4, 0, 0.06, 14) }, // 前へ突き出す膝と衣の裾
    { y: top + 0.3, ring: ellipse(0.23, 0.27, 0, 0.02, 14) },
    { y: top + 0.5, ring: ellipse(0.2, 0.17, 0, 0.03, 14) },
    { y: top + 0.78, ring: ellipse(0.215, 0.15, 0, 0.09, 14) },
    { y: top + 0.96, ring: ellipse(0.245, 0.14, 0, 0.14, 14) },
    { y: top + 1.0, ring: ellipse(0.12, 0.1, 0, 0.17, 14) },
    { y: top + 1.04, ring: ellipse(0.075, 0.075, 0, 0.18, 14) },
  ]);
  // 頭巾を被った頭（前へ垂れている）
  const head = transform(
    lathe(
      [
        [
          [0.0, -0.1],
          [0.07, -0.085],
          [0.105, -0.03],
          [0.108, 0.03],
          [0.08, 0.08],
          [0.03, 0.105],
          [0, 0.108],
        ],
      ],
      10,
    ),
    compose(rotX(32), move(0, top + 1.16, 0.23)),
  );
  const hood = transform(
    lathe(
      [
        [
          [0.0, -0.06],
          [0.125, -0.05],
          [0.148, 0.02],
          [0.12, 0.085],
          [0.05, 0.13],
          [0, 0.138],
        ],
      ],
      10,
    ),
    compose(scale(1, 1, 1.1), rotX(28), move(0, top + 1.17, 0.2)),
  );
  // 腕（肩 → 肘 → 胸の前で合掌）
  const arms = merge(
    limb([-0.235, top + 0.93, 0.13], [-0.2, top + 0.66, 0.22], 0.062, 0.052),
    limb([0.235, top + 0.93, 0.13], [0.2, top + 0.66, 0.22], 0.062, 0.052),
    limb([-0.2, top + 0.66, 0.22], [-0.02, top + 0.84, 0.36], 0.05, 0.04),
    limb([0.2, top + 0.66, 0.22], [0.02, top + 0.84, 0.36], 0.05, 0.04),
    box(0, top + 0.86, 0.37, 0.07, 0.11, 0.05),
  );
  return {
    parts: [
      { geo: plinth, kind: 'stone' },
      { geo: merge(robe, head, hood, arms), kind: 'stone' },
    ],
  };
}

// ---------------------------------------------------------------- 石積み

function cairn() {
  // 3 段のケルン。下ほど大きく、少しずつずらして積む。
  return {
    parts: [
      {
        geo: merge(
          rock(0, 0, 0, 0.27, 0.16, 0.22, 1.1),
          rock(0.03, 0.15, -0.015, 0.19, 0.14, 0.16, 2.3),
          rock(-0.02, 0.28, 0.01, 0.11, 0.12, 0.1, 3.7),
        ),
        kind: 'stone',
      },
    ],
  };
}

// ---------------------------------------------------------------- 突き立つ剣

/** 突き立つ剣の寸法（アセットと TS の配置ヘルパーで共有。extras にも書き出す）。 */
export const PLANTED_SWORD = {
  length: 0.93,
  /** 切先が地面に埋まる深さ（正立のとき）。 */
  buriedTip: 0.2,
  /** 柄頭が埋まる深さ（逆さのとき）。 */
  buriedPommel: 0.06,
};

function plantedSword() {
  // 錆びた直剣（亡者兵の剣と同じ形）を中心原点にする。
  const { parts } = ITEMS.Sword_Rusty.build();
  const centerY = (0.8 - 0.13) / 2;
  return {
    parts: parts.map((p) => ({ ...p, geo: transform(p.geo, move(0, -centerY, 0)) })),
  };
}

// ---------------------------------------------------------------- アイテム定義

const SWORD_HAND_SOCKET = {
  bone: 'hand_r',
  position: [0, 0.06, 0],
  quaternion: [0.4304, 0.561, 0.4304, 0.561],
};

// 背中の大剣: 柄が右肩の後ろ（キャラクターの右 = -X）、刃は左腰へ向かって斜めに背中へ沿う。
const backAngle = -157.7;
const BACK_PLACEMENT = {
  position: [-0.19, 1.47, -0.24],
  quaternion: [0, 0, Math.sin(rad(backAngle) / 2), Math.cos(rad(backAngle) / 2)],
};

export const EXPLORATION_ITEMS = {
  GravekeeperGreatsword: {
    build: gravekeeperGreatsword,
    socket: SWORD_HAND_SOCKET,
    extraSockets: {
      hand: SWORD_HAND_SOCKET,
      back: { bone: 'spine_03', placement: BACK_PLACEMENT },
    },
    extras: { length: 1.5 },
  },
  OilJar: {
    build: oilJar,
    // 腕を下ろした姿勢で手のひらに乗せ、口を上へ向ける（手のボーンの -Y が上）。投擲ではこのソケットから放す。
    socket: { bone: 'hand_r', position: [0, 0.07, 0.04], quaternion: [0, 0, 1, 0] },
  },
  Bell: { build: bell },
  PrayingStatue: { build: prayingStatue },
  Cairn: { build: cairn },
  PlantedSword: { build: plantedSword, extras: { ...PLANTED_SWORD } },
};

// 'ironDark' は大剣の樋（暗い鉄）用の色
COLORS_EXPLORATION.ironDark = (p, seed, info) => {
  const c = COLORS.iron(p, seed, info);
  return [c[0] * 0.35, c[1] * 0.35, c[2] * 0.35];
};
METAL_KINDS.add('ironDark');

/** 探索用メッシュ全体を glTF にする。boneWorldMatrices は knight.glb の bind pose（build-exploration.mjs が渡す）。 */
export function buildExplorationDocument(boneWorldMatrices) {
  return buildItemsDocument({
    defs: EXPLORATION_ITEMS,
    sceneName: 'Exploration',
    boneWorldMatrices,
    colors: COLORS_EXPLORATION,
    metalKinds: METAL_KINDS,
  });
}

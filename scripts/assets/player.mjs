// プレイヤー（旅の騎士）の装備メッシュ（プロシージャル自作。素材由来のライセンスなし、テクスチャなし）。
// 装備（equipment.mjs）・探索用メッシュ（exploration.mjs）と同じ作り方: コードで生成し、色は頂点カラーで表す。
// 色設計: 使い込まれた鋼（青灰・エッジだけ明るい）、暗い革、深紅の布（外套・陣羽織・兜の羽根）。
// 錆びた敵の装備と対になる「手入れされた旅の騎士」。三人称の後ろ姿（兜の羽根・肩当て・外套）のシルエットを重視。
//
// 座標系: キャラクター空間（足元が原点、+Y 上、+Z 前、+X がキャラクターの左）の T ポーズ（knight.glb の bind pose）で作り、
// 取り付けボーンの bind ワールド行列の逆行列をソケットとして計算する（equipment.mjs と同じ）。
//
// 外套は 3 段（Knight_Cape_1〜3）に分けてあり、extras.pivot（アイテム空間の蝶番の位置）で上から順に鎖状に
// 吊るして、ランタイム（src/render/player/capeRig.ts）が段ごとに揺らす（軽量なボーン揺れ）。
import { box, emptyGeo, loft, lathe, merge, transform } from './geometry.mjs';
import {
  COLORS,
  buildItemsDocument,
  compose,
  ellipse,
  fbm,
  latheArc,
  mirrorX,
  mix3,
  move,
  pushTri,
  smooth,
} from './equipment.mjs';

// ---------------------------------------------------------------- 小道具

const rad = (deg) => (deg * Math.PI) / 180;
const rotXf = (deg) => {
  const [s, c] = [Math.sin(rad(deg)), Math.cos(rad(deg))];
  return ([x, y, z]) => [x, y * c - z * s, y * s + z * c];
};
const rotZf = (deg) => {
  const [s, c] = [Math.sin(rad(deg)), Math.cos(rad(deg))];
  return ([x, y, z]) => [x * c - y * s, x * s + y * c, z];
};

/** 2 点間の先細りの柱（腕・脚の防具の芯）。軸は y に沿って作り、p0 → p1 に向ける。 */
function tube(p0, p1, r0, r1, n = 12) {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  const g = lathe(
    [
      [
        [r0, 0],
        [(r0 + r1) * 0.5 + 0.004, len * 0.5],
        [r1, len],
      ],
    ],
    n,
  );
  const d = [(p1[0] - p0[0]) / len, (p1[1] - p0[1]) / len, (p1[2] - p0[2]) / len];
  // y 軸を d へ向ける回転（Rodrigues）
  const ax = [d[2], 0, -d[0]];
  const s = Math.hypot(ax[0], ax[2]);
  const c = d[1];
  const rot =
    s < 1e-9
      ? (p) => (c > 0 ? p : [p[0], -p[1], p[2]])
      : (p) => {
          const k = [ax[0] / s, 0, ax[2] / s];
          const kxp = [
            k[1] * p[2] - k[2] * p[1],
            k[2] * p[0] - k[0] * p[2],
            k[0] * p[1] - k[1] * p[0],
          ];
          const kdp = k[0] * p[0] + k[1] * p[1] + k[2] * p[2];
          return [0, 1, 2].map((i) => p[i] * c + kxp[i] * s + k[i] * kdp * (1 - c));
        };
  return transform(g, compose(rot, move(...p0)));
}

// ---------------------------------------------------------------- 色

const COLORS_PLAYER = {
  ...COLORS,
  // 手入れされた鋼: 青灰の鈍い地、エッジは擦れて明るく、凹みと下向きの面にごく薄い黒ずみ・茶の曇り
  steel(p, seed, info) {
    const [x, y, z] = [p[0] + seed, p[1], p[2] - seed];
    const n = info?.n ?? [0, 1, 0];
    const edge = info?.edge ?? 0;
    const tone = 0.9 + 0.2 * fbm(x * 2.4, y * 2.4, z * 2.4);
    const base = [0.2 * tone, 0.215 * tone, 0.25 * tone];
    const grime =
      smooth(0.45, 0.85, fbm(x * 3.2 + 3, y * 3.2, z * 3.2)) * (0.35 + 0.65 * Math.max(0, -n[1]));
    let c = mix3(base, [0.09, 0.075, 0.07], grime * 0.55);
    c = mix3(c, [0.55, 0.56, 0.6], edge * 0.55); // エッジの擦れ（地金が光る）
    return c;
  },
  // 兜の目の奥・通気孔など、影になる暗い鋼
  steelDark(p, seed, info) {
    const c = COLORS_PLAYER.steel(p, seed, info);
    return [c[0] * 0.2, c[1] * 0.2, c[2] * 0.22];
  },
  // 真鍮の鋲・縁取り（くすんだ金）
  brass(p, seed) {
    const n = fbm(p[0] * 9 + seed, p[1] * 9, p[2] * 9);
    return mix3([0.2, 0.125, 0.04], [0.34, 0.23, 0.08], n);
  },
  // 深紅の布（外套・陣羽織・羽根）: 暗い赤。裾ほど泥と擦れで黒ずみ、陣羽織の中央に縦の帯
  crimson(p, seed) {
    const n = fbm(p[0] * 4 + seed, p[1] * 2.5, p[2] * 4);
    const base = mix3([0.07, 0.007, 0.01], [0.125, 0.014, 0.017], n);
    const hem = smooth(0.8, 0.45, p[1]) * 0.55; // 低い所ほど汚れる
    const stripe = Math.abs(p[0]) < 0.028 ? 0.35 : 0; // 中央の帯（少し暗い）
    return mix3(mix3(base, [0.03, 0.02, 0.02], hem), [0.05, 0.006, 0.008], stripe);
  },
};

const METAL_KINDS = new Set(['steel', 'steelDark', 'brass']);

// ---------------------------------------------------------------- 兜（Head）

function knightHelm() {
  const cz = -0.016; // 頭の中心（Head ボーンの z）
  const dome = lathe(
    [
      [
        [0.137, 1.745],
        [0.14, 1.77],
        [0.13, 1.81],
        [0.1, 1.845],
        [0.05, 1.865],
        [0, 1.87],
      ],
    ],
    12,
  );
  // 後頭部と側面を覆う下側（正面は開けて、顔の前面は嘴状のバイザーが覆う）
  const skirt = latheArc(
    [
      [
        [0.138, 1.745],
        [0.142, 1.65],
        [0.15, 1.56],
        [0.16, 1.5],
      ],
    ],
    10,
    Math.PI * 0.5 + 0.95,
    Math.PI * 2.5 - 0.95,
  );
  const rim = lathe(
    [
      [
        [0.146, 1.738],
        [0.149, 1.75],
        [0.141, 1.76],
      ],
    ],
    12,
  );
  // 嘴状のバイザー（フードの下の顔全体を覆う。目の高さにスリット: ドームの縁との隙間）
  const visor = loft([
    { y: 1.54, ring: ellipse(0.062, 0.075, 0, 0.082 + cz, 10) },
    { y: 1.6, ring: ellipse(0.088, 0.11, 0, 0.088 + cz, 10) },
    { y: 1.68, ring: ellipse(0.118, 0.15, 0, 0.082 + cz, 10) },
    { y: 1.725, ring: ellipse(0.138, 0.158, 0, 0.056 + cz, 10) },
  ]);
  const visorTop = lathe(
    [
      [
        [0.14, 1.725],
        [0.146, 1.732],
        [0.14, 1.738],
      ],
    ],
    14,
  );
  // 通気孔（右頬側に縦の細い穴を並べる）
  const slots = merge(
    ...[0.014, 0.036, 0.058].map((x) =>
      box(-0.08 - x * 0.2, 1.6, 0.14 + cz + 0.01 - x * 0.5, 0.008, 0.05, 0.012),
    ),
  );
  // 中央の縦の稜線
  const ridge = box(0, 1.6, 0.188 + cz, 0.012, 0.16, 0.03);
  // 頂部の飾り帯（真鍮）
  const crestBand = box(0, 1.865, cz, 0.016, 0.014, 0.28);
  // 首を覆うゴルジェット
  const gorget = loft([
    { y: 1.5, ring: ellipse(0.17, 0.14, 0, 0.0, 16) },
    { y: 1.53, ring: ellipse(0.145, 0.125, 0, 0.0, 16) },
    { y: 1.56, ring: ellipse(0.13, 0.115, 0, 0.0, 16) },
  ]);
  // 羽根飾り（深紅の布の帯）: 頭頂から後ろへ流れて首元へ垂れる
  const plume = emptyGeo();
  const spine = [
    [0, 1.87, 0.07],
    [0, 1.9, -0.04],
    [0, 1.86, -0.16],
    [0, 1.76, -0.25],
    [0, 1.64, -0.29],
  ];
  const w = [0.012, 0.03, 0.04, 0.045, 0.035];
  for (let i = 0; i < spine.length - 1; i++) {
    const [a, b] = [spine[i], spine[i + 1]];
    const [wa, wb] = [w[i], w[i + 1]];
    const a0 = [a[0] - wa, a[1], a[2]];
    const a1 = [a[0] + wa, a[1], a[2]];
    const b0 = [b[0] - wb, b[1], b[2]];
    const b1 = [b[0] + wb, b[1], b[2]];
    pushTri(plume, a0, a1, b0);
    pushTri(plume, a1, b1, b0);
  }
  return {
    parts: [
      { geo: merge(dome, skirt, rim, visor, visorTop, ridge, gorget), kind: 'steel' },
      { geo: slots, kind: 'steelDark' },
      { geo: crestBand, kind: 'brass' },
      { geo: plume, kind: 'crimson' },
    ],
  };
}

// ---------------------------------------------------------------- 胸甲と帯（spine_03）

function knightCuirass() {
  const ringAt = (y, rx, rz, cz = 0) => ({ y, ring: ellipse(rx, rz, 0, cz, 14) });
  const shell = loft([
    ringAt(1.04, 0.185, 0.135, 0.0),
    ringAt(1.12, 0.2, 0.147, 0.0),
    ringAt(1.24, 0.235, 0.168, 0.016),
    ringAt(1.38, 0.248, 0.176, 0.012),
    ringAt(1.46, 0.215, 0.148, 0.0),
  ]);
  // 胸の稜線（前）と背骨の筋（後ろ）
  const ridge = box(0, 1.27, 0.19, 0.022, 0.3, 0.03);
  const spineLine = box(0, 1.27, -0.172, 0.018, 0.3, 0.02);
  // 縁の返し（首・腕ぐりの縁取り）
  const collar = lathe(
    [
      [
        [0.205, 1.45],
        [0.213, 1.465],
        [0.2, 1.48],
      ],
    ],
    14,
  );
  // 首元のゴルジェット
  const neck = loft([
    ringAt(1.46, 0.17, 0.13, 0.0),
    ringAt(1.5, 0.15, 0.12, -0.005),
    ringAt(1.54, 0.12, 0.105, -0.01),
  ]);
  // 腹の帯板（革の帯の下に重なる 2 枚）
  const lames = merge(
    loft([ringAt(0.99, 0.2, 0.15), ringAt(1.05, 0.192, 0.142)]),
    loft([ringAt(0.94, 0.208, 0.157), ringAt(1.0, 0.2, 0.15)]),
  );
  const belt = loft([ringAt(1.03, 0.2, 0.15), ringAt(1.1, 0.205, 0.155)]);
  const buckle = box(0, 1.065, 0.158, 0.06, 0.05, 0.016);
  const pouch = box(0.235, 0.99, 0.02, 0.07, 0.1, 0.1);
  const pouchFlap = box(0.24, 1.03, 0.02, 0.08, 0.03, 0.11);
  const rivets = merge(
    ...[-0.13, 0.13].flatMap((x) => [1.2, 1.34].map((y) => box(x, y, 0.17, 0.018, 0.018, 0.018))),
  );
  return {
    parts: [
      { geo: merge(shell, ridge, spineLine, collar, neck, lames), kind: 'steel' },
      { geo: merge(buckle, rivets), kind: 'brass' },
      { geo: merge(belt, pouch, pouchFlap), kind: 'leather' },
    ],
  };
}

// ---------------------------------------------------------------- 陣羽織（pelvis）

/** 腰から前後に垂れる深紅の陣羽織（前面・背面の 2 枚。脚の動きを妨げないよう短め・脇は開ける）。 */
function knightTabard() {
  const g = emptyGeo();
  const cols = 4;
  const rows = 3;
  for (const side of [1, -1]) {
    const grid = [];
    for (let r = 0; r <= rows; r++) {
      const v = r / rows;
      const y = 1.04 - v * 0.4;
      const row = [];
      for (let c = 0; c <= cols; c++) {
        const u = c / cols - 0.5;
        const half = 0.115 + 0.05 * v;
        const x = u * 2 * half;
        // 腰の前後の形に沿って、裾ほど外へ開く。裾はわずかに波打つ
        const z = side * (0.158 + 0.07 * v + 0.012 * Math.sin(c * 2.1 + v * 3));
        row.push([x, y - (r === rows ? 0.02 * Math.abs(Math.sin(c * 1.9)) : 0), z]);
      }
      grid.push(row);
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const [a, b, d, e] = [grid[r][c], grid[r][c + 1], grid[r + 1][c], grid[r + 1][c + 1]];
        if (side > 0) {
          pushTri(g, a, d, b);
          pushTri(g, b, d, e);
        } else {
          pushTri(g, a, b, d);
          pushTri(g, b, e, d);
        }
      }
    }
  }
  return { parts: [{ geo: g, kind: 'crimson' }] };
}

// ---------------------------------------------------------------- 肩当て・籠手・脛当て

/** 左肩の肩当て（3 枚の板が重なる、縁を巻いた肩甲）。キャラクターの左 = +X。 */
function pauldronLeft() {
  const dome = (s) =>
    lathe(
      [
        [
          [0.16 * s, 0.0],
          [0.158 * s, 0.03 * s],
          [0.135 * s, 0.078 * s],
          [0.09 * s, 0.115 * s],
          [0.035 * s, 0.133 * s],
          [0, 0.136 * s],
        ],
      ],
      10,
    );
  const rimRing = (s) =>
    lathe(
      [
        [
          [0.158 * s, -0.012],
          [0.166 * s, 0.006],
          [0.158 * s, 0.022],
        ],
      ],
      10,
    );
  const place = (g, dx) => transform(g, compose(rotZf(-34), move(0.2 + dx, 1.5, 0.0)));
  const lames = [];
  for (let t = 0; t < 3; t++) {
    const s = 0.92 + t * 0.12;
    const drop = -0.05 * t; // 腕の下へ向かって重ねる
    const lame = merge(dome(s), rimRing(s));
    lames.push(
      transform(
        lame,
        compose(move(0, drop, 0), rotZf(-34), move(0.2 + 0.035 * t, 1.5 - 0.0 * t, 0.0)),
      ),
    );
  }
  void place;
  // 肩当てを留める革のストラップ（上腕に巻く）と、縁の真鍮鋲
  const strap = transform(
    lathe(
      [
        [
          [0.074, -0.02],
          [0.074, 0.02],
        ],
      ],
      10,
    ),
    compose(rotZf(-90), move(0.3, 1.455, -0.065)),
  );
  const studs = merge(
    ...[0.24, 0.3, 0.36].map((x) => box(x, 1.575 - (x - 0.24) * 0.55, 0.0, 0.02, 0.014, 0.02)),
  );
  return {
    parts: [
      { geo: merge(...lames), kind: 'steel' },
      { geo: strap, kind: 'leather' },
      { geo: studs, kind: 'brass' },
    ],
  };
}

function vambraceLeft() {
  // 前腕（lowerarm_l: x 0.443 → 0.683）の籠手と肘当て
  const arm = tube([0.455, 1.455, -0.07], [0.66, 1.455, -0.07], 0.066, 0.052, 12);
  const cuff = transform(
    lathe(
      [
        [
          [0.07, 0.0],
          [0.07, 0.02],
        ],
        [
          [0.062, 0.2],
          [0.062, 0.222],
        ],
      ],
      12,
    ),
    compose(rotZf(-90), move(0.45, 1.455, -0.07)),
  );
  const couter = transform(
    lathe(
      [
        [
          [0.07, 0.0],
          [0.068, 0.03],
          [0.045, 0.062],
          [0, 0.074],
        ],
      ],
      10,
    ),
    compose(rotZf(0), move(0.443, 1.5, -0.07)),
  );
  return { parts: [{ geo: merge(arm, cuff, couter), kind: 'steel' }] };
}

function greaveLeft() {
  // 脛当て（calf_l: y 0.542 → 0.086）と膝当て
  const shin = merge(tube([0.091, 0.14, -0.05], [0.091, 0.5, -0.045], 0.062, 0.078, 12));
  const ridge = box(0.091, 0.32, 0.025, 0.014, 0.34, 0.016);
  const poleyn = transform(
    lathe(
      [
        [
          [0.095, 0.0],
          [0.092, 0.03],
          [0.065, 0.062],
          [0, 0.074],
        ],
      ],
      12,
    ),
    compose(rotXf(90), move(0.091, 0.545, -0.0)),
  );
  return { parts: [{ geo: merge(shin, ridge, poleyn), kind: 'steel' }] };
}

// ---------------------------------------------------------------- 外套（3 段）

/** 外套の段の境目の高さ（上から）と、各高さの後ろ側の z・半幅。 */
const CAPE_Y = [1.5, 1.18, 0.86, 0.54];
const capeZ = (y) => -0.19 - 0.115 * smooth(1.5, 0.54, y);
const capeHalf = (y) => 0.2 + 0.1 * smooth(1.5, 0.54, y);

export const CAPE_PIVOTS = CAPE_Y.slice(0, 3).map((y) => [0, y, capeZ(y)]);

function capeSegment(index) {
  const [y0, y1] = [CAPE_Y[index], CAPE_Y[index + 1]];
  const cols = 8;
  const rows = 2;
  const g = emptyGeo();
  const grid = [];
  for (let r = 0; r <= rows; r++) {
    const y = y0 + ((y1 - y0) * r) / rows;
    const row = [];
    for (let c = 0; c <= cols; c++) {
      const u = c / cols - 0.5;
      const half = capeHalf(y);
      // 体を巻くように両端が前へ回る
      const wrap =
        0.075 * (1 - Math.cos(u * 2 * Math.PI * 0.5 * 1)) * (1 - 0.5 * smooth(1.5, 0.54, y));
      const hemWave =
        index === 2 && r === rows
          ? 0.03 * Math.sin(c * 2.3) - 0.02 * Math.abs(Math.sin(c * 1.3))
          : 0;
      row.push([u * 2 * half, y + hemWave, capeZ(y) + wrap + 0.012 * Math.sin(c * 1.7 + y * 6)]);
    }
    grid.push(row);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [a, b, d, e] = [grid[r][c], grid[r][c + 1], grid[r + 1][c], grid[r + 1][c + 1]];
      // 背面（-Z）が表。material は doubleSide
      pushTri(g, a, b, d);
      pushTri(g, b, e, d);
    }
  }
  const parts = [{ geo: g, kind: 'crimson' }];
  if (index === 0) {
    // 襟（首の後ろ〜肩を覆う厚い布）と、前で留める真鍮の留め金
    const collar = loft([
      { y: 1.47, ring: ellipse(0.215, 0.17, 0, -0.01, 16) },
      { y: 1.53, ring: ellipse(0.185, 0.15, 0, -0.01, 16) },
      { y: 1.57, ring: ellipse(0.16, 0.135, 0, -0.01, 16) },
    ]);
    parts.push({ geo: collar, kind: 'crimson' });
    parts.push({
      geo: merge(box(0.1, 1.5, 0.15, 0.04, 0.04, 0.02), box(-0.1, 1.5, 0.15, 0.04, 0.04, 0.02)),
      kind: 'brass',
    });
  }
  return { parts };
}

// ---------------------------------------------------------------- アイテム定義

const mirrorParts = (item) => ({ parts: item.parts.map((p) => ({ ...p, geo: mirrorX(p.geo) })) });

export const PLAYER_ITEMS = {
  Knight_Helm: { build: knightHelm, socket: 'Head' },
  Knight_Cuirass: { build: knightCuirass, socket: 'spine_03' },
  Knight_Tabard: { build: knightTabard, socket: 'pelvis' },
  Knight_Pauldron_L: { build: pauldronLeft, socket: 'upperarm_l' },
  Knight_Pauldron_R: { build: () => mirrorParts(pauldronLeft()), socket: 'upperarm_r' },
  Knight_Vambrace_L: { build: vambraceLeft, socket: 'lowerarm_l' },
  Knight_Vambrace_R: { build: () => mirrorParts(vambraceLeft()), socket: 'lowerarm_r' },
  Knight_Greave_L: { build: greaveLeft, socket: 'calf_l' },
  Knight_Greave_R: { build: () => mirrorParts(greaveLeft()), socket: 'calf_r' },
  Knight_Cape_1: { build: () => capeSegment(0), socket: 'spine_03', extras: { segment: 0 } },
  Knight_Cape_2: {
    build: () => capeSegment(1),
    socket: 'spine_03',
    extras: { segment: 1, pivot: CAPE_PIVOTS[1] },
  },
  Knight_Cape_3: {
    build: () => capeSegment(2),
    socket: 'spine_03',
    extras: { segment: 2, pivot: CAPE_PIVOTS[2] },
  },
};
// 外套の最上段は肩の高さの蝶番で吊るす
PLAYER_ITEMS.Knight_Cape_1.extras.pivot = CAPE_PIVOTS[0];

/** プレイヤーの装備一式（表示順）。 */
export const PLAYER_LOADOUT = Object.keys(PLAYER_ITEMS);

/** player.glb 全体。boneWorldMatrices は knight.glb の bind pose（build-player.mjs が渡す）。 */
export function buildPlayerDocument(boneWorldMatrices) {
  return buildItemsDocument({
    defs: PLAYER_ITEMS,
    sceneName: 'PlayerKit',
    boneWorldMatrices,
    colors: COLORS_PLAYER,
    metalKinds: METAL_KINDS,
    // 手入れされた鋼: 金属度を上げて鏡面の色を地の鋼色にする（暗い鋼。誘電体の白い鏡面反射で白飛びしない）
    metal: { metallic: 0.8, roughness: 0.55 },
  });
}

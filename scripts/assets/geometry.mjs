// 小物（剣・盾）用の最小限のプロシージャルジオメトリ生成。
// 出力は { positions, normals, indices }（Float32 / Uint32 配列）。単位はメートル。
// すべて原点基準で、呼び出し側が平行移動・回転して合成する。

/** @typedef {{ positions: number[], normals: number[], indices: number[] }} Geo */

export function emptyGeo() {
  return { positions: [], normals: [], indices: [] };
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function normalize(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** 三角形を 1 枚追加（フラットシェード）。 */
function pushFlatTri(g, a, b, c) {
  const n = normalize(cross(sub(b, a), sub(c, a)));
  const base = g.positions.length / 3;
  for (const p of [a, b, c]) {
    g.positions.push(...p);
    g.normals.push(...n);
  }
  g.indices.push(base, base + 1, base + 2);
}

/** 凸多角形（反時計回りで外向き）をフラットシェードで追加。 */
function pushFlatPoly(g, pts) {
  for (let i = 1; i < pts.length - 1; i++) pushFlatTri(g, pts[0], pts[i], pts[i + 1]);
}

/** 軸平行ボックス。 */
export function box(cx, cy, cz, sx, sy, sz) {
  const g = emptyGeo();
  const [hx, hy, hz] = [sx / 2, sy / 2, sz / 2];
  const v = (x, y, z) => [cx + x * hx, cy + y * hy, cz + z * hz];
  const quad = (a, b, c, d) => pushFlatPoly(g, [a, b, c, d]);
  quad(v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1)); // +x
  quad(v(-1, -1, 1), v(-1, 1, 1), v(-1, 1, -1), v(-1, -1, -1)); // -x
  quad(v(-1, 1, -1), v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1)); // +y
  quad(v(-1, -1, 1), v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1)); // -y
  quad(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1)); // +z
  quad(v(1, -1, -1), v(-1, -1, -1), v(-1, 1, -1), v(1, 1, -1)); // -z
  return g;
}

/**
 * y 軸まわりの回転体。strips は [r, y] の折れ線の配列で、各折れ線は滑らかにシェードされ、
 * 折れ線同士の境界は硬いエッジになる。折れ線は「外側が見える向き」（進行方向の右手側が外）に並べる。
 */
export function lathe(strips, segments = 24) {
  const g = emptyGeo();
  for (const strip of strips) {
    // 各頂点の法線（断面の接線から求める。(dr, dy) の右手側 = (dy, -dr)）
    const profileNormals = strip.map((p, i) => {
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
        const th = (s / segments) * Math.PI * 2;
        const [r, y] = strip[i];
        const [nr, ny] = profileNormals[i];
        g.positions.push(Math.cos(th) * r, y, Math.sin(th) * r);
        g.normals.push(Math.cos(th) * nr, ny, Math.sin(th) * nr);
      }
    }
    const row = segments + 1;
    for (let i = 0; i < strip.length - 1; i++) {
      for (let s = 0; s < segments; s++) {
        const a = base + i * row + s;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        // 向きは法線方向（外向き）が表になる巻き順
        g.indices.push(a, c, b, b, c, d);
      }
    }
  }
  return g;
}

/**
 * y 軸方向のリング列を結ぶロフト。各リングは [x, z] の頂点列（同じ頂点数、上から見て反時計回り）。
 * 最後のリングが 1 点（先端）の場合は [[x, z]] を 1 要素で渡す。フラットシェード。
 */
export function loft(rings) {
  const g = emptyGeo();
  const P = (ring, i, y) => [ring[i % ring.length][0], y, ring[i % ring.length][1]];
  for (let k = 0; k < rings.length - 1; k++) {
    const { ring: r0, y: y0 } = rings[k];
    const { ring: r1, y: y1 } = rings[k + 1];
    const n = Math.max(r0.length, r1.length);
    for (let i = 0; i < n; i++) {
      if (r1.length === 1) {
        pushFlatTri(g, P(r0, i + 1, y0), P(r0, i, y0), P(r1, 0, y1));
      } else {
        pushFlatPoly(g, [P(r0, i + 1, y0), P(r0, i, y0), P(r1, i, y1), P(r1, i + 1, y1)]);
      }
    }
  }
  // 下面のキャップ
  const first = rings[0];
  pushFlatPoly(
    g,
    first.ring.map((_, i) => P(first.ring, i, first.y)),
  );
  return g;
}

/** ジオメトリを変換する（fn: [x,y,z] → [x,y,z]。法線は回転のみとして同じ fn を点 (0,0,0) 基準で適用）。 */
export function transform(g, fn) {
  const o = fn([0, 0, 0]);
  const out = emptyGeo();
  for (let i = 0; i < g.positions.length; i += 3) {
    out.positions.push(...fn([g.positions[i], g.positions[i + 1], g.positions[i + 2]]));
    const n = fn([g.normals[i], g.normals[i + 1], g.normals[i + 2]]);
    out.normals.push(n[0] - o[0], n[1] - o[1], n[2] - o[2]);
  }
  out.indices = [...g.indices];
  return out;
}

/**
 * 巻き順の誤り検出。凸なパーツ向け: 三角形の幾何法線が「バウンディングボックス中心 → 三角形重心」
 * 方向と逆を向いている枚数を返す（0 が正常）。保存された法線とも一致しているか確認する。
 */
export function countInvertedTriangles(g) {
  const n = g.positions.length / 3;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      min[c] = Math.min(min[c], g.positions[i * 3 + c]);
      max[c] = Math.max(max[c], g.positions[i * 3 + c]);
    }
  }
  const center = min.map((v, c) => (v + max[c]) / 2);
  const p = (k) => [g.positions[k * 3], g.positions[k * 3 + 1], g.positions[k * 3 + 2]];
  let bad = 0;
  for (let t = 0; t < g.indices.length; t += 3) {
    const [i, j, k] = [g.indices[t], g.indices[t + 1], g.indices[t + 2]];
    const fn = cross(sub(p(j), p(i)), sub(p(k), p(i)));
    if (Math.hypot(...fn) < 1e-12) continue; // 縮退三角形
    const centroid = [0, 1, 2].map((c) => (p(i)[c] + p(j)[c] + p(k)[c]) / 3 - center[c]);
    const stored = [0, 1, 2].map(
      (c) => g.normals[i * 3 + c] + g.normals[j * 3 + c] + g.normals[k * 3 + c],
    );
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    if (dot(fn, centroid) < 0 || dot(fn, stored) < 0) bad++;
  }
  return bad;
}

/** 複数のジオメトリを 1 つにまとめる。 */
export function merge(...geos) {
  const out = emptyGeo();
  for (const g of geos) {
    const base = out.positions.length / 3;
    out.positions.push(...g.positions);
    out.normals.push(...g.normals);
    for (const i of g.indices) out.indices.push(i + base);
  }
  return out;
}

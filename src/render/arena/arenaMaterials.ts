import { MeshStandardNodeMaterial } from 'three/webgpu';
import type { Node } from 'three/webgpu';
import { torchGlow, type Torch } from './arenaTorches';
import { bakedNoise, getMaterialDetail } from '../bakedNoise';
import { tagMaterial } from '../materialGroups';
import {
  abs,
  atan,
  attribute,
  cross,
  dFdx,
  dFdy,
  dot,
  float,
  floor,
  fract,
  fwidth,
  hash,
  length,
  max,
  min,
  mix,
  normalize,
  normalView,
  normalWorld,
  positionView,
  positionWorld,
  round,
  sign,
  smoothstep,
  step,
  vec2,
  vec3,
} from 'three/tsl';

/**
 * 闘技場の石（床・柱・台座・外周壁）の TSL マテリアル。テクスチャなしで、
 * 石ごとの明暗・色味の差、欠けた縁、風化（粒・孔・染み）、ひび、目地の苔、汚れを手続きで作る。
 *
 *  - 目地・ひびの線は `fwidth`（画面上の 1 ピクセルあたりの変化量）で幅を決める解析的アンチエイリアス。遠景でちらつかない。
 *  - 凹凸（目地の窪み・孔・ひび）は高さ → 法線の摂動（Mikkelsen の勾配法）で出す。テクスチャ・追加パスなし。
 *  - 粒・孔など細かい成分は、1 ピクセルが大きくなる（遠景）ほど消す。
 *  - ノイズは焼いたテクスチャの参照（`bakedNoise`。#236）。high は 1 ピクセルあたり 10〜14 回、
 *    medium/low は粒・孔・縁の細かい欠け・ひびの歪み（3 → 1）を省いて 5〜7 回。
 */

type F = Node<'float'>;
type V3 = Node<'vec3'>;

const PI2 = Math.PI * 2;

/** 石の基準色（リニア）。夜に寄る闘技場でも浮かない中間のグレー。 */
const STONE_BASE = vec3(0.215, 0.205, 0.192);
const JOINT_COLOR = vec3(0.045, 0.041, 0.038);
const MOSS_COLOR = vec3(0.07, 0.092, 0.04);

/** 高さ（m 単位の浮き彫り）から、ビュー空間の法線を摂動する（`BumpMapNode` と同じ式。procedural な高さ用）。 */
function bumpNormal(height: F, strength: number): V3 {
  const sx = dFdx(positionView);
  const sy = dFdy(positionView);
  const n = normalView;
  const r1 = cross(sy, n);
  const r2 = cross(n, sx);
  const det = dot(sx, r1);
  const grad = sign(det).mul(dFdx(height).mul(r1).add(dFdy(height).mul(r2)).mul(strength));
  return normalize(abs(det).mul(n).sub(grad));
}

interface StoneInput {
  /** 目地までの最短距離（m）。 */
  readonly edge: F;
  /** 石ごとのシード。 */
  readonly cell: F;
  /** ワールド座標。 */
  readonly p: V3;
  /** 目地の半幅（m）。 */
  readonly jointW: F;
  /** 汚れ・苔の量 0..1（高さ・場所から計算したもの）。 */
  readonly grime: F;
  /** 暗さの係数（接触 AO など。1 で影響なし）。 */
  readonly occlusion: F;
  /** ひびの量 0..1。 */
  readonly cracks: number;
  /** 石をまたぐ大きなひびの量 0..1。 */
  readonly bigCracks: number;
}

interface StoneOutput {
  readonly color: V3;
  readonly height: F;
  readonly roughness: F;
}

function shadeStone(i: StoneInput): StoneOutput {
  const { edge, cell, p } = i;
  const high = getMaterialDetail() >= 2;
  const aa = fwidth(edge).add(0.0015);
  // 1 ピクセルが大きいほど細部を消す（遠景のちらつき・モアレの抑制）
  const fine: F = float(1).sub(smoothstep(0.012, 0.05, aa));

  // 欠けた縁: 目地の位置を細かいノイズで揺らす
  const edgeN = edge
    .add(bakedNoise(p.mul(9.5)).mul(0.014))
    .add(high ? bakedNoise(p.mul(31)).mul(0.005).mul(fine) : float(0));
  const onStone: F = smoothstep(i.jointW.sub(aa.mul(0.9)), i.jointW.add(aa.mul(0.9)), edgeN);

  // 石ごとの明暗と色味（寒色寄り ↔ 暖色寄り）
  const tone: F = float(0.5).add(hash(cell).mul(0.85));
  const hue = mix(vec3(0.83, 0.92, 1.05), vec3(1.07, 0.97, 0.8), hash(cell.add(17.3)));
  // 石の中の染み（低周波）と粒（高周波）、孔
  const stain: F = bakedNoise(p.mul(0.85).add(cell.mul(1.7)))
    .mul(0.5)
    .add(0.5);
  const grain: F = high ? bakedNoise(p.mul(23)).mul(fine) : float(0);
  const pit: F = high
    ? smoothstep(0.52, 0.74, bakedNoise(p.mul(8.1).add(cell))).mul(fine)
    : float(0);
  // 縁は丸く欠けて暗い（接触面の陰）、縁のすぐ内側はわずかに明るい（角の摩耗）
  const edgeShade: F = mix(float(0.68), float(1), smoothstep(0.0, 0.17, edgeN));
  const edgeWear: F = float(1).add(
    smoothstep(0.02, 0.05, edgeN)
      .mul(float(1).sub(smoothstep(0.05, 0.11, edgeN)))
      .mul(0.14),
  );

  let stone = STONE_BASE.mul(hue)
    .mul(tone)
    .mul(mix(float(0.74), float(1.14), stain))
    .mul(float(1).add(grain.mul(0.15)))
    .mul(float(1).sub(pit.mul(0.3)))
    .mul(edgeShade)
    .mul(edgeWear);

  // ひび: 石ごとに入る/入らない。3D ノイズの零点集合が面上の曲線になる
  const crackSeed: F = hash(cell.add(3.7));
  const hasCrack: F = step(float(1 - i.cracks * 0.55), crackSeed);
  // 細かい揺らぎでひびを折れ線に（なめらかな曲線にしない）
  const q: V3 = p.mul(2.6).add(cell.mul(3.1));
  // medium/low はノイズ 1 回で 3 軸を同じ向きに歪める（折れ線の形が少し単調になる）
  const warp = high
    ? vec3(
        bakedNoise(q.mul(2.9)),
        bakedNoise(q.mul(2.9).add(7.3)),
        bakedNoise(q.mul(2.9).add(13.1)),
      ).mul(0.4)
    : vec3(bakedNoise(q.mul(2.9)).mul(0.4));
  const cn: F = abs(bakedNoise(q.add(warp)));
  const cnAA = fwidth(cn).add(0.002);
  const crackW = 0.016;
  const crackLine: F = float(1)
    .sub(smoothstep(crackW, cnAA.mul(1.6).add(crackW), cn))
    .mul(hasCrack)
    .mul(onStone);
  // 石をまたぐ大きなひび（床だけ。一部の範囲にだけ走る）
  // medium/low は床の大きなひびを省く（ノイズ 2 回）
  const bigOn = high && i.bigCracks > 0;
  const bn: F = bigOn
    ? abs(
        bakedNoise(
          p
            .mul(0.75)
            .add(warp.mul(0.6))
            .add(vec3(5.1, 1.3, 9.7)),
        ),
      )
    : float(1);
  const bnAA = fwidth(bn).add(0.0015);
  const bigMask: F = bigOn
    ? smoothstep(0.12, 0.4, bakedNoise(p.mul(0.13).add(vec3(1.9, 8.1, 3.3))))
    : float(0);
  const bigCrack: F = float(1)
    .sub(smoothstep(0.012, float(0.012).add(bnAA.mul(1.6)), bn))
    .mul(i.bigCracks)
    .mul(bigMask);
  const cracks: F = max(crackLine, bigCrack.mul(onStone));
  stone = stone.mul(float(1).sub(cracks.mul(0.78)));

  // 汚れ・苔・接触 AO
  const mossNoise: F = smoothstep(
    0.0,
    0.5,
    bakedNoise(p.mul(2.4).add(cell)).add(i.grime.mul(0.9)).sub(0.15),
  );
  const moss: F = mossNoise.mul(i.grime);
  stone = mix(stone, stone.mul(vec3(0.62, 0.78, 0.5)), moss.mul(0.7));
  stone = stone.mul(float(1).sub(i.grime.mul(0.38))).mul(i.occlusion);

  const jointColor = mix(JOINT_COLOR, MOSS_COLOR, moss.mul(0.9)).mul(i.occlusion);
  const color = mix(jointColor, stone, onStone) as V3;

  // 高さ（m）: 目地が窪み、孔・ひびが削れ、表面は粒でざらつく
  const height: F = onStone
    .mul(0.014)
    .sub(pit.mul(0.004))
    .sub(cracks.mul(0.006))
    .add(grain.mul(0.0018))
    .add((high ? bakedNoise(p.mul(2.6).add(cell)) : stain.sub(0.5).mul(2)).mul(0.004));
  const roughness: F = mix(float(1), float(0.93).sub(stain.mul(0.1)).add(moss.mul(0.07)), onStone);
  return { color, height, roughness };
}

/** 円形の床（敷石を同心円状に敷く）。 */
export interface ArenaFloorOptions {
  readonly cx: number;
  readonly cz: number;
  /** 床の円の半径（壁の内側まで）。 */
  readonly radius: number;
  /** 柱の位置（根元の接触 AO・汚れ用）。 */
  readonly pillars: readonly { readonly x: number; readonly z: number }[];
  /** 台座の半径。 */
  readonly pedestalRadius: number;
  readonly torches: readonly Torch[];
}

export function createArenaFloorMaterial(o: ArenaFloorOptions): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 0.95, metalness: 0 });
  // 地形との Z ファイティングを避ける（床の円盤は地面よりわずかに浮かせてある）
  material.polygonOffset = true;
  material.polygonOffsetFactor = -2;
  material.polygonOffsetUnits = -2;

  const p = positionWorld;
  const rel = vec2(p.x.sub(o.cx), p.z.sub(o.cz));
  const r: F = length(rel);
  const ringW = 1.18;
  const ringF: F = r.div(ringW);
  const ringI: F = floor(ringF);
  const ringT: F = fract(ringF);
  const dRing: F = min(ringT, float(1).sub(ringT)).mul(ringW);
  const ringMid: F = ringI.add(0.5).mul(ringW);
  // 外側の輪ほど石の数が増え、石の長さがほぼ一定（約 1.6m）になる
  const count: F = max(round(ringMid.mul(PI2 / 1.6)), float(6));
  const turn: F = atan(rel.y, rel.x).div(PI2);
  const u: F = turn.mul(count).add(hash(ringI.mul(3.17)));
  const cellIndex: F = floor(u);
  const uT: F = fract(u);
  const dArc: F = min(uT, float(1).sub(uT)).mul(ringMid.mul(PI2).div(count));
  const edge: F = min(dRing, dArc);
  const cell: F = hash(ringI.mul(53.1).add(cellIndex.mod(count)));

  // 汚れ: 壁際・柱の根元・台座の周りに溜まる + 低周波のむら
  const wall: F = smoothstep(o.radius - 3.2, o.radius, r);
  let near: F = float(0);
  let ao: F = float(1);
  for (const pillar of o.pillars) {
    const d: F = length(vec2(p.x.sub(pillar.x), p.z.sub(pillar.z)));
    near = max(near, float(1).sub(smoothstep(0.9, 2.4, d)));
    ao = ao.mul(
      float(1).sub(
        float(1)
          .sub(smoothstep(0.7, 1.9, d))
          .mul(0.42),
      ),
    );
  }
  const ped: F = float(1).sub(smoothstep(o.pedestalRadius, o.pedestalRadius + 1.4, r));
  const patchy: F = bakedNoise(p.mul(0.33)).mul(0.5).add(0.5);
  const grime: F = max(max(wall.mul(0.85), near.mul(0.7)), ped.mul(0.5)).mul(
    mix(float(0.7), float(1.25), patchy),
  );
  const wallAO: F = float(1).sub(smoothstep(o.radius - 1.4, o.radius + 0.1, r).mul(0.48));

  // 戦いの焦げ跡（大きな暗い斑）と、台座を囲む彫り込みの輪・目盛り
  const scorch: F = smoothstep(0.34, 0.7, bakedNoise(p.mul(0.16).add(vec3(2.2, 0.7, 6.1))));
  const inlayR: F = abs(r.sub(4.4));
  const inlayAA = fwidth(r).mul(1.2).add(0.01);
  const inlay: F = float(1).sub(smoothstep(0.07, float(0.07).add(inlayAA), inlayR));
  const tickBand: F = float(1).sub(smoothstep(0.16, inlayAA.add(0.16), abs(r.sub(3.5))));
  const tick: F = step(float(0.84), fract(turn.mul(36))).mul(tickBand);

  const shade = shadeStone({
    edge,
    cell,
    p,
    jointW: float(0.02).add(hash(cell.add(9.1)).mul(0.012)),
    grime,
    occlusion: ao.mul(wallAO).mul(float(1).sub(scorch.mul(0.4))),
    cracks: 0.5,
    bigCracks: 0.55,
  });
  const color = mix(shade.color, shade.color.mul(0.55), max(inlay, tick)) as V3;
  material.colorNode = color;
  material.roughnessNode = shade.roughness;
  material.normalNode = bumpNormal(shade.height, 1);
  material.emissiveNode = color.mul(torchGlow(p, vec3(0, 1, 0), o.torches, 2.1));
  return tagMaterial(material, 'arena');
}

/** 石積み（壁・柱・台座）の設定。 */
export interface ArenaMasonryOptions {
  /** 石の 1 段の高さ（m）。 */
  readonly courseHeight: number;
  /** 石 1 個の幅（m）。`Infinity` に近い大きな値で縦目地なし（柱の円盤）。 */
  readonly blockWidth: number;
  /** 床の高さ（ワールド y）。汚れ・苔が床に近いほど濃くなる。 */
  readonly floorY: number;
  /** ひびの量 0..1。 */
  readonly cracks: number;
  /** 汚れの強さ。 */
  readonly grime: number;
  readonly torches: readonly Torch[];
}

/** 石積みの壁・柱・台座。頂点属性 `wallS` / `wallV`（`arenaGeometry.ts`）が石の段と目地を決める。 */
export function createArenaMasonryMaterial(o: ArenaMasonryOptions): MeshStandardNodeMaterial {
  const material = new MeshStandardNodeMaterial({ roughness: 0.95, metalness: 0 });
  const p = positionWorld;
  const s: F = attribute('wallS', 'float');
  const v: F = attribute('wallV', 'float');

  const rowF: F = v.div(o.courseHeight);
  const row: F = floor(rowF);
  const rowT: F = fract(rowF);
  const dV: F = min(rowT, float(1).sub(rowT)).mul(o.courseHeight);
  // 段ごとに石の幅とずらしを変える（芋目地を避ける）
  const width: F = float(o.blockWidth).mul(hash(row.add(5.3)).mul(0.5).add(0.78));
  const su: F = s.add(hash(row.mul(1.9).add(13.1)).mul(width)).div(width);
  const col: F = floor(su);
  const suT: F = fract(su);
  const dU: F = min(suT, float(1).sub(suT)).mul(width);
  const edge: F = min(dV, dU);
  const cell: F = hash(row.mul(91.7).add(col));

  // 汚れ: 床に近いほど濃く、天端も雨だれで少し濃い
  const h: F = p.y.sub(o.floorY);
  const low: F = float(1).sub(smoothstep(0.1, 1.5, h));
  const drip: F = bakedNoise(vec3(s.mul(2.1), v.mul(0.25), 3.3))
    .mul(0.5)
    .add(0.5);
  const grime: F = max(low.mul(0.95), drip.mul(0.38)).mul(o.grime);
  const occlusion: F = mix(float(0.62), float(1), smoothstep(0.0, 0.7, h));

  const shade = shadeStone({
    edge,
    cell,
    p,
    jointW: float(0.022).add(hash(cell.add(9.1)).mul(0.012)),
    grime,
    occlusion,
    cracks: o.cracks,
    bigCracks: 0,
  });
  material.colorNode = shade.color;
  material.roughnessNode = shade.roughness;
  material.normalNode = bumpNormal(shade.height, 1);
  material.emissiveNode = shade.color.mul(torchGlow(p, normalWorld, o.torches, 2.1));
  return tagMaterial(material, 'arena');
}

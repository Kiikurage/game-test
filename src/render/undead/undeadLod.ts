import {
  Color,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
  type Texture,
} from 'three/webgpu';
import type { PartColorizer } from '../assets/characterLod';
import type { TextureSampler } from '../assets/textureSampler';
import { roleOf, type UndeadRole } from './undeadMaterial';
import type { UndeadVariant } from './variants';

/** 亡者マテリアルへ置き換える前の、元マテリアルの色情報（簡略メッシュの頂点色を焼くのに使う）。 */
export interface UndeadPartSource {
  readonly role: UndeadRole;
  readonly color: readonly [number, number, number];
  readonly map: Texture | null;
}

/** `applyUndeadLook` の前に呼ぶ。元マテリアルを覚える（適用後は元のテクスチャ・色が見えなくなる）。 */
export function captureUndeadSources(root: Object3D): Map<Mesh, UndeadPartSource> {
  const sources = new Map<Mesh, UndeadPartSource>();
  root.traverse((obj) => {
    if ((obj as { isMesh?: boolean }).isMesh !== true) return;
    const mesh = obj as Mesh;
    const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
      (Material & Partial<MeshStandardMaterial>) | undefined;
    if (!material) return;
    const c = material.color;
    sources.set(mesh, {
      role: roleOf(mesh),
      color: c ? [c.r, c.g, c.b] : [1, 1, 1],
      map: material.map ?? null,
    });
  });
  return sources;
}

/** 簡略メッシュの色の底上げ（近景のリム・暗部リフトの代わり）。 */
const LIFT = 1.4;

const luminance = (r: number, g: number, b: number): number => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * 亡者マテリアル（`undeadMaterial.ts`）の色演算を、頂点ごとに CPU で近似する。
 * 斑・ひび・リムライトは省き、役割（肌・布・金属）ごとの平均的な色にする。遠目ではこれで十分。
 */
export function createUndeadColorizer(
  sources: ReadonlyMap<Mesh, UndeadPartSource>,
  variant: UndeadVariant,
  sample: TextureSampler,
): PartColorizer {
  const skin = new Color(variant.skin);
  const bruise = new Color(variant.bruise);
  const cloth = new Color(variant.cloth);
  const rust = new Color(variant.rust);
  const tex: [number, number, number] = [1, 1, 1];
  return (mesh, part, colors, offset, heights) => {
    const src = sources.get(mesh);
    for (let i = 0; i < part.count; i++) {
      let r = 1;
      let g = 1;
      let b = 1;
      if (src) {
        if (src.map) {
          sample(src.map, part.uvs[i * 2] ?? 0, part.uvs[i * 2 + 1] ?? 0, tex);
        } else {
          tex[0] = tex[1] = tex[2] = 1;
        }
        r = tex[0] * src.color[0];
        g = tex[1] * src.color[1];
        b = tex[2] * src.color[2];
      }
      const lum = luminance(r, g, b);
      let or: number;
      let og: number;
      let ob: number;
      const role = src?.role ?? 'cloth';
      if (role === 'skin') {
        const k = (lum * 1.6 + 0.45) * 3.4;
        const kb = (lum + 0.4) * 3.4;
        or = skin.r * k * 0.75 + bruise.r * kb * 0.25;
        og = skin.g * k * 0.75 + bruise.g * kb * 0.25;
        ob = skin.b * k * 0.75 + bruise.b * kb * 0.25;
      } else if (role === 'cloth') {
        const y = heights[offset + i] ?? 0;
        const dirt = smooth(0, 1.1, y) * 0.45 + 0.55;
        const k = 7 * dirt * 0.8;
        or = (lum + (r - lum) * 0.35) * cloth.r * k;
        og = (lum + (g - lum) * 0.35) * cloth.g * k;
        ob = (lum + (b - lum) * 0.35) * cloth.b * k;
      } else {
        if (part.colors.length > 0) {
          // 装備メッシュの焼き込み頂点カラー（undeadMaterial と同じ: 錆色へ 8% 寄せて 1.25 倍）
          or = ((part.colors[i * 3] ?? 0) * 0.92 + rust.r * 0.35 * 0.08) * 1.25;
          og = ((part.colors[i * 3 + 1] ?? 0) * 0.92 + rust.g * 0.35 * 0.08) * 1.25;
          ob = ((part.colors[i * 3 + 2] ?? 0) * 0.92 + rust.b * 0.35 * 0.08) * 1.25;
        } else {
          const iron = lum * 0.8 + 0.5;
          const rusty = lum * 0.9 + 0.35;
          or = 0.17 * iron * 0.6 + rust.r * rusty * 0.4;
          og = 0.16 * iron * 0.6 + rust.g * rusty * 0.4;
          ob = 0.15 * iron * 0.6 + rust.b * rusty * 0.4;
        }
      }
      const o = (offset + i) * 3;
      // 近景はリムライト・暗部の持ち上げ（characterLight）で明るく見えるので、その分を底上げする
      colors[o] = or * LIFT;
      colors[o + 1] = og * LIFT;
      colors[o + 2] = ob * LIFT;
    }
  };
}

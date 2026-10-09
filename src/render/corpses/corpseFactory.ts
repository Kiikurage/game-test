import {
  Box3,
  Color,
  Euler,
  Group,
  Matrix4,
  Mesh,
  Vector3,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from 'three/webgpu';
import type { CorpsePlacement, CorpsePose, CorpseVariant } from '../../core/corpses';
import type { CharacterAssets } from '../assets/characterAssets';
import type { EquipmentAssets } from '../assets/equipment';
import {
  bakeSkinnedMesh,
  freezeStatic,
  collectSkinnedMeshes,
  mergeBakedParts,
  type BakedPart,
} from './bake';
import { CORPSE_POSE_DEFS, type CorpsePoseDef } from './corpsePoses';
import { CORPSE_VARIANT_DEFS, hiddenMeshes, type CorpseVariantDef } from './corpseVariants';
import { applyBoneTurns } from './poseMath';
import { loadIndexSimplifier, simplifyGeometry, type IndexSimplifier } from './simplify';

const DEG = Math.PI / 180;

/** 肌のマテリアル名（顔・体）。それ以外（衣装）は cloth の色を掛ける。 */
const SKIN_MATERIALS = new Set(['MI_Regular_Male', 'MI_Head']);

/** 焼き込み済みの遺体 1 種（ポーズ × バリアント）。ジオメトリ・マテリアルは同じ種の全インスタンスで共有する。 */
export interface CorpseTemplate {
  readonly pose: CorpsePose;
  readonly variant: CorpseVariant;
  readonly group: Group;
  /** 三角形数（装備を含む）。 */
  readonly triangles: number;
  /** 描画に使うメッシュ数（= ドローコール数の目安）。 */
  readonly meshCount: number;
  /** 原点基準の境界（焼き込み後）。 */
  readonly bounds: Box3;
}

/**
 * 遺体（静止ポーズ）の生成。UBC の騎士を一度だけポーズさせて頂点に焼き込み、`SkinnedMesh` ではない静的な `Mesh`
 * にする。スケルトン・ミキサーは残らず、配置後の更新コスト（スキニング・行列）はゼロ。
 * ポーズ × バリアントごとに 1 回だけ焼き（遅延）、同じ種の遺体はジオメトリとマテリアルを共有する。
 */
export class CorpseFactory {
  private readonly templates = new Map<string, CorpseTemplate>();
  private readonly materials = new Map<string, Material>();

  /**
   * @param simplifier 指定すると焼き込み後のジオメトリの三角形数を `simplifyRatio` に減らす（遺体は小さく暗く遠目に見えるので、
   *   十数体並べてもモバイルの負荷が増えないようにする）。
   */
  constructor(
    private readonly characters: CharacterAssets,
    private readonly equipment?: EquipmentAssets,
    private readonly simplifier?: IndexSimplifier,
    private readonly simplifyRatio = 0.5,
  ) {}

  /** メッシュ簡略化つきで作る（meshoptimizer を動的に読み込む）。 */
  static async create(
    characters: CharacterAssets,
    equipment?: EquipmentAssets,
    simplifyRatio = 0.5,
  ): Promise<CorpseFactory> {
    return new CorpseFactory(characters, equipment, await loadIndexSimplifier(), simplifyRatio);
  }

  /** 焼き込み済みテンプレート（無ければ焼く）。 */
  template(pose: CorpsePose, variant: CorpseVariant): CorpseTemplate {
    const key = `${pose}:${variant}`;
    let t = this.templates.get(key);
    if (!t) {
      t = this.bake(pose, variant);
      this.templates.set(key, t);
    }
    return t;
  }

  /**
   * 配置データから遺体を作る。`matrixAutoUpdate` を止めた静的なグループで、シーンへ追加するだけで使える。
   * 返り値のジオメトリ・マテリアルは共有なので `dispose` しないこと。
   */
  create(placement: CorpsePlacement): Group {
    const group = this.template(placement.pose, placement.variant).group.clone(true);
    group.name = `corpse:${placement.pose}:${placement.variant}`;
    group.matrixAutoUpdate = true; // 位置を設定してから freeze で止める
    group.position.set(...placement.position);
    group.rotation.y = placement.yaw;
    freezeStatic(group);
    return group;
  }

  private bake(pose: CorpsePose, variant: CorpseVariant): CorpseTemplate {
    const poseDef: CorpsePoseDef = CORPSE_POSE_DEFS[pose];
    const variantDef: CorpseVariantDef = CORPSE_VARIANT_DEFS[variant];
    const character = this.characters.createCharacter('knight', { sword: false, shield: false });
    const root = character.root;
    applyBoneTurns(root, poseDef.turns);
    if (poseDef.lay) {
      const [x, y, z] = poseDef.lay;
      root.quaternion.setFromEuler(new Euler(x * DEG, y * DEG, z * DEG, 'XYZ'));
    }
    const gearObjects: Object3D[] = [];
    for (const id of variantDef.gear) {
      if (this.equipment) {
        this.equipment.equip(character, id);
        const holder = root.getObjectByName(`equip:${id}`);
        if (holder) gearObjects.push(holder);
      }
    }
    root.updateMatrixWorld(true);

    const { width, height } = variantDef.build;
    const scale = new Matrix4().makeScale(width, height, width);
    const hidden = new Set(hiddenMeshes(variantDef));
    const skinned = collectSkinnedMeshes(root).filter((m) => !hidden.has(m.name));
    const parts = skinned.map((m) => bakeSkinnedMesh(m, scale));

    // 基準（原点）の決定
    const bounds = new Box3();
    for (const p of parts) expand(bounds, p);
    const pelvis = new Vector3();
    root.getObjectByName('pelvis')?.getWorldPosition(pelvis);
    pelvis.applyMatrix4(scale);
    const shift = anchorShift(poseDef, parts, bounds, pelvis);
    const move = new Matrix4().makeTranslation(shift.x, shift.y, shift.z);
    for (const p of parts) {
      for (let i = 0; i < p.positions.length; i += 3) {
        p.positions[i] = (p.positions[i] ?? 0) + shift.x;
        p.positions[i + 1] = (p.positions[i + 1] ?? 0) + shift.y;
        p.positions[i + 2] = (p.positions[i + 2] ?? 0) + shift.z;
      }
    }

    const group = new Group();
    let triangles = 0;
    let meshCount = 0;
    // 同じマテリアルのパーツを 1 メッシュにまとめる（ドローコール削減）
    const byMaterial = new Map<Material, BakedPart[]>();
    skinned.forEach((m, i) => {
      const part = parts[i];
      if (!part) return;
      const material = this.material(m, variantDef);
      byMaterial.set(material, [...(byMaterial.get(material) ?? []), part]);
    });
    for (const [material, list] of byMaterial) {
      const merged = mergeBakedParts(list);
      const geometry = this.simplifier
        ? simplifyGeometry(merged, this.simplifier, { ratio: this.simplifyRatio })
        : merged;
      if (geometry !== merged) merged.dispose();
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      triangles += (geometry.getIndex()?.count ?? 0) / 3;
      meshCount++;
    }
    // 簡易装備: ボーンのワールド行列を固定した静的メッシュにする
    for (const holder of gearObjects) {
      const item = holder.children[0];
      if (!item) continue;
      const wrapper = new Group();
      wrapper.name = holder.name;
      wrapper.matrixAutoUpdate = false;
      wrapper.matrix.multiplyMatrices(move, scale).multiply(holder.matrixWorld);
      wrapper.add(item.clone());
      wrapper.traverse((obj) => {
        if (!(obj as { isMesh?: boolean }).isMesh) return;
        const mesh = obj as Mesh;
        triangles +=
          (mesh.geometry.index?.count ?? mesh.geometry.attributes['position']?.count ?? 0) / 3;
        meshCount++;
      });
      group.add(wrapper);
    }
    const finalBounds = new Box3().setFromObject(group);
    freezeStatic(group);
    // 元のキャラクター（スケルトン）はここで捨てる。ジオメトリは共有元（glb）のものなので dispose しない。
    character.dispose();
    return { pose, variant, group, triangles, meshCount, bounds: finalBounds };
  }

  /** バリアントごとに色を掛けたマテリアル（バリアント × 元マテリアルで 1 つを共有）。 */
  private material(mesh: SkinnedMesh, variant: CorpseVariantDef): Material {
    const source = mesh.material as Material;
    const key = `${variant.id}:${source.name}`;
    let m = this.materials.get(key);
    if (!m) {
      m = source.clone();
      const tint = new Color(SKIN_MATERIALS.has(source.name) ? variant.skin : variant.cloth);
      const colored = m as Material & { color?: Color };
      colored.color?.multiply(tint);
      this.materials.set(key, m);
    }
    return m;
  }
}

function expand(box: Box3, part: BakedPart): void {
  const v = new Vector3();
  for (let i = 0; i < part.positions.length; i += 3) {
    box.expandByPoint(
      v.set(part.positions[i] ?? 0, part.positions[i + 1] ?? 0, part.positions[i + 2] ?? 0),
    );
  }
}

/** メッシュ名（`Head_Skin` / `Male_Ranger_Body`）に対応するパーツの境界を求める。 */
function boundsOf(parts: readonly BakedPart[], name: string, fallback: Box3): Box3 {
  const box = new Box3();
  for (const p of parts) if (p.name === name) expand(box, p);
  return box.isEmpty() ? fallback : box;
}

function anchorShift(
  def: CorpsePoseDef,
  parts: readonly BakedPart[],
  bounds: Box3,
  pelvis: Vector3,
): Vector3 {
  const { x, y, z } = def.anchor;
  const center = bounds.getCenter(new Vector3());
  const sx = x === 'pelvis' ? -pelvis.x : -center.x;
  const sy = y === 'min' ? -bounds.min.y : -(pelvis.y - y.seat);
  let sz: number;
  switch (z) {
    case 'pelvis':
      sz = -pelvis.z;
      break;
    case 'bbox':
      sz = -center.z;
      break;
    case 'back':
      sz = -boundsOf(parts, 'Male_Ranger_Body', bounds).min.z;
      break;
    case 'head':
      sz = -boundsOf(parts, 'Head_Skin', bounds).max.z;
      break;
  }
  return new Vector3(sx, sy, sz);
}

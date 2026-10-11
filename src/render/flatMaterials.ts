import { MeshStandardNodeMaterial, type Material, type Mesh, type Object3D } from 'three/webgpu';
import { materialGroupOf, type MaterialGroup } from './materialGroups';

// `?flatmat`（perf.view.ts）と `?bench` の切り分け（bench/bench.view.ts）で共有する。

const FLAT_COLOR = 0x8a8478;

/** 重い TSL マテリアルを単色の MeshStandard に差し替える（見た目は壊れる。負荷の切り分け専用）。 */
export class FlatMaterials {
  private readonly cache = new Map<Material, Material>();
  /** 差し替えたメッシュと元のマテリアル（`restore` 用。`?bench` の実行時切替）。 */
  private readonly originals = new Map<Mesh, Material>();

  /** groups が null なら全グループ。 */
  constructor(private readonly groups: ReadonlySet<MaterialGroup> | null) {}

  apply(root: Object3D): void {
    root.traverse((obj) => {
      if (!(obj as { isMesh?: boolean }).isMesh) return;
      const mesh = obj as Mesh;
      if (mesh.userData.flatMat !== undefined) return;
      const original = mesh.material;
      if (Array.isArray(original)) return;
      mesh.userData.flatMat = true;
      // 透明・加算のもの（炎・霧・光だまり・パーティクル）は対象外（それは ?noparticles 側）
      if (original.transparent) return;
      if (this.groups && !this.groups.has(materialGroupOf(original))) return;
      let flat = this.cache.get(original);
      if (!flat) {
        const color = (original as { color?: { getHex(): number } }).color;
        const vertexColors = 'color' in mesh.geometry.attributes;
        flat = new MeshStandardNodeMaterial({
          color: vertexColors ? 0xffffff : (color?.getHex() ?? FLAT_COLOR),
          roughness: 0.9,
          metalness: 0,
          vertexColors,
        });
        this.cache.set(original, flat);
      }
      this.originals.set(mesh, original);
      mesh.material = flat;
    });
  }

  /** 差し替えを元に戻す。 */
  restore(root: Object3D): void {
    root.traverse((obj) => {
      delete obj.userData.flatMat;
    });
    for (const [mesh, original] of this.originals) mesh.material = original;
    this.originals.clear();
  }
}

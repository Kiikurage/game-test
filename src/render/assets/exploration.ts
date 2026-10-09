import {
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type Mesh,
  type Object3D,
} from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { PlantedSwordPlacement } from '../../core/plantedSwords';
import type { Character } from './character';

/**
 * 探索・脇道要素の簡易メッシュ（自作、`public/assets/exploration.glb`。生成は scripts/assets/exploration.mjs）。
 * ノード名 = ID。取り付けのあるもの（大剣・壺）は extras にボーンと姿勢（`sockets` に複数の取り付け先）を持つ。
 */
export const EXPLORATION_IDS = [
  'GravekeeperGreatsword',
  'OilJar',
  'Bell',
  'PrayingStatue',
  'Cairn',
  'PlantedSword',
] as const;

export type ExplorationId = (typeof EXPLORATION_IDS)[number];

/** 大剣の表示位置。持ち替えで `hand` ↔ `back` を切り替える（`none` は非表示）。 */
export type GreatswordMount = 'hand' | 'back' | 'none';

/** ノードの extras に入っている取り付け情報。 */
export interface ExplorationSocket {
  readonly bone: string;
  readonly position: readonly [number, number, number];
  readonly quaternion: readonly [number, number, number, number];
}

interface ExplorationExtras extends Partial<ExplorationSocket> {
  readonly sockets?: Readonly<Record<string, ExplorationSocket>>;
}

function isSocket(value: unknown): value is ExplorationSocket {
  const v = value as Partial<ExplorationSocket> | undefined;
  return typeof v?.bone === 'string' && Array.isArray(v.position) && Array.isArray(v.quaternion);
}

const GREATSWORD_ID = 'GravekeeperGreatsword';
const JAR_ID = 'OilJar';
const greatswordSlot = (mount: 'hand' | 'back'): string => `equip:${GREATSWORD_ID}:${mount}`;

/** 石積みなど、位置・向き・大きさだけで並べるものの配置。 */
export interface PropPlacement {
  readonly position: readonly [number, number, number];
  readonly yaw?: number;
  readonly scale?: number;
}

export class ExplorationAssets {
  private constructor(
    private readonly items: ReadonlyMap<
      ExplorationId,
      { readonly object: Object3D; readonly extras: ExplorationExtras }
    >,
  ) {}

  /** exploration.glb を読み込む。baseUrl は public/assets/ の URL（既定は Vite の BASE_URL 配下）。 */
  static async load(baseUrl = `${import.meta.env.BASE_URL}assets/`): Promise<ExplorationAssets> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(`${baseUrl}exploration.glb`);
    const items = new Map<
      ExplorationId,
      { readonly object: Object3D; readonly extras: ExplorationExtras }
    >();
    for (const id of EXPLORATION_IDS) {
      const object = gltf.scene.getObjectByName(id);
      if (!object) throw new Error(`exploration.glb is missing item: ${id}`);
      items.set(id, { object, extras: object.userData as ExplorationExtras });
    }
    return new ExplorationAssets(items);
  }

  private item(id: ExplorationId): {
    readonly object: Object3D;
    readonly extras: ExplorationExtras;
  } {
    const item = this.items.get(id);
    if (!item) throw new Error(`unknown exploration item: ${id}`);
    return item;
  }

  /** アイテムの取り付け情報。複数ある物（大剣）は name（`hand` / `back`）で選ぶ。 */
  getSocket(id: ExplorationId, name?: string): ExplorationSocket {
    const { extras } = this.item(id);
    const socket = name === undefined ? extras : extras.sockets?.[name];
    if (!isSocket(socket)) throw new Error(`exploration item has no socket: ${id} ${name ?? ''}`);
    return socket;
  }

  /**
   * 静的に置くためのクローン（ジオメトリ・マテリアルは共有）。鐘・像・壺など。
   * glb のノードは頂点量子化のための平行移動・スケールを持つので、`Group` で包んで返す（位置・回転は Group に設定する）。
   */
  create(id: ExplorationId): Group {
    const object = this.item(id).object.clone();
    object.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    const group = new Group();
    group.name = id;
    group.add(object);
    return group;
  }

  private attachSocket(
    character: Character,
    slot: string,
    id: ExplorationId,
    socket: ExplorationSocket,
  ): Object3D {
    const object = this.create(id);
    character.attachAt(slot, socket.bone, object, socket.position, socket.quaternion);
    return object;
  }

  /**
   * 墓守の大剣の表示位置を切り替える（持ち替えで手 / 背中が入れ替わる）。
   * 返り値は表示した大剣（`none` のとき undefined）。
   */
  setGreatswordMount(character: Character, mount: GreatswordMount): Object3D | undefined {
    for (const m of ['hand', 'back'] as const) {
      character.detachAt(greatswordSlot(m), this.getSocket(GREATSWORD_ID, m).bone);
    }
    if (mount === 'none') return undefined;
    return this.attachSocket(
      character,
      greatswordSlot(mount),
      GREATSWORD_ID,
      this.getSocket(GREATSWORD_ID, mount),
    );
  }

  /** 獣脂の壺を手に持つ（投擲前）。 */
  holdOilJar(character: Character): Object3D {
    return this.attachSocket(character, `equip:${JAR_ID}`, JAR_ID, this.getSocket(JAR_ID));
  }

  /**
   * 獣脂の壺を手のボーンから放す（投擲）。ワールド姿勢を保ったまま `parent`（通常はシーン）へ付け替えて返す。
   * 持っていなければ undefined。以後の弾道は呼び出し側が動かす。
   */
  releaseOilJar(character: Character, parent: Object3D): Object3D | undefined {
    const bone = character.root.getObjectByName(this.getSocket(JAR_ID).bone);
    const holder = bone?.getObjectByName(`equip:${JAR_ID}`);
    const jar = holder?.children[0];
    if (!holder || !jar) return undefined;
    parent.attach(jar); // ワールド変換を保ったまま付け替える
    holder.removeFromParent();
    return jar;
  }

  /**
   * 同じアイテムを `matrices` の数だけ InstancedMesh で並べる。プリミティブ（金属 / 柔素材）ごとに 1 ドローコール。
   * 返り値の Group を置く側がシーンへ追加する。
   */
  createInstances(id: ExplorationId, matrices: readonly Matrix4[]): Group {
    const root = this.item(id).object.clone();
    // glb の小物ノードは頂点量子化のためノード自身に平行移動・スケールを持つ。メッシュのワールド行列（アイテム空間）を各インスタンスに掛ける。
    root.updateMatrixWorld(true);
    const group = new Group();
    group.name = `instances:${id}`;
    const m = new Matrix4();
    root.traverse((obj) => {
      if (!(obj as { isMesh?: boolean }).isMesh) return;
      const mesh = obj as Mesh;
      const instanced = new InstancedMesh(mesh.geometry, mesh.material, matrices.length);
      matrices.forEach((placement, i) => {
        instanced.setMatrixAt(i, m.multiplyMatrices(placement, mesh.matrixWorld));
      });
      instanced.instanceMatrix.needsUpdate = true;
      instanced.castShadow = true;
      instanced.receiveShadow = true;
      group.add(instanced);
    });
    return group;
  }

  /** 石積み（3 段のケルン）を並べる。 */
  createCairns(placements: readonly PropPlacement[]): Group {
    return this.createInstances(
      'Cairn',
      placements.map((p) => propMatrix(p)),
    );
  }

  /** 突き立つ剣を並べる（霧の門前の 12 本は `gateSwordPlacements` の結果を渡す）。 */
  createPlantedSwords(placements: readonly PlantedSwordPlacement[]): Group {
    return this.createInstances(
      'PlantedSword',
      placements.map((p) => plantedSwordMatrix(p)),
    );
  }
}

const EULER = new Euler();
const QUAT = new Quaternion();
const ONE = new Vector3(1, 1, 1);

/** 位置・Y 回転・拡大から行列を作る。 */
export function propMatrix(placement: PropPlacement, target = new Matrix4()): Matrix4 {
  QUAT.setFromEuler(EULER.set(0, placement.yaw ?? 0, 0));
  const s = placement.scale ?? 1;
  return target.compose(new Vector3(...placement.position), QUAT, new Vector3(s, s, s));
}

/** 突き立つ剣 1 本の行列。メッシュは刃が +Y なので、正立（柄が上、切先が刺さる）は Z 軸まわりに 180° 回す。逆さはそのまま（刃が上）。 */
export function plantedSwordMatrix(
  placement: PlantedSwordPlacement,
  target = new Matrix4(),
): Matrix4 {
  EULER.set(
    placement.tiltX,
    placement.yaw,
    placement.tiltZ + (placement.inverted ? 0 : Math.PI),
    'YXZ',
  );
  QUAT.setFromEuler(EULER);
  return target.compose(new Vector3(...placement.position), QUAT, ONE);
}

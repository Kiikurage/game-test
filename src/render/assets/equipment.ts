import type { Mesh, Object3D } from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { Character } from './character';

/**
 * 亡者・ボス用の簡易装備メッシュ（自作、`public/assets/equipment.glb`。生成は scripts/assets/equipment.mjs）。
 * 各アイテムは glb のノード名 = ID で、取り付けボーンと姿勢（position / quaternion）がノードの extras にある。
 */
export const EQUIPMENT_IDS = [
  'Sword_Rusty',
  'Axe_Rusty',
  'GreatAxe',
  'GreatShield',
  'Cuirass',
  'CuirassHeavy',
  'Pauldron_L',
  'Pauldron_R',
  'PauldronLarge_L',
  'PauldronLarge_R',
  'Vambrace_L',
  'Vambrace_R',
  'Greave_L',
  'Greave_R',
  'Tassets',
  'Helm_Pot',
  'Helm_Great',
  'Cape',
] as const;

export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

/** 敵ごとの装備一覧（仕様書 5.2 / 5.3 / 6.1 節）。scripts/assets/equipment.mjs の LOADOUTS と一致させる（テストで検証）。 */
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
} as const satisfies Record<string, readonly EquipmentId[]>;

export type LoadoutName = keyof typeof LOADOUTS;

export function parseLoadoutName(value: string | null | undefined): LoadoutName | undefined {
  return (Object.keys(LOADOUTS) as LoadoutName[]).find((name) => name === value);
}

/** ノードの extras に入っている取り付け情報。 */
export interface EquipmentSocket {
  readonly bone: string;
  readonly position: readonly [number, number, number];
  readonly quaternion: readonly [number, number, number, number];
}

function isSocket(value: unknown): value is EquipmentSocket {
  const v = value as Partial<EquipmentSocket> | undefined;
  return typeof v?.bone === 'string' && Array.isArray(v.position) && Array.isArray(v.quaternion);
}

export class EquipmentAssets {
  private constructor(
    private readonly items: ReadonlyMap<EquipmentId, { object: Object3D; socket: EquipmentSocket }>,
  ) {}

  /** equipment.glb を読み込む。baseUrl は public/assets/ の URL（既定は Vite の BASE_URL 配下）。 */
  static async load(baseUrl = `${import.meta.env.BASE_URL}assets/`): Promise<EquipmentAssets> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(`${baseUrl}equipment.glb`);
    const items = new Map<EquipmentId, { object: Object3D; socket: EquipmentSocket }>();
    for (const id of EQUIPMENT_IDS) {
      const object = gltf.scene.getObjectByName(id);
      if (!object) throw new Error(`equipment.glb is missing item: ${id}`);
      const socket: unknown = object.userData;
      if (!isSocket(socket)) throw new Error(`equipment item has no socket extras: ${id}`);
      items.set(id, { object, socket });
    }
    return new EquipmentAssets(items);
  }

  /** アイテムの取り付け情報。 */
  getSocket(id: EquipmentId): EquipmentSocket {
    const item = this.items.get(id);
    if (!item) throw new Error(`unknown equipment: ${id}`);
    return item.socket;
  }

  /** キャラクターのボーンへアイテムを 1 つ取り付ける（ジオメトリ・マテリアルは共有）。 */
  equip(character: Character, id: EquipmentId): Object3D {
    const item = this.items.get(id);
    if (!item) throw new Error(`unknown equipment: ${id}`);
    // 兜を被せるときは衣装のフードを隠す（兜から突き出さないように）
    if (id.startsWith('Helm_')) {
      const hood = character.root.getObjectByName('Male_Ranger_Head_Hood');
      if (hood) hood.visible = false;
    }
    const object = item.object.clone();
    object.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        const mesh = obj as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    character.attachAt(
      `equip:${id}`,
      item.socket.bone,
      object,
      item.socket.position,
      item.socket.quaternion,
    );
    return object;
  }

  /** 敵種別ごとの装備一式を取り付ける。 */
  equipLoadout(character: Character, loadout: LoadoutName): Object3D[] {
    return LOADOUTS[loadout].map((id) => this.equip(character, id));
  }

  /** アイテムを外す。 */
  unequip(character: Character, id: EquipmentId): void {
    character.detachAt(`equip:${id}`, this.getSocket(id).bone);
    if (id.startsWith('Helm_')) {
      const hood = character.root.getObjectByName('Male_Ranger_Head_Hood');
      if (hood) hood.visible = true;
    }
  }
}

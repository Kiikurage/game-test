import {
  Color,
  Group,
  Matrix4,
  Vector3,
  type Material,
  type Mesh,
  type Object3D,
} from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { Character } from '../assets/character';
import { CapeSpring, type CapeMotion } from './capeSpring';

/**
 * プレイヤー（旅の騎士）の装備（自作、`public/assets/player.glb`。生成は scripts/assets/player.mjs）。
 * 兜・胸甲・陣羽織・肩当て・籠手・脛当て・外套（3 段）。各アイテムは glb のノード名 = ID で、取り付けボーンと姿勢が extras にある。
 * マテリアルは標準のまま（補助光は characterLight 側）。
 */
export const PLAYER_ARMOR_IDS = [
  'Knight_Helm',
  'Knight_Cuirass',
  'Knight_Tabard',
  'Knight_Pauldron_L',
  'Knight_Pauldron_R',
  'Knight_Vambrace_L',
  'Knight_Vambrace_R',
  'Knight_Greave_L',
  'Knight_Greave_R',
] as const;

/** 外套の段（上から）。 */
export const PLAYER_CAPE_IDS = ['Knight_Cape_1', 'Knight_Cape_2', 'Knight_Cape_3'] as const;

export type PlayerArmorId = (typeof PLAYER_ARMOR_IDS)[number];
export type PlayerCapeId = (typeof PLAYER_CAPE_IDS)[number];
export type PlayerItemId = PlayerArmorId | PlayerCapeId;

export interface PlayerSocket {
  readonly bone: string;
  readonly position: readonly [number, number, number];
  readonly quaternion: readonly [number, number, number, number];
}

interface ItemExtras extends Partial<PlayerSocket> {
  readonly segment?: number;
  /** 外套の段の蝶番（アイテム空間）。 */
  readonly pivot?: readonly [number, number, number];
}

function isSocket(value: unknown): value is PlayerSocket {
  const v = value as Partial<PlayerSocket> | undefined;
  return typeof v?.bone === 'string' && Array.isArray(v.position) && Array.isArray(v.quaternion);
}

/** 騎士の衣装（UBC のレンジャー衣装）のうち、プレイヤーの装備と重なるので隠すメッシュ。 */
const HIDDEN_OUTFIT = ['Male_Ranger_Head_Hood', 'Male_Ranger_Acc_Pauldron'] as const;
/** 衣装の布・革のマテリアル名（色を暗く寄せる対象。肌は触らない）。 */
const OUTFIT_MATERIAL = 'MI_Ranger';

/** 外套の揺れの駆動（段ごとの蝶番を毎フレーム回す）。 */
export class CapeRig {
  readonly spring = new CapeSpring({ segments: PLAYER_CAPE_IDS.length });

  private readonly up = new Vector3();
  private readonly rootInverse = new Matrix4();

  /**
   * @param pivots 段ごとの蝶番（上から）
   * @param reference 外套のルート（アイテム空間 = 直立した T ポーズの向き）。上体の傾きを求めるのに使う
   * @param root キャラクターのルート（傾きはこの座標系で測る）
   */
  constructor(
    private readonly pivots: readonly Object3D[],
    private readonly reference?: Object3D,
    private readonly root?: Object3D,
  ) {}

  /** 外套のルートの「上」が、キャラクターの座標系で前・左へどれだけ傾いているか（rad）。 */
  private lean(): { pitch: number; roll: number } {
    if (!this.reference || !this.root) return { pitch: 0, roll: 0 };
    this.root.updateWorldMatrix(true, false);
    this.reference.updateWorldMatrix(true, false);
    this.rootInverse.copy(this.root.matrixWorld).invert();
    // 外套ルートのローカル +Y をキャラクター空間へ（回転のみ）
    this.up
      .set(0, 1, 0)
      .transformDirection(this.reference.matrixWorld)
      .transformDirection(this.rootInverse);
    return { pitch: Math.atan2(this.up.z, this.up.y), roll: Math.atan2(this.up.x, this.up.y) };
  }

  /** 毎フレーム呼ぶ。motion はプレイヤーの前進速度と旋回角速度（上体の傾きは自動で測る）。 */
  update(dt: number, motion: CapeMotion): void {
    const lean = this.lean();
    this.spring.step(dt, { leanPitch: lean.pitch, leanRoll: lean.roll, ...motion });
    this.pivots.forEach((pivot, i) => {
      pivot.rotation.x = this.spring.pitch[i] ?? 0;
      pivot.rotation.z = this.spring.roll[i] ?? 0;
    });
  }

  /** 静止姿勢へ戻す。 */
  reset(): void {
    this.spring.reset();
    this.update(0, { forwardSpeed: 0, turnRate: 0 });
    for (const pivot of this.pivots) pivot.rotation.set(0, 0, 0);
  }
}

/** 取り付け済みの装備一式への参照。 */
export interface PlayerKit {
  readonly cape: CapeRig;
  /** 装備を外して衣装（フード・肩当て）を元に戻す。 */
  remove(): void;
}

export class PlayerKitAssets {
  private constructor(
    private readonly items: ReadonlyMap<
      PlayerItemId,
      { readonly object: Object3D; readonly extras: ItemExtras }
    >,
  ) {}

  /** player.glb を読み込む。baseUrl は public/assets/ の URL（既定は Vite の BASE_URL 配下）。 */
  static async load(baseUrl = `${import.meta.env.BASE_URL}assets/`): Promise<PlayerKitAssets> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(`${baseUrl}player.glb`);
    const items = new Map<PlayerItemId, { object: Object3D; extras: ItemExtras }>();
    for (const id of [...PLAYER_ARMOR_IDS, ...PLAYER_CAPE_IDS]) {
      const object = gltf.scene.getObjectByName(id);
      if (!object) throw new Error(`player.glb is missing item: ${id}`);
      items.set(id, { object, extras: object.userData as ItemExtras });
    }
    return new PlayerKitAssets(items);
  }

  private item(id: PlayerItemId): { readonly object: Object3D; readonly extras: ItemExtras } {
    const item = this.items.get(id);
    if (!item) throw new Error(`unknown player item: ${id}`);
    return item;
  }

  getSocket(id: PlayerItemId): PlayerSocket {
    const { extras } = this.item(id);
    if (!isSocket(extras)) throw new Error(`player item has no socket: ${id}`);
    return extras;
  }

  private clone(id: PlayerItemId): Object3D {
    const object = this.item(id).object.clone();
    object.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return object;
  }

  /**
   * 旅の騎士の装備一式を取り付ける。兜を被せるのでフードを、肩当てを付けるので衣装の肩当てを隠し、
   * 衣装の布の色を暗い青灰へ寄せる（深紅の外套・陣羽織が映えるように）。
   */
  equipKnight(character: Character, options: { outfitTint?: number } = {}): PlayerKit {
    const hidden: Object3D[] = [];
    for (const name of HIDDEN_OUTFIT) {
      const mesh = character.root.getObjectByName(name);
      if (mesh?.visible) {
        mesh.visible = false;
        hidden.push(mesh);
      }
    }
    tintOutfit(character, options.outfitTint ?? 0x5c6472);
    for (const id of PLAYER_ARMOR_IDS) {
      const socket = this.getSocket(id);
      character.attachAt(
        `player:${id}`,
        socket.bone,
        this.clone(id),
        socket.position,
        socket.quaternion,
      );
    }
    const capeSocket = this.getSocket('Knight_Cape_1');
    const pivots: Object3D[] = [];
    const capeRoot = new Group();
    capeRoot.name = 'cape';
    let parent: Object3D = capeRoot;
    for (const id of PLAYER_CAPE_IDS) {
      const pivotPoint = this.item(id).extras.pivot;
      if (!pivotPoint) throw new Error(`cape segment has no pivot: ${id}`);
      // 蝶番 = アイテム空間の pivot。内側を -pivot へずらして、段の形をアイテム空間のまま保つ
      const pivot = new Group();
      pivot.name = `${id}:pivot`;
      pivot.position.fromArray(pivotPoint);
      const inner = new Group();
      inner.position.fromArray(pivotPoint).multiplyScalar(-1);
      inner.add(this.clone(id));
      pivot.add(inner);
      parent.add(pivot);
      pivots.push(pivot);
      parent = inner;
    }
    character.attachAt(
      'player:cape',
      capeSocket.bone,
      capeRoot,
      capeSocket.position,
      capeSocket.quaternion,
    );
    return {
      cape: new CapeRig(pivots, capeRoot, character.root),
      remove: () => {
        for (const id of PLAYER_ARMOR_IDS)
          character.detachAt(`player:${id}`, this.getSocket(id).bone);
        character.detachAt('player:cape', capeSocket.bone);
        for (const mesh of hidden) mesh.visible = true;
      },
    };
  }
}

/** 衣装の布・革のマテリアルへ色を掛ける（インスタンスごとに複製。肌は触らない）。 */
export function tintOutfit(character: Character, color: number): void {
  const tint = new Color(color);
  character.root.traverse((obj) => {
    if (!(obj as { isMesh?: boolean }).isMesh) return;
    const mesh = obj as Mesh;
    const material = mesh.material as Material & { color?: Color };
    if (material.name !== OUTFIT_MATERIAL || mesh.userData['outfitTinted']) return;
    const copy = material.clone();
    copy.color?.multiply(tint);
    mesh.material = copy;
    mesh.userData['outfitTinted'] = true;
  });
}

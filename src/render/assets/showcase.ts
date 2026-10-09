import {
  BoxGeometry,
  Mesh as ThreeMesh,
  MeshBasicNodeMaterial,
  Timer,
  Vector3,
  type Camera,
  type Mesh,
  type Object3D,
  type Scene,
} from 'three/webgpu';
import { ATMOSPHERE } from '../environment';
import { applyCharacterLight, setCharacterLightEnabled } from '../characterLight';
import { CharacterAssets } from './characterAssets';
import { CLIP_NAMES, type ClipName } from './clips';
import type { Character } from './character';
import { EquipmentAssets, parseLoadoutName, type LoadoutName } from './equipment';
import { applyUndeadLook, type UndeadLook } from '../undead/undeadMaterial';
import { UNDEAD_VARIANTS, UNDEAD_VARIANT_IDS, parseVariantId } from '../undead/variants';

/** E2E / デバッグ用に公開する状態。 */
export interface ShowcaseState {
  readonly clip: ClipName;
  /** 現在のクリップの再生位置（秒）。 */
  readonly time: number;
  readonly triangles: number;
}

/**
 * アセットパイプラインの動作確認用: シーンに騎士を 1 体置いてアニメーションを再生する。
 * 本格的なプレイヤー統合は別チケット（#8）で行う。
 *
 * URL クエリ（撮影・確認用）:
 *   `?clip=<クリップ名>`  再生するクリップ（既定 Idle_Loop）
 *   `&t=<秒>`             再生位置を固定する
 *   `&view=front|left|right|back|close` と `&dist=<m>`  キャラクターに寄ったカメラ位置（既定はゲームのカメラのまま）
 *   `&undead=<gaunt|bloated|scorched|drowned|all>`  亡者マテリアルを適用（all は 4 バリアントを横並び）
 *   `&dissolve=<0..1>` ディゾルブ進行度、`&ember=<0..1>` 熾火の強さ（亡者のみ）
 *   `&light=front|back|side|shade`  太陽に対するカメラ位置（順光 / 逆光 / 横 / 影の中: 太陽との間に遮蔽物を置き、横から撮る）。
 *   `&telegraph=<0..1>`  武器のリムライトの強調（攻撃予備動作の演出フック確認用）
 *   `&rim=0`  キャラクターの補助光（リムライト等）を切る（改善前後の比較用）
 *   `&equip=soldier|shieldbearer|boss|all`  簡易装備メッシュを装着（boss は 2.2 倍、all は盾持ち・亡者兵・ボスを横並び。亡者マテリアルと併用可）
 */
export class CharacterShowcase {
  private readonly timer = new Timer();

  private constructor(
    private readonly character: Character,
    private readonly extras: readonly Character[],
    readonly clip: ClipName,
    private readonly frozen: boolean,
    readonly triangles: number,
  ) {}

  /** シーンに置かれたキャラクターのルート（影の追従対象などに使う）。 */
  get root(): Object3D {
    return this.character.root;
  }

  static async create(
    scene: Scene,
    camera: Camera,
    search = window.location.search,
  ): Promise<CharacterShowcase> {
    const params = new URLSearchParams(search);
    const requested = params.get('clip');
    const clip = CLIP_NAMES.find((n) => n === requested) ?? 'Idle_Loop';
    const t = params.get('t');
    const frozenAt = t === null ? NaN : Number(t);

    const assets = await CharacterAssets.load(['knight']);
    const undeadParam = params.get('undead');
    const undeadIds =
      undeadParam === 'all'
        ? UNDEAD_VARIANT_IDS
        : [parseVariantId(undeadParam)].filter((id) => id !== undefined);
    const equipParam = params.get('equip');
    const loadouts: LoadoutName[] =
      equipParam === 'all'
        ? ['shieldbearer', 'soldier', 'boss']
        : [parseLoadoutName(equipParam)].filter((n) => n !== undefined);
    const equipment = loadouts.length > 0 ? await EquipmentAssets.load() : undefined;
    const lateral = { shieldbearer: 0, soldier: -1.7, boss: 2.6 };
    const dissolve = Number(params.get('dissolve') ?? 0);
    const ember = Number(params.get('ember') ?? 0);
    const telegraph = Number(params.get('telegraph') ?? 0);
    setCharacterLightEnabled(params.get('rim') !== '0');
    const lightMode = params.get('light');
    // light 指定時はキャラクターが太陽に対して決まった向きになるカメラへ振り向く
    const lightAzimuth = lightCameraAzimuth(lightMode);
    const facing =
      lightAzimuth === undefined
        ? Math.atan2(4.5 - 0.8, 6 + 0.2) // カメラの方を向く
        : Math.atan2(Math.cos(lightAzimuth), Math.sin(lightAzimuth));
    const spawn = (index: number, count: number): Character => {
      const loadout = loadouts[index];
      const c = assets.createCharacter('knight', loadout ? { sword: false, shield: false } : {});
      // 横並びの間隔 1.6m（装備 all は種別ごとの位置）。向きに対して左右へ振る
      const offset =
        equipParam === 'all' && loadout ? lateral[loadout] : (index - (count - 1) / 2) * 1.6;
      c.root.position.set(0.8 + Math.cos(facing) * offset, 0, -0.2 - Math.sin(facing) * offset);
      c.root.rotation.y = facing;
      // 描画基盤（#7）の影の中に立たせる
      c.root.traverse((obj) => {
        if ((obj as { isMesh?: boolean }).isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      scene.add(c.root);
      if (loadout) {
        equipment?.equipLoadout(c, loadout);
        if (loadout === 'boss') c.root.scale.setScalar(2.2); // ボスは UBC を約 2.2 倍（仕様書 6.1 節）
      }
      const id = undeadIds[index];
      if (id !== undefined) {
        const look: UndeadLook = applyUndeadLook(c.root, UNDEAD_VARIANTS[id]);
        c.root.scale.multiply(new Vector3(...look.buildScale));
        look.setDissolve(dissolve);
        look.setEmber(ember);
        look.setWeaponTelegraph(telegraph);
      } else {
        applyCharacterLight(c.root).setWeaponTelegraph(telegraph);
      }
      return c;
    };
    const count = Math.max(1, undeadIds.length, loadouts.length);
    const spawned = Array.from({ length: count }, (_, i) => spawn(i, count));
    const [character, ...extras] = spawned as [Character, ...Character[]];
    if (lightAzimuth !== undefined) {
      applyLightView(camera, lightAzimuth, Number(params.get('dist')), spawned.length);
      if (lightMode === 'shade') addShadeOccluder(scene);
    } else {
      applyView(character, camera, params.get('view'), Number(params.get('dist')), 0.8, -0.2);
    }

    const frozen = Number.isFinite(frozenAt);
    for (const c of spawned) {
      const action = c.play(clip, { fade: 0 });
      if (frozen) {
        action.time = frozenAt;
        action.paused = true;
        c.mixer.update(0);
      }
    }

    let triangles = 0;
    character.root.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        const mesh = obj as Mesh;
        const { index, attributes } = mesh.geometry;
        triangles += (index ? index.count : (attributes['position']?.count ?? 0)) / 3;
      }
    });
    return new CharacterShowcase(character, extras, clip, frozen, triangles);
  }

  /** 毎フレーム呼ぶ。実時間でアニメーションを進める。 */
  update(): void {
    this.timer.update();
    if (this.frozen) return;
    const dt = this.timer.getDelta();
    this.character.update(dt);
    for (const c of this.extras) c.update(dt);
  }

  get state(): ShowcaseState {
    return {
      clip: this.clip,
      time: this.character.action?.time ?? 0,
      triangles: this.triangles,
    };
  }
}

const VIEW_ANGLES = {
  front: 0,
  close: 0,
  left: Math.PI / 2,
  right: -Math.PI / 2,
  back: Math.PI,
} as const;

/** キャラクターを正面/側面/背面から映す位置へカメラを移す（デバッグ用）。 */
function applyView(
  character: Character,
  camera: Camera,
  view: string | null,
  dist: number,
  centerX: number,
  centerZ: number,
): void {
  if (view === null || !(view in VIEW_ANGLES)) return;
  const angle = character.root.rotation.y + VIEW_ANGLES[view as keyof typeof VIEW_ANGLES];
  const distance = Number.isFinite(dist) && dist > 0 ? dist : view === 'close' ? 2.2 : 4;
  const target = { x: centerX, z: centerZ };
  camera.position.set(
    target.x + Math.sin(angle) * distance,
    view === 'close' ? 1.6 : 1.3,
    target.z + Math.cos(angle) * distance,
  );
  camera.lookAt(target.x, view === 'close' ? 1.25 : 0.9, target.z);
}

/** 太陽に対するカメラの方位（xz 平面, x 軸基準）。 */
function lightCameraAzimuth(mode: string | null): number | undefined {
  const sun = ATMOSPHERE.sunAzimuth;
  switch (mode) {
    case 'front':
      return sun; // カメラが太陽側 = 太陽を背にして撮る
    case 'back':
      return sun + Math.PI; // 太陽に向かって撮る
    case 'side':
    case 'shade':
      return sun + Math.PI / 2;
    default:
      return undefined;
  }
}

function applyLightView(camera: Camera, azimuth: number, dist: number, count: number): void {
  const distance = Number.isFinite(dist) && dist > 0 ? dist : 3.2 + count * 0.9;
  camera.position.set(0.8 + Math.cos(azimuth) * distance, 1.4, -0.2 + Math.sin(azimuth) * distance);
  camera.lookAt(0.8, 1.1, -0.2);
}

/** 影の確認用: 太陽とキャラクターの間に、描画されない（影だけ落とす）遮蔽物を置く。 */
function addShadeOccluder(scene: Scene): void {
  const material = new MeshBasicNodeMaterial();
  material.colorWrite = false;
  material.depthWrite = false;
  const box = new ThreeMesh(new BoxGeometry(14, 14, 14), material);
  const sunDir = new Vector3(Math.cos(ATMOSPHERE.sunAzimuth), 0, Math.sin(ATMOSPHERE.sunAzimuth));
  box.position.set(0.8 + sunDir.x * 9, 7, -0.2 + sunDir.z * 9);
  box.castShadow = true;
  scene.add(box);
}

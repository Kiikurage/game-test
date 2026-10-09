import { Timer, type Camera, type Mesh, type Object3D, type Scene } from 'three/webgpu';
import { CharacterAssets } from './characterAssets';
import { CLIP_NAMES, type ClipName } from './clips';
import type { Character } from './character';
import { EquipmentAssets, parseLoadoutName, type LoadoutName } from './equipment';

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
 *   `&equip=soldier|shieldbearer|boss|all`  簡易装備メッシュを装着（boss は 2.2 倍、all は 3 体を横並び。盾持ちが中央）
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
    // 装備プレビュー: all は盾持ちを中央に、亡者兵を左、ボスを右に並べる
    const equipParam = params.get('equip');
    const loadouts: LoadoutName[] =
      equipParam === 'all'
        ? ['shieldbearer', 'soldier', 'boss']
        : [parseLoadoutName(equipParam)].filter((n) => n !== undefined);
    const equipment = loadouts.length > 0 ? await EquipmentAssets.load() : undefined;
    const facing = Math.atan2(4.5 - 0.8, 6 + 0.2); // カメラの方を向く
    const lateral = { all_shieldbearer: 0, all_soldier: -1.7, all_boss: 2.6 };
    const spawnEquipped = (loadout: LoadoutName | undefined): Character => {
      const c = assets.createCharacter('knight', loadout ? { sword: false, shield: false } : {});
      const offset = equipParam === 'all' && loadout ? lateral[`all_${loadout}`] : 0;
      c.root.position.set(0.8 + Math.cos(facing) * offset, 0, -0.2 - Math.sin(facing) * offset);
      c.root.rotation.y = facing;
      if (loadout) {
        equipment?.equipLoadout(c, loadout);
        if (loadout === 'boss') c.root.scale.setScalar(2.2); // ボスは UBC を約 2.2 倍（仕様書 6.1 節）
      }
      return c;
    };
    const [primaryLoadout, ...otherLoadouts] = loadouts;
    const character = spawnEquipped(primaryLoadout);
    const extras = otherLoadouts.map((l) => spawnEquipped(l));
    for (const c of extras) {
      c.root.traverse((obj) => {
        if ((obj as { isMesh?: boolean }).isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
      scene.add(c.root);
    }
    // 描画基盤（#7）の影の中に立たせる
    character.root.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    scene.add(character.root);
    applyView(character, camera, params.get('view'), Number(params.get('dist')));

    const frozen = Number.isFinite(frozenAt);
    for (const c of [character, ...extras]) {
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
function applyView(character: Character, camera: Camera, view: string | null, dist: number): void {
  if (view === null || !(view in VIEW_ANGLES)) return;
  const angle = character.root.rotation.y + VIEW_ANGLES[view as keyof typeof VIEW_ANGLES];
  const distance = Number.isFinite(dist) && dist > 0 ? dist : view === 'close' ? 2.2 : 4;
  const target = character.root.position;
  camera.position.set(
    target.x + Math.sin(angle) * distance,
    view === 'close' ? 1.6 : 1.3,
    target.z + Math.cos(angle) * distance,
  );
  camera.lookAt(target.x, view === 'close' ? 1.25 : 0.9, target.z);
}

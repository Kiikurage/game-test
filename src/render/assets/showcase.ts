import { Timer, type Camera, type Mesh, type Scene } from 'three/webgpu';
import { CharacterAssets } from './characterAssets';
import { CLIP_NAMES, type ClipName } from './clips';
import type { Character } from './character';

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
 */
export class CharacterShowcase {
  private readonly timer = new Timer();

  private constructor(
    private readonly character: Character,
    readonly clip: ClipName,
    private readonly frozen: boolean,
    readonly triangles: number,
  ) {}

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
    const character = assets.createCharacter('knight');
    character.root.position.set(1.4, 0, 1.2);
    character.root.rotation.y = Math.atan2(4.5 - 1.4, 6 - 1.2); // カメラの方を向く
    scene.add(character.root);
    applyView(character, camera, params.get('view'), Number(params.get('dist')));

    const action = character.play(clip, { fade: 0 });
    const frozen = Number.isFinite(frozenAt);
    if (frozen) {
      action.time = frozenAt;
      action.paused = true;
      character.mixer.update(0);
    }

    let triangles = 0;
    character.root.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        const mesh = obj as Mesh;
        const { index, attributes } = mesh.geometry;
        triangles += (index ? index.count : (attributes['position']?.count ?? 0)) / 3;
      }
    });
    return new CharacterShowcase(character, clip, frozen, triangles);
  }

  /** 毎フレーム呼ぶ。実時間でアニメーションを進める。 */
  update(): void {
    this.timer.update();
    if (!this.frozen) this.character.update(this.timer.getDelta());
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

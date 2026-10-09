import { Quaternion, Timer, Vector3, type Mesh, type Scene } from 'three/webgpu';
import type { Game } from '../game/game';
import type { Character } from './assets/character';
import { CharacterAssets } from './assets/characterAssets';
import { PlayerAnimator, type PlayerAnimLayer } from './assets/playerAnimator';
import type { ClipName } from './assets/clips';

const Y_AXIS = new Vector3(0, 1, 0);

/** E2E / デバッグ用の状態。 */
export interface PlayerViewState {
  /** 最もウェイトの大きいクリップ。 */
  readonly clip: ClipName;
  readonly triangles: number;
}

/**
 * プレイヤー（騎士モデル）の描画。位置・向きは game の `player.transform` を補間して読み、
 * アニメーションは `player.animation` から `PlayerAnimator` が決める。
 * モデルの差し替えは `CharacterAssets.createCharacter` の引数を変えるだけ。
 */
export class PlayerView {
  private readonly timer = new Timer();
  private readonly position = new Vector3();
  private readonly orientation = new Quaternion();
  private readonly offset = new Quaternion();

  private constructor(
    private readonly game: Game,
    private readonly character: Character,
    private readonly animator: PlayerAnimator,
    readonly triangles: number,
  ) {}

  /** シーンに置かれたモデルのルート（影の追従対象などに使う）。 */
  get root(): Character['root'] {
    return this.character.root;
  }

  /** 撮影・調整用: アニメーションのレイヤーを指定時刻で固定表示する（null で解除）。 */
  setDebugPose(pose: { layer: PlayerAnimLayer; time: number } | null): void {
    this.animator.debugPose = pose;
  }

  get state(): PlayerViewState {
    return { clip: this.animator.dominantClip, triangles: this.triangles };
  }

  static async create(scene: Scene, game: Game, assets?: CharacterAssets): Promise<PlayerView> {
    const loaded = assets ?? (await CharacterAssets.load(['knight']));
    const character = loaded.createCharacter('knight');
    let triangles = 0;
    character.root.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        const mesh = obj as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const { index, attributes } = mesh.geometry;
        triangles += (index ? index.count : (attributes['position']?.count ?? 0)) / 3;
      }
    });
    scene.add(character.root);
    const animator = new PlayerAnimator(character, loaded);
    const view = new PlayerView(game, character, animator, triangles);
    view.update(1);
    return view;
  }

  /** 毎フレーム呼ぶ。alpha: 直前ステップ→最新ステップの補間係数。 */
  update(alpha: number): void {
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const player = this.game.player;
    player.transform.sample(alpha, this.position, this.orientation);
    // カメラが壁際で本体に近づきすぎたら、背中で画面が埋まらないよう非表示にする（ヒステリシス付き）
    const arm = this.game.camera.armLength;
    if (this.character.root.visible ? arm < 0.9 : arm > 1.2) {
      this.character.root.visible = !this.character.root.visible;
    }
    this.animator.update(dt, player.animation);
    // ロックオン中の横移動は、体を移動方向へ向ける（上半身は背骨で対象へ戻す）
    this.offset.setFromAxisAngle(Y_AXIS, this.animator.bodyYawOffset);
    this.character.root.position.copy(this.position);
    this.character.root.quaternion.copy(this.orientation).multiply(this.offset);
    this.animator.applyTwist();
  }
}

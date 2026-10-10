import { Quaternion, Timer, Vector3, type Mesh, type Scene } from 'three/webgpu';
import type { Game } from '../game/game';
import type { GuardPresentation } from '../game/player/player';
import type { Character } from './assets/character';
import { CharacterAssets } from './assets/characterAssets';
import { PlayerAnimator, type PlayerAnimLayer } from './assets/playerAnimator';
import { PlayerKitAssets, type CapeRig } from './player/playerKit';
import { applyCharacterLight } from './characterLight';

const Y_AXIS = new Vector3(0, 1, 0);

/** E2E / デバッグ用の状態。 */
export interface PlayerViewState {
  /** 下半身で最もウェイトの大きいクリップ。 */
  readonly clip: string;
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
    private readonly cape?: CapeRig,
  ) {}

  private lastYaw = NaN;

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
    // 旅の騎士の装備（#103）。読み込みに失敗しても素の騎士で遊べるようにする
    const kit = await PlayerKitAssets.load().catch((e: unknown) => {
      console.error('player kit failed to load', e);
      return undefined;
    });
    const cape = kit?.equipKnight(character).cape;
    // 逆光でも輪郭・武器が読めるよう補助光（リムライト・暗部の持ち上げ）を足す（#144）
    applyCharacterLight(character.root);
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
    const view = new PlayerView(game, character, animator, triangles, cape);
    view.update(1);
    return view;
  }

  /**
   * ガードの上半身: 構え `Sword_Block`（盾が下から上がる前半）→ 保持 `Idle_Shield_Loop` → 被ガードのスタン `Shield_OneShot`。
   * 下半身は移動のまま（ガードしながら歩ける）。解除の硬直（`release`）は上書きを外してクロスフェードで戻す。
   */
  private applyGuardPose(guard: GuardPresentation): void {
    switch (guard.phase) {
      case 'raise':
        // 構え完了（6F = 0.1s）に、Sword_Block の盾が上がりきるまで（0.2s）を合わせる
        this.animator.setUpperBody('Sword_Block', 1, Math.min(0.2, (guard.frame / 6) * 0.2));
        break;
      case 'hold':
        this.animator.setUpperBody('Idle_Shield_Loop', 1, (guard.frame / 60) % 2.5);
        break;
      case 'hit':
        this.animator.setUpperBody('Shield_OneShot', 1, Math.min(0.8, (guard.frame / 60) * 2));
        break;
      default:
        this.animator.setUpperBody(null);
    }
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
    this.applyGuardPose(player.animation.guard);
    this.animator.update(dt, player.animation, alpha);
    // ロックオン中の横移動は、体を移動方向へ向ける（上半身は背骨で対象へ戻す）
    this.offset.setFromAxisAngle(Y_AXIS, this.animator.bodyYawOffset);
    this.character.root.position.copy(this.position);
    this.character.root.quaternion.copy(this.orientation).multiply(this.offset);
    this.animator.applyTwist();
    if (this.cape && dt > 0) {
      const yaw = player.animation.yaw;
      let delta = Number.isNaN(this.lastYaw) ? 0 : yaw - this.lastYaw;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.lastYaw = yaw;
      this.cape.update(dt, {
        forwardSpeed: player.animation.localVelocity.z,
        turnRate: delta / dt,
      });
    }
  }
}

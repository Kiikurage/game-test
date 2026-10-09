import { Quaternion, Timer, Vector3, type Camera, type Mesh, type Scene } from 'three/webgpu';
import type { Enemy } from '../game/enemy/enemy';
import type { Game } from '../game/game';
import type { Character } from './assets/character';
import { CharacterAssets } from './assets/characterAssets';
import { EnemyAnimator } from './assets/enemyAnimator';
import { EquipmentAssets } from './assets/equipment';
import { EnemyDebugView } from './enemyDebugView';
import { applyUndeadLook, type UndeadLook } from './undead/undeadMaterial';
import {
  UNDEAD_VARIANTS,
  createRng,
  dissolveProgress,
  pickVariantId,
  DISSOLVE_FRAMES,
  type UndeadVariantId,
} from './undead/variants';

const Y_AXIS = new Vector3(0, 1, 0);
/** 倒れてからディゾルブを始めるまでの待ち（5.2 節: 倒れてから 60F 後に消え始め、60F かけて消える）。 */
const DISSOLVE_DELAY_FRAMES = 60;

interface EnemyEntry {
  readonly enemy: Enemy;
  readonly character: Character;
  readonly animator: EnemyAnimator;
  readonly look: UndeadLook;
  readonly variant: UndeadVariantId;
  /** 体格の倍率（亡者バリアント × 種別）。 */
  readonly scale: Vector3;
}

/**
 * 敵（game 層の `Enemy`）の描画。亡者マテリアル + 簡易装備（`equipLoadout`）の騎士モデルを置き、
 * 位置・向きは `enemy.transform` を補間して読み、アニメーションは `enemy.animation` から `EnemyAnimator` が決める。
 * `?debug` では視野・状態の可視化（`EnemyDebugView`）を重ねる。
 */
export class EnemyViews {
  private readonly timer = new Timer();
  private readonly position = new Vector3();
  private readonly orientation = new Quaternion();
  private readonly offset = new Quaternion();
  private debug: EnemyDebugView | null = null;

  private constructor(
    private readonly scene: Scene,
    private readonly entries: readonly EnemyEntry[],
  ) {}

  /** 描画中の敵の数。 */
  get count(): number {
    return this.entries.length;
  }

  static async create(scene: Scene, game: Game, assets?: CharacterAssets): Promise<EnemyViews> {
    const enemies = game.enemies.enemies;
    const loaded = assets ?? (await CharacterAssets.load(['knight']));
    const equipment = await EquipmentAssets.load();
    // 同型が並ばないよう、配置順に決定的な乱数でバリアントを割り振る（直前と同じものは選ばない）
    const rand = createRng(0x42);
    let previous: UndeadVariantId | undefined;
    const entries: EnemyEntry[] = [];
    for (const enemy of enemies) {
      const variant = pickVariantId(rand, previous);
      previous = variant;
      const character = loaded.createCharacter('knight', { sword: false, shield: false });
      equipment.equipLoadout(character, enemy.stats.loadout);
      const look = applyUndeadLook(character.root, UNDEAD_VARIANTS[variant]);
      character.root.traverse((obj) => {
        if ((obj as { isMesh?: boolean }).isMesh) {
          const mesh = obj as Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      const scale = new Vector3(...look.buildScale).multiplyScalar(enemy.stats.bodyScale);
      character.root.scale.copy(scale);
      scene.add(character.root);
      entries.push({
        enemy,
        character,
        animator: new EnemyAnimator(character, loaded),
        look,
        variant,
        scale,
      });
    }
    const views = new EnemyViews(scene, entries);
    views.update(1);
    return views;
  }

  /** `?debug`: 視野コーン・状態名・気付きゲージを表示する。 */
  setDebug(enabled: boolean): void {
    if (enabled && !this.debug) {
      this.debug = new EnemyDebugView(
        this.scene,
        this.entries.map((e) => e.enemy),
      );
    } else if (!enabled && this.debug) {
      this.debug.dispose();
      this.debug = null;
    }
  }

  /** 毎フレーム呼ぶ。alpha: 直前ステップ→最新ステップの補間係数。 */
  update(alpha: number, camera?: Camera): void {
    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.1);
    for (const e of this.entries) {
      const { enemy, character, animator } = e;
      enemy.transform.sample(alpha, this.position, this.orientation);
      animator.update(dt, enemy.animation, alpha);
      this.offset.setFromAxisAngle(Y_AXIS, animator.bodyYawOffset);
      character.root.position.copy(this.position);
      character.root.quaternion.copy(this.orientation).multiply(this.offset);
      animator.applyTwist();
      if (!enemy.alive) {
        e.look.setDissolve(
          dissolveProgress(enemy.deadFrames - DISSOLVE_DELAY_FRAMES, DISSOLVE_FRAMES.soldier),
        );
      }
    }
    if (this.debug && camera) this.debug.update(alpha, camera);
  }
}

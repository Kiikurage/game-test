import { createUberMaterial } from './uberMaterial';
import {
  Frustum,
  Matrix4,
  Quaternion,
  Sphere,
  Timer,
  Vector3,
  type Camera,
  type Mesh,
  type Object3D,
  type Scene,
} from 'three/webgpu';
import type { Enemy } from '../game/enemy/enemy';
import type { Game } from '../game/game';
import type { Character } from './assets/character';
import { CharacterAssets } from './assets/characterAssets';
import { EnemyAnimator } from './assets/enemyAnimator';
import { EquipmentAssets } from './assets/equipment';
import { EnemyDebugView } from './enemyDebugView';
import { enemyAttackByAction, killFeedbackAt } from '../game/data';
import { WEAPON_TELEGRAPH, enemyTelegraph } from './telegraph/weaponTelegraph';
import { applyUndeadLook, type UndeadLook } from './undead/undeadMaterial';
import { createLodBuilder, type CharacterLod } from './assets/characterLod';
import { createCanvasSampler } from './assets/textureSampler';
import { captureUndeadSources, createUndeadColorizer } from './undead/undeadLod';
import { UNDEAD_VARIANTS, createRng, pickVariantId, type UndeadVariantId } from './undead/variants';
import { renderClock } from './renderClock';

const Y_AXIS = new Vector3(0, 1, 0);
/** 命中点が分からない撃破（デバッグの `kill` など）で、燃え尽きを始める高さ（身長に対する比）。 */
const KILL_POINT_FALLBACK_HEIGHT = 0.6;

interface EnemyEntry {
  readonly enemy: Enemy;
  readonly character: Character;
  readonly animator: EnemyAnimator;
  readonly look: UndeadLook;
  readonly variant: UndeadVariantId;
  /** 体格の倍率（亡者バリアント × 種別）。 */
  readonly scale: Vector3;
  /** 簡略メッシュ（遠景・影）。作れなかったときは null で、従来どおり詳細メッシュだけを描く。 */
  readonly lod: CharacterLod | null;
  /** LOD 切り替えのヒステリシス用（直前に詳細メッシュだったか）。 */
  near: boolean;
  /** 撃破の演出中（復活したら戻す）。 */
  dissolving: boolean;
  /** トドメの命中点（ワールド）。`impact` イベントで受け取る。無ければ胸の高さ。 */
  killPoint: Vector3 | null;
}

/** 敵の LOD 設定（品質プリセットから `GameView` が渡す）。 */
export interface EnemyLodConfig {
  /** 詳細メッシュで描く距離（m）。ボスは体格に比例して延ばす。 */
  nearDistance: number;
  /** 影の簡略メッシュを出す、影の焦点からの距離（m）。 */
  shadowDistance: number;
}

/** 詳細 ↔ 簡略の切り替えのヒステリシス幅（m）。 */
const LOD_HYSTERESIS = 1.5;
/** 画面外の敵でも、長い影が画面に入りうる分だけ判定球を広げる（m）。 */
const SHADOW_REACH = 9;

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
  /** LOD 設定。既定は常に詳細メッシュ（`GameView.attachEnemies` が品質に合わせて上書きする）。 */
  lod: EnemyLodConfig = { nearDistance: Infinity, shadowDistance: Infinity };
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  private readonly sphere = new Sphere();

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
    const lodBuilder = await createLodBuilder().catch((e: unknown) => {
      console.error('character LOD unavailable', e);
      return undefined;
    });
    // 遠景用の簡略メッシュのマテリアル（頂点色。全敵で共有）
    const lodMaterial = createUberMaterial(
      { shading: 'lit', vertexColors: true },
      { roughness: 0.9, metalness: 0.1 },
    );
    const sampler = createCanvasSampler();
    // 同型が並ばないよう、配置順に決定的な乱数でバリアントを割り振る（直前と同じものは選ばない）
    const rand = createRng(0x42);
    let previous: UndeadVariantId | undefined;
    const entries: EnemyEntry[] = [];
    for (const enemy of enemies) {
      const variant = pickVariantId(rand, previous);
      previous = variant;
      const character = loaded.createCharacter('knight', { sword: false, shield: false });
      equipment.equipLoadout(character, enemy.stats.loadout);
      const sources = captureUndeadSources(character.root);
      const look = applyUndeadLook(character.root, UNDEAD_VARIANTS[variant]);
      character.root.traverse((obj) => {
        if ((obj as { isMesh?: boolean }).isMesh) {
          const mesh = obj as Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      // 簡略メッシュ（遠景・影）。作ると詳細メッシュは影を落とさなくなり、簡略メッシュが影を担当する
      const lod =
        lodBuilder?.create(character.root, lodMaterial, {
          colorize: createUndeadColorizer(sources, UNDEAD_VARIANTS[variant], sampler),
        }) ?? null;
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
        lod,
        near: false,
        dissolving: false,
        killPoint: null,
      });
    }
    // トドメの命中点（燃え尽きの広がりの起点。#281）。死亡処理と同じステップに出る
    const byId = new Map(entries.map((e) => [e.enemy.id, e]));
    game.events.on('impact', (ev) => {
      if (!ev.killed) return;
      const entry = byId.get(ev.targetId);
      if (entry) entry.killPoint = new Vector3(ev.position.x, ev.position.y, ev.position.z);
    });
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

  /**
   * 毎フレーム呼ぶ。alpha: 直前ステップ→最新ステップの補間係数。
   * `camera` があれば距離・視錐台で LOD を切り替える（画面外は描かず、アニメーション更新も省く）。
   * `shadowFocus`: 影の焦点（プレイヤー）。この近くの敵だけ影の簡略メッシュを出す。
   */
  update(alpha: number, camera?: Camera, shadowFocus?: Vector3): void {
    this.timer.update(renderClock.nowMs);
    const dt = Math.min(Math.max(this.timer.getDelta(), 0), 0.1); // 時計を止めた直後の最初の差は負になりうる
    if (camera) {
      camera.updateMatrixWorld();
      this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projection);
    }
    for (const e of this.entries) {
      const { enemy, character, animator } = e;
      enemy.transform.sample(alpha, this.position, this.orientation);
      character.root.position.copy(this.position);
      if (e.lod && camera) {
        this.applyLod(e, camera, shadowFocus);
        if (e.lod.isIdle) continue; // 画面にも影にも出ない: 位置だけ追従し、アニメーションは止める
      }
      animator.update(dt, enemy.animation, alpha);
      this.offset.setFromAxisAngle(Y_AXIS, animator.bodyYawOffset);
      character.root.quaternion.copy(this.orientation).multiply(this.offset);
      animator.applyTwist();
      // 攻撃の予備動作の間だけ武器の縁を光らせる（インスタンス単位のユニフォームを書き換えるだけ）
      const tg =
        enemy.state === 'attack' && enemy.alive
          ? enemyTelegraph(enemyAttackByAction(enemy.fsm.actionId), enemy.fsm.stateFrame)
          : null;
      if (tg && tg.amount > 0) {
        e.look.setWeaponTelegraph(tg.amount, WEAPON_TELEGRAPH[tg.kind].color);
      } else if (e.look.weaponTelegraph !== 0) {
        e.look.setWeaponTelegraph(0);
      }
      if (!enemy.alive) {
        // 撃破（#281）: 閃光・眼の消灯・燃え尽き → 20F からディゾルブ（tuning は KILL_FEEDBACK）
        if (!e.dissolving) {
          e.dissolving = true;
          e.killPoint ??= this.position
            .clone()
            .setY(this.position.y + enemy.height * KILL_POINT_FALLBACK_HEIGHT);
        }
        const k = killFeedbackAt(enemy.deadFrames);
        e.look.setKillFeedback(k, e.killPoint ?? undefined);
        e.look.setDissolve(k.dissolve);
      } else if (e.dissolving) {
        // 篝火の休憩で復活した
        e.dissolving = false;
        e.killPoint = null;
        e.look.setKillFeedback(killFeedbackAt(-1));
        e.look.setDissolve(0);
      }
    }
    if (this.debug && camera) this.debug.update(alpha, camera);
  }
  private warming = false;
  private readonly culledBefore = new WeakMap<Object3D, boolean>();

  /**
   * ウォームアップ中（#241）: 全敵の詳細メッシュを距離・視錐台に関係なく描かせる。
   * 詳細メッシュは近づく・倒れる（ディゾルブ）まで描かれないので、そのままだと初回の描画（パイプライン生成。
   * 亡者のバリアントごとにシェーダが違う）が戦闘中・死亡の瞬間に起きて大きくカクつく。
   * `GameView.warmUp` が描画の前後で true / false にする。
   */
  setWarmUp(on: boolean): void {
    this.warming = on;
    for (const { character, lod } of this.entries) {
      lod?.setWarmUp(on);
      character.root.traverse((obj) => {
        if (!(obj as { isMesh?: boolean }).isMesh) return;
        if (on) {
          this.culledBefore.set(obj, obj.frustumCulled);
          obj.frustumCulled = false;
        } else {
          obj.frustumCulled = this.culledBefore.get(obj) ?? true;
        }
      });
    }
  }

  /** 距離・視錐台から、詳細メッシュ / 簡略メッシュ / 非表示と、影の簡略メッシュの要否を決める。 */
  private applyLod(e: EnemyEntry, camera: Camera, shadowFocus?: Vector3): void {
    const { lod } = e;
    if (!lod) return;
    if (this.warming) {
      lod.apply('near', true);
      return;
    }
    const size = Math.max(e.scale.x, e.scale.y);
    const center = this.sphere.center.copy(this.position);
    center.y += 0.9 * size;
    this.sphere.radius = 1.3 * size;
    const inView = this.frustum.intersectsSphere(this.sphere);
    // 長い影が画面へ入りうる分だけ広げた球で、画面外の敵の影を残すか決める
    this.sphere.radius += SHADOW_REACH;
    const shadowVisible = this.frustum.intersectsSphere(this.sphere);
    const dist = camera.position.distanceTo(this.position);
    const focusDist = shadowFocus ? this.position.distanceTo(shadowFocus) : 0;
    const shadow = shadowVisible && focusDist < this.lod.shadowDistance;
    const nearDistance = this.lod.nearDistance * size + (e.near ? LOD_HYSTERESIS : 0);
    // 消え始めた（倒れた）敵はディゾルブを見せるため詳細メッシュのまま
    e.near = dist < nearDistance || !e.enemy.alive;
    const dissolved = !e.enemy.alive && e.look.dissolve >= 1;
    if (dissolved) lod.apply('none', false);
    else lod.apply(inView ? (e.near ? 'near' : 'far') : 'none', shadow);
  }
}

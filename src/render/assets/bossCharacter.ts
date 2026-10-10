import {
  Frustum,
  Matrix4,
  MeshStandardNodeMaterial,
  Quaternion,
  Sphere,
  Vector3,
  type Camera,
  type Group,
  type Mesh,
  type Object3D,
} from 'three/webgpu';
import type { EmberField, ParticleSystem } from '../particles';
import { BOSS_SCALE } from '../boss/bossGait';
import { emberPulse } from '../boss/bossLook';
import { applyUndeadLook, type UndeadLook } from '../undead/undeadMaterial';
import { captureUndeadSources, createUndeadColorizer } from '../undead/undeadLod';
import { BOSS_VARIANT } from '../undead/variants';
import type { Character } from './character';
import { CharacterAssets } from './characterAssets';
import { createLodBuilder, type CharacterLod, type CharacterLodBuilder } from './characterLod';
import { createCanvasSampler, type TextureSampler } from './textureSampler';
import { EquipmentAssets } from './equipment';

/**
 * ボス「門番の骸 オルグ」のモデル（仕様書 6.1 / 6.5 節）。**描画専用**で、ゲームの状態は持たない。
 *
 * - UBC の騎士（`knight.glb`）を一様に `BOSS_SCALE`（2.2）倍。比率は変えない（写実寄りの巨躯）。
 * - 装備は `LOADOUTS.boss`（兜・重胸当て・大型肩当て・籠手・草摺り・脛当て・マント・大盾・大斧）、
 *   マテリアルは亡者マテリアル（`BOSS_VARIANT`）。ジオメトリ・テクスチャは `CharacterAssets` / `EquipmentAssets` と共有。
 * - フェーズ 2: `setPhase(2)` で盾を外し（`detachShield` で投げ捨て演出に渡せる）、斧を両手持ちに切り替え、
 *   熾火（眼・鎧の継ぎ目・肌の亀裂・斧が橙に発光 + 足元の熾火パーティクル）を点ける。
 *   移行演出中の熾火の補間は `setEmber(0..1)`（`emberAtTransitionFrame` の値を渡す）。
 * - 描画コスト: 全身 約 23.9k tris（騎士 21,252 + 装備 2,634）、ドローコールは騎士のメッシュ数 + 装備 12、
 *   テクスチャは騎士の 7 枚（約 17MB）を雑魚と共有（ボスは常に近距離なので簡略メッシュには切り替えない）。
 *
 * 使い方（毎フレーム）:
 *   root の位置・向きを置く → アニメーションを更新（`CharacterAnimator.update` → `character.update`）→ `lateUpdate(dt)`。
 *   `lateUpdate` は両手持ちの斧を手の位置に合わせ、熾火の発生源を足元へ追従させる。
 */
export const BOSS_EMBER_FIELD = { radius: 1.3, height: 1.7 } as const;

/** 簡略メッシュ（遠景・影）の作成に使うもの。`BossCharacter.load` が用意する（`?lod=0` では undefined）。 */
export interface BossLodAssets {
  readonly builder: CharacterLodBuilder;
  readonly material: MeshStandardNodeMaterial;
  readonly sampler: TextureSampler;
}

/** ボスの LOD 設定（`GameView` の品質プリセットから）。nearDistance には体格（2.2 倍）が掛かる。 */
export interface BossLodConfig {
  nearDistance: number;
  shadowDistance: number;
}

/** 詳細 ↔ 簡略の切り替えのヒステリシス幅（m）と、画面外でも長い影が入りうる分の広がり（m）。 */
const LOD_HYSTERESIS = 1.5;
const SHADOW_REACH = 9;

export type BossGrip = 'shield' | 'twoHand';

const SHIELD_ID = 'GreatShield';
const AXE_ID = 'GreatAxe';
/** 両手持ち: 手の間隔がこの範囲（モデル空間の m）で、斧の柄を両手の線に合わせていく。 */
const TWO_HAND_BLEND = { from: 0.1, to: 0.3 } as const;

const smooth = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

function isDetachableProp(mesh: Object3D): boolean {
  for (let o: Object3D | null = mesh; o; o = o.parent) {
    if (o.name === `equip:${AXE_ID}` || o.name === `equip:${SHIELD_ID}`) return true;
  }
  return false;
}

export class BossCharacter {
  readonly root: Group;
  /** 亡者マテリアルのハンドル（ディゾルブ・熾火）。撃破演出（E5-8）は `look.setDissolve` を使う。 */
  readonly look: UndeadLook;
  private phaseValue: 1 | 2 = 1;
  private gripValue: BossGrip = 'shield';
  private shieldHolder: Object3D | undefined;
  private axeHolder: Object3D | undefined;
  private readonly axeSocketQuat = new Quaternion();
  /** 盾の見本（体から外れた盾は戻せないので、フェーズ 1 へ戻すときの複製元）。 */
  private readonly shieldTemplate: Object3D;
  private emberValue = 0;
  private time = 0;
  private emberField: EmberField | undefined;
  private particles: ParticleSystem | undefined;

  /** 簡略メッシュ（遠景・影）。作れなかった / `?lod=0` のときは null。 */
  readonly lod: CharacterLod | null;
  lodConfig: BossLodConfig = { nearDistance: Infinity, shadowDistance: Infinity };
  private near = true;
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  private readonly sphere = new Sphere();

  private readonly pr = new Vector3();
  private readonly pl = new Vector3();
  private readonly dir = new Vector3();
  private readonly yOne = new Vector3();
  private readonly rootInv = new Quaternion();
  private readonly handQuat = new Quaternion();
  private readonly qOne = new Quaternion();
  private readonly qSwing = new Quaternion();

  private constructor(
    readonly character: Character,
    private readonly equipment: EquipmentAssets,
    look: UndeadLook,
    lod: CharacterLod | null,
  ) {
    this.lod = lod;
    this.root = character.root;
    this.look = look;
    this.shieldHolder = character.root.getObjectByName(`equip:${SHIELD_ID}`) ?? undefined;
    this.axeHolder = character.root.getObjectByName(`equip:${AXE_ID}`) ?? undefined;
    const socket = equipment.getSocket(AXE_ID);
    this.axeSocketQuat.fromArray(socket.quaternion);
    if (!this.shieldHolder) throw new Error('boss loadout is missing GreatShield');
    this.shieldTemplate = this.shieldHolder.clone();
  }

  /** アセットを読み込む（`CharacterAssets` は雑魚と共有できる）。 */
  static async load(
    assets?: CharacterAssets,
    equipment?: EquipmentAssets,
  ): Promise<{ assets: CharacterAssets; equipment: EquipmentAssets; lod?: BossLodAssets }> {
    const [a, e, builder] = await Promise.all([
      assets ?? CharacterAssets.load(['knight']),
      equipment ?? EquipmentAssets.load(),
      createLodBuilder().catch((err: unknown) => {
        console.error('character LOD unavailable', err);
        return undefined;
      }),
    ]);
    if (!builder) return { assets: a, equipment: e };
    return {
      assets: a,
      equipment: e,
      lod: {
        builder,
        material: new MeshStandardNodeMaterial({
          vertexColors: true,
          roughness: 0.9,
          metalness: 0.1,
        }),
        sampler: createCanvasSampler(),
      },
    };
  }

  /** ボスを 1 体作る。`root` をシーンへ追加して使う（足元が原点、+Z 向き、身長 約 4.0m）。 */
  static create(
    assets: CharacterAssets,
    equipment: EquipmentAssets,
    lodAssets?: BossLodAssets,
  ): BossCharacter {
    const character = assets.createCharacter('knight', { sword: false, shield: false });
    equipment.equipLoadout(character, 'boss');
    const sources = captureUndeadSources(character.root);
    const look = applyUndeadLook(character.root, BOSS_VARIANT);
    character.root.traverse((obj) => {
      if ((obj as { isMesh?: boolean }).isMesh) {
        const mesh = obj as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    // 簡略メッシュ: 骨に固定された身体・鎧・兜・マントを 1 本に結合する（遠景・影用）。
    // 斧（両手持ちで手の線に合わせる）と盾（投げ捨てる）は結合しない。常に詳細で描き、自分で影を落とす
    const lod =
      lodAssets?.builder.create(character.root, lodAssets.material, {
        colorize: createUndeadColorizer(sources, BOSS_VARIANT, lodAssets.sampler),
        exclude: isDetachableProp,
      }) ?? null;
    character.root.scale.setScalar(BOSS_SCALE);
    return new BossCharacter(character, equipment, look, lod);
  }

  get phase(): 1 | 2 {
    return this.phaseValue;
  }

  get grip(): BossGrip {
    return this.gripValue;
  }

  /** 盾がまだ体に付いているか。 */
  get hasShield(): boolean {
    return this.shieldHolder !== undefined;
  }

  get ember(): number {
    return this.emberValue;
  }

  /**
   * フェーズの見た目を一括で切り替える（即時）。1: 盾 + 斧（片手）、熾火なし。2: 盾なし・斧を両手持ち・熾火。
   * 盾が付いたままフェーズ 2 にすると盾は消える（演出を挟むなら先に `detachShield` を呼ぶ）。
   */
  setPhase(phase: 1 | 2): void {
    this.phaseValue = phase;
    if (phase === 2) {
      if (this.shieldHolder) this.dropShield();
      this.setGrip('twoHand');
      this.setEmber(1);
    } else {
      this.restoreShield();
      this.setGrip('shield');
      this.setEmber(0);
    }
  }

  /** 熾火の強さ（0〜1）。眼・鎧の継ぎ目・肌の亀裂・斧が橙に光り、足元に熾火のパーティクルが出る。 */
  setEmber(amount: number): void {
    this.emberValue = Math.min(1, Math.max(0, amount));
    this.look.setEmber(this.emberValue);
    this.emberField?.setActive(this.emberValue > 0.05);
  }

  /** 斧の持ち方。`twoHand` は両手持ち（`lateUpdate` で柄を両手の線に合わせる）、`shield` は右手だけの片手持ち。 */
  setGrip(grip: BossGrip): void {
    if (grip === this.gripValue) return;
    this.gripValue = grip;
    const holder = this.axeHolder;
    if (!holder) return;
    if (grip === 'twoHand') {
      // 手のボーンから外してキャラクターのルート直下へ（姿勢は毎フレーム手に合わせて計算する）
      this.root.add(holder);
    } else {
      const socket = this.equipment.getSocket(AXE_ID);
      holder.position.fromArray(socket.position);
      holder.quaternion.fromArray(socket.quaternion);
      this.root.getObjectByName(socket.bone)?.add(holder);
    }
  }

  /**
   * 盾を体から切り離し、`parent`（通常はシーン）へワールド姿勢を保ったまま移して返す。
   * 返した物体を `ThrownShield` に渡すと投げ捨ての飛行・着地になる（演出は E5-6）。盾がなければ undefined。
   */
  detachShield(parent: Object3D): Object3D | undefined {
    const holder = this.shieldHolder;
    if (!holder) return undefined;
    this.root.updateWorldMatrix(true, true);
    parent.attach(holder);
    this.shieldHolder = undefined;
    return holder;
  }

  /** 熾火のパーティクル（足元）を使う。`view.particles` を渡す。 */
  bindParticles(particles: ParticleSystem): void {
    this.releaseParticles();
    this.particles = particles;
    const p = this.root.position;
    this.emberField = particles.acquireEmberField(
      p.x,
      p.y,
      p.z,
      BOSS_EMBER_FIELD.radius,
      BOSS_EMBER_FIELD.height,
    );
    this.emberField.setActive(this.emberValue > 0.05);
  }

  /** アニメーション更新の後に毎フレーム呼ぶ（両手持ちの斧・熾火の追従・熾火の呼吸）。 */
  lateUpdate(dt: number): void {
    this.time += Math.min(Math.max(dt, 0), 0.1);
    if (this.emberValue > 0) {
      // 熾火は鼓動するように明滅する（ディゾルブ中は固定）
      this.look.setEmber(
        this.look.dissolve > 0 ? this.emberValue : emberPulse(this.time, this.emberValue),
      );
    }
    this.emberField?.place(this.root.position.x, this.root.position.y, this.root.position.z);
    if (this.gripValue === 'twoHand') this.alignAxe();
  }

  /**
   * 毎フレーム呼ぶ（`lateUpdate` の前）。距離・視錐台から詳細 / 簡略 / 非表示と、影の簡略メッシュの要否を決める。
   * フェーズ 2（熾火）と撃破演出（ディゾルブ）は詳細メッシュのまま（簡略メッシュには発光・ディゾルブが無い）。
   * 戻り値が false のときは画面にも影にも出ない（アニメーション更新を省いてよい）。
   */
  updateLod(camera: Camera, shadowFocus?: Vector3): boolean {
    const { lod } = this;
    if (!lod) return true;
    camera.updateMatrixWorld();
    this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projection);
    const size = BOSS_SCALE;
    const pos = this.root.position;
    this.sphere.center.copy(pos);
    this.sphere.center.y += 0.9 * size;
    this.sphere.radius = 1.3 * size;
    const inView = this.frustum.intersectsSphere(this.sphere);
    this.sphere.radius += SHADOW_REACH;
    const shadowVisible = this.frustum.intersectsSphere(this.sphere);
    const dist = camera.position.distanceTo(pos);
    const focusDist = shadowFocus ? pos.distanceTo(shadowFocus) : 0;
    const shadow = shadowVisible && focusDist < this.lodConfig.shadowDistance;
    const nearDistance = this.lodConfig.nearDistance * size + (this.near ? LOD_HYSTERESIS : 0);
    this.near = dist < nearDistance || this.emberValue > 0 || this.look.dissolve > 0;
    if (this.look.dissolve >= 1) lod.apply('none', false);
    else lod.apply(inView ? (this.near ? 'near' : 'far') : 'none', shadow);
    return !lod.isIdle;
  }

  /** 熾火パーティクルを返却し、マテリアルを解放する。シーンからの除去は呼び出し側で行う。 */
  dispose(): void {
    this.releaseParticles();
    this.look.dispose();
    this.character.dispose();
  }

  private releaseParticles(): void {
    if (this.particles && this.emberField) this.particles.releaseEmberField(this.emberField);
    this.emberField = undefined;
    this.particles = undefined;
  }

  private dropShield(): void {
    this.shieldHolder?.removeFromParent();
    this.shieldHolder = undefined;
  }

  private restoreShield(): void {
    if (this.shieldHolder) return;
    // 投げ捨てた盾は戻らないので、最初に取っておいた見本（同じ亡者マテリアル）の複製を付け直す
    const socket = this.equipment.getSocket(SHIELD_ID);
    const bone = this.root.getObjectByName(socket.bone);
    if (!bone) return;
    const holder = this.shieldTemplate.clone();
    holder.position.fromArray(socket.position);
    holder.quaternion.fromArray(socket.quaternion);
    holder.scale.set(1, 1, 1);
    bone.add(holder);
    this.shieldHolder = holder;
  }

  /**
   * 両手持ちの斧: 柄が右手を通り、左手の方向（手が離れているほど両手の線）を向くようにする。
   * 手が近いとき（片手向けのクリップ）は右手ソケットの向きのまま。ルートの局所空間（拡大前）で計算する。
   */
  private alignAxe(): void {
    const holder = this.axeHolder;
    if (!holder) return;
    const handR = this.root.getObjectByName('hand_r');
    const handL = this.root.getObjectByName('hand_l');
    if (!handR || !handL) return;
    this.root.updateWorldMatrix(true, false);
    handR.updateWorldMatrix(true, false);
    handL.updateWorldMatrix(true, false);
    this.pr.setFromMatrixPosition(handR.matrixWorld);
    this.pl.setFromMatrixPosition(handL.matrixWorld);
    this.root.worldToLocal(this.pr);
    this.root.worldToLocal(this.pl);
    handR.getWorldQuaternion(this.handQuat);
    this.root.getWorldQuaternion(this.rootInv).invert();
    this.qOne.copy(this.rootInv).multiply(this.handQuat).multiply(this.axeSocketQuat);
    this.yOne.set(0, 1, 0).applyQuaternion(this.qOne);

    this.dir.copy(this.pl).sub(this.pr);
    const gap = this.dir.length();
    const w = smooth((gap - TWO_HAND_BLEND.from) / (TWO_HAND_BLEND.to - TWO_HAND_BLEND.from));
    if (w > 0) {
      this.dir.divideScalar(gap);
      if (this.dir.dot(this.yOne) < 0) this.dir.negate(); // 刃は上側
      this.dir
        .multiplyScalar(w)
        .addScaledVector(this.yOne, 1 - w)
        .normalize();
      this.qSwing.setFromUnitVectors(this.yOne, this.dir);
      holder.quaternion.copy(this.qSwing).multiply(this.qOne);
    } else {
      holder.quaternion.copy(this.qOne);
    }
    holder.position.copy(this.pr);
  }
}

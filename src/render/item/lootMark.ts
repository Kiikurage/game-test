import { createUberMaterial } from '../uberMaterial';
import {
  Color,
  Frustum,
  InstancedMesh,
  Matrix4,
  OctahedronGeometry,
  Quaternion,
  Sphere,
  Vector3,
} from 'three/webgpu';
import type { GameView } from '../gameView';

/** 拾得物の目印の高さ（地面から、m）と上下の揺れ。低く控えめに（遺体の胸の高さ程度）。 */
const HOVER = 0.32;
const BOB = 0.03;
/** 菱形の大きさ（半径、m）。 */
const SIZE = 0.08;
/** この距離（m）より遠いプレイヤーからは描かない。光の粒は `MOTE_NEAR` より近いときだけ。 */
const FAR = 60;
const MOTE_NEAR = 25;
/** 光の粒（既存の回復の粒のバースト）を出す間隔（秒）。 */
const MOTE_INTERVAL = 1.5;
/** 発光色。ブルームの閾値を少し超える程度に抑える（半透明・ライトは使わない）。 */
const GLOW = new Color(0xffd27a).multiplyScalar(1.5);

export interface LootMarkSpot {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  /** 立つ面の高さ（地形・足場の上面）。 */
  readonly ground: number;
  /** 地面からの目印の高さ（m）。既定 `HOVER`。遺体の上は体に重ならないよう高くする。 */
  readonly hover?: number;
}

/**
 * 拾得物・調べる対象の目印（#67 / #248）: 小さく淡く光る菱形（ゆっくり回り、わずかに上下する）と、
 * そこから立ち上る淡い光の粒（既存の `ParticleSystem.healGlow` を一定間隔で少量）。回復瓶・遺品・遺体で共通。
 * コスト: 全目印を 1 つの `InstancedMesh`（1 ドローコール）にまとめ、非表示は scale 0。MeshBasic・半透明なし・実ライトなし。
 */
export class LootMarks {
  private readonly mesh: InstancedMesh;
  private readonly feet = new Vector3();
  private readonly matrix = new Matrix4();
  private readonly quat = new Quaternion();
  private readonly pos = new Vector3();
  private readonly scale = new Vector3();
  private readonly shown: boolean[];
  private readonly frustum = new Frustum();
  private readonly view4 = new Matrix4();
  private readonly sphere = new Sphere();
  private time = 0;
  private nextMote = 0;
  /** 最初の更新は必ず描く（ウォームアップでパイプラインを作り、初めて見えた瞬間のカクつきを防ぐ）。 */
  private warm = true;

  constructor(
    private readonly view: GameView,
    private readonly spots: readonly LootMarkSpot[],
  ) {
    const geometry = new OctahedronGeometry(SIZE, 0).scale(1, 1.5, 1);
    const material = createUberMaterial({ shading: 'unlit' }, { color: GLOW });
    this.mesh = new InstancedMesh(geometry, material, spots.length);
    this.mesh.name = 'lootmarks';
    // 視錐台カリングは `update` で対象ごとに行う（見える目印が 1 つもなければ描かない）
    this.mesh.frustumCulled = false;
    this.shown = spots.map(() => false);
    spots.forEach((_, i) => {
      this.matrix.makeScale(0, 0, 0);
      this.mesh.setMatrixAt(i, this.matrix);
    });
    view.scene.add(this.mesh);
  }

  /** 目印が見えている対象の ID（確認用）。 */
  get visibleIds(): string[] {
    return this.spots.filter((_, i) => this.shown[i]).map((s) => s.id);
  }

  /** `active` は目印を出す（未取得・条件を満たす）対象の ID。 */
  update(dt: number, active: ReadonlySet<string>, px: number, pz: number): void {
    this.time += dt;
    const emit = this.time >= this.nextMote;
    if (emit) this.nextMote = this.time + MOTE_INTERVAL;
    const camera = this.view.camera;
    camera.updateMatrixWorld();
    this.view4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.view4);
    let anyInView = false;
    this.quat.setFromAxisAngle(this.pos.set(0, 1, 0), this.time * 1.2);
    this.spots.forEach((spot, i) => {
      const dist = Math.hypot(spot.x - px, spot.z - pz);
      const visible = active.has(spot.id) && dist < FAR;
      this.shown[i] = visible;
      const y = spot.ground + (spot.hover ?? HOVER) + Math.sin(this.time * 2) * BOB;
      this.pos.set(spot.x, y, spot.z);
      this.scale.setScalar(visible ? 1 : 0);
      if (visible && this.frustum.intersectsSphere(this.sphere.set(this.pos, SIZE * 2))) {
        anyInView = true;
      }
      this.matrix.compose(this.pos, this.quat, this.scale);
      this.mesh.setMatrixAt(i, this.matrix);
      if (visible && emit && dist < MOTE_NEAR) {
        this.feet.set(spot.x, spot.ground + 0.1, spot.z);
        this.view.particles.healGlow(this.feet, 0.15, 0.7);
      }
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.visible = this.warm || anyInView;
    this.warm = false;
    this.mesh.userData['visibleIds'] = this.visibleIds; // dev フック（E2E）用
  }
}

import { Color, Mesh, MeshBasicNodeMaterial, OctahedronGeometry, Vector3 } from 'three/webgpu';
import type { GameView } from '../gameView';

/** 拾得物の目印の高さ（地面から、m）と上下の揺れ。 */
const HOVER = 0.6;
const BOB = 0.08;
/** この距離（m）より遠いプレイヤーからは描かない。光の粒は `MOTE_NEAR` より近いときだけ。 */
const FAR = 60;
const MOTE_NEAR = 25;
/** 光の粒（既存の回復の粒のバースト）を出す間隔（秒）。 */
const MOTE_INTERVAL = 1.5;
/** 発光色。1 を超える値でブルームに拾わせる（半透明・ライトは使わない）。 */
const GLOW = new Color(0xffd27a).multiplyScalar(3.2);

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
 * 拾得物・調べる対象の目印（#67 / #248）: 強く発光する小さな菱形 1 つ（ゆっくり回り、上下に揺れる）と、
 * そこから立ち上る淡い光の粒（既存の `ParticleSystem.healGlow` を一定間隔で少量）。回復瓶・遺品・遺体で共通。
 * コスト: メッシュ 1 つ・MeshBasic（全目印で共有）。新しい半透明マテリアル・実ライトなし。
 */
export class LootMarks {
  private readonly meshes: { spot: LootMarkSpot; mesh: Mesh }[];
  private readonly feet = new Vector3();
  private time = 0;
  private nextMote = 0;
  /** 最初の更新は全部を描く（ウォームアップでパイプラインを作る。遠くの目印が初めて見えた瞬間のカクつきを防ぐ）。 */
  private warm = true;

  constructor(
    private readonly view: GameView,
    spots: readonly LootMarkSpot[],
  ) {
    const geometry = new OctahedronGeometry(0.24, 0).scale(1, 1.5, 1);
    const material = new MeshBasicNodeMaterial({ color: GLOW });
    this.meshes = spots.map((spot) => {
      const mesh = new Mesh(geometry, material);
      mesh.name = `lootmark:${spot.id}`;
      mesh.position.set(spot.x, spot.ground + (spot.hover ?? HOVER), spot.z);
      view.scene.add(mesh);
      return { spot, mesh };
    });
  }

  /** 目印が見えている対象の ID（確認用）。 */
  get visibleIds(): string[] {
    return this.meshes.filter((m) => m.mesh.visible).map((m) => m.spot.id);
  }

  /** `active` は目印を出す（未取得・条件を満たす）対象の ID。 */
  update(dt: number, active: ReadonlySet<string>, px: number, pz: number): void {
    this.time += dt;
    const emit = this.time >= this.nextMote;
    if (emit) this.nextMote = this.time + MOTE_INTERVAL;
    const warm = this.warm;
    this.warm = false;
    for (const { spot, mesh } of this.meshes) {
      const dist = Math.hypot(spot.x - px, spot.z - pz);
      mesh.frustumCulled = !warm;
      mesh.visible = warm || (active.has(spot.id) && dist < FAR);
      if (!mesh.visible) continue;
      mesh.rotation.y = this.time * 1.2;
      mesh.position.y = spot.ground + (spot.hover ?? HOVER) + Math.sin(this.time * 2) * BOB;
      if (!warm && emit && dist < MOTE_NEAR) {
        this.feet.set(spot.x, spot.ground + 0.1, spot.z);
        this.view.particles.healGlow(this.feet, 0.18, 1.1);
      }
    }
  }
}

import {
  CylinderGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  type Object3D,
  MeshStandardNodeMaterial,
  type PerspectiveCamera,
  Vector3,
} from 'three/webgpu';
import type { ParticleSystem } from './index';
import { terrainHeight } from '../terrain';

/** `?particles` で確認用ビュー（篝火・熾火・ヒット火花・撃破の灰を繰り返し出す）を有効にする。 */
export function isParticleDemoEnabled(search: string): boolean {
  return new URLSearchParams(search).has('particles');
}

/** 篝火の足場（薪と石の輪）。見た目確認用の簡易モデル。 */
export function createBonfireBase(): Group {
  const g = new Group();
  const wood = new MeshStandardNodeMaterial({ color: 0x2b1d14, roughness: 0.95 });
  const charcoal = new MeshStandardNodeMaterial({
    color: 0x1a0f0a,
    emissive: 0xff5a10,
    emissiveIntensity: 1.1,
    roughness: 1,
  });
  const stone = new MeshStandardNodeMaterial({ color: 0x55504a, roughness: 0.95 });
  const log = new CylinderGeometry(0.05, 0.065, 0.8, 7);
  for (let i = 0; i < 5; i++) {
    const m = new Mesh(log, i === 0 ? charcoal : wood);
    const a = (i / 5) * Math.PI * 2 + 0.3;
    m.position.set(Math.cos(a) * 0.12, 0.13, Math.sin(a) * 0.12);
    m.rotation.set(Math.PI / 2 - 0.35, 0, a + Math.PI / 2);
    m.castShadow = true;
    g.add(m);
  }
  const rock = new DodecahedronGeometry(0.17, 0);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const m = new Mesh(rock, stone);
    m.position.set(Math.cos(a) * 0.52, 0.06, Math.sin(a) * 0.52);
    m.scale.set(1, 0.7, 1.1);
    m.rotation.set(i, i * 2, 0);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

/** ?pview= の視点: [カメラ xyz, 注視点 xyz, fov?]。 */
const DEMO_VIEWS: Record<string, readonly number[]> = {
  bonfire: [-3.4, 1.25, -1.0, -0.6, 0.85, 1.7],
  hit: [-0.2, 1.4, 0.0, 2.0, 1.1, 2.0, 50],
  death: [-1.0, 1.3, -0.2, -3.6, 1.0, 3.0, 50],
  ember: [-0.6, 1.2, 0.4, 1.4, 0.9, 3.4, 56],
  wide: [-6.0, 2.2, -3.0, 0.5, 1.0, 3.0, 70],
};

/**
 * 確認用デモ: 篝火 1 基、熾火フィールド 1 つ、ヒット火花と撃破の灰を一定間隔で繰り返す。
 * 本番のゲームロジックが接続されるまでの足場。
 */
export class ParticleDemo {
  private t = 0;
  private nextHit = 0.3;
  private nextDeath = 0.9;
  private readonly hitPos = new Vector3(2.0, 1.1, 2.0);
  private readonly hitNormal = new Vector3(-0.7, 0.35, -0.5).normalize();
  private readonly deathPos = new Vector3(-3.6, 0, 3.0);

  constructor(
    private readonly particles: ParticleSystem,
    scene: Object3D,
    camera: PerspectiveCamera,
  ) {
    const bx = -1.2;
    const bz = 0.9;
    const by = terrainHeight(bx, bz);
    const base = createBonfireBase();
    base.position.set(bx, by, bz);
    scene.add(base);
    particles.acquireBonfire(bx, by, bz);
    particles.acquireEmberField(1.4, terrainHeight(1.4, 3.4), 3.4, 1.5, 2.2);

    // 太陽を背にした位置から見る（逆光だと炎が白飛びして読めない）。?pview= で見る対象を切り替える
    const view = new URLSearchParams(window.location.search).get('pview') ?? 'bonfire';
    const t = DEMO_VIEWS[view] ?? DEMO_VIEWS['bonfire'];
    if (t) {
      camera.position.set(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0);
      camera.fov = t[6] ?? 62;
      camera.updateProjectionMatrix();
      camera.lookAt(t[3] ?? 0, t[4] ?? 0, t[5] ?? 0);
    }

    // ヘッドレス（SwiftShader）では描画が遅いので、撮影時に粒子が出揃うよう先にシミュレーションを進める
    const warm = Number(new URLSearchParams(window.location.search).get('warm') ?? 0);
    const origin = new Vector3();
    for (let i = 0; i < warm * 20; i++) {
      this.update(0.05);
      particles.update(0.05, origin);
    }
  }

  update(dt: number): void {
    this.t += dt;
    if (this.t >= this.nextHit) {
      this.nextHit = this.t + 0.5;
      this.particles.hit(this.hitPos, this.hitNormal, 1);
    }
    if (this.t >= this.nextDeath) {
      this.nextDeath = this.t + 1.6;
      this.particles.deathAsh(this.deathPos, 0.4, 1.8, 1);
    }
  }
}

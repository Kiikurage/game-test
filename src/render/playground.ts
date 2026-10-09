import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type Camera,
} from 'three/webgpu';
import type { Game } from '../game/game';
import { chestPosition } from '../game/lockOn/targets';
import { PLAYGROUND_BOXES, type BoxSpec } from '../game/world/playground';

const DEG = Math.PI / 180;

function boxMesh(spec: BoxSpec, material: MeshStandardNodeMaterial): Mesh {
  const mesh = new Mesh(new BoxGeometry(spec.hx * 2, spec.hy * 2, spec.hz * 2), material);
  mesh.position.set(spec.x, spec.y, spec.z);
  // 物理（game.ts）と同じ回転順: ヨー → ローカル X 軸のピッチ
  const yaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), (spec.yawDeg ?? 0) * DEG);
  const pitch = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (spec.pitchDeg ?? 0) * DEG);
  mesh.quaternion.copy(yaw).multiply(pitch);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** 木製の訓練用人形（柱 + 腕木 + 頭）。身長 `height`・台座の半径 `radius` に合わせて組む。 */
function createDummyMesh(height: number, radius: number): Group {
  const group = new Group();
  const wood = new MeshStandardNodeMaterial({ color: 0x7a5a38, roughness: 0.85, metalness: 0 });
  const stone = new MeshStandardNodeMaterial({ color: 0x7d776d, roughness: 0.9, metalness: 0 });
  const straw = new MeshStandardNodeMaterial({ color: 0xc2a45e, roughness: 1, metalness: 0 });

  const base = new Mesh(new CylinderGeometry(radius, radius * 1.1, 0.2, 20), stone);
  base.position.y = 0.1;
  const post = new Mesh(new CylinderGeometry(radius * 0.34, radius * 0.42, height * 0.9, 12), wood);
  post.position.y = 0.2 + (height * 0.9) / 2;
  const arms = new Mesh(new BoxGeometry(radius * 3.4, radius * 0.3, radius * 0.3), wood);
  arms.position.y = height * 0.7;
  const torso = new Mesh(
    new CylinderGeometry(radius * 0.62, radius * 0.7, height * 0.34, 14),
    straw,
  );
  torso.position.y = height * 0.6;
  const head = new Mesh(new SphereGeometry(radius * 0.55, 16, 12), straw);
  head.position.y = height * 0.94;

  for (const m of [base, post, arms, torso, head]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

/**
 * テストシーンの足場（階段・坂・壁）とロックオン用ダミー、ロックオンマーカー。
 * 形は `game/world/playground.ts` のデータから作るので、物理と見た目が一致する。
 */
export class PlaygroundView {
  readonly root = new Group();
  private readonly marker: Mesh;
  private readonly tmp = new Vector3();

  /** `showProps` が false のときは足場を描かない（レベルでは使わず、ロックオンマーカーだけ使う）。 */
  constructor(
    private readonly game: Game,
    showProps = true,
  ) {
    const stone = new MeshStandardNodeMaterial({ color: 0x9a9082, roughness: 0.9, metalness: 0 });
    if (showProps) for (const spec of PLAYGROUND_BOXES) this.root.add(boxMesh(spec, stone));

    for (const dummy of game.dummies) {
      const mesh = createDummyMesh(dummy.height, dummy.radius);
      mesh.position.copy(dummy.position);
      this.root.add(mesh);
    }

    // ロックオンマーカー（暫定。HUD の仕様は #？ の UI で作り込む）。常に手前に描く小さなリング。
    const material = new MeshBasicNodeMaterial({
      color: 0xffb04a,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    this.marker = new Mesh(new RingGeometry(0.62, 0.78, 32), material);
    this.marker.renderOrder = 999;
    this.marker.visible = false;
    this.marker.frustumCulled = false;
    this.root.add(this.marker);
  }

  /** 毎フレーム: マーカーをロックオン対象の胸元へ、カメラの方を向けて置く。 */
  update(camera: Camera): void {
    const target = this.game.lockOn.target;
    if (!target) {
      this.marker.visible = false;
      return;
    }
    chestPosition(target, this.tmp);
    this.marker.visible = true;
    this.marker.position.copy(this.tmp);
    this.marker.quaternion.copy(camera.quaternion);
    // 距離によらず画面上で同じ大きさに見えるようにする
    const distance = camera.position.distanceTo(this.tmp);
    this.marker.scale.setScalar(Math.max(0.08, distance * 0.045));
  }
}

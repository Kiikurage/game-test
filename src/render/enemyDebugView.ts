import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicNodeMaterial,
  LineSegments,
  Quaternion,
  Vector3,
  type Camera,
  type Scene,
} from 'three/webgpu';
import { ENEMY_VISION } from '../game/data';
import type { Enemy } from '../game/enemy/enemy';
import { isCombatState, type EnemyStateId } from '../game/enemy/enemyStates';

const DEG = Math.PI / 180;
/** 床からの高さ（地形に埋まらないよう少し浮かせる）。 */
const LIFT = 0.15;
const ARC_STEPS = 28;

/** 状態ごとの色（緑 = 平常、黄 = 警戒、赤 = 戦闘、青 = 帰還、灰 = 行動不能）。 */
const STATE_COLOR: Record<EnemyStateId, number> = {
  idle: 0x6fd36f,
  suspicious: 0xf2d24a,
  alert: 0xff7a3a,
  chase: 0xff3a3a,
  approach: 0xff3a3a,
  attack: 0xff3a3a,
  recover: 0xff3a3a,
  return: 0x4aa3ff,
  staggered: 0xb0b0b0,
  dead: 0x606060,
};

/** 扇（敵の正面 ±半角）の線: 両端の辺・外周の弧・距離帯（3m / 8m）の弧・感度が最大の ±40° の辺。 */
function fanGeometry(): BufferGeometry {
  const pts: number[] = [];
  const seg = (ax: number, az: number, bx: number, bz: number) => {
    pts.push(ax, LIFT, az, bx, LIFT, bz);
  };
  const dir = (deg: number, r: number): [number, number] => [
    Math.sin(deg * DEG) * r,
    Math.cos(deg * DEG) * r,
  ];
  const half = ENEMY_VISION.fovDeg / 2;
  const edge = (deg: number, r: number) => {
    const [x, z] = dir(deg, r);
    seg(0, 0, x, z);
  };
  edge(-half, ENEMY_VISION.range);
  edge(half, ENEMY_VISION.range);
  const inner = ENEMY_VISION.angleBands[0].withinDeg;
  edge(-inner, ENEMY_VISION.range);
  edge(inner, ENEMY_VISION.range);
  for (const band of ENEMY_VISION.distanceBands) {
    for (let i = 0; i < ARC_STEPS; i++) {
      const a = -half + (i / ARC_STEPS) * half * 2;
      const b = -half + ((i + 1) / ARC_STEPS) * half * 2;
      const [ax, az] = dir(a, band.upTo);
      const [bx, bz] = dir(b, band.upTo);
      seg(ax, az, bx, bz);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return geometry;
}

/** 戦闘中の視認範囲（全周）の円。 */
function ringGeometry(radius: number): BufferGeometry {
  const pts: number[] = [];
  const steps = 48;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const b = ((i + 1) / steps) * Math.PI * 2;
    pts.push(
      Math.sin(a) * radius,
      LIFT,
      Math.cos(a) * radius,
      Math.sin(b) * radius,
      LIFT,
      Math.cos(b) * radius,
    );
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return geometry;
}

interface Item {
  readonly enemy: Enemy;
  readonly group: Group;
  readonly fan: LineSegments;
  readonly ring: LineSegments;
  readonly material: LineBasicNodeMaterial;
  readonly label: HTMLDivElement;
}

/**
 * `?debug` の敵の可視化: 視野の扇（Idle / Suspicious）または視認範囲の円（戦闘中）を地面に描き、
 * 頭上に状態名・気付きゲージ・見失いの経過を出す。スクリーンショットや調整用で、通常のプレイでは出さない。
 */
export class EnemyDebugView {
  private readonly items: Item[] = [];
  private readonly container = document.createElement('div');
  private readonly position = new Vector3();
  private readonly orientation = new Quaternion();
  private readonly projected = new Vector3();

  constructor(
    private readonly scene: Scene,
    enemies: readonly Enemy[],
  ) {
    this.container.className = 'enemy-debug';
    Object.assign(this.container.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '15',
      overflow: 'hidden',
    });
    document.body.appendChild(this.container);

    const fan = fanGeometry();
    const ring = ringGeometry(ENEMY_VISION.range);
    for (const enemy of enemies) {
      const material = new LineBasicNodeMaterial({ color: 0x6fd36f });
      material.depthTest = false;
      material.transparent = true;
      material.opacity = 0.85;
      const fanLines = new LineSegments(fan, material);
      const ringLines = new LineSegments(ring, material);
      fanLines.renderOrder = ringLines.renderOrder = 10;
      fanLines.frustumCulled = ringLines.frustumCulled = false;
      const group = new Group();
      group.add(fanLines, ringLines);
      scene.add(group);

      const label = document.createElement('div');
      Object.assign(label.style, {
        position: 'absolute',
        transform: 'translate(-50%, -100%)',
        padding: '1px 5px',
        borderRadius: '3px',
        background: 'rgb(0 0 0 / 0.6)',
        color: '#fff',
        font: '11px/1.3 ui-monospace, monospace',
        whiteSpace: 'pre',
        textAlign: 'center',
      });
      this.container.appendChild(label);
      this.items.push({ enemy, group, fan: fanLines, ring: ringLines, material, label });
    }
  }

  update(alpha: number, camera: Camera): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (const item of this.items) {
      const { enemy, group, material, label } = item;
      enemy.transform.sample(alpha, this.position, this.orientation);
      group.position.copy(this.position);
      group.quaternion.copy(this.orientation);
      const state = enemy.state;
      const combat = isCombatState(state);
      item.fan.visible = !combat && state !== 'dead';
      item.ring.visible = combat;
      material.color.setHex(STATE_COLOR[state]);

      this.projected.set(this.position.x, this.position.y + enemy.height + 0.35, this.position.z);
      this.projected.project(camera);
      const visible = this.projected.z < 1 && Math.abs(this.projected.x) < 1.2;
      label.style.display = visible ? 'block' : 'none';
      if (!visible) continue;
      label.style.left = `${(this.projected.x * 0.5 + 0.5) * w}px`;
      label.style.top = `${(-this.projected.y * 0.5 + 0.5) * h}px`;
      const lost = enemy.lostFrames > 0 ? ` lost ${(enemy.lostFrames / 60).toFixed(1)}s` : '';
      label.textContent = `${state}\ngauge ${Math.round(enemy.gauge)}${lost}`;
      label.style.color = `#${STATE_COLOR[state].toString(16).padStart(6, '0')}`;
    }
  }

  dispose(): void {
    for (const item of this.items) {
      this.scene.remove(item.group);
      item.material.dispose();
    }
    this.items.length = 0;
    this.container.remove();
  }
}

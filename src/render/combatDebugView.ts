import {
  BufferAttribute,
  BufferGeometry,
  LineBasicNodeMaterial,
  LineSegments,
  type Object3D,
} from 'three/webgpu';
import type { Capsule } from '../game/combat/geometry';
import type { HitResolver } from '../game/combat/hitResolver';
import type { HitShape, SectorShape } from '../game/combat/shapes';

/** ?debug の判定可視化。ハートボックス（被弾判定）とヒットボックス（攻撃判定）をワイヤで描く。 */

type Rgb = readonly [number, number, number];

const COLOR_HEART_PLAYER: Rgb = [0.25, 1, 0.45];
const COLOR_HEART_ENEMY: Rgb = [0.3, 0.8, 1];
const COLOR_HEART_INVULN: Rgb = [0.55, 0.55, 0.75];
const COLOR_HIT: Rgb = [1, 0.25, 0.2];
const COLOR_HIT_CONNECTED: Rgb = [1, 0.92, 0.2];
const COLOR_HIT_GHOST: Rgb = [0.6, 0.18, 0.15];

const MAX_VERTICES = 24000;
const RING_SEGMENTS = 16;
const ARC_SEGMENTS = 24;

class WireBuilder {
  readonly positions = new Float32Array(MAX_VERTICES * 3);
  readonly colors = new Float32Array(MAX_VERTICES * 3);
  count = 0;

  reset(): void {
    this.count = 0;
  }

  line(ax: number, ay: number, az: number, bx: number, by: number, bz: number, c: Rgb): void {
    if (this.count + 2 > MAX_VERTICES) return;
    const i = this.count * 3;
    const p = this.positions;
    const col = this.colors;
    p[i] = ax;
    p[i + 1] = ay;
    p[i + 2] = az;
    p[i + 3] = bx;
    p[i + 4] = by;
    p[i + 5] = bz;
    for (let k = 0; k < 2; k++) {
      col[i + k * 3] = c[0];
      col[i + k * 3 + 1] = c[1];
      col[i + k * 3 + 2] = c[2];
    }
    this.count += 2;
  }

  /** カプセルのワイヤ（両端の輪・縦線・半球の弧）。 */
  capsule(cap: Capsule, c: Rgb): void {
    const ax = cap.a.x;
    const ay = cap.a.y;
    const az = cap.a.z;
    const dx = cap.b.x - ax;
    const dy = cap.b.y - ay;
    const dz = cap.b.z - az;
    const len = Math.hypot(dx, dy, dz);
    // 軸 w と直交基底 u, v
    const wx = len > 1e-6 ? dx / len : 0;
    const wy = len > 1e-6 ? dy / len : 1;
    const wz = len > 1e-6 ? dz / len : 0;
    let ux = wy * 0 - wz * 1;
    let uy = wz * 0 - wx * 0;
    let uz = wx * 1 - wy * 0;
    if (Math.hypot(ux, uy, uz) < 1e-3) {
      ux = 1;
      uy = 0;
      uz = 0;
    }
    const un = Math.hypot(ux, uy, uz);
    ux /= un;
    uy /= un;
    uz /= un;
    const vx = wy * uz - wz * uy;
    const vy = wz * ux - wx * uz;
    const vz = wx * uy - wy * ux;
    const r = cap.radius;
    const at = (bx: number, by: number, bz: number, ca: number, sa: number) =>
      [
        bx + (ux * ca + vx * sa) * r,
        by + (uy * ca + vy * sa) * r,
        bz + (uz * ca + vz * sa) * r,
      ] as const;
    // 両端の輪
    for (const [bx, by, bz] of [
      [ax, ay, az],
      [cap.b.x, cap.b.y, cap.b.z],
    ] as const) {
      for (let i = 0; i < RING_SEGMENTS; i++) {
        const t0 = (i / RING_SEGMENTS) * Math.PI * 2;
        const t1 = ((i + 1) / RING_SEGMENTS) * Math.PI * 2;
        const p0 = at(bx, by, bz, Math.cos(t0), Math.sin(t0));
        const p1 = at(bx, by, bz, Math.cos(t1), Math.sin(t1));
        this.line(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], c);
      }
    }
    // 縦線
    for (let k = 0; k < 4; k++) {
      const t = (k / 4) * Math.PI * 2;
      const p0 = at(ax, ay, az, Math.cos(t), Math.sin(t));
      const p1 = at(cap.b.x, cap.b.y, cap.b.z, Math.cos(t), Math.sin(t));
      this.line(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], c);
    }
    // 半球の弧（u 面と v 面）
    for (const plane of [0, 1]) {
      for (const [end, sign] of [
        [cap.a, -1],
        [cap.b, 1],
      ] as const) {
        for (let i = 0; i < ARC_SEGMENTS / 2; i++) {
          const t0 = (i / (ARC_SEGMENTS / 2)) * Math.PI;
          const t1 = ((i + 1) / (ARC_SEGMENTS / 2)) * Math.PI;
          const pt = (t: number) => {
            // 軸方向の高さ sin(t)、横方向 cos(t)
            const side = Math.cos(t) * r;
            const up = Math.sin(t) * r * sign;
            const sx = plane === 0 ? ux : vx;
            const sy = plane === 0 ? uy : vy;
            const sz = plane === 0 ? uz : vz;
            return [
              end.x + sx * side + wx * up,
              end.y + sy * side + wy * up,
              end.z + sz * side + wz * up,
            ] as const;
          };
          const p0 = pt(t0);
          const p1 = pt(t1);
          this.line(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], c);
        }
      }
    }
  }

  /** 扇形（全周は円）。上下の面の輪郭と、辺の縦線。 */
  sector(s: SectorShape, c: Rgb): void {
    const full = s.arcDeg >= 360;
    const half = (s.arcDeg * Math.PI) / 360;
    const y0 = s.origin.y + s.yMin;
    const y1 = s.origin.y + s.yMax;
    const point = (yaw: number, d: number): readonly [number, number] => [
      s.origin.x + Math.sin(yaw) * d,
      s.origin.z + Math.cos(yaw) * d,
    ];
    const n = full ? 48 : Math.max(8, Math.ceil(s.arcDeg / 5));
    const start = full ? 0 : s.yaw - half;
    const span = full ? Math.PI * 2 : half * 2;
    for (const y of [y0, y1]) {
      for (let i = 0; i < n; i++) {
        const p0 = point(start + (i / n) * span, s.range);
        const p1 = point(start + ((i + 1) / n) * span, s.range);
        this.line(p0[0], y, p0[1], p1[0], y, p1[1], c);
      }
      if (!full) {
        for (const yaw of [s.yaw - half, s.yaw + half]) {
          const p = point(yaw, s.range);
          this.line(s.origin.x, y, s.origin.z, p[0], y, p[1], c);
        }
      }
    }
    for (const yaw of full
      ? [0, Math.PI / 2, Math.PI, -Math.PI / 2]
      : [s.yaw - half, s.yaw + half]) {
      const p = point(yaw, s.range);
      this.line(p[0], y0, p[1], p[0], y1, p[1], c);
    }
  }

  shape(shape: HitShape, c: Rgb): void {
    if (shape.kind === 'capsule') this.capsule(shape.capsule, c);
    else this.sector(shape, c);
  }
}

/** 判定の可視化ビュー。`root` をシーンに足し、毎フレーム `update()` を呼ぶ。 */
export class CombatDebugView {
  readonly root: Object3D;
  private readonly builder = new WireBuilder();
  private readonly geometry = new BufferGeometry();
  private readonly positionAttr = new BufferAttribute(this.builder.positions, 3);
  private readonly colorAttr = new BufferAttribute(this.builder.colors, 3);
  /** ハートボックス（被弾判定）を描くか。戦闘デバッグ HUD のトグルが切り替える。 */
  showHeartboxes = true;
  /** ヒットボックス（攻撃判定）を描くか。 */
  showHitboxes = true;

  constructor(private readonly resolver: HitResolver) {
    this.positionAttr.setUsage(35048); // DynamicDrawUsage
    this.colorAttr.setUsage(35048);
    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('color', this.colorAttr);
    this.geometry.setDrawRange(0, 0);
    const material = new LineBasicNodeMaterial({
      vertexColors: true,
      depthTest: false,
      transparent: true,
    });
    const lines = new LineSegments(this.geometry, material);
    lines.frustumCulled = false;
    lines.renderOrder = 1000;
    this.root = lines;
  }

  update(): void {
    const b = this.builder;
    b.reset();
    for (const target of this.showHeartboxes ? this.resolver.allTargets.values() : []) {
      const color = target.invulnerable
        ? COLOR_HEART_INVULN
        : target.team === 'player'
          ? COLOR_HEART_PLAYER
          : COLOR_HEART_ENEMY;
      for (const box of target.heartboxes) b.capsule(box, color);
    }
    for (const attack of this.showHitboxes ? this.resolver.activeAttacks : []) {
      if (attack.lastShape) {
        b.shape(attack.lastShape, attack.hitFlash < 6 ? COLOR_HIT_CONNECTED : COLOR_HIT);
      }
    }
    for (const { attack } of this.showHitboxes ? this.resolver.recentAttacks : []) {
      if (attack.lastShape) {
        b.shape(
          attack.lastShape,
          attack.hitTargets.size > 0 ? COLOR_HIT_CONNECTED : COLOR_HIT_GHOST,
        );
      }
    }
    this.geometry.setDrawRange(0, b.count);
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
  }
}

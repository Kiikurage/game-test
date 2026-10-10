import {
  BufferAttribute,
  BufferGeometry,
  Group,
  LineBasicNodeMaterial,
  LineSegments,
  type Object3D,
} from 'three/webgpu';
import type { GridNavigator } from '../game/enemy/gridNavigator';

/**
 * ?debug の敵ナビゲーションの可視化。歩ける範囲の縁（青緑。門が閉じている間は門の部分も縁になる）と、
 * 各敵の残りの経路（黄）を地面に描く。縁は門の開閉（`grid.version`）で作り直す。
 */

/** 床からの高さ（地形に埋まらないよう少し浮かせる）。 */
const LIFT = 0.18;
const MAX_PATH_VERTICES = 8192;

export class NavDebugView {
  readonly root: Object3D;
  private readonly group = new Group();
  private readonly edges: LineSegments;
  private readonly pathPositions = new Float32Array(MAX_PATH_VERTICES * 3);
  private readonly pathGeometry = new BufferGeometry();
  private readonly pathAttr = new BufferAttribute(this.pathPositions, 3);
  private builtVersion = -1;

  constructor(private readonly navigator: GridNavigator) {
    const edgeMaterial = new LineBasicNodeMaterial({
      color: 0x2fd6c8,
      transparent: true,
      opacity: 0.7,
    });
    edgeMaterial.depthTest = false;
    this.edges = new LineSegments(new BufferGeometry(), edgeMaterial);
    this.edges.frustumCulled = false;
    this.edges.renderOrder = 900;

    this.pathAttr.setUsage(35048); // DynamicDrawUsage
    this.pathGeometry.setAttribute('position', this.pathAttr);
    this.pathGeometry.setDrawRange(0, 0);
    const pathMaterial = new LineBasicNodeMaterial({ color: 0xffd23f, transparent: true });
    pathMaterial.depthTest = false;
    const paths = new LineSegments(this.pathGeometry, pathMaterial);
    paths.frustumCulled = false;
    paths.renderOrder = 901;

    this.group.add(this.edges, paths);
    this.root = this.group;
  }

  update(): void {
    const grid = this.navigator.grid;
    if (this.builtVersion !== grid.version) {
      this.builtVersion = grid.version;
      this.rebuildEdges();
    }
    let n = 0;
    const p = this.pathPositions;
    const point = (x: number, z: number) => {
      p[n++] = x;
      p[n++] = grid.heightAtPoint(x, z) + LIFT;
      p[n++] = z;
    };
    for (const path of this.navigator.debugPaths()) {
      for (let i = 1; i < path.points.length; i++) {
        if (n + 6 > p.length) break;
        const a = path.points[i - 1];
        const b = path.points[i];
        if (!a || !b) continue;
        point(a.x, a.z);
        point(b.x, b.z);
      }
    }
    this.pathAttr.needsUpdate = true;
    this.pathGeometry.setDrawRange(0, n / 3);
  }

  dispose(): void {
    this.edges.geometry.dispose();
    this.pathGeometry.dispose();
  }

  /** 歩けるセルと歩けないセルの境の辺を線分にする。 */
  private rebuildEdges(): void {
    const g = this.navigator.grid;
    const s = g.cellSize;
    const out: number[] = [];
    const seg = (x0: number, z0: number, x1: number, z1: number, h: number) => {
      out.push(x0, h, z0, x1, h, z1);
    };
    for (let iz = 0; iz < g.rows; iz++) {
      for (let ix = 0; ix < g.cols; ix++) {
        if (!g.isWalkable(ix, iz)) continue;
        const x0 = g.minX + ix * s;
        const z0 = g.minZ + iz * s;
        const h = (g.height[g.index(ix, iz)] ?? 0) + LIFT;
        if (!g.isWalkable(ix - 1, iz)) seg(x0, z0, x0, z0 + s, h);
        if (!g.isWalkable(ix + 1, iz)) seg(x0 + s, z0, x0 + s, z0 + s, h);
        if (!g.isWalkable(ix, iz - 1)) seg(x0, z0, x0 + s, z0, h);
        if (!g.isWalkable(ix, iz + 1)) seg(x0, z0 + s, x0 + s, z0 + s, h);
      }
    }
    this.edges.geometry.dispose();
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(out), 3));
    this.edges.geometry = geometry;
  }
}

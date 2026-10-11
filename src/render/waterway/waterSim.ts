import {
  HalfFloatType,
  LinearFilter,
  StorageBufferAttribute,
  StorageTexture,
  Vector4,
  type ComputeNode,
  type Node,
  type WebGPURenderer,
} from 'three/webgpu';
import {
  Fn,
  If,
  Loop,
  Return,
  abs,
  clamp,
  exp,
  float,
  instanceIndex,
  int,
  max,
  min,
  select,
  storage,
  textureStore,
  uniform,
  uniformArray,
  uvec2,
  vec4,
} from 'three/tsl';
import type { WaterGrid } from './waterLayout';

/**
 * 地下水路の水面の波（#270）。水路全体を覆う高さ場の波動方程式を GPU（compute）で解く。
 *
 * - 格子は `WaterGrid`（セル 6〜12cm。品質で変える）。陸のセルは境界（ノイマン条件: 壁で反射する）。
 * - 1 ステップ = ゲームの固定ステップ 1 回（60Hz）。描画が何ステップ進んだかは `waterWake`（game 側）の記録で決まるので、
 *   実時間に依存しない。陽解法の 2 段（h_next = h + (h - h_prev)·damping + k·∇²h）で、ping-pong の 2 バッファ。
 * - 外力（足の押し分け・足音・ローリング・着地・雫）はステップごとに最大 `MAX_IMPULSES` 個の
 *   (x, z, 半径, 強さ) で、体積を保つ「メキシカンハット」の山（中心が盛り上がり周りが沈む）として高さに足す。
 * - 泡（白く砕けた所）も格子に持つ。強い外力と急な曲率で増え、ステップごとに減衰する。
 * - 描画用に、フレームに 1 回だけ (高さ, ∂h/∂x, ∂h/∂z, 泡) を半精度のストレージテクスチャへ焼く（線形補間で引ける）。
 */

/** 1 ステップの外力の最大数。 */
export const MAX_IMPULSES = 24;

export interface WaterSimOptions {
  /** 波の速さ（m/s）。浅い水の重力波 √(g·h) ≈ 1.2m/s より少し遅くして、波紋を目で追えるようにする。 */
  readonly waveSpeed?: number;
  /** 1 ステップあたりの速度の減衰（1 = 減衰なし）。 */
  readonly damping?: number;
}

const WORKGROUP = 64;

export class WaterSim {
  readonly texture: StorageTexture;
  readonly grid: WaterGrid;
  private readonly steps: [ComputeNode, ComputeNode];
  private readonly bakes: [ComputeNode, ComputeNode];
  private readonly impulses: Vector4[];
  private readonly impulseCount = uniform(0, 'int');
  /** 0 = 現在の高さは A、1 = B。 */
  private parity = 0;
  private pending = 0;
  private dirty = true;
  /** 進めたステップ数。 */
  stepCount = 0;

  constructor(
    private readonly renderer: WebGPURenderer,
    grid: WaterGrid,
    options: WaterSimOptions = {},
  ) {
    this.grid = grid;
    const { nx, nz, cell } = grid;
    const n = nx * nz;
    const dt = 1 / 60;
    const c = options.waveSpeed ?? 0.85;
    const k = Math.min(0.45, ((c * dt) / cell) ** 2);
    const damping = options.damping ?? 0.988;

    const buffer = (data?: Float32Array) =>
      storage(new StorageBufferAttribute(data ?? new Float32Array(n), 1), 'float', n);
    const maskData = new Float32Array(n);
    for (let i = 0; i < n; i++) maskData[i] = grid.mask[i] ?? 0;
    const mask = buffer(maskData).toReadOnly();
    const hA = buffer();
    const hB = buffer();
    const foam = buffer();

    this.impulses = Array.from({ length: MAX_IMPULSES }, () => new Vector4(0, 0, 1, 0));
    const imp = uniformArray(this.impulses, 'vec4');

    const texture = new StorageTexture(nx, nz);
    texture.type = HalfFloatType;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    this.texture = texture;

    const originX = float(grid.originX);
    const originZ = float(grid.originZ);
    const cellN = float(cell);
    const W = int(nx);
    const count = this.impulseCount;

    const makeStep = (cur: typeof hA, prev: typeof hA): ComputeNode =>
      Fn(() => {
        const i = int(instanceIndex);
        If(i.greaterThanEqual(int(n)), () => {
          Return();
        });
        If(mask.element(i).lessThan(0.5), () => {
          Return();
        });
        const h = cur.element(i).toVar();
        const nb = (j: Node<'int'>): Node<'float'> =>
          select<'float'>(mask.element(j).greaterThan(0.5), cur.element(j), h);
        const sum = nb(i.add(1))
          .add(nb(i.sub(1)))
          .add(nb(i.add(W)))
          .add(nb(i.sub(W)));
        const lap = sum.sub(h.mul(4));
        const vel = h.sub(prev.element(i));
        const next = h.add(vel.mul(damping)).add(lap.mul(k)).mul(0.9993).toVar();
        // 外力
        const x = i.mod(W);
        const z = i.div(W);
        const wx = originX.add(float(x).add(0.5).mul(cellN));
        const wz = originZ.add(float(z).add(0.5).mul(cellN));
        const kick = float(0).toVar();
        Loop({ start: int(0), end: count, type: 'int', condition: '<' }, ({ i: m }) => {
          const p = imp.element(m) as unknown as Node<'vec4'>;
          const dx = wx.sub(p.x);
          const dz = wz.sub(p.y);
          const q = dx.mul(dx).add(dz.mul(dz)).div(p.z.mul(p.z));
          If(q.lessThan(9), () => {
            // 体積を保つ山: (1 - q)·e^(-q)
            next.addAssign(p.w.mul(float(1).sub(q)).mul(exp(q.negate())));
            kick.addAssign(abs(p.w).mul(exp(q.negate())));
          });
        });
        prev.element(i).assign(clamp(next, -0.04, 0.04));
        // 泡: 外力と急な曲率で増え、ゆっくり消える
        const f = foam.element(i);
        const gain = kick.mul(10).add(max(abs(lap).sub(0.0025), 0).mul(10));
        f.assign(min(f.mul(0.986).add(gain), 1));
      })().compute(n, [WORKGROUP]);

    const makeBake = (cur: typeof hA): ComputeNode =>
      Fn(() => {
        const i = int(instanceIndex);
        If(i.greaterThanEqual(int(n)), () => {
          Return();
        });
        const x = i.mod(W);
        const z = i.div(W);
        const coord = uvec2(x.toUint(), z.toUint());
        If(mask.element(i).lessThan(0.5), () => {
          textureStore(texture, coord, vec4(0, 0, 0, 0)).toWriteOnly();
          Return();
        });
        const h = cur.element(i);
        const nb = (j: Node<'int'>): Node<'float'> =>
          select<'float'>(mask.element(j).greaterThan(0.5), cur.element(j), h);
        const inv = float(0.5 / cell);
        const gx = nb(i.add(1))
          .sub(nb(i.sub(1)))
          .mul(inv);
        const gz = nb(i.add(W))
          .sub(nb(i.sub(W)))
          .mul(inv);
        textureStore(texture, coord, vec4(h, gx, gz, foam.element(i))).toWriteOnly();
      })().compute(n, [WORKGROUP]);

    this.steps = [makeStep(hA, hB), makeStep(hB, hA)];
    this.bakes = [makeBake(hA), makeBake(hB)];
  }

  /** 次のステップの外力を足す（`step` で消費される）。溢れた分は捨てる。 */
  addImpulse(x: number, z: number, radius: number, strength: number): void {
    if (this.pending >= MAX_IMPULSES) return;
    this.impulses[this.pending]?.set(x, z, Math.max(radius, this.grid.cell * 0.75), strength);
    this.pending++;
  }

  /** 1 ステップ進める（溜めた外力を使い切る）。 */
  step(): void {
    this.impulseCount.value = this.pending;
    const node = this.steps[this.parity];
    if (node) void this.renderer.compute(node);
    // step は「prev」へ書くので、書いた側が新しい現在
    this.parity = 1 - this.parity;
    this.pending = 0;
    this.dirty = true;
    this.stepCount++;
  }

  /** 進めたステップがあれば描画用のテクスチャへ焼く（フレームに 1 回）。 */
  bake(): void {
    if (!this.dirty) return;
    const node = this.bakes[this.parity];
    if (node) void this.renderer.compute(node);
    this.dirty = false;
  }
}

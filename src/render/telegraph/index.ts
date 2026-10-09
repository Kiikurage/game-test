import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicNodeMaterial,
  type Node,
  type UniformNode,
} from 'three/webgpu';
import {
  abs,
  attribute,
  clamp,
  float,
  length,
  mix,
  mx_worley_noise_vec2,
  smoothstep,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import { terrainHeight } from '../terrain';
import {
  GROUND_LIFT,
  createDiscMesh,
  createStripMesh,
  placeOnTerrain,
  type HeightFn,
  type TelegraphMesh,
} from './geometry';
import { DEFAULT_BLINK, TelegraphClock, type BlinkParams } from './timing';

export { APPEAR_FRAMES, DEFAULT_BLINK, FADE_OUT_FRAMES, TelegraphClock } from './timing';
export type { BlinkParams } from './timing';

type Kind = 'circle' | 'shadow' | 'line';

const POOL_SIZE: Record<Kind, number> = { circle: 6, shadow: 3, line: 6 };

/** 帯の標準の幅（m）。仕様 6.3 節 技 7 の灰の波は幅 1.5m。 */
export const DEFAULT_LINE_WIDTH = 1.5;

interface Uniforms {
  appear: UniformNode<'float', number>;
  blink: UniformNode<'float', number>;
  fade: UniformNode<'float', number>;
  frame: UniformNode<'float', number>;
  /** 円: 半径(m)。帯: 幅(m)。 */
  sizeA: UniformNode<'float', number>;
  /** 帯: 長さ(m)。 */
  sizeB: UniformNode<'float', number>;
  /** 影の円: 0（遠い）→ 1（着地直前）。 */
  progress: UniformNode<'float', number>;
}

function createUniforms(): Uniforms {
  return {
    appear: uniform(0),
    blink: uniform(1),
    fade: uniform(0),
    frame: uniform(0),
    sizeA: uniform(1),
    sizeB: uniform(1),
    progress: uniform(0),
  };
}

function createMaterial(u: Uniforms, kind: Kind): MeshBasicNodeMaterial {
  const local = attribute('aLocal', 'vec2');
  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.side = DoubleSide;
  material.fog = false;
  // 地形メッシュとのわずかな高さの食い違いによるちらつきを避ける
  material.polygonOffset = true;
  material.polygonOffsetFactor = -2;
  material.polygonOffsetUnits = -2;

  // 地面が熾火色に灼け、ひび割れから光が漏れる表現。低彩度・低不透明度・柔らかい縁で世界観になじませ、
  // 範囲は「縁の灼け」と「ひびの密度」で読ませる。点滅は呼吸のようにゆっくり（暗側でも消えない）。
  const emberDim = vec3(0.62, 0.2, 0.07);
  const emberHot = vec3(1.0, 0.42, 0.12);
  const crack = (xy: Node<'vec2'>): Node<'float'> => {
    const w = mx_worley_noise_vec2(xy);
    return float(1).sub(smoothstep(0.0, 0.09, w.y.sub(w.x)));
  };

  if (kind === 'circle') {
    const rr = length(local).div(mix(float(0.82), float(1), u.appear));
    const soft = float(1).sub(smoothstep(0.9, 1.0, rr));
    // 縁ほど強く灼ける（中心は薄い）。外縁は柔らかく溶ける
    const rim = smoothstep(0.55, 0.95, rr).mul(soft);
    const edgeLine = smoothstep(0.86, 0.93, rr).mul(soft).mul(0.5);
    const cracks = crack(local.mul(u.sizeA).mul(0.38))
      .mul(smoothstep(0.1, 0.8, rr))
      .mul(soft);
    const glow = mix(float(0.55), float(1), u.blink);
    const a = rim.mul(0.2).add(soft.mul(0.12)).add(edgeLine).add(cracks.mul(0.5)).mul(glow);
    material.opacityNode = clamp(a, 0, 0.8).mul(u.appear).mul(u.fade);
    material.colorNode = mix(emberDim, emberHot, clamp(cracks.add(edgeLine), 0, 1));
  } else if (kind === 'shadow') {
    // 影の円（技 5 滞空中の着地点ガイド）: 暗い柔らかい円。着地が近いほど濃く締まり、縁がうっすら灼ける
    const rr = length(local).div(mix(float(0.75), float(1), u.appear));
    const body = float(1).sub(smoothstep(0.35, mix(float(1.0), float(0.85), u.progress), rr));
    const rim = smoothstep(0.88, 0.95, rr)
      .mul(float(1).sub(smoothstep(0.96, 1.0, rr)))
      .mul(mix(float(0.15), float(0.5), u.progress));
    const glowRim = rim.mul(mix(float(0.6), float(1), u.blink));
    const a = body.mul(mix(float(0.25), float(0.65), u.progress)).add(glowRim);
    material.opacityNode = clamp(a, 0, 0.8).mul(u.appear).mul(u.fade);
    material.colorNode = mix(vec3(0.012, 0.007, 0.007), emberHot, clamp(glowRim.mul(2.5), 0, 1));
  } else {
    // 帯（直線）: 柔らかい縁の灼け + ひび。進行方向の先ほど少し強く灼ける
    const halfW = u.sizeA.mul(0.5);
    const ax = abs(local.x).mul(2);
    const ex = ax.div(mix(float(0.4), float(1), u.appear));
    const soft = float(1).sub(smoothstep(0.8, 1.0, ex));
    const edge = smoothstep(
      float(1).sub(float(0.22).div(halfW)),
      float(1).sub(float(0.1).div(halfW)),
      ex,
    )
      .mul(soft)
      .mul(0.5);
    const cap = float(1)
      .sub(smoothstep(0.0, float(0.2).div(u.sizeB), local.y))
      .add(smoothstep(float(1).sub(float(0.2).div(u.sizeB)), 1.0, local.y))
      .mul(soft)
      .mul(0.3);
    const cracks = crack(vec2(local.x.mul(u.sizeA), local.y.mul(u.sizeB)).mul(0.4)).mul(soft);
    const glow = mix(float(0.55), float(1), u.blink);
    const along = mix(float(0.8), float(1.15), local.y);
    const a = soft.mul(0.13).add(edge).add(cap).add(cracks.mul(0.42)).mul(glow).mul(along);
    material.opacityNode = clamp(a, 0, 0.8).mul(u.appear).mul(u.fade);
    material.colorNode = mix(emberDim, emberHot, clamp(cracks.add(edge), 0, 1));
  }
  return material;
}

/** 地面予告 1 つ。`GroundTelegraphs` から取得し、`show()` / `hide()` で出現・消去を制御する。 */
export class Telegraph {
  readonly clock: TelegraphClock;
  /** @internal */
  readonly uniforms = createUniforms();
  /** @internal */
  readonly mesh: Mesh;
  /** @internal */
  releasing = false;
  /** @internal プール内で確保中か、確保時刻（古いものから再利用する）。 */
  inUse = false;
  /** @internal */
  stamp = 0;
  private readonly tmesh: TelegraphMesh;

  /** @internal */
  constructor(
    readonly kind: Kind,
    tmesh: TelegraphMesh,
    blink: BlinkParams,
    private readonly heightAt: HeightFn,
  ) {
    this.tmesh = tmesh;
    this.clock = new TelegraphClock(blink);
    this.mesh = new Mesh(tmesh.geometry, createMaterial(this.uniforms, kind));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    this.mesh.visible = false;
  }

  /** 予告の出現を開始する（8F で完全表示）。発生 F18 から出すのは呼び出し側の責務。 */
  show(): void {
    this.clock.show();
    this.sync();
  }

  /** 予告を消す（4F でフェードアウト）。 */
  hide(): void {
    this.clock.hide();
  }

  get visible(): boolean {
    return this.clock.visible;
  }

  /** 影の円の濃さ（0: 跳び上がり直後 → 1: 着地直前）。 */
  setProgress(p: number): void {
    this.uniforms.progress.value = Math.min(1, Math.max(0, p));
  }

  /** 円 / 影の円を (x, z) に置き直す。地形に合わせて頂点の高さを再計算する。 */
  placeCircle(x: number, z: number, radius: number): void {
    this.uniforms.sizeA.value = radius;
    placeOnTerrain(this.tmesh, x, z, 0, radius, radius, this.heightAt);
  }

  /** 帯を (x, z) から yaw 方向へ length だけ伸ばして置く。yaw は +z を 0 とし、ワールド +x 方向が +π/2。 */
  placeLine(x: number, z: number, yaw: number, length: number, width: number): void {
    this.uniforms.sizeA.value = width;
    this.uniforms.sizeB.value = length;
    placeOnTerrain(this.tmesh, x, z, yaw, width, length, this.heightAt);
  }

  /** @internal 時計の状態を uniform とメッシュ表示へ反映する。 */
  sync(): void {
    const c = this.clock;
    this.mesh.visible = c.visible;
    this.uniforms.appear.value = c.appear;
    this.uniforms.blink.value = c.blinkValue;
    this.uniforms.fade.value = c.fade;
    this.uniforms.frame.value = c.frame;
  }
}

export interface GroundTelegraphsOptions {
  /** 地形の高さ関数。省略時はテスト地形。 */
  heightAt?: HeightFn;
  /** 点滅パターン（周期・コントラストなど）の上書き。 */
  blink?: Partial<BlinkParams>;
}

/**
 * ボス技の地面予告（赤橙の円・直線、影の円）。
 * - 地形に沿うよう、固定トポロジのメッシュの頂点高さを配置時に地形へ合わせる。
 * - 予告はプール化（確保は初回のみ。満杯なら最も古いものを再利用）。
 * - 出現は 8F、点滅は色以外の手がかり（周期は既定 20F = 3Hz、暗側 0.3）。
 *
 * 使い方: `const t = telegraphs.line(x, z, yaw, 12); t.show(); ... t.hide();`
 * 毎フレーム `update(dt)`（またはシミュレーション駆動なら `advance(frames)`）を呼ぶ。
 */
export class GroundTelegraphs {
  readonly root = new Group();
  /** true の間は時計を進めない（デバッグ・撮影用）。 */
  paused = false;
  private readonly blink: BlinkParams;
  private readonly heightAt: HeightFn;
  private stampCounter = 0;
  private readonly items: Record<Kind, (Telegraph | null)[]>;

  constructor(options: GroundTelegraphsOptions = {}) {
    this.root.name = 'ground-telegraphs';
    this.heightAt = options.heightAt ?? terrainHeight;
    this.blink = { ...DEFAULT_BLINK, ...options.blink };
    this.items = {
      circle: new Array<Telegraph | null>(POOL_SIZE.circle).fill(null),
      shadow: new Array<Telegraph | null>(POOL_SIZE.shadow).fill(null),
      line: new Array<Telegraph | null>(POOL_SIZE.line).fill(null),
    };
  }

  /** 空きがあればそれを、なければ最も古く確保されたものを再利用する（実行時の確保は初回のみ）。 */
  private acquire(kind: Kind): Telegraph {
    const list = this.items[kind];
    let index = list.findIndex((t) => t === null || !t.inUse);
    if (index < 0) {
      index = 0;
      for (let i = 1; i < list.length; i++) {
        if ((list[i]?.stamp ?? 0) < (list[index]?.stamp ?? 0)) index = i;
      }
    }
    let t = list[index] ?? null;
    if (!t) {
      const mesh =
        kind === 'line'
          ? createStripMesh(LINE_ALONG, LINE_ACROSS)
          : createDiscMesh(DISC_RINGS, DISC_SEGMENTS);
      t = new Telegraph(kind, mesh, this.blink, this.heightAt);
      list[index] = t;
      this.root.add(t.mesh);
    }
    t.inUse = true;
    t.stamp = ++this.stampCounter;
    t.clock.reset();
    t.releasing = false;
    t.setProgress(0);
    return t;
  }

  /** 赤橙の円（跳躍叩きつけの着地範囲など）。show() するまで表示されない。 */
  circle(x: number, z: number, radius: number): Telegraph {
    const t = this.acquire('circle');
    t.placeCircle(x, z, radius);
    return t;
  }

  /** 影の円（技 5 の滞空中に着地点を示すガイド）。`setProgress` で着地が近いほど濃くなる。 */
  shadowCircle(x: number, z: number, radius: number): Telegraph {
    const t = this.acquire('shadow');
    t.placeCircle(x, z, radius);
    return t;
  }

  /** 赤橙の直線（灰の波など）。yaw は +z を 0 とする向き（atan2(dx, dz)）。 */
  line(x: number, z: number, yaw: number, length: number, width = DEFAULT_LINE_WIDTH): Telegraph {
    const t = this.acquire('line');
    t.placeLine(x, z, yaw, length, width);
    return t;
  }

  /** 予告を消してプールへ返す（フェードアウト後に再利用可能になる）。 */
  release(t: Telegraph): void {
    t.releasing = true;
    t.hide();
  }

  /** 描画駆動で時計を進める。 */
  update(dtSeconds: number): void {
    this.advance(Math.min(Math.max(dtSeconds, 0), 0.1) * 60);
  }

  /** シミュレーション駆動（60Hz のステップ数）で時計を進める。 */
  advance(frames: number): void {
    if (this.paused) return;
    for (const kind of KINDS) {
      const list = this.items[kind];
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (!t || (!t.visible && !t.releasing)) continue;
        t.clock.advance(frames);
        t.sync();
        if (t.releasing && !t.visible) {
          t.releasing = false;
          t.inUse = false;
        }
      }
    }
  }

  /** 表示中・フェード中の予告の数。 */
  get activeCount(): number {
    let n = 0;
    for (const kind of KINDS) for (const t of this.items[kind]) if (t?.visible) n++;
    return n;
  }
}

const KINDS: readonly Kind[] = ['circle', 'shadow', 'line'];
const DISC_RINGS = 8;
const DISC_SEGMENTS = 48;
const LINE_ALONG = 32;
const LINE_ACROSS = 6;

export { GROUND_LIFT };

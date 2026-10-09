import {
  AdditiveBlending,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  SpriteNodeMaterial,
  type Node,
  type UniformNode,
  Vector3,
} from 'three/webgpu';
import {
  attribute,
  clamp,
  dot,
  exp,
  float,
  floor,
  fract,
  length,
  cameraViewMatrix,
  atan,
  mix,
  pow,
  sin,
  smoothstep,
  step,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { SlotPool } from './slotPool';

export type F = Node<'float'>;
export type V3 = Node<'vec3'>;
export type V4 = Node<'vec4'>;
export type TimeUniform = UniformNode<'float', number>;

/** 乱数列（mulberry32）。シード固定で撮影が再現できる。 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0..1 の乱数を 3 つ返す GPU 側のハッシュ（サイクルごとの再抽選に使う）。 */
export function hash3(p: V3): V3 {
  const q = vec3(
    dot(p, vec3(127.1, 311.7, 74.7)),
    dot(p, vec3(269.5, 183.3, 246.1)),
    dot(p, vec3(113.5, 271.9, 124.6)),
  );
  return fract(sin(q).mul(43758.5453));
}

/** スプライトの形。 */
export type SpriteShape = 'soft' | 'flake' | 'spark';

function shapeAlpha(shape: SpriteShape): F {
  const c = uv().sub(0.5).mul(2);
  switch (shape) {
    case 'soft':
      return pow(clamp(float(1).sub(length(c)), 0, 1), 1.6);
    case 'flake':
      // 少し縦長の楕円。縁は硬めで、中心がわずかに明るい
      return smoothstep(1.0, 0.72, length(c.mul(vec2(1.0, 1.35)))).mul(0.85);
    case 'spark': {
      const d = length(c);
      return pow(clamp(float(1).sub(d), 0, 1), 2.2).add(smoothstep(0.35, 0.0, d).mul(0.6));
    }
  }
}

/** 1 粒子の見た目（ワールド座標・サイズ m・色・不透明度）。 */
export interface ParticleShade {
  position: V3;
  size: F;
  color: V3;
  alpha: F;
  rotation?: F;
  /** 縦横比（高さ = size × stretch）。炎の縦長の舌に使う。 */
  stretch?: F;
}

export type BlendMode = 'add' | 'normal';

function createGeometry(count: number): InstancedBufferGeometry {
  const plane = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.setAttribute('position', plane.getAttribute('position'));
  geometry.setAttribute('uv', plane.getAttribute('uv'));
  geometry.instanceCount = count;
  return geometry;
}

function createMesh(
  geometry: InstancedBufferGeometry,
  blend: BlendMode,
  shape: SpriteShape,
  shade: ParticleShade,
  alive: F,
): Mesh {
  const material = new SpriteNodeMaterial();
  material.positionNode = shade.position;
  material.scaleNode = vec2(
    shade.size,
    shade.stretch ? shade.size.mul(shade.stretch) : shade.size,
  ).mul(alive);
  if (shade.rotation) material.rotationNode = shade.rotation;
  material.colorNode = vec4(shade.color, 1);
  material.opacityNode = shade.alpha.mul(shapeAlpha(shape)).mul(alive);
  material.transparent = true;
  material.depthWrite = false;
  material.blending = blend === 'add' ? AdditiveBlending : NormalBlending;
  // 加算ブレンドの粒子にフォグを掛けると遠景で白く浮くため、通常ブレンドのみフォグを受ける
  material.fog = blend === 'normal';
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = blend === 'add' ? 11 : 10;
  return mesh;
}

// ---------------------------------------------------------------------------
// 連続エミッタ（環境の灰・篝火・熾火）: 位置・色・サイズをすべて頂点シェーダで時間の関数として計算する。
// CPU は毎フレーム時間 uniform と中心座標を更新するだけ。ステートレスなのでコンピュートパスもバッファ更新も要らない。
// ---------------------------------------------------------------------------

export interface ContinuousCtx {
  /** 粒子固有の固定乱数（xyz は位置・位相用、w は寿命のばらつき）。 */
  rnd: V4;
  /** 周回ごとに引き直す乱数。 */
  cyc: V3;
  /** 周回内の進行度 0..1 と経過秒、寿命秒。 */
  age01: F;
  age: F;
  life: F;
  /** 絶対時間（秒）。 */
  t: F;
  /** エミッタ中心（ワールド）。 */
  center: Node<'vec3'>;
  /** 0..1。点火・フェードイン/アウト用。0 で非表示。 */
  intensity: F;
}

export interface ContinuousSpec {
  count: number;
  blend: BlendMode;
  shape: SpriteShape;
  /** 寿命（秒）の範囲。 */
  life: readonly [number, number];
  seed: number;
  shade(ctx: ContinuousCtx): ParticleShade;
}

export class ContinuousLayer {
  readonly mesh: Mesh;
  readonly center = new Vector3();
  private readonly intensityU = uniform(1);

  constructor(spec: ContinuousSpec, time: TimeUniform) {
    const rng = createRng(spec.seed);
    const data = new Float32Array(spec.count * 4);
    for (let i = 0; i < data.length; i++) data[i] = rng();
    const geometry = createGeometry(spec.count);
    geometry.setAttribute('aRand', new InstancedBufferAttribute(data, 4));

    const rnd = attribute('aRand', 'vec4') as V4;
    const life = mix(float(spec.life[0]), float(spec.life[1]), rnd.w);
    const x = rnd.x.add(time.div(life));
    const cycle = floor(x);
    const age01 = fract(x);
    const cyc = hash3(rnd.xyz.add(cycle.mul(1.37)).add(vec3(0.5, 1.5, 2.5)));
    const centerU = uniform(this.center);
    const shade = spec.shade({
      rnd,
      cyc,
      age01,
      age: age01.mul(life),
      life,
      t: time,
      center: centerU,
      intensity: this.intensityU,
    });
    // intensity 0 の粒子は面積 0 にして描画負荷も省く
    this.mesh = createMesh(geometry, spec.blend, spec.shape, shade, step(0.001, this.intensityU));
  }

  get intensity(): number {
    return this.intensityU.value;
  }

  set intensity(v: number) {
    this.intensityU.value = v;
    this.mesh.visible = v > 0.001;
  }
}

// ---------------------------------------------------------------------------
// バーストエミッタ（ヒット火花・撃破の灰）: 発生時に CPU が粒子ブロック（スロット）へ初期値を書く。
// 以降の運動（抵抗つき放物運動）は GPU が解析式で計算する。スロットはリング的に再利用し、確保しない。
// ---------------------------------------------------------------------------

export interface BurstCtx {
  rnd: V4;
  origin: V3;
  vel: V3;
  /** ワールド座標での現在位置（初速・抵抗・重力から解析的に求めた値）。 */
  pos: V3;
  /** 現在の速度ベクトル（ワールド）。 */
  velNow: V3;
  /** 速度方向に画面上で細長く伸ばすための回転（rad）。スプリットの Y 軸が進行方向を向く。 */
  streakAngle: F;
  age: F;
  age01: F;
  life: F;
  t: F;
}

export interface BurstSpec {
  /** 1 スロット（1 回のバースト）あたりの最大粒数。 */
  slotSize: number;
  blend: BlendMode;
  shape: SpriteShape;
  /** 重力加速度（m/s²、下向きが負）。 */
  gravity: number;
  /** 速度の指数減衰係数（1/s）。 */
  drag: number;
  seed: number;
  shade(ctx: BurstCtx): ParticleShade;
}

/** 1 粒子の初期値（書き込み用の可変構造体。init 関数が埋める）。 */
export interface BurstParticleInit {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export type BurstInit<P> = (
  out: BurstParticleInit,
  index: number,
  count: number,
  params: P,
  rng: () => number,
) => void;

const DEAD_TIME = -1e6;

export class BurstLayer {
  readonly mesh: Mesh;
  readonly pool: SlotPool;
  readonly slotSize: number;
  private readonly origin: Float32Array;
  private readonly vel: Float32Array;
  private readonly rand: Float32Array;
  private readonly originAttr: InstancedBufferAttribute;
  private readonly velAttr: InstancedBufferAttribute;
  private readonly randAttr: InstancedBufferAttribute;
  private readonly expiry: Float64Array;
  private readonly scratch: BurstParticleInit = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 };
  private readonly rng: () => number;

  constructor(
    spec: BurstSpec,
    slots: number,
    private readonly time: TimeUniform,
  ) {
    this.slotSize = spec.slotSize;
    this.pool = new SlotPool(slots);
    this.rng = createRng(spec.seed);
    const total = Math.max(1, slots * spec.slotSize);
    this.origin = new Float32Array(total * 4);
    this.vel = new Float32Array(total * 4);
    this.rand = new Float32Array(total * 4);
    this.expiry = new Float64Array(Math.max(1, slots));
    for (let i = 0; i < total; i++) this.origin[i * 4 + 3] = DEAD_TIME;
    this.originAttr = new InstancedBufferAttribute(this.origin, 4);
    this.velAttr = new InstancedBufferAttribute(this.vel, 4);
    this.randAttr = new InstancedBufferAttribute(this.rand, 4);
    const geometry = createGeometry(slots * spec.slotSize);
    geometry.setAttribute('aOrigin', this.originAttr);
    geometry.setAttribute('aVel', this.velAttr);
    geometry.setAttribute('aRand', this.randAttr);

    const o4 = attribute('aOrigin', 'vec4') as V4;
    const v4 = attribute('aVel', 'vec4') as V4;
    const rnd = attribute('aRand', 'vec4') as V4;
    const age = this.time.sub(o4.w);
    const life = v4.w;
    const k = float(Math.max(spec.drag, 1e-3));
    const travel = float(1)
      .sub(exp(age.negate().mul(k)))
      .div(k);
    const pos = o4.xyz
      .add(v4.xyz.mul(travel))
      .add(vec3(0, 1, 0).mul(age.mul(age).mul(0.5 * spec.gravity)));
    const velNow = v4.xyz
      .mul(exp(age.negate().mul(k)))
      .add(vec3(0, 1, 0).mul(age.mul(spec.gravity)));
    const viewVel = cameraViewMatrix.mul(vec4(velNow, 0)).xyz;
    const streakAngle = atan(viewVel.x.negate(), viewVel.y);
    const shade = spec.shade({
      rnd,
      origin: o4.xyz,
      vel: v4.xyz,
      pos,
      velNow,
      streakAngle,
      age,
      age01: clamp(age.div(life), 0, 1),
      life,
      t: this.time,
    });
    // 寿命外（未使用スロット・期限切れ）は面積 0
    const alive = step(0, age).mul(step(age, life));
    this.mesh = createMesh(geometry, spec.blend, spec.shape, shade, alive);
    this.mesh.visible = slots > 0;
  }

  /**
   * count 粒のバーストを発生させる。`now` は時間 uniform と同じ時刻（秒）。
   * 満杯なら最も古いスロットを上書きする。実際に使った粒数を返す。
   */
  emit<P>(now: number, count: number, params: P, init: BurstInit<P>): number {
    if (this.pool.capacity === 0 || count <= 0) return 0;
    const n = Math.min(count, this.slotSize);
    const { index } = this.pool.acquire();
    const base = index * this.slotSize;
    const s = this.scratch;
    let maxLife = 0;
    for (let i = 0; i < this.slotSize; i++) {
      const o = (base + i) * 4;
      if (i < n) {
        s.life = 1;
        init(s, i, n, params, this.rng);
        this.origin[o] = s.x;
        this.origin[o + 1] = s.y;
        this.origin[o + 2] = s.z;
        this.origin[o + 3] = now;
        this.vel[o] = s.vx;
        this.vel[o + 1] = s.vy;
        this.vel[o + 2] = s.vz;
        this.vel[o + 3] = s.life;
        this.rand[o] = this.rng();
        this.rand[o + 1] = this.rng();
        this.rand[o + 2] = this.rng();
        this.rand[o + 3] = this.rng();
        if (s.life > maxLife) maxLife = s.life;
      } else {
        this.origin[o + 3] = DEAD_TIME;
        this.vel[o + 3] = 0;
      }
    }
    this.expiry[index] = now + maxLife;
    this.originAttr.needsUpdate = true;
    this.velAttr.needsUpdate = true;
    this.randAttr.needsUpdate = true;
    return n;
  }

  /** 寿命を過ぎたスロットを解放する。 */
  update(now: number): void {
    for (let i = 0; i < this.pool.capacity; i++) {
      if (this.pool.isActive(i) && now >= (this.expiry[i] ?? 0)) this.pool.release(i);
    }
  }

  get activeSlots(): number {
    return this.pool.activeCount;
  }

  clear(): void {
    this.pool.clear();
    for (let i = 0; i < this.origin.length; i += 4) this.origin[i + 3] = DEAD_TIME;
    this.originAttr.needsUpdate = true;
  }
}

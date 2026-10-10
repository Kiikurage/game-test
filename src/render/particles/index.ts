import { Group, PointLight, type Vector3 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import type { ParticleQuality } from '../quality';
import { burstCount } from './budget';
import { BurstLayer, ContinuousLayer, type BurstParticleInit, type TimeUniform } from './layer';
import {
  BURST_SPECS,
  ambientAshSpec,
  bonfireFlameSpec,
  bonfireSparkSpec,
  chargeGlintInit,
  deathAshInit,
  deathEmberInit,
  emberFieldSpec,
  hitDustInit,
  hitSparkInit,
  hitSplashInit,
  type DeathParams,
  type HitParams,
} from './presets';
import { SlotPool } from './slotPool';

export type { DeathParams, HitParams } from './presets';

/** 同時に置ける篝火 / 熾火フィールドの数（超えたら最も古いものを再利用）。 */
const MAX_BONFIRES = 3;
const MAX_EMBER_FIELDS = 2;

/** 篝火エミッタ。`ParticleSystem.acquireBonfire` で取得し、`release` で返す。 */
export class Bonfire {
  private readonly flames: ContinuousLayer;
  private readonly sparks: ContinuousLayer;
  private readonly light: PointLight | null;
  private lit = 0;
  private target = 1;
  readonly position = { x: 0, y: 0, z: 0 };
  /** 光の強さへの倍率（点火の閃光など。既定 1）。 */
  boost = 1;

  constructor(root: Group, q: ParticleQuality, time: TimeUniform, index: number) {
    this.flames = new ContinuousLayer(bonfireFlameSpec(q.bonfireFlames, 5100 + index), time);
    this.sparks = new ContinuousLayer(bonfireSparkSpec(q.bonfireSparks, 5200 + index), time);
    this.flames.intensity = 0;
    this.sparks.intensity = 0;
    root.add(this.flames.mesh, this.sparks.mesh);
    if (q.bonfireLight) {
      this.light = new PointLight(0xff8a3c, 0, 14, 2);
      root.add(this.light);
    } else {
      this.light = null;
    }
  }

  place(x: number, y: number, z: number): void {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
    this.flames.center.set(x, y, z);
    this.sparks.center.set(x, y, z);
    this.light?.position.set(x, y + 0.9, z);
  }

  /** 点火 / 消火（炎は約 0.6 秒でフェードする）。 */
  setLit(on: boolean): void {
    this.target = on ? 1 : 0;
  }

  get isLit(): boolean {
    return this.target > 0;
  }

  /** 完全に消えて描画されていない状態か。 */
  get isIdle(): boolean {
    return this.lit <= 0.001 && this.target === 0;
  }

  /** @internal */
  reset(): void {
    this.lit = 0;
    this.target = 1;
    this.boost = 1;
  }

  /** @internal */
  tick(dt: number, t: number): void {
    const step = dt / 0.6;
    if (this.lit < this.target) this.lit = Math.min(this.target, this.lit + step);
    else if (this.lit > this.target) this.lit = Math.max(this.target, this.lit - step);
    this.flames.intensity = this.lit;
    this.sparks.intensity = this.lit;
    if (this.light) {
      // 複数の周波数を重ねたゆらぎ（炎の呼吸）
      const f =
        0.82 +
        0.1 * Math.sin(t * 9.3) +
        0.06 * Math.sin(t * 17.1 + 1.3) +
        0.04 * Math.sin(t * 31.7 + 2.1);
      this.light.intensity = 38 * this.lit * f * this.boost;
    }
  }
}

/** 熾火フィールド（ボスの熾火・地面の残り火）。 */
export class EmberField {
  readonly layer: ContinuousLayer;
  private target = 1;
  private level = 0;

  constructor(
    root: Group,
    q: ParticleQuality,
    time: TimeUniform,
    radius: number,
    height: number,
    index: number,
  ) {
    this.layer = new ContinuousLayer(
      emberFieldSpec(q.emberField, radius, height, 6100 + index),
      time,
    );
    this.layer.intensity = 0;
    root.add(this.layer.mesh);
  }

  place(x: number, y: number, z: number): void {
    this.layer.center.set(x, y, z);
  }

  /** 熾火の出現 / 消失（約 1 秒でフェード）。 */
  setActive(on: boolean): void {
    this.target = on ? 1 : 0;
  }

  /** @internal */
  reset(): void {
    this.level = 0;
    this.target = 1;
  }

  /** @internal */
  tick(dt: number): void {
    if (this.level < this.target) this.level = Math.min(this.target, this.level + dt);
    else if (this.level > this.target) this.level = Math.max(this.target, this.level - dt);
    this.layer.intensity = this.level;
  }
}

export interface ParticleSystemStats {
  /** 現在描画対象の粒子数（上限ベース。ブロック確保数 + 連続エミッタの粒数）。 */
  readonly particles: number;
  readonly activeBursts: number;
  readonly drawLayers: number;
}

/**
 * パーティクル全体の管理。
 * - 連続エミッタ（環境の灰・篝火・熾火）は頂点シェーダで時間から位置を解く（ステートレス）。
 * - バースト（ヒット・撃破）は固定サイズのスロットプールへ初期値を書くだけで、実行時に確保しない。
 * - 個数は `QualityPreset.particles` に従う。
 * - three の Group を `root` として公開するので、シーンに 1 度 add する。
 */
export class ParticleSystem {
  readonly root = new Group();
  private readonly time: TimeUniform = uniform(0);
  private clock = 0;
  private readonly ash: ContinuousLayer | null;
  private readonly bursts: Record<keyof typeof BURST_SPECS, BurstLayer>;
  private readonly bonfirePool = new SlotPool(MAX_BONFIRES);
  private readonly bonfires: (Bonfire | null)[] = new Array<Bonfire | null>(MAX_BONFIRES).fill(
    null,
  );
  private readonly fieldPool = new SlotPool(MAX_EMBER_FIELDS);
  private readonly fields: (EmberField | null)[] = new Array<EmberField | null>(
    MAX_EMBER_FIELDS,
  ).fill(null);

  constructor(private readonly quality: ParticleQuality) {
    this.root.name = 'particles';
    if (quality.ambientAsh > 0) {
      this.ash = new ContinuousLayer(ambientAshSpec(quality.ambientAsh), this.time);
      this.root.add(this.ash.mesh);
    } else {
      this.ash = null;
    }
    const make = (key: keyof typeof BURST_SPECS): BurstLayer => {
      const layer = new BurstLayer(BURST_SPECS[key], quality.burstSlots, this.time);
      this.root.add(layer.mesh);
      return layer;
    };
    this.bursts = {
      spark: make('spark'),
      dust: make('dust'),
      splash: make('splash'),
      ash: make('ash'),
      ember: make('ember'),
    };
  }

  /** 毎フレーム呼ぶ。`follow` は環境の灰が追従する位置（プレイヤー）。 */
  update(dt: number, follow: Vector3): void {
    const step = Math.min(Math.max(dt, 0), 0.1);
    this.clock += step;
    this.time.value = this.clock;
    this.ash?.center.copy(follow);
    for (const layer of Object.values(this.bursts)) layer.update(this.clock);
    for (const b of this.bonfires) b?.tick(step, this.clock);
    for (const f of this.fields) f?.tick(step);
  }

  // --- 篝火 / 熾火（プール化されたエミッタ）---

  acquireBonfire(x: number, y: number, z: number): Bonfire {
    const { index } = this.bonfirePool.acquire();
    let b = this.bonfires[index] ?? null;
    if (!b) {
      b = new Bonfire(this.root, this.quality, this.time, index);
      this.bonfires[index] = b;
    }
    b.reset();
    b.place(x, y, z);
    return b;
  }

  releaseBonfire(b: Bonfire): void {
    const index = this.bonfires.indexOf(b);
    if (index < 0) return;
    b.setLit(false);
    this.bonfirePool.release(index);
  }

  acquireEmberField(x: number, y: number, z: number, radius = 2, height = 2.2): EmberField {
    const { index } = this.fieldPool.acquire();
    let f = this.fields[index] ?? null;
    if (!f) {
      f = new EmberField(this.root, this.quality, this.time, radius, height, index);
      this.fields[index] = f;
    }
    f.reset();
    f.place(x, y, z);
    return f;
  }

  releaseEmberField(f: EmberField): void {
    const index = this.fields.indexOf(f);
    if (index < 0) return;
    f.setActive(false);
    this.fieldPool.release(index);
  }

  // --- バースト ---

  /** ヒット時の火花・塵・黒い飛沫。normal は飛び散る向き（単位ベクトル）。 */
  hit(position: Vector3, normal: Vector3, power = 1): void {
    const p: HitParams = {
      x: position.x,
      y: position.y,
      z: position.z,
      nx: normal.x,
      ny: normal.y,
      nz: normal.z,
      power,
    };
    const q = this.quality;
    const t = this.clock;
    this.bursts.spark.emit(t, burstCount(Math.round(14 * power), q), p, hitSparkInit);
    this.bursts.dust.emit(t, burstCount(6, q), p, hitDustInit);
    this.bursts.splash.emit(t, burstCount(8, q), p, hitSplashInit);
  }

  /** 強攻撃のフル溜めの閃き（刃先の小さな火花。ヒット用の塵・飛沫は出さない）。 */
  chargeGlint(position: Vector3, power = 1): void {
    const p: HitParams = {
      x: position.x,
      y: position.y,
      z: position.z,
      nx: 0,
      ny: 1,
      nz: 0,
      power,
    };
    this.bursts.spark.emit(this.clock, burstCount(9, this.quality), p, chargeGlintInit);
  }

  /** 撃破時に体から灰と熾火が剥がれて舞い上がる（亡者のディゾルブ・ボスの熾火）。 */
  deathAsh(feet: Vector3, radius = 0.4, height = 1.8, rise = 1): void {
    const p: DeathParams = { x: feet.x, y: feet.y, z: feet.z, radius, height, rise };
    const q = this.quality;
    const scale = Math.max(1, (radius * height) / 0.7);
    this.bursts.ash.emit(
      this.clock,
      burstCount(Math.round(56 * Math.min(scale, 1.4)), q),
      p,
      deathAshInit,
    );
    this.bursts.ember.emit(
      this.clock,
      burstCount(Math.round(18 * Math.min(scale, 1.5)), q),
      p,
      deathEmberInit,
    );
  }

  get stats(): ParticleSystemStats {
    const q = this.quality;
    let particles = this.ash ? q.ambientAsh : 0;
    let activeBursts = 0;
    for (const layer of Object.values(this.bursts)) {
      activeBursts += layer.activeSlots;
      particles += layer.activeSlots * layer.slotSize;
    }
    for (const b of this.bonfires)
      if (b && !b.isIdle) particles += q.bonfireFlames + q.bonfireSparks;
    for (let i = 0; i < this.fields.length; i++)
      if (this.fieldPool.isActive(i)) particles += q.emberField;
    return {
      particles,
      activeBursts,
      drawLayers: this.root.children.filter((c) => c.visible).length,
    };
  }

  /** 全バーストを消す（リスポーン時など）。 */
  clearBursts(): void {
    for (const layer of Object.values(this.bursts)) layer.clear();
  }
}

export type { BurstParticleInit };

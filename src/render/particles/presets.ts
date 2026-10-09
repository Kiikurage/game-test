import {
  abs,
  clamp,
  cos,
  float,
  fract,
  length,
  max,
  mix,
  pow,
  sin,
  smoothstep,
  sqrt,
  vec3,
} from 'three/tsl';
import type {
  BurstInit,
  BurstSpec,
  ContinuousSpec,
  F,
  ParticleShade,
  ContinuousCtx,
  BurstCtx,
  V3,
} from './layer';

const TAU = Math.PI * 2;

/** 0 → 1 → 0 の山型（入りと抜けをなめらかにする）。 */
function fadeInOut(age01: F, inEnd: number, outStart: number): F {
  return smoothstep(0, inEnd, age01).mul(smoothstep(1, outStart, age01));
}

// ===========================================================================
// 環境の灰: プレイヤー周辺の箱の中をゆっくり漂い、箱の端で見えなくなってラップする
// ===========================================================================

/** 灰が舞う範囲（プレイヤー中心）。水平 ±HALF_XZ、高さ 0..HEIGHT。 */
const ASH_SIZE_XZ = 40;
const ASH_HEIGHT = 13;
const ASH_WIND = vec3(0.95, -0.2, 0.4);

export function ambientAshSpec(count: number): ContinuousSpec {
  return {
    count,
    blend: 'normal',
    shape: 'flake',
    // 位置は周回ではなく時間で決まるので寿命は一定でよい
    life: [60, 60],
    seed: 7101,
    shade: (c: ContinuousCtx): ParticleShade => {
      const { rnd, t, center } = c;
      const phase = rnd.xyz.mul(40);
      const sway = vec3(
        sin(t.mul(0.7).add(phase.x)),
        sin(t.mul(1.3).add(phase.y)).mul(0.5),
        cos(t.mul(0.55).add(phase.z)),
      ).mul(0.55);
      // 旋回する突風っぽいゆらぎ（粒子ごとに位相が違う）
      const gust = sin(t.mul(0.35).add(rnd.x.mul(6.28)))
        .mul(0.5)
        .add(1);
      const raw = rnd.xyz
        .mul(vec3(ASH_SIZE_XZ, ASH_HEIGHT, ASH_SIZE_XZ))
        .add(ASH_WIND.mul(t).mul(gust))
        .add(sway);
      // プレイヤーを中心に箱でラップ
      const wx = fract(raw.x.sub(center.x).div(ASH_SIZE_XZ).add(0.5)).sub(0.5);
      const wz = fract(raw.z.sub(center.z).div(ASH_SIZE_XZ).add(0.5)).sub(0.5);
      const wy = fract(raw.y.sub(center.y).div(ASH_HEIGHT));
      const position = vec3(
        center.x.add(wx.mul(ASH_SIZE_XZ)),
        center.y.add(wy.mul(ASH_HEIGHT)).sub(1.0),
        center.z.add(wz.mul(ASH_SIZE_XZ)),
      );
      // 箱の端・上下端でフェード（ラップの瞬間が見えない）
      const edge = smoothstep(0.5, 0.3, max(abs(wx), abs(wz)));
      const vert = smoothstep(0, 0.12, wy).mul(smoothstep(1, 0.8, wy));
      // ひらひら回転しながら光を拾ったり失ったりする
      const flip = abs(sin(t.mul(rnd.y.mul(2.2).add(0.8)).add(phase.y)))
        .mul(0.65)
        .add(0.2);
      const tone = rnd.z;
      const soot = vec3(0.1, 0.09, 0.085);
      const lit = vec3(0.85, 0.66, 0.46);
      return {
        position,
        size: rnd.w.mul(0.08).add(0.06),
        color: mix(soot, lit, smoothstep(0.25, 0.9, tone)),
        alpha: edge.mul(vert).mul(flip).mul(c.intensity).mul(0.9),
        rotation: t.mul(rnd.x.sub(0.5).mul(3)).add(phase.x),
      };
    },
  };
}

// ===========================================================================
// 篝火
// ===========================================================================

/** 炎: 下から立ち上る橙のビルボード。加算合成 + HDR でブルームに乗る。 */
export function bonfireFlameSpec(count: number, seed: number): ContinuousSpec {
  return {
    count,
    blend: 'add',
    shape: 'soft',
    life: [0.65, 1.1],
    seed,
    shade: (c: ContinuousCtx): ParticleShade => {
      const { rnd, cyc, age01, t, center } = c;
      const ang = cyc.y.mul(TAU);
      const rad = sqrt(cyc.x)
        .mul(0.26)
        .mul(float(1).sub(age01.mul(0.6)));
      const wob = t.mul(rnd.y.mul(5).add(5)).add(rnd.x.mul(30));
      const sway = vec3(sin(wob), 0, cos(wob.mul(0.8))).mul(age01.mul(age01).mul(0.16));
      const rise = age01.mul(rnd.z.mul(0.6).add(1.25));
      const position = center
        .add(vec3(cos(ang).mul(rad), rise.add(0.12), sin(ang).mul(rad)))
        .add(sway);
      // 生まれてすぐ膨らみ、上へ行くほど細く消える
      const flicker = sin(t.mul(rnd.x.mul(12).add(14)).add(rnd.y.mul(40)))
        .mul(0.12)
        .add(1);
      const grow = smoothstep(0, 0.18, age01).mul(pow(float(1).sub(age01), 0.75));
      const size = grow.mul(cyc.z.mul(0.25).add(0.55)).mul(0.8).mul(flicker);
      const hot = vec3(1.7, 0.85, 0.2);
      const mid = vec3(1.8, 0.45, 0.05);
      const cool = vec3(0.75, 0.09, 0.02);
      const color = mix(
        mix(hot, mid, smoothstep(0.0, 0.3, age01)),
        cool,
        smoothstep(0.45, 1.0, age01),
      );
      const alpha = pow(float(1).sub(age01), 1.1)
        .mul(smoothstep(0, 0.06, age01))
        .mul(0.8);
      return { position, size, color, alpha: alpha.mul(c.intensity), stretch: float(2.0) };
    },
  };
}

/** 火の粉: 小さく明るい粒が揺れながら上昇し、明滅して消える。 */
export function bonfireSparkSpec(count: number, seed: number): ContinuousSpec {
  return {
    count,
    blend: 'add',
    shape: 'spark',
    life: [1.3, 3.2],
    seed,
    shade: (c: ContinuousCtx): ParticleShade => {
      const { rnd, cyc, age01, age, t, center } = c;
      const ang = cyc.y.mul(TAU);
      const rad = sqrt(cyc.x).mul(0.22);
      const speed = cyc.z.mul(1.1).add(0.7);
      const wob = age.mul(rnd.y.mul(3).add(2.5)).add(rnd.x.mul(30));
      const wind = vec3(0.45, 0, 0.15).mul(age.mul(age).mul(0.25));
      const position = center
        .add(vec3(cos(ang).mul(rad), 0.25, sin(ang).mul(rad)))
        .add(
          vec3(sin(wob), age.mul(speed), cos(wob.mul(1.3))).mul(
            vec3(0.14, 1, 0.14).mul(age01.add(0.2)),
          ),
        )
        .add(wind);
      const blink = smoothstep(0.1, 0.7, abs(sin(t.mul(rnd.w.mul(18).add(10)).add(rnd.x.mul(50)))));
      const size = float(0.05)
        .mul(float(1).sub(age01.mul(0.6)))
        .mul(rnd.w.mul(0.8).add(0.7));
      const color = mix(vec3(4.2, 1.7, 0.3), vec3(1.6, 0.25, 0.04), age01);
      const alpha = mix(float(0.35), float(1), blink)
        .mul(pow(float(1).sub(age01), 0.6))
        .mul(smoothstep(0, 0.04, age01));
      return { position, size, color, alpha: alpha.mul(c.intensity) };
    },
  };
}

// ===========================================================================
// 熾火フィールド（ボスの熾火・闘技場の地面の残り火など）
// ===========================================================================

export function emberFieldSpec(
  count: number,
  radius: number,
  height: number,
  seed: number,
): ContinuousSpec {
  return {
    count,
    blend: 'add',
    shape: 'spark',
    life: [4, 7.5],
    seed,
    shade: (c: ContinuousCtx): ParticleShade => {
      const { rnd, cyc, age01, age, t, center } = c;
      const ang = cyc.y.mul(TAU);
      const rad = sqrt(cyc.x).mul(radius);
      const wob = age.mul(rnd.y.mul(0.9).add(0.5)).add(rnd.x.mul(30));
      const position = center.add(
        vec3(
          cos(ang).mul(rad).add(sin(wob).mul(0.25)),
          age01.mul(cyc.z.mul(0.7).add(0.45)).mul(height).add(0.04),
          sin(ang)
            .mul(rad)
            .add(cos(wob.mul(0.7)).mul(0.25)),
        ),
      );
      // 熾火の「呼吸」: 粒ごとに周期の違うゆっくりした明滅
      const pulse = sin(t.mul(rnd.y.mul(2.6).add(0.9)).add(rnd.x.mul(60)))
        .mul(0.5)
        .add(0.5);
      const glow = pulse.mul(pulse);
      const color = vec3(2.4, 0.55, 0.07).mul(glow.mul(1.3).add(0.3));
      const alpha = fadeInOut(age01, 0.1, 0.55).mul(glow.mul(0.75).add(0.25));
      const size = rnd.w.mul(0.03).add(0.035).mul(glow.mul(0.4).add(0.8));
      return { position, size, color, alpha: alpha.mul(c.intensity) };
    },
  };
}

// ===========================================================================
// バースト: ヒット火花・塵・黒い飛沫（4.1 節）/ 撃破の灰・熾火（5.2 / 6.1 / 8.4 節）
// ===========================================================================

export interface HitParams {
  x: number;
  y: number;
  z: number;
  /** 飛び散る向き（単位ベクトル。攻撃方向の反対や接触面の法線）。 */
  nx: number;
  ny: number;
  nz: number;
  /** 勢い（軽攻撃 1、強攻撃 1.4 など）。 */
  power: number;
}

export interface DeathParams {
  /** 足元の座標。 */
  x: number;
  y: number;
  z: number;
  /** 体を覆う円柱（半径・高さ）。この体積から粒が剥がれて舞い上がる。 */
  radius: number;
  height: number;
  /** 舞い上がりの強さ（亡者 1、ボスの熾火は 2〜3）。 */
  rise: number;
}

/** 方向 (nx,ny,nz) を中心に spread で散らした単位ベクトルを out に書き、速度に変換する。 */
function sprayVelocity(
  out: { vx: number; vy: number; vz: number },
  p: HitParams,
  speed: number,
  spread: number,
  rng: () => number,
): void {
  let rx = rng() * 2 - 1;
  let ry = rng() * 2 - 1;
  let rz = rng() * 2 - 1;
  const l = Math.hypot(rx, ry, rz) || 1;
  rx /= l;
  ry /= l;
  rz /= l;
  let dx = p.nx + rx * spread;
  let dy = p.ny + ry * spread;
  let dz = p.nz + rz * spread;
  const dl = Math.hypot(dx, dy, dz) || 1;
  dx /= dl;
  dy /= dl;
  dz /= dl;
  out.vx = dx * speed;
  out.vy = dy * speed;
  out.vz = dz * speed;
}

export const hitSparkInit: BurstInit<HitParams> = (out, _i, _n, p, rng) => {
  out.x = p.x;
  out.y = p.y;
  out.z = p.z;
  sprayVelocity(out, p, (3.5 + rng() * 6.5) * p.power, 0.95, rng);
  out.life = 0.22 + rng() * 0.32;
};

export const hitDustInit: BurstInit<HitParams> = (out, _i, _n, p, rng) => {
  out.x = p.x + (rng() - 0.5) * 0.12;
  out.y = p.y + (rng() - 0.5) * 0.12;
  out.z = p.z + (rng() - 0.5) * 0.12;
  sprayVelocity(out, p, (0.5 + rng() * 1.4) * p.power, 1.2, rng);
  out.vy += 0.5;
  out.life = 0.45 + rng() * 0.4;
};

export const hitSplashInit: BurstInit<HitParams> = (out, _i, _n, p, rng) => {
  out.x = p.x;
  out.y = p.y;
  out.z = p.z;
  sprayVelocity(out, p, (2 + rng() * 3.8) * p.power, 0.8, rng);
  out.life = 0.35 + rng() * 0.3;
};

function bodyPoint(
  out: { x: number; y: number; z: number },
  p: DeathParams,
  rng: () => number,
): void {
  const a = rng() * TAU;
  const r = Math.sqrt(rng()) * p.radius;
  out.x = p.x + Math.cos(a) * r;
  out.z = p.z + Math.sin(a) * r;
  out.y = p.y + rng() * p.height;
}

export const deathAshInit: BurstInit<DeathParams> = (out, i, n, p, rng) => {
  bodyPoint(out, p, rng);
  // 下の粒ほど先に・上の粒ほど遅れて剥がれる印象を寿命の差で作る
  out.vx = (rng() - 0.3) * 0.9;
  out.vz = (rng() - 0.3) * 0.5;
  out.vy = (0.35 + rng() * 1.1) * p.rise;
  out.life = 1.3 + rng() * 1.4 + (i / Math.max(1, n)) * 0.3;
};

export const deathEmberInit: BurstInit<DeathParams> = (out, _i, _n, p, rng) => {
  bodyPoint(out, p, rng);
  out.vx = (rng() - 0.35) * 1.1;
  out.vz = (rng() - 0.4) * 0.8;
  out.vy = (0.9 + rng() * 2.0) * p.rise;
  out.life = 0.9 + rng() * 1.5;
};

export const BURST_SPECS = {
  spark: {
    slotSize: 16,
    blend: 'add',
    shape: 'spark',
    gravity: -11,
    drag: 2.2,
    seed: 9001,
    shade: (c: BurstCtx): ParticleShade => {
      const speed = length(c.velNow);
      return {
        position: c.pos,
        // 速度方向に細長い火花。減速するほど短く丸くなる
        size: float(0.028)
          .mul(float(1).sub(c.age01.mul(0.6)))
          .mul(c.rnd.x.mul(0.8).add(0.7)),
        stretch: clamp(speed.mul(0.55), 1, 9),
        rotation: c.streakAngle,
        color: mix(vec3(4.0, 2.3, 0.8), vec3(2.2, 0.5, 0.07), smoothstep(0, 0.8, c.age01)),
        alpha: pow(float(1).sub(c.age01), 0.8),
      };
    },
  },
  dust: {
    slotSize: 8,
    blend: 'normal',
    shape: 'soft',
    gravity: 0.6,
    drag: 3.2,
    seed: 9002,
    shade: (c: BurstCtx): ParticleShade => ({
      position: c.pos,
      size: mix(float(0.12), float(0.34), c.age01).mul(c.rnd.y.mul(0.6).add(0.7)),
      color: mix(vec3(0.5, 0.45, 0.4), vec3(0.4, 0.37, 0.34), c.rnd.x),
      alpha: float(0.32)
        .mul(float(1).sub(c.age01))
        .mul(smoothstep(0, 0.08, c.age01)),
    }),
  },
  splash: {
    slotSize: 10,
    blend: 'normal',
    shape: 'flake',
    gravity: -13,
    drag: 0.8,
    seed: 9003,
    shade: (c: BurstCtx): ParticleShade => ({
      position: c.pos,
      size: c.rnd.x
        .mul(0.035)
        .add(0.035)
        .mul(float(1).sub(c.age01.mul(0.4))),
      color: vec3(0.025, 0.018, 0.018),
      alpha: float(0.9).mul(smoothstep(1, 0.7, c.age01)),
      rotation: c.rnd.z.mul(6.28),
    }),
  },
  ash: {
    slotSize: 80,
    blend: 'normal',
    shape: 'flake',
    gravity: 0.15,
    drag: 0.9,
    seed: 9004,
    shade: (c: BurstCtx): ParticleShade => {
      const swirl = vec3(
        sin(c.age.mul(c.rnd.y.mul(2).add(1.5)).add(c.rnd.x.mul(30))),
        0,
        cos(c.age.mul(c.rnd.x.mul(2).add(1.5)).add(c.rnd.y.mul(30))),
      ).mul(c.age01.mul(0.45));
      return {
        position: c.pos.add(swirl),
        size: c.rnd.w
          .mul(0.05)
          .add(0.03)
          .mul(float(1).sub(c.age01.mul(0.35))),
        color: mix(vec3(0.07, 0.065, 0.06), vec3(0.42, 0.31, 0.22), smoothstep(0.3, 0.9, c.rnd.z)),
        alpha: smoothstep(0, 0.08, c.age01)
          .mul(smoothstep(1, 0.55, c.age01))
          .mul(0.9),
        rotation: c.age.mul(c.rnd.x.sub(0.5).mul(5)).add(c.rnd.y.mul(6.28)),
      };
    },
  },
  ember: {
    slotSize: 28,
    blend: 'add',
    shape: 'spark',
    gravity: 0.5,
    drag: 0.7,
    seed: 9005,
    shade: (c: BurstCtx): ParticleShade => {
      const wob = c.age.mul(c.rnd.y.mul(3).add(2)).add(c.rnd.x.mul(30));
      const pos: V3 = c.pos.add(vec3(sin(wob), 0, cos(wob.mul(1.2))).mul(c.age01.mul(0.3)));
      const blink = smoothstep(
        0.1,
        0.8,
        abs(sin(c.age.mul(c.rnd.w.mul(16).add(8)).add(c.rnd.x.mul(50)))),
      );
      return {
        position: pos,
        size: c.rnd.w
          .mul(0.025)
          .add(0.03)
          .mul(float(1).sub(c.age01.mul(0.5))),
        color: mix(vec3(3.4, 1.2, 0.2), vec3(1.2, 0.18, 0.03), c.age01),
        alpha: mix(float(0.4), float(1), blink).mul(smoothstep(1, 0.4, c.age01)),
      };
    },
  },
} as const satisfies Record<string, BurstSpec>;

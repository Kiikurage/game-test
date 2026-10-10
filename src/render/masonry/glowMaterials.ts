import {
  AdditiveBlending,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  MeshBasicNodeMaterial,
  Uint32BufferAttribute,
} from 'three/webgpu';
import {
  Fn,
  abs,
  attribute,
  clamp,
  float,
  fwidth,
  length,
  max,
  mix,
  mx_noise_float,
  pow,
  sin,
  smoothstep,
  time,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

/**
 * たいまつの炎・炎の周りの光だまり（壁と床の加算の板）・蜘蛛の巣。ライトは使わない。
 * 炎と光だまりは同じ加算マテリアル 1 つ（= 1 ドローコール）にまとめる。
 *
 * 頂点属性 (`FxBuilder`): `uv`、`kind`（0 = 炎、1 = 光だまり）、`ph`（ゆらぎの位相）、`inten`（強さ）。
 */
export function createFlameMaterial(): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const uvA = attribute('uv', 'vec2');
  const kind = attribute('kind', 'float');
  const ph = attribute('ph', 'float');
  const inten = attribute('inten', 'float');
  const flicker = float(0.86)
    .add(time.mul(11).add(ph.mul(6.28)).sin().mul(0.08))
    .add(time.mul(5.3).add(ph.mul(11)).sin().mul(0.06));

  const color = Fn(() => {
    const x = uvA.x.sub(0.5);
    const y = uvA.y;
    const wob = mx_noise_float(vec3(uvA.x.mul(3.2), y.mul(2.4).sub(time.mul(2.6)), ph.mul(9)));
    const width = sin(pow(y, 0.65).mul(3.14159))
      .mul(0.36)
      .mul(float(1).sub(y.mul(0.35)));
    const sway = wob.mul(0.16).mul(y);
    const shape = smoothstep(width, width.mul(0.35), abs(x.add(sway)))
      .mul(smoothstep(1.0, 0.7, y.add(wob.mul(0.1))))
      .mul(smoothstep(0.0, 0.08, y));
    const hot = mix(vec3(1.0, 0.78, 0.38), vec3(1.0, 0.3, 0.04), smoothstep(0.05, 0.85, y));
    const flame = hot.mul(shape).mul(2.2);

    const r = length(vec2(uvA.x.sub(0.5), uvA.y.sub(0.5))).mul(2);
    const g = pow(clamp(float(1).sub(r), 0, 1), 2.4);
    const halo = vec3(1.0, 0.46, 0.14).mul(g).mul(inten);
    return mix(flame, halo, kind).mul(flicker);
  })();
  material.colorNode = vec4(color, 1);
  return material;
}

/** 蜘蛛の巣（扇形の板。uv = (角度 0..1, 半径 0..1)。放射状の糸と、たるんだ同心の糸、ちぎれ）。 */
export function createWebMaterial(): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const uvA = attribute('uv', 'vec2');
  const a = uvA.x;
  const r = uvA.y;
  const alpha = Fn(() => {
    const spokeCoord = a.mul(5);
    const sd = abs(spokeCoord.fract().sub(0.5)).sub(0.5).abs();
    const spoke = float(1).sub(smoothstep(0.0, fwidth(spokeCoord).mul(1.4).add(0.004), sd));
    const sag = sin(a.mul(15.7)).mul(0.28).mul(r);
    const ringCoord = r.mul(6.5).add(sag);
    const rd = abs(ringCoord.fract().sub(0.5)).sub(0.5).abs();
    const ring = float(1).sub(smoothstep(0.0, fwidth(ringCoord).mul(1.4).add(0.004), rd));
    const threads = max(spoke, ring.mul(smoothstep(0.1, 0.22, r)));
    const tear = smoothstep(-0.35, -0.1, mx_noise_float(vec3(a.mul(4), r.mul(4), float(2.7))));
    return threads
      .mul(tear)
      .mul(smoothstep(1.0, 0.78, r))
      .mul(0.62);
  })();
  material.colorNode = vec4(vec3(0.34, 0.36, 0.4), 1);
  material.opacityNode = alpha;
  return material;
}

/** 炎・光だまり・蜘蛛の巣の板を溜める。 */
export class FxBuilder {
  private readonly positions: number[] = [];
  private readonly uvs: number[] = [];
  private readonly kinds: number[] = [];
  private readonly phases: number[] = [];
  private readonly intens: number[] = [];
  private readonly indices: number[] = [];
  private count = 0;

  get triangles(): number {
    return this.indices.length / 3;
  }

  /** 4 頂点の板（p0 → p1 が u、p0 → p2 が v）。 */
  quad(
    p0: readonly [number, number, number],
    p1: readonly [number, number, number],
    p2: readonly [number, number, number],
    kind: number,
    phase: number,
    intensity: number,
  ): void {
    const p3: [number, number, number] = [
      p1[0] + p2[0] - p0[0],
      p1[1] + p2[1] - p0[1],
      p1[2] + p2[2] - p0[2],
    ];
    const corners = [p0, p1, p2, p3] as const;
    const uv = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ] as const;
    for (let i = 0; i < 4; i++) {
      this.positions.push(...(corners[i] ?? p0));
      this.uvs.push(...(uv[i] ?? [0, 0]));
      this.kinds.push(kind);
      this.phases.push(phase);
      this.intens.push(intensity);
    }
    const b = this.count;
    this.indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    this.count += 4;
  }

  /** 蜘蛛の巣の扇形（apex から `dirA` と `dirB` の間を長さ `radius` で埋める）。 */
  webSector(
    apex: readonly [number, number, number],
    dirA: readonly [number, number, number],
    dirB: readonly [number, number, number],
    radius: number,
  ): void {
    const segs = 6;
    const base = this.count;
    for (let ir = 0; ir <= 1; ir++) {
      for (let ia = 0; ia <= segs; ia++) {
        const t = ia / segs;
        // dirA → dirB を球面ではなく線形補間して正規化
        let dx = dirA[0] + (dirB[0] - dirA[0]) * t;
        let dy = dirA[1] + (dirB[1] - dirA[1]) * t;
        let dz = dirA[2] + (dirB[2] - dirA[2]) * t;
        const l = Math.hypot(dx, dy, dz) || 1;
        dx /= l;
        dy /= l;
        dz /= l;
        const rr = ir * radius;
        this.positions.push(apex[0] + dx * rr, apex[1] + dy * rr, apex[2] + dz * rr);
        this.uvs.push(t, ir);
        this.kinds.push(0);
        this.phases.push(0);
        this.intens.push(0);
      }
    }
    for (let ia = 0; ia < segs; ia++) {
      const i0 = base + ia;
      this.indices.push(i0, i0 + 1, i0 + segs + 1, i0 + 1, i0 + segs + 2, i0 + segs + 1);
    }
    this.count += (segs + 1) * 2;
  }

  build(): BufferGeometry | null {
    if (this.count === 0) return null;
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    g.setAttribute('uv', new Float32BufferAttribute(this.uvs, 2));
    g.setAttribute('kind', new Float32BufferAttribute(this.kinds, 1));
    g.setAttribute('ph', new Float32BufferAttribute(this.phases, 1));
    g.setAttribute('inten', new Float32BufferAttribute(this.intens, 1));
    g.setIndex(new Uint32BufferAttribute(this.indices, 1));
    g.computeBoundingSphere();
    return g;
  }
}

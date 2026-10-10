import {
  Color,
  DirectionalLight,
  HemisphereLight,
  type Node,
  type Scene,
  Vector3,
} from 'three/webgpu';
import {
  Fn,
  cameraPosition,
  clamp,
  floor,
  fract,
  hash,
  length,
  step,
  dot,
  float,
  fog,
  max,
  mix,
  mx_fractal_noise_float,
  normalize,
  positionWorld,
  positionWorldDirection,
  pow,
  smoothstep,
  uniform,
  vec2,
  vec3,
  exponentialHeightFogFactor,
  densityFogFactor,
} from 'three/tsl';
import type { QualityPreset } from './quality';
import { SHADOW_PROXY_LAYER } from './layers';
import { sharedHazeFar, sharedHazeSun, sharedSunTint } from './atmosphereNodes';

/** 太陽（シャドウカメラ）をフォーカスからどれだけ離すか（m）。 */
const SHADOW_LIGHT_DISTANCE = 90;

/**
 * 雰囲気を決める定数群。「黄金色の低い太陽 + 霞んだ空気 + 落ち着いた色調」。
 * 空・フォグ・ライトで同じ値を共有して整合させる。
 */
export const ATMOSPHERE = {
  /** 太陽の方位（rad, x 軸基準で xz 平面）と仰角（rad）。低い太陽が長い影を落とす。 */
  sunAzimuth: 0.82,
  sunElevation: 0.17,
  sunColor: 0xffc27a,
  sunIntensity: 3.4,
  /** 半球光: 空側は青みを抑えた灰青、地面側は暖かい土色の照り返し。 */
  skyLight: 0x8c9cae,
  groundLight: 0x5a4430,
  hemiIntensity: 1.7,
  fillLight: 0xc8b8a0,
  fillIntensity: 0.95,
  /** 空のグラデーション。 */
  zenith: 0x4f6a80,
  midSky: 0x9fa89f,
  horizon: 0xe4bf8a,
  /** フォグ（霞）の色。太陽と反対側は灰青寄り、太陽側は金色。 */
  hazeFar: 0x9ca5a4,
  hazeSun: 0xf0b877,
} as const;

/** 時間帯・場所ごとのライティング・空・フォグのまとまり（`Environment.setMood` が 2 つの間を補間する）。 */
export interface Mood {
  readonly sunColor: number;
  /** 空の太陽の光芒・雲の縁・遠景の逆光に使う色（ライトの色 `sunColor` とは別。夜は暗くする）。 */
  readonly skyTint: number;
  readonly sunIntensity: number;
  readonly skyLight: number;
  readonly groundLight: number;
  readonly hemiIntensity: number;
  readonly fillLight: number;
  readonly fillIntensity: number;
  readonly zenith: number;
  readonly midSky: number;
  readonly horizon: number;
  readonly hazeFar: number;
  readonly hazeSun: number;
  /** 距離フォグの密度。 */
  readonly fogDensity: number;
  /** 星の量 0..1。 */
  readonly stars: number;
}

/** 既定の黄昏（フィールド）。 */
export const DUSK_MOOD: Mood = {
  sunColor: ATMOSPHERE.sunColor,
  skyTint: ATMOSPHERE.sunColor,
  sunIntensity: ATMOSPHERE.sunIntensity,
  skyLight: ATMOSPHERE.skyLight,
  groundLight: ATMOSPHERE.groundLight,
  hemiIntensity: ATMOSPHERE.hemiIntensity,
  fillLight: ATMOSPHERE.fillLight,
  fillIntensity: ATMOSPHERE.fillIntensity,
  zenith: ATMOSPHERE.zenith,
  midSky: ATMOSPHERE.midSky,
  horizon: ATMOSPHERE.horizon,
  hazeFar: ATMOSPHERE.hazeFar,
  hazeSun: ATMOSPHERE.hazeSun,
  fogDensity: 0.0085,
  stars: 0,
};

/**
 * 闘技場（仕様書 7.2 節: 夕闇からほぼ夜。太陽は黄昏の 1/4（仕様の 2.0 → 0.5 と同じ比）、環境光は青。太陽は冷たい月明かり、補助光は篝火の暖色）。
 * 主光源は篝火・熾火・たいまつ（画面側の暖色）で、太陽・環境光は暗い青に寄せる。
 */
export const ARENA_MOOD: Mood = {
  sunColor: 0x9ab0f0,
  skyTint: 0x6a3a52,
  sunIntensity: ATMOSPHERE.sunIntensity * 0.35,
  skyLight: 0x7684b8,
  groundLight: 0x302c44,
  hemiIntensity: 0.8,
  fillLight: 0xff7440,
  fillIntensity: 0.8,
  zenith: 0x0a1030,
  midSky: 0x2a2658,
  horizon: 0x8a4e72,
  hazeFar: 0x232a4a,
  hazeSun: 0x3c2c4c,
  fogDensity: 0.0115,
  stars: 1,
};

/** 太陽へ向かう単位ベクトル。 */
export function sunDirection(out = new Vector3()): Vector3 {
  const { sunAzimuth: az, sunElevation: el } = ATMOSPHERE;
  return out.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
}

export interface Environment {
  readonly sun: DirectionalLight;
  readonly hemisphere: HemisphereLight;
  /** 影のカバー範囲の中心をプレイヤー付近へ追従させる（毎フレーム呼ぶ）。 */
  followShadowFocus(focus: Vector3): void;
  /**
   * ライティング・空・フォグを `DUSK_MOOD`（t = 0）から `mood`（t = 1）へ補間して設定する。
   * uniform / ライトの値を書き換えるだけでシェーダは変わらない（毎フレーム呼んでよい）。
   */
  setMood(mood: Mood, t: number): void;
  /**
   * 距離フォグの密度への倍率（既定 1。ムードの密度に掛ける）。ボス撃破で崩壊の灰が空気を濃くし、霧が晴れる演出が使う（#86）。
   * `setMood` と独立に効く（毎フレーム呼んでよい）。
   */
  setFogScale(scale: number): void;
  /** 視線方向（ワールド）に対する空の色。背景と同じ式・同じ uniform（闘技場の背景の幕が使う）。 */
  skyAt(dir: Node<'vec3'>): Node<'vec3'>;
}

/**
 * 空・フォグ・太陽光・半球光を scene に設定する。
 * 影は `preset.shadowRadius` 四方のプレイヤー追従シャドウカメラ（1 カスケード）。
 */
export function createEnvironment(scene: Scene, preset: QualityPreset): Environment {
  const sunDir = sunDirection();
  const sunDirNode = uniform(sunDir);
  const sunColor = new Color(ATMOSPHERE.sunColor);

  // --- 空（背景ノード）---
  const zenith = uniform(new Color(ATMOSPHERE.zenith));
  const midSky = uniform(new Color(ATMOSPHERE.midSky));
  const horizon = uniform(new Color(ATMOSPHERE.horizon));
  // フォグ色と太陽色は遠景（skyline）と共有（闘技場のムード切り替えで同時に動く）
  const hazeFar = sharedHazeFar;
  const hazeSun = sharedHazeSun;
  const sunTint = sharedSunTint;
  const starAmount = uniform(0);
  sunTint.value.copy(sunColor);

  const skyAt = (dirNode: Node<'vec3'>): Node<'vec3'> =>
    Fn(() => {
      const dir = dirNode;
      const h = dir.y;
      const mu = clamp(dot(dir, sunDirNode), 0, 1);

      // 地平線の金色 → 中空の灰緑 → 天頂の青灰
      const up = clamp(h, 0, 1);
      let col = mix(horizon, midSky, smoothstep(0.0, 0.28, up));
      col = mix(col, zenith, smoothstep(0.15, 0.85, up));
      // 太陽側の地平線ほど強く染まる
      col = mix(col, horizon.mul(1.15), pow(mu, 3).mul(smoothstep(0.5, 0.0, up)));
      // 太陽の周囲の光芒（大気散乱）+ 太陽円盤（HDR。ブルームで滲む）
      const glow = pow(mu, 8).mul(0.55).add(pow(mu, 90).mul(1.4));
      const disc = smoothstep(0.99955, 0.99985, mu).mul(24);
      // 夜（星が出るムード）では太陽の円盤・光芒を消す
      col = col.add(sunTint.mul(glow.add(disc)).mul(float(1).sub(starAmount)));

      // 薄い雲の筋（太陽に照らされた縁が金色になる）
      const cloudUV = vec2(dir.x, dir.z)
        .div(max(h.add(0.18), 0.06))
        .mul(1.2);
      const cloud = mx_fractal_noise_float(vec3(cloudUV.x, cloudUV.y.mul(3.2), 0.0), 4, 2.0, 0.5)
        .mul(0.5)
        .add(0.5);
      const cloudMask = smoothstep(0.58, 0.88, cloud)
        .mul(smoothstep(0.02, 0.3, h))
        .mul(smoothstep(0.85, 0.4, h))
        .mul(0.5);
      const cloudLit = mix(midSky.mul(0.85), sunTint.mul(1.1), pow(mu, 2).mul(0.7).add(0.15));
      col = mix(col, cloudLit, cloudMask);

      // 星（天頂付近にまばらに。闘技場のムードでだけ出る）
      const grid = dir.mul(240);
      const cell = floor(grid);
      const seed = hash(cell.x.add(cell.y.mul(57.3)).add(cell.z.mul(131.7)));
      const star = step(0.9988, seed)
        .mul(smoothstep(0.42, 0.0, length(fract(grid).sub(0.5))))
        .mul(hash(seed.mul(91.7)).mul(0.7).add(0.5))
        .mul(smoothstep(0.32, 0.75, up));
      col = col.add(vec3(0.8, 0.86, 1.0).mul(star).mul(starAmount).mul(2.2));

      // 地平線より下は霞の色で塗りつぶす（フォグと連続させる）
      return mix(hazeFar.mul(0.9), col, smoothstep(-0.06, 0.02, h));
    })();
  scene.backgroundNode = skyAt(positionWorldDirection);

  // --- フォグ（距離 + 高さ）。太陽側は金色の霞、反対側は灰青の霞 ---
  const fogColor = Fn(() => {
    const viewDir = normalize(positionWorld.sub(cameraPosition));
    const mu = clamp(dot(viewDir, sunDirNode), 0, 1);
    return mix(hazeFar, hazeSun, pow(mu, 2.5));
  })();
  const fogDensity = uniform(DUSK_MOOD.fogDensity);
  const distanceFog = densityFogFactor(fogDensity);
  const heightFog = exponentialHeightFogFactor(float(0.0025), float(3));
  // 2 つのフォグ係数を「透過率の積」で合成する
  const transmittance = (f: unknown): Node<'float'> => float(1).sub(f as Node<'float'>);
  const fogFactor = float(1).sub(transmittance(distanceFog).mul(transmittance(heightFog)));
  scene.fogNode = fog(fogColor, fogFactor);

  // --- ライト ---
  const hemisphere = new HemisphereLight(
    ATMOSPHERE.skyLight,
    ATMOSPHERE.groundLight,
    ATMOSPHERE.hemiIntensity,
  );
  scene.add(hemisphere);

  // 太陽と反対側からの弱い補助光（影なし）。逆光で潰れる面の形を読めるようにする
  const fill = new DirectionalLight(ATMOSPHERE.fillLight, ATMOSPHERE.fillIntensity);
  fill.position.set(-sunDir.x, 0.35, -sunDir.z).normalize();
  scene.add(fill);

  const sun = new DirectionalLight(ATMOSPHERE.sunColor, ATMOSPHERE.sunIntensity);
  sun.castShadow = true;
  // シャドウパスだけが描くメッシュ（キャラクターの簡略シャドウ）も拾う
  sun.shadow.camera.layers.enable(SHADOW_PROXY_LAYER);
  const r = preset.shadowRadius;
  sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
  sun.shadow.camera.left = -r;
  sun.shadow.camera.right = r;
  sun.shadow.camera.top = r;
  sun.shadow.camera.bottom = -r;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = SHADOW_LIGHT_DISTANCE * 2;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 2.5;
  sun.position.copy(sunDir).multiplyScalar(SHADOW_LIGHT_DISTANCE);
  scene.add(sun);
  scene.add(sun.target);

  // シャドウマップのテクセル単位に焦点をスナップして、カメラ/プレイヤー移動時の影のチラつきを防ぐ
  const texel = (2 * r) / preset.shadowMapSize;
  const forward = sunDir.clone().negate();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const upAxis = new Vector3().crossVectors(right, forward).normalize();
  const snapped = new Vector3();

  const followShadowFocus = (focus: Vector3): void => {
    const sx = Math.round(focus.dot(right) / texel) * texel;
    const sy = Math.round(focus.dot(upAxis) / texel) * texel;
    const sz = focus.dot(forward);
    snapped
      .set(0, 0, 0)
      .addScaledVector(right, sx)
      .addScaledVector(upAxis, sy)
      .addScaledVector(forward, sz);
    sun.target.position.copy(snapped);
    sun.position.copy(snapped).addScaledVector(sunDir, SHADOW_LIGHT_DISTANCE);
  };
  followShadowFocus(new Vector3());

  const from = DUSK_MOOD;
  const tmpA = new Color();
  const tmpB = new Color();
  const lerpColor = (out: Color, a: number, b: number, t: number): Color =>
    out.copy(tmpA.set(a)).lerp(tmpB.set(b), t);
  let lastT = 0;
  let moodFog = from.fogDensity;
  let fogScale = 1;
  const setMood = (mood: Mood, t: number): void => {
    const k = Math.min(1, Math.max(0, t));
    if (k === lastT && (k === 0 || k === 1)) return;
    lastT = k;
    const num = (a: number, b: number): number => a + (b - a) * k;
    lerpColor(sun.color, from.sunColor, mood.sunColor, k);
    sun.intensity = num(from.sunIntensity, mood.sunIntensity);
    lerpColor(hemisphere.color, from.skyLight, mood.skyLight, k);
    lerpColor(hemisphere.groundColor, from.groundLight, mood.groundLight, k);
    hemisphere.intensity = num(from.hemiIntensity, mood.hemiIntensity);
    lerpColor(fill.color, from.fillLight, mood.fillLight, k);
    fill.intensity = num(from.fillIntensity, mood.fillIntensity);
    lerpColor(zenith.value, from.zenith, mood.zenith, k);
    lerpColor(midSky.value, from.midSky, mood.midSky, k);
    lerpColor(horizon.value, from.horizon, mood.horizon, k);
    lerpColor(hazeFar.value, from.hazeFar, mood.hazeFar, k);
    lerpColor(hazeSun.value, from.hazeSun, mood.hazeSun, k);
    lerpColor(sunTint.value, from.skyTint, mood.skyTint, k);
    moodFog = num(from.fogDensity, mood.fogDensity);
    fogDensity.value = moodFog * fogScale;
    starAmount.value = num(from.stars, mood.stars);
  };

  const setFogScale = (scale: number): void => {
    fogScale = Math.max(0, scale);
    fogDensity.value = moodFog * fogScale;
  };

  return { sun, hemisphere, followShadowFocus, setMood, setFogScale, skyAt };
}

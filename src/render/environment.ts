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

/** 太陽（シャドウカメラ）をフォーカスからどれだけ離すか（m）。 */
const SHADOW_LIGHT_DISTANCE = 90;

/**
 * 雰囲気を決める定数群。「黄金色の低い太陽 + 霞んだ空気 + 落ち着いた色調」。
 * 空・フォグ・ライトで同じ値を共有して整合させる。
 */
export const ATMOSPHERE = {
  /** 太陽の方位（rad, x 軸基準で xz 平面）と仰角（rad）。低い太陽が長い影を落とす。 */
  sunAzimuth: -2.45,
  sunElevation: 0.17,
  sunColor: 0xffc27a,
  sunIntensity: 3.4,
  /** 半球光: 空側は青みを抑えた灰青、地面側は暖かい土色の照り返し。 */
  skyLight: 0x8c9cae,
  groundLight: 0x5a4430,
  hemiIntensity: 1.2,
  fillLight: 0xc8b8a0,
  fillIntensity: 0.7,
  /** 空のグラデーション。 */
  zenith: 0x4f6a80,
  midSky: 0x9fa89f,
  horizon: 0xe4bf8a,
  /** フォグ（霞）の色。太陽と反対側は灰青寄り、太陽側は金色。 */
  hazeFar: 0x9ca5a4,
  hazeSun: 0xf0b877,
} as const;

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
  const hazeFar = uniform(new Color(ATMOSPHERE.hazeFar));
  const hazeSun = uniform(new Color(ATMOSPHERE.hazeSun));
  const sunTint = uniform(sunColor);

  const skyColor = Fn(() => {
    const dir = positionWorldDirection;
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
    col = col.add(sunTint.mul(glow.add(disc)));

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

    // 地平線より下は霞の色で塗りつぶす（フォグと連続させる）
    return mix(hazeFar.mul(0.9), col, smoothstep(-0.06, 0.02, h));
  })();
  scene.backgroundNode = skyColor;

  // --- フォグ（距離 + 高さ）。太陽側は金色の霞、反対側は灰青の霞 ---
  const fogColor = Fn(() => {
    const viewDir = normalize(positionWorld.sub(cameraPosition));
    const mu = clamp(dot(viewDir, sunDirNode), 0, 1);
    return mix(hazeFar, hazeSun, pow(mu, 2.5));
  })();
  const distanceFog = densityFogFactor(float(0.0085));
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

  return { sun, hemisphere, followShadowFocus };
}

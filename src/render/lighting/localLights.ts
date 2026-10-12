import { Group, PointLight, type ColorRepresentation, type Scene } from 'three/webgpu';
import { REFLECT_LAYER } from '../layers';

/**
 * 局所光源（篝火・たいまつ・燭台・苔など、影を落とさない点光源）の登録口（#322）。
 *
 * 各 view はライトを自前で `new PointLight` せず、`localLightsOf(view.scene).add(...)` で登録する。
 * 登録した光はクラスタードライティング（`clusteredLighting.ts`）で全マテリアルを実際に照らす
 * （マテリアル側で偽のライトを emissive に足さない）。
 *
 * - 光の組（シーン内のライトの集合）が変わると全マテリアルのシェーダが作り直しになるので、
 *   光は起動時（view の生成・load の中、`GameView.warmUp` より前）に登録し、消すときも強さ 0 にする。
 * - ゆらぎ（`flicker`）はここで毎フレーム強さに掛ける（`update` は `localLights.view.ts` が呼ぶ）。
 * - 水面の反射（`REFLECT_LAYER` のカメラ）にも効かせるため、レイヤーを有効にしておく。
 */

export interface LocalLightOptions {
  readonly position: readonly [number, number, number];
  readonly color: ColorRepresentation;
  /** 光度（cd）。three の物理単位（減衰は距離の 2 乗）。 */
  readonly intensity: number;
  /** 光の届く距離（m）。クラスターへの振り分けにも使うので 0（無限）にしない。 */
  readonly distance: number;
  /** 炎のゆらぎの位相（省略 = ゆらがない）。 */
  readonly flickerPhase?: number;
}

export interface LocalLight {
  readonly light: PointLight;
  /** ゆらぎを掛ける前の強さ（cd）。0 で消灯（光の組は変えない）。 */
  intensity: number;
  setPosition(x: number, y: number, z: number): void;
}

/** 炎のゆらぎ（0.75..1.0 付近）。複数の周波数を重ねる。 */
export function flameFlicker(time: number, phase: number): number {
  return (
    0.88 +
    0.07 * Math.sin(time * 11 + phase) +
    0.05 * Math.sin(time * 5.3 + phase * 1.9) +
    0.025 * Math.sin(time * 23.7 + phase * 0.7)
  );
}

class Entry implements LocalLight {
  intensity: number;
  constructor(
    readonly light: PointLight,
    readonly phase: number | null,
  ) {
    this.intensity = light.intensity;
  }
  setPosition(x: number, y: number, z: number): void {
    this.light.position.set(x, y, z);
    this.light.updateMatrixWorld();
  }
}

export class LocalLights {
  readonly root = new Group();
  private readonly entries: Entry[] = [];

  constructor() {
    this.root.name = 'local-lights';
  }

  /** 登録済みの光の数。 */
  get count(): number {
    return this.entries.length;
  }

  add(o: LocalLightOptions): LocalLight {
    const light = new PointLight(o.color, o.intensity, o.distance, 2);
    light.castShadow = false;
    light.position.set(o.position[0], o.position[1], o.position[2]);
    light.layers.enable(REFLECT_LAYER);
    this.root.add(light);
    light.updateMatrixWorld();
    const entry = new Entry(light, o.flickerPhase ?? null);
    this.entries.push(entry);
    return entry;
  }

  /** 毎フレーム。`time` は秒（ゆらぎの時刻）。 */
  update(time: number): void {
    for (const e of this.entries) {
      e.light.intensity =
        e.phase === null ? e.intensity : e.intensity * flameFlicker(time, e.phase);
    }
  }
}

const byScene = new WeakMap<Scene, LocalLights>();

/** シーンの局所光源の登録口（初回呼び出しでシーンに追加する）。 */
export function localLightsOf(scene: Scene): LocalLights {
  let lights = byScene.get(scene);
  if (!lights) {
    lights = new LocalLights();
    scene.add(lights.root);
    byScene.set(scene, lights);
  }
  return lights;
}

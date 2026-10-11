import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardNodeMaterial,
  Uint32BufferAttribute,
  type Object3D,
} from 'three/webgpu';
import { reflector, uniform } from 'three/tsl';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { waterwayOf } from '../../game/world/waterway.system';
import { WAKE_KIND, waterWakeOf } from '../../game/world/waterWake.system';
import { DUSK_MOOD, type Mood } from '../environment';
import { REFLECT_LAYER } from '../layers';
import { registerViewPlugin } from '../viewPlugins';
import { createWaterFx, type SplashKind, type WaterFx } from './waterFx';
import { buildWaterGrid, buildWaterSurface, isWater } from './waterLayout';
import { createLightRig } from './waterLighting';
import { createWaterMaterial } from './waterMaterial';
import type { WaterFields } from './waterNodes';
import { buildWaterShell } from './waterShell';
import { WaterSim } from './waterSim';
import {
  createLayoutTexture,
  loadWaterTextures,
  placeholderWaterTextures,
  type WaterTextures,
} from './waterTextures';
import {
  DRIP_SPOTS,
  insideWaterway,
  nearWaterwayMouth,
  waterLayoutInput,
  waterwayLights,
} from './waterwayLevel';

const DEG = Math.PI / 180;

/**
 * 地下水路のムード（暗く冷たい。主光源はたいまつ・床板の穴の光・苔の偽のライト）。
 * 空（床板の穴から見える）は黄昏のまま。太陽は 0（影の更新も止める）。
 */
const WATERWAY_MOOD: Mood = {
  ...DUSK_MOOD,
  sunIntensity: 0,
  skyLight: 0x52627a,
  groundLight: 0x16191e,
  hemiIntensity: 0.42,
  fillLight: 0xff8a50,
  fillIntensity: 0.12,
  hazeFar: 0x0a0d12,
  hazeSun: 0x0c0e13,
  fogDensity: 0.05,
  stars: 0,
};
/** ムードのなじませ（1/秒）。 */
const MOOD_RATE = 2.4;
/** 1 フレームで追いつく波のステップ数の上限（撮影の `advance` で大きく進めたとき。古いステップは捨てる）。 */
const MAX_CATCHUP = 240;
/** 水路の口からこの距離（m）以内なら、外からでも水路を描く。 */
const MOUTH_RADIUS = 14;

/** 波の外力（半径 m、高さ m）。`strength` を掛ける。 */
const IMPULSE = {
  wake: { radius: 0.15, height: 0.00055 },
  step: { radius: 0.12, height: -0.0065 },
  roll: { radius: 0.34, height: -0.012 },
  land: { radius: 0.4, height: -0.01 },
  drip: { radius: 0.04, height: -0.005 },
} as const;

interface WakeCopy {
  step: number;
  kind: number;
  x: number;
  y: number;
  z: number;
  strength: number;
}

interface Built {
  readonly root: Group;
  readonly fx: WaterFx;
  readonly water: Mesh;
}

/** 水路の描画の状態（E2E・撮影用）。 */
export interface WaterwayRenderInfo {
  readonly visible: boolean;
  readonly reflection: boolean;
  readonly moodWeight: number;
  readonly simSteps: number;
  readonly built: boolean;
}

const infos = new WeakMap<object, () => WaterwayRenderInfo>();
/** 描画の状態を返す（`game` ごと）。 */
export function waterwayRenderInfo(game: object): WaterwayRenderInfo | undefined {
  return infos.get(game)?.();
}

// 地下水路（#111 / #270）の描画。
//  - 壁・床・天井・石棺は石積み + 濡れ・コースティクス・苔（`waterShell.ts`。`levelView` は style `waterway` を描かない）
//  - 水面は波のシミュレーション（GPU）+ フローマップの法線 + 平面反射 + 屈折（`waterMaterial.ts`）
//  - しぶき・雫・霧・光の筋（`waterFx.ts`）
//  - 腐った床板（割れたら消える）と鉄格子（開いたら消える）。コライダは `Game.setBoxEnabled`
registerViewPlugin('waterway', ({ game, view, level, gameRenderer }) => {
  const root = new Group();
  root.name = 'waterway';
  view.scene.add(root);
  if (!level) return {};

  const wood = new MeshStandardNodeMaterial({ color: 0x5a4430, roughness: 0.95, metalness: 0 });
  const iron = new MeshStandardNodeMaterial({ color: 0x35302c, roughness: 0.6, metalness: 0.5 });

  const hatchBox = level.boxes.find((b) => b.style === 'hatch');
  let hatch: Object3D | null = null;
  if (hatchBox) {
    const mesh = new Mesh(new BoxGeometry(hatchBox.hx * 2, hatchBox.hy * 2, hatchBox.hz * 2), wood);
    mesh.position.set(hatchBox.x, hatchBox.y, hatchBox.z);
    mesh.rotation.y = (hatchBox.yawDeg ?? 0) * DEG;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    hatch = mesh;
  }

  const grateBox = level.boxes.find((b) => b.style === 'grate');
  let grate: Object3D | null = null;
  if (grateBox) {
    // 鉄格子: 縦の鉄棒と上下の枠
    const parts: BufferGeometry[] = [];
    const bars = 8;
    for (let i = 0; i < bars; i++) {
      const bar = new BoxGeometry(0.06, grateBox.hy * 2, 0.06);
      bar.translate(-grateBox.hx + 0.1 + ((grateBox.hx * 2 - 0.2) * i) / (bars - 1), 0, 0);
      parts.push(bar);
    }
    for (const dy of [-1, 1]) {
      const rail = new BoxGeometry(grateBox.hx * 2, 0.1, 0.1);
      rail.translate(0, dy * (grateBox.hy - 0.05), 0);
      parts.push(rail);
    }
    const mesh = new Mesh(mergeGeometries(parts), iron);
    mesh.position.set(grateBox.x, grateBox.y, grateBox.z);
    mesh.rotation.y = (grateBox.yawDeg ?? 0) * DEG;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.layers.enable(REFLECT_LAYER);
    root.add(mesh);
    grate = mesh;
  }

  const state = waterwayOf(game);
  const way = level.data.waterways?.[0];
  if (!way) {
    return {
      update: () => {
        if (hatch) hatch.visible = !state.hatchBroken;
        if (grate) grate.visible = !state.grateOpen;
      },
    };
  }

  const { water: quality, materialDetail } = gameRenderer.quality.preset;
  const drawEnabled = !new URLSearchParams(location.search).has('nodraw');
  const grid = buildWaterGrid(waterLayoutInput(level, way), quality.simCell);
  const holeY = hatchBox ? hatchBox.y + hatchBox.hy : grid.floorY + 2.4;
  const rig = createLightRig(waterwayLights(grid.floorY), holeY);
  const sim = drawEnabled ? new WaterSim(gameRenderer.renderer, grid) : null;
  const layoutTexture = createLayoutTexture(grid);
  const waterRects = way.rects.filter((r) => r.water);
  const wake = waterWakeOf(game);
  const reflectionWeight = uniform(0);

  // 雫: 天井から水面までの落下時間（ステップ）
  const ceilingY = grid.floorY + way.ceiling;
  const fallSteps = Math.round(60 * Math.sqrt((2 * (ceilingY - grid.surfaceY)) / 9.8));

  let built: Built | null = null;
  let reflectionNode: ReturnType<typeof reflector> | null = null;
  let reflectionEnabled = false;

  const build = (textures: WaterTextures): void => {
    const fields: WaterFields = {
      grid,
      sim: sim ? sim.texture : layoutTexture,
      layout: layoutTexture,
      textures,
      time: rig.time,
    };
    const group = new Group();
    group.name = 'waterway-water';

    const shell = buildWaterShell(level, way, fields, rig, materialDetail);
    for (const m of shell.meshes) m.layers.enable(REFLECT_LAYER);
    group.add(shell.root);

    if (quality.reflection > 0) {
      const node = reflector({ resolutionScale: quality.reflection, bounces: false });
      node.target.rotateX(-Math.PI / 2);
      node.target.position.y = grid.surfaceY;
      group.add(node.target);
      const virtual = node.reflector.getVirtualCamera(view.camera);
      virtual.layers.set(REFLECT_LAYER);
      // ライトもカメラのレイヤーで選ばれる。シーンのライトを反射にも効かせる（光の組が同じなのでパイプラインも共有される）
      view.scene.traverse((o) => {
        if ((o as { isLight?: boolean }).isLight === true) o.layers.enable(REFLECT_LAYER);
      });
      // 水路の外（水面が床板の穴・鉄格子越しに少し見えるだけ）では反射を描かない
      const base = node.reflector as unknown as { updateBefore(frame: unknown): unknown };
      const original = base.updateBefore.bind(base);
      base.updateBefore = (frame: unknown) => (reflectionEnabled ? original(frame) : undefined);
      reflectionNode = node;
    }

    const surface = buildWaterSurface(waterRects, grid.surfaceY, quality.meshStep);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(surface.positions, 3));
    geometry.setIndex(new Uint32BufferAttribute(surface.indices, 1));
    geometry.computeBoundingSphere();
    const water = new Mesh(
      geometry,
      createWaterMaterial({ fields, rig, reflection: reflectionNode, reflectionWeight }),
    );
    water.name = 'waterway-surface';
    water.renderOrder = 1;
    group.add(water);

    const fx = createWaterFx(fields, rig, waterRects, quality.splashSlots, quality.mistLayers);
    group.add(fx.root);
    root.add(group);
    built = { root: group, fx, water };
  };

  let frames = 0;
  let weight = -1;
  let lastStep = wake.step;
  let reflectPlayerDone = false;
  const lastFeet = { x: game.player.feet.x, z: game.player.feet.z };
  const records: WakeCopy[] = [];
  let recordCount = 0;

  const inWater = (x: number, y: number, z: number): boolean =>
    isWater(grid, x, z) && y < grid.surfaceY + 0.35 && y > grid.floorY - 0.3;

  const splashOf = (kind: number): SplashKind | null =>
    kind === WAKE_KIND.step
      ? 'step'
      : kind === WAKE_KIND.roll
        ? 'roll'
        : kind === WAKE_KIND.land
          ? 'land'
          : null;

  const advanceWater = (fx: WaterFx, toStep: number): void => {
    const from = Math.max(lastStep, toStep - MAX_CATCHUP);
    recordCount = 0;
    wake.forEachSince(from, (r) => {
      let rec = records[recordCount];
      if (!rec) {
        rec = { step: 0, kind: 0, x: 0, y: 0, z: 0, strength: 0 };
        records.push(rec);
      }
      rec.step = r.step;
      rec.kind = r.kind;
      rec.x = r.x;
      rec.y = r.y;
      rec.z = r.z;
      rec.strength = r.strength;
      recordCount++;
    });
    let k = 0;
    for (let s = from + 1; s <= toStep; s++) {
      const now = s / 60;
      while (k < recordCount && (records[k]?.step ?? Infinity) <= s) {
        const r = records[k++];
        if (!r || r.step < s || !inWater(r.x, r.y, r.z)) continue;
        if (r.kind === WAKE_KIND.wake) {
          const w = IMPULSE.wake;
          sim?.addImpulse(r.x, r.z, w.radius, w.height * Math.min(r.strength, 6));
          continue;
        }
        const kind = splashOf(r.kind);
        if (!kind) continue;
        const imp = IMPULSE[kind];
        sim?.addImpulse(r.x, r.z, imp.radius, imp.height * Math.max(0.3, r.strength));
        fx.splash(now, kind, r.x, r.z, r.strength);
      }
      for (const d of DRIP_SPOTS) {
        if ((s + d.phase) % d.period === 0) {
          sim?.addImpulse(d.x, d.z, IMPULSE.drip.radius, IMPULSE.drip.height);
          fx.splash(now, 'drip', d.x, d.z, 1);
        }
        if ((s + fallSteps + d.phase) % d.period === 0) {
          fx.drip(now, d.x, ceilingY, d.z, fallSteps / 60);
        }
      }
      sim?.step();
    }
    sim?.bake();
  };

  /** プレイヤーのメッシュを反射にも描く（プレイヤーの読み込み後に 1 回）。 */
  const reflectPlayer = (): void => {
    const target = view.shadowFocusTarget;
    if (reflectPlayerDone || !target) return;
    target.traverse((o) => {
      if ((o as { isMesh?: boolean }).isMesh === true && o.layers.isEnabled(0)) {
        o.layers.enable(REFLECT_LAYER);
      }
    });
    reflectPlayerDone = true;
  };

  infos.set(game, () => ({
    visible: built?.root.visible ?? false,
    reflection: reflectionEnabled,
    moodWeight: Math.max(0, weight),
    simSteps: sim?.stepCount ?? 0,
    built: built !== null,
  }));

  return {
    load: async () => {
      let textures: WaterTextures;
      try {
        textures = await loadWaterTextures(import.meta.env.BASE_URL);
      } catch (e) {
        console.warn('waterway: water textures failed to load', e);
        textures = placeholderWaterTextures();
      }
      build(textures);
    },
    update: (dt) => {
      if (hatch) hatch.visible = !state.hatchBroken;
      if (grate) grate.visible = !state.grateOpen;
      const step = wake.step;
      rig.time.value = step / 60;
      rig.shaft.value = state.hatchBroken ? 1 : 0.18;
      if (!built) {
        lastStep = step;
        return;
      }
      const b: Built = built;
      frames++;
      const cam = view.camera.position;
      const feet = game.player.feet;
      const camInside = insideWaterway(way, cam.x, cam.y, cam.z, 0.3);
      const playerInside = insideWaterway(way, feet.x, feet.y, feet.z, 0);
      const near =
        camInside ||
        playerInside ||
        nearWaterwayMouth(cam.x, cam.z, MOUTH_RADIUS, state.hatchBroken, state.grateOpen) ||
        nearWaterwayMouth(feet.x, feet.z, MOUTH_RADIUS, state.hatchBroken, state.grateOpen);
      // 初回の 2 フレームは出したままにして、ローディング中のウォームアップでパイプラインを作っておく
      const visible = frames <= 2 || near;
      b.root.visible = visible;

      // ムード（水路の中だけ暗く冷たく）。外では呼ばない（闘技場のムードと競合しない）
      const target = playerInside || camInside ? 1 : 0;
      const prev = weight;
      // ワープ（テレポート・リスポーン）直後はなじませずに合わせる
      const warped = Math.hypot(feet.x - lastFeet.x, feet.z - lastFeet.z) > 4;
      lastFeet.x = feet.x;
      lastFeet.z = feet.z;
      weight =
        weight < 0 || warped
          ? target
          : weight + (target - weight) * (1 - Math.exp(-Math.min(dt, 0.5) * MOOD_RATE));
      if (Math.abs(weight - target) < 1e-3) weight = target;
      if (weight > 0 || prev > 0) view.environment.setMood(WATERWAY_MOOD, weight);
      // 太陽がほぼ 0 の間は影の更新を止める（反射の仮想カメラの分も影を描き直さない）
      const shadow = view.environment.sun.shadow;
      const frozen = weight >= 0.99;
      if (frozen === shadow.autoUpdate) {
        shadow.autoUpdate = !frozen;
        shadow.needsUpdate = true;
      }

      // 反射はカメラが水路の中にいるときだけ
      reflectionEnabled = visible && camInside && reflectionNode !== null;
      reflectionWeight.value = reflectionEnabled ? 1 : 0;
      if (reflectionEnabled) reflectPlayer();

      // 波・しぶき（ゲームの固定ステップに合わせて進める。実時間に依存しない）
      if (visible && step > lastStep) advanceWater(b.fx, step);
      lastStep = step;
      b.fx.update(step / 60);
      b.fx.setShaftVisible(visible);
    },
  };
});

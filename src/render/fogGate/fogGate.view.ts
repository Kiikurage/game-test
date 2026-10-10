import { CircleGeometry, CylinderGeometry, Group, Mesh, PlaneGeometry } from 'three/webgpu';
import type { Object3D } from 'three/webgpu';
import { FOG_GATE } from '../../game/data/fogGate';
import { fogGateOf } from '../../game/fogGate/fogGate.system';
import type { FogGate } from '../../game/fogGate/fogGate';
import { registerViewPlugin } from '../viewPlugins';
import {
  createFogUniforms,
  createFogPillarMaterial,
  createFogWallMaterial,
  createGroundMistMaterial,
  FOG_BUDGET,
} from './fogGateMaterials';

/** 霧の壁の寸法（m）。門のコライダ（幅 4.4・高さ 6）より少し大きく、通路の壁の縁を隠す。 */
const WALL_WIDTH = 4.8;
const WALL_HEIGHT = 7.5;
/** 柱の位置: 門から通り抜ける向きへこの距離（m）。通路の上にそびえる。 */
const PILLAR_AHEAD = 1.2;
const PILLAR_RADIUS = { top: 3.0, bottom: 4.0 };
const MIST_RADIUS = 6;
/** 霧が現れる / 消える速さ（1/秒）。 */
const FADE_IN = 1.4;
const FADE_OUT = 0.45;
/** 画面を覆うヴェールの色（青白）。 */
const VEIL_BACKGROUND =
  'radial-gradient(ellipse at 50% 55%, rgba(244,249,255,1) 0%, rgba(196,218,252,1) 55%, rgba(132,166,232,1) 100%)';

const smooth = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

// 霧の門の見た目（#66）: 青白く揺らぐ霧の壁（門の中）・高さ 25m の霧の柱（ランドマーク）・足元の霧。
// 状態は game の `fogGateOf(game)`（closed / entering / sealed = 霧あり、open = 消える）を読むだけ。
// 入場演出（entering）は霧の壁が荒れて明るくなり、画面を青白いヴェール（DOM）が覆う。門の周辺はフォグ密度を上げる（0.04 / 0.015）。
// コスト: 透明メッシュのみ（`FOG_BUDGET`）。パーティクルは使わない。
registerViewPlugin('fogGate', ({ game, view, gameRenderer, level }) => {
  const gate: FogGate | null = fogGateOf(game);
  const placed = level?.gates.find((g) => g.def.id === FOG_GATE.id);
  if (!gate || !placed) return {};
  const quality = gameRenderer.quality.preset.level;
  const { def } = placed;

  const uniforms = createFogUniforms();
  const root = new Group();
  root.name = 'fogGate';
  root.position.set(def.x, placed.y, def.z);
  root.rotation.y = gate.yaw;

  // 霧の壁（門の中。前方 = ローカル +z）
  const walls = FOG_BUDGET.wallLayers[quality];
  for (let i = 0; i < walls; i++) {
    const mesh = new Mesh(
      new PlaneGeometry(WALL_WIDTH, WALL_HEIGHT),
      createFogWallMaterial(uniforms, {
        seed: 3.7 + i * 11.3,
        flow: i === 0 ? 1 : -0.7,
        width: WALL_WIDTH,
        height: WALL_HEIGHT,
        strength: i === 0 ? 1 : 0.7,
      }),
    );
    mesh.name = `fogGate:wall${i}`;
    mesh.position.set(0, WALL_HEIGHT / 2 - 0.2, i * 0.34 - 0.17);
    mesh.renderOrder = 4 + i;
    root.add(mesh);
  }

  // 地表の霧
  if (FOG_BUDGET.groundMist[quality] > 0) {
    const mist = new Mesh(
      new CircleGeometry(MIST_RADIUS, 32).rotateX(-Math.PI / 2),
      createGroundMistMaterial(uniforms, MIST_RADIUS),
    );
    mist.name = 'fogGate:mist';
    mist.position.set(0, 0.22, 0);
    mist.renderOrder = 3;
    root.add(mist);
  }

  // 霧の柱（ランドマーク。遠景から見える）。外側に薄いハロを重ねる
  const pillar = new Group();
  pillar.name = 'fogGate:pillar';
  pillar.position.set(0, 0, PILLAR_AHEAD);
  const baseY = placed.y - 1;
  const layers = FOG_BUDGET.pillarLayers[quality];
  for (let i = 0; i < layers; i++) {
    const grow = 1 + i * 0.7;
    const height = FOG_GATE.pillarHeightM + 1;
    const mesh = new Mesh(
      new CylinderGeometry(
        PILLAR_RADIUS.top * grow,
        PILLAR_RADIUS.bottom * grow,
        height,
        i === 0 ? 24 : 16,
        1,
        true,
      ),
      createFogPillarMaterial(uniforms, {
        baseY,
        height: FOG_GATE.pillarHeightM,
        seed: 1.3 + i * 7.1,
        flow: i === 0 ? 1 : 0.6,
        strength: i === 0 ? 1 : 0.5,
      }),
    );
    mesh.name = `fogGate:pillar${i}`;
    // 円柱の中心は高さの半分。足元は門の足元より 1m 下
    mesh.position.set(0, baseY - placed.y + height / 2, 0);
    mesh.renderOrder = 5 + i;
    mesh.frustumCulled = false;
    pillar.add(mesh);
  }
  root.add(pillar);
  view.scene.add(root);

  // 入場演出のヴェール（DOM。画面全体を青白い霧が覆う）
  const veil = document.createElement('div');
  veil.setAttribute('data-testid', 'fog-gate-veil');
  veil.setAttribute('aria-hidden', 'true');
  Object.assign(veil.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    background: VEIL_BACKGROUND,
    opacity: '0',
    zIndex: '4',
  });
  (document.getElementById('app') ?? document.body).appendChild(veil);

  let density = gate.fogVisible ? 1 : 0;
  let lastVeil = -1;
  let hidGraybox = false;
  let fogBoost = 1;
  const isTarget = (o: Object3D): boolean => o.name === `gate:${FOG_GATE.id}`;

  return {
    update: (dt) => {
      // 旧グレーボックスの半透明の板は隠す（levelView が作る。同じ門を二重に描かない）
      if (!hidGraybox) {
        const old = view.scene.getObjectByProperty('name', `gate:${FOG_GATE.id}`);
        if (old && isTarget(old)) {
          old.visible = false;
          hidGraybox = true;
        }
      }
      const step = Math.min(dt, 0.1);
      const target = gate.fogVisible ? 1 : 0;
      const rate = target > density ? FADE_IN : FADE_OUT;
      density += Math.sign(target - density) * Math.min(Math.abs(target - density), rate * step);
      uniforms.density.value = density;
      // 入場中は荒れる（0 → 1 → 余韻）。封鎖中はやや荒れたまま、閉じている間は静か
      const frame = gate.entryProgress;
      const surgeTarget =
        gate.state === 'entering'
          ? smooth(frame / 30)
          : gate.state === 'sealed'
            ? frame >= 0
              ? 0.5
              : 0.3
            : 0;
      uniforms.surge.value += (surgeTarget - uniforms.surge.value) * Math.min(1, step * 6);
      root.visible = density > 0.003;

      // 画面のヴェール
      const v = gate.veil;
      if (v !== lastVeil) {
        lastVeil = v;
        veil.style.opacity = v < 0.002 ? '0' : String(v);
      }

      // 門の周辺のフォグ密度（通常の 0.04 / 0.015 倍まで）
      const { feet } = game.player;
      const d = Math.hypot(feet.x - def.x, feet.z - def.z);
      const w = smooth(
        (FOG_GATE.localFogOuterM - d) / (FOG_GATE.localFogOuterM - FOG_GATE.localFogInnerM),
      );
      const wantBoost = 1 + (FOG_GATE.localFogFactor - 1) * w * density;
      fogBoost += (wantBoost - fogBoost) * Math.min(1, step * 3);
      view.environment.setFogBoost(fogBoost);
    },
  };
});

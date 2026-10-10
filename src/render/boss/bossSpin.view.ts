import {
  AdditiveBlending,
  DoubleSide,
  Mesh,
  MeshBasicNodeMaterial,
  RingGeometry,
  Vector3,
} from 'three/webgpu';
import {
  atan,
  exp,
  float,
  length,
  mix,
  positionLocal,
  pow,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';
import { bossSystemOf } from '../../game/boss/boss.system';
import { SPIN_BLADE_OFFSET, SPIN_RADIUS, spinStateOf } from '../../game/boss/moves/spin.move';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 回転斬り（技 6）の描画。ゲーム側の状態（`spinStateOf`）を毎フレーム読む。ボス本体の回転は `boss.view.ts` が
 * `spinStateOf(boss).angle` をヨーへ足して行う。ここでは斧の軌跡と、足元の砂塵・火花を出す。
 *
 * - **軌跡**: 腰の高さの外縁の細い輪（半径 3.5〜4.8m）。斧の向きに熾火色の細く明るい縁、後ろへすぐ消える尾（加算合成）（TSL。1 ドローコール）。
 *   判定の持続の間だけ見せ、終わったら 4F で消す。
 * - **砂塵・火花**: 斧の先（半径 4m）に 2F ごとに火花と塵（`particles.hit`）。
 */

/** 軌跡の長さ（rad）。短く、先頭から素早く消える。 */
const TRAIL = 1.0;
/** 軌跡が消えるまで（F）。 */
const FADE_FRAMES = 3;
/** 軌跡の高さ（足元から。m）。 */
const TRAIL_HEIGHT = 1.5;
/** 軌跡の内側の半径（m）。外縁の細い帯だけ見せる（プレイヤーに平たい膜をかけない）。 */
const TRAIL_INNER = 3.5;

registerViewPlugin('boss-spin', ({ game, view }) => {
  const head = uniform(0);
  const amount = uniform(0);
  const geometry = new RingGeometry(TRAIL_INNER, SPIN_RADIUS, 64, 1);
  geometry.rotateX(-Math.PI / 2);
  // 加算合成・深度書き込みなし: 下の物を覆わず、明るさを足すだけ
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
  });
  const ang = atan(positionLocal.x, positionLocal.z);
  // 先頭からどれだけ後ろか（0: 先頭 → 1: 尾の端）
  const behind = head
    .sub(ang)
    .mod(Math.PI * 2)
    .div(TRAIL);
  // 先頭の細く明るい縁（熾火色）と、すぐ消える尾
  const edge = exp(behind.mul(-28));
  const tail = pow(float(1).sub(behind).max(0), 4);
  const r = length(positionLocal.xz);
  const radial = smoothstep(TRAIL_INNER + 0.2, SPIN_RADIUS - 0.4, r).mul(
    float(1).sub(smoothstep(SPIN_RADIUS - 0.15, SPIN_RADIUS + 0.02, r)),
  );
  material.colorNode = mix(vec3(1.0, 0.28, 0.05), vec3(2.2, 1.1, 0.4), edge);
  material.opacityNode = edge.mul(0.7).add(tail.mul(0.16)).mul(radial).mul(amount);
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  mesh.visible = false;
  view.scene.add(mesh);

  const position = new Vector3();
  const normal = new Vector3();
  let fade = 0;
  let lastFrame = -1;
  let lastRotation = 0;
  let headAngle = 0;

  return {
    update() {
      const boss = bossSystemOf(game).boss;
      const state = boss?.alive ? spinStateOf(boss) : undefined;
      if (!boss || !state) {
        mesh.visible = false;
        fade = 0;
        lastFrame = -1;
        return;
      }
      if (state.hitting) fade = FADE_FRAMES;
      else if (state.frame !== lastFrame) fade = Math.max(0, fade - 1);
      if (fade <= 0 && !state.hitting) {
        mesh.visible = false;
        lastFrame = state.frame;
        return;
      }
      headAngle = boss.yaw + state.angle + SPIN_BLADE_OFFSET;
      head.value = headAngle;
      amount.value = state.hitting ? 1 : fade / FADE_FRAMES;
      mesh.visible = true;
      mesh.position.set(boss.position.x, boss.position.y + TRAIL_HEIGHT, boss.position.z);

      // 斧の先の火花・塵: 判定の持続の間、2F ごと（段の F が進んだときだけ）
      if (
        state.hitting &&
        state.frame !== lastFrame &&
        (state.frame % 2 === 0 || state.rotation !== lastRotation)
      ) {
        const a = headAngle;
        position.set(
          boss.position.x + Math.sin(a) * 4,
          boss.position.y + 0.15,
          boss.position.z + Math.cos(a) * 4,
        );
        normal.set(Math.sin(a + 1.2), 0.8, Math.cos(a + 1.2)).normalize();
        view.particles.hit(position, normal, 0.9);
      }
      lastFrame = state.frame;
      lastRotation = state.rotation;
    },
  };
});

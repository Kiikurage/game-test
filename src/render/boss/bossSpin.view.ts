import {
  AdditiveBlending,
  DoubleSide,
  Mesh,
  MeshBasicNodeMaterial,
  RingGeometry,
  Vector3,
} from 'three/webgpu';
import { atan, float, length, mix, positionLocal, pow, smoothstep, uniform, vec3 } from 'three/tsl';
import { bossSystemOf } from '../../game/boss/boss.system';
import { SPIN_RADIUS, spinStateOf } from '../../game/boss/moves/spin.move';
import { registerViewPlugin } from '../viewPlugins';

/**
 * 回転斬り（技 6）の描画。ゲーム側の状態（`spinStateOf`）を毎フレーム読む。ボス本体の回転は `boss.view.ts` が
 * `spinStateOf(boss).angle` をヨーへ足して行う。ここでは斧の軌跡と、足元の砂塵・火花を出す。
 *
 * - **軌跡**: 腰の高さの平たい輪（半径 2.2〜4.8m）。斧の向きを先頭に、後ろへ 2π の 35% ほど尾を引く（TSL。1 ドローコール）。
 *   判定の持続の間だけ見せ、終わったら 4F で消す。
 * - **砂塵・火花**: 斧の先（半径 4m）に 2F ごとに火花と塵（`particles.hit`）。
 */

/** 斧の向きの、ボスの正面からのずれ（rad。右手に斧を持って振る向き）。 */
const BLADE_OFFSET = 1.1;
/** 軌跡の長さ（rad）。 */
const TRAIL = 2.2;
/** 軌跡が消えるまで（F）。 */
const FADE_FRAMES = 4;
/** 軌跡の高さ（足元から。m）。 */
const TRAIL_HEIGHT = 1.5;

registerViewPlugin('boss-spin', ({ game, view }) => {
  const head = uniform(0);
  const amount = uniform(0);
  const geometry = new RingGeometry(2.2, SPIN_RADIUS, 64, 1);
  geometry.rotateX(-Math.PI / 2);
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
  const tail = pow(float(1).sub(behind).max(0), 2.2);
  const r = length(positionLocal.xz);
  const radial = smoothstep(2.2, SPIN_RADIUS - 0.25, r).mul(
    smoothstep(SPIN_RADIUS + 0.02, SPIN_RADIUS - 0.3, r)
      .mul(0.6)
      .add(0.4),
  );
  material.colorNode = mix(vec3(1.0, 0.3, 0.06), vec3(1.7, 0.8, 0.3), tail.mul(radial));
  material.opacityNode = tail.mul(radial).mul(amount);
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
      headAngle = boss.yaw + state.angle + BLADE_OFFSET;
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

import { Vector3, Quaternion, type Object3D } from 'three/webgpu';
import { PLAYER_ACTIONS } from '../../game/data';
import { registerViewPlugin } from '../viewPlugins';
import { drinkPose, flaskFill, flaskGlow } from './drinkPose';
import { FLASK_GRIP_Y, FLASK_LENGTH, FLASK_SCALE, createFlask, type FlaskMesh } from './flaskMesh';
import { BonePoseGuard } from './bonePoseGuard';
import { rotateBoneAbout, solveTwoBone } from './poseUtils';
import { StepClock } from './stepClock';

/**
 * 回復の見た目（#173）: 左手に自作の瓶（琥珀色に光る液体）を持ち、口元へ運んで頭を反らして飲む。
 * 効いた瞬間（`heal` イベント = F26）に体から光の粒が立ちのぼり、瓶の口から火花が散る。
 *
 * 瓶は左手のボーンに付けた小物で、動作（`heal` / `healEmpty`）の間だけ現れる。腕と頭はミキサーの後に手続きで補正する
 * （頭の傾きを強め、左手を IK で口元へ）。時間割は `drinkPose.ts`。空振り（瓶が空 = `healEmpty`）は中身が無い瓶で同じ動作を短くやる。
 */

/** 動作の全体フレーム。 */
const TOTAL = {
  heal: PLAYER_ACTIONS.heal.startup + PLAYER_ACTIONS.heal.active + PLAYER_ACTIONS.heal.recovery,
  healEmpty:
    PLAYER_ACTIONS.healEmpty.startup +
    PLAYER_ACTIONS.healEmpty.active +
    PLAYER_ACTIONS.healEmpty.recovery,
} as const;

/** 飲むときの頭の反らし（rad、頭・首・背骨の合計。クリップの控えめな動きに上乗せする）。 */
const HEAD_TILT = 0.62;
/** 口の位置（頭のボーンから、キャラクター空間の前方向）。兜の面頬の前。 */
const MOUTH_OFFSET = new Vector3(0, -0.015, 0.16);
/** 瓶の首の向き: 運ぶ間は上向き（−50°）、飲む間は口へ向けてやや上向き（−18°）。 */
const NECK_UP = (-50 * Math.PI) / 180;
const NECK_SIP = (-18 * Math.PI) / 180;
/** 左肘が逃げる向き（キャラクター空間。左・下・後ろ）。 */
const ELBOW_POLE = new Vector3(0.6, -0.5, -0.5);

const AXIS_X = new Vector3(1, 0, 0);

registerViewPlugin('heal-flask', ({ game, view }) => {
  const clock = new StepClock();
  let flask: FlaskMesh | null = null;
  let flaskRoot: Object3D | null = null;
  let burst = false;
  game.events.on('heal', () => {
    burst = true;
  });

  const axisX = new Vector3();
  const rootQ = new Quaternion();
  const mouth = new Vector3();
  const tip = new Vector3();
  const neckDir = new Vector3();
  const target = new Vector3();
  const pole = new Vector3();
  const handPos = new Vector3();
  const feet = new Vector3();
  const quat = new Quaternion();
  const parentQ = new Quaternion();
  const up = new Vector3();

  interface Rig {
    readonly root: Object3D;
    readonly handL: Object3D;
    readonly upper: Object3D;
    readonly lower: Object3D;
    readonly spine3: Object3D;
    readonly neck: Object3D;
    readonly head: Object3D;
    readonly guard: BonePoseGuard;
  }
  let rig: Rig | null = null;
  /** 飲む間は盾を隠す（前腕の盾が口元の瓶を覆うので、背に回した扱い）。 */
  let shield: Object3D | null = null;

  /** 使うボーンを（キャラクターごとに 1 度だけ）探す。足りなければ null。 */
  function findRig(root: Object3D): Rig | null {
    if (rig?.root === root) return rig;
    const get = (name: string): Object3D | undefined => root.getObjectByName(name) ?? undefined;
    const handL = get('hand_l');
    const upper = get('upperarm_l');
    const lower = get('lowerarm_l');
    const spine3 = get('spine_03');
    const neck = get('neck_01');
    const head = get('Head');
    if (!handL || !upper || !lower || !spine3 || !neck || !head) return null;
    const guard = new BonePoseGuard([spine3, neck, head, upper, lower, handL]);
    rig = { root, handL, upper, lower, spine3, neck, head, guard };
    return rig;
  }

  return {
    update(dt) {
      const anim = game.player.animation;
      const drinking = anim.state === 'heal' || anim.state === 'healEmpty';
      const root = view.shadowFocusTarget;
      if (!root) return;
      const fire = burst;
      burst = false;
      if (fire) {
        feet.copy(root.position);
        view.particles.healGlow(feet);
      }
      const found = findRig(root);
      if (!found) return;
      const { handL, upper, lower, spine3, neck, head, guard } = found;
      if (!drinking) {
        clock.reset();
        guard.restore();
        if (flask) flask.root.visible = false;
        if (shield) shield.visible = true;
        return;
      }
      if (!flask || flaskRoot !== handL) {
        flask?.dispose();
        flask = createFlask();
        flaskRoot = handL;
        handL.add(flask.root);
      }

      const empty = anim.state === 'healEmpty';
      const frame = clock.update(dt, anim.stateFrame, anim.frozen);
      const u = Math.min(1, frame / TOTAL[anim.state]);
      const pose = drinkPose(u);
      const sip = empty ? pose.sip * 0.5 : pose.sip;

      shield ??= root.getObjectByName('attach:shield') ?? null;
      if (shield) shield.visible = pose.flask < 0.3;
      flask.root.visible = root.visible && pose.flask > 0.01;
      flask.setFill(flaskFill(u, empty));
      flask.setGlow(flaskGlow(u, empty));
      flask.root.scale.setScalar(FLASK_SCALE * pose.flask);
      if (!root.visible) return;

      guard.begin();
      // 頭を後ろへ反らす（背骨・首・頭に分けて、キャラクターの右軸まわり。負 = 後ろ）
      root.updateWorldMatrix(true, true);
      axisX.copy(AXIS_X).transformDirection(root.matrixWorld);
      const tilt = HEAD_TILT * sip;
      rotateBoneAbout(spine3, axisX, -tilt * 0.15);
      rotateBoneAbout(neck, axisX, -tilt * 0.4);
      rotateBoneAbout(head, axisX, -tilt * 0.45);

      // 口の位置（反らした頭に合わせて回す）
      root.getWorldQuaternion(rootQ);
      head.getWorldPosition(mouth);
      up.copy(MOUTH_OFFSET)
        .applyQuaternion(rootQ)
        .applyAxisAngle(axisX, -tilt * 0.45);
      mouth.add(up);

      // 瓶の首の向き（口へ向かう方向。キャラクター空間で後ろ向き + 上下）
      const phi = NECK_UP + (NECK_SIP - NECK_UP) * sip;
      neckDir.set(0, -Math.sin(phi), -Math.cos(phi)).applyQuaternion(rootQ);
      // 瓶の口（栓の先）: 運ぶ間は胸の前・口の下、飲む間は口へ
      const away = 1 - sip;
      tip.copy(mouth);
      up.set(0, -0.14 * away, 0.12 * away).applyQuaternion(rootQ);
      tip.add(up);
      // 握った手の位置 = 瓶の口 − 首の向き × (握りから口まで)
      target.copy(tip).addScaledVector(neckDir, -(FLASK_LENGTH - FLASK_GRIP_Y));
      pole.copy(ELBOW_POLE).applyQuaternion(rootQ);
      solveTwoBone(upper, lower, handL, target, pole, pose.arm);

      guard.end();

      // 瓶は手に付けたまま、向きと位置を（ワールドで）合わせ直す
      handL.updateWorldMatrix(true, false);
      handL.getWorldPosition(handPos);
      handPos.addScaledVector(neckDir, -FLASK_GRIP_Y);
      flask.root.position.copy(handPos);
      handL.worldToLocal(flask.root.position);
      quat.setFromUnitVectors(up.set(0, 1, 0), neckDir);
      handL.getWorldQuaternion(parentQ);
      flask.root.quaternion.copy(parentQ).invert().multiply(quat);

      // 効いた瞬間（healApply = F26）、瓶の口から火花が散る
      if (fire) view.particles.chargeGlint(tip, 0.8);
    },
  };
});

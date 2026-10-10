import { Quaternion, Vector3, type Object3D } from 'three/webgpu';
import { rimAtTransitionFrame, BOSS_TRANSITION } from '../../game/boss/bossTransition';
import { bossTransitionOf } from '../../game/boss/bossTransition.system';
import { slamAt } from '../../game/camera/cameraEffects.system';
import type { Game } from '../../game/game';
import type { Boss } from '../../game/boss/boss';
import type { BossCharacter } from '../assets/bossCharacter';
import type { GameView } from '../gameView';
import { emberAtTransitionFrame, shieldReleased } from './bossLook';
import { bossIntroPose } from './bossIntroPose';
import { bossTransitionPose } from './bossTransitionPose';
import { ThrownShield } from './thrownShield';

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);

/** 背骨・首の回転の配分（合計 1）。 */
const SPINE: readonly (readonly [string, number])[] = [
  ['spine_01', 0.25],
  ['spine_02', 0.35],
  ['spine_03', 0.4],
];
const HEAD: readonly (readonly [string, number])[] = [
  ['neck_01', 0.4],
  ['head', 0.6],
];

/** 盾を投げ捨てる速度（ボスのモデル空間: +X が左、+Z が正面。m/s）。 */
const THROW_VELOCITY = new Vector3(5.5, 8.5, 4);
const THROW_SPIN = new Vector3(3.2, 1.5, 7);

/**
 * ボスのフェーズ移行の見た目（#84 / 6.5 節）。`bossTransitionOf(game).frame`（ボスの移行 F）に同期する。
 *  - F13: 盾が手を離れて飛び、地面に刺さる（`ThrownShield`。着地で破片・衝撃音・小さな振動）。斧は両手持ちへ。
 *  - F60–F100: 咆哮。眼窩・武器が橙に発光（`emberAtTransitionFrame`）、熾火が舞う、画面端が赤くなる（30F）。
 *  - 仰け反り・盾投げ・咆哮は `bossTransitionPose` の加算の回転（クリップ + 手続き）。
 * 移行が途中で中断された（ボスがリセットされた）ら、盾・熾火を元に戻す。
 */
export class BossTransitionFx {
  private touched = false;
  private roared = false;
  private lastRim = 0;
  private lastFrame = -1;
  private introFrame = -1;
  private thrown: ThrownShield | null = null;
  private readonly rq = new Quaternion();
  private readonly pq = new Quaternion();
  private readonly dq = new Quaternion();
  private readonly axis = new Vector3();
  private readonly feet = new Vector3();
  private readonly normal = new Vector3();

  constructor(
    private readonly game: Game,
    private readonly view: GameView,
    private readonly model: BossCharacter,
  ) {}

  /** 毎フレーム（フェーズの同期より前）。盾・熾火・画面の縁取りを進める。 */
  update(dt: number, boss: Boss): void {
    this.introFrame = boss.introFrame; // 入場演出（#85）の姿勢は applyPose が重ねる
    const frame = bossTransitionOf(this.game).frame;
    if (frame >= 0) {
      this.touched = true;
      const { model } = this;
      if (shieldReleased(frame) && model.hasShield) this.throwShield(boss);
      if (frame >= BOSS_TRANSITION.shieldThrow + 14) model.setGrip('twoHand');
      model.setEmber(emberAtTransitionFrame(frame));
      if (frame >= BOSS_TRANSITION.roar && !this.roared) {
        this.roared = true;
        this.view.particles.deathAsh(this.feet.copy(boss.position), 1.7, 3.2, 1);
      }
    } else if (this.touched) {
      this.touched = false;
      this.roared = false;
      if (boss.phase === 1) {
        // 中断（リセット）: 盾も熾火も元の見た目へ
        this.model.setPhase(1);
        this.clearShield();
      }
    }
    if (boss.phase === 1 && frame < 0 && this.thrown) this.clearShield();
    // 移行中の盾はシミュレーションの F に同期して飛ぶ（一時停止・スローでも合う）。移行の前後は実時間
    const simDt = frame >= 0 && this.lastFrame >= 0 ? (frame - this.lastFrame) / 60 : dt;
    this.lastFrame = frame;
    // `ThrownShield.update` は 1 回 0.05 秒まで。フレームが飛んでも（ステップ送り・低 fps）同じ軌道になるよう刻む
    for (let left = simDt; left > 1e-6 && this.thrown; left -= 1 / 60) {
      this.thrown.update(Math.min(left, 1 / 60));
    }
    const rim = frame >= 0 ? rimAtTransitionFrame(frame) : 0;
    if (rim !== this.lastRim) {
      this.lastRim = rim;
      this.view.postProcess.setScreenEffect({ rim });
    }
  }

  /** アニメーションの更新の後、`lateUpdate` の前に呼ぶ。手続きの姿勢を重ねる。 */
  applyPose(): void {
    const transition = bossTransitionOf(this.game).frame;
    const frame = transition >= 0 ? transition : this.introFrame;
    if (frame < 0) return;
    const pose = transition >= 0 ? bossTransitionPose(frame) : bossIntroPose(frame);
    const shake = Math.sin(frame * 2.1) * pose.tremor;
    const { root } = this.model;
    root.updateMatrixWorld(true);
    root.getWorldQuaternion(this.rq);
    for (const [name, w] of SPINE) {
      this.rotate(name, X, pose.spinePitch * w + shake * w);
      this.rotate(name, Y, pose.spineTwist * w);
    }
    for (const [name, w] of HEAD) this.rotate(name, X, pose.headPitch * w - shake * w * 2);
    this.rotate('upperarm_l', Z, pose.armSpread);
    this.rotate('upperarm_r', Z, -pose.armSpread);
  }

  /** モデル空間の軸まわりに、ボーンを追加で回す（親の姿勢を考慮。以降の子孫の行列も更新する）。 */
  private rotate(name: string, axis: Vector3, angle: number): void {
    if (Math.abs(angle) < 1e-5) return;
    const bone = this.model.root.getObjectByName(name);
    const parent = bone?.parent;
    if (!bone || !parent) return;
    parent.getWorldQuaternion(this.pq);
    this.axis.copy(axis).applyQuaternion(this.rq);
    this.dq.setFromAxisAngle(this.axis, angle);
    // 局所の回転 = 親^-1 · 世界の回転 · 親
    bone.quaternion.premultiply(this.dq.premultiply(this.pq.clone().invert()).multiply(this.pq));
    bone.updateMatrixWorld(true);
  }

  private throwShield(boss: Boss): void {
    const { model, view, game } = this;
    const shield: Object3D | undefined = model.detachShield(view.scene);
    if (!shield) return;
    // モデル空間の速度をボスの向きでワールドへ
    const yaw = new Quaternion().setFromAxisAngle(Y, boss.yaw);
    const velocity = THROW_VELOCITY.clone().applyQuaternion(yaw);
    const spin = THROW_SPIN.clone().applyQuaternion(yaw);
    this.thrown = new ThrownShield(shield, {
      velocity,
      spin,
      radius: 1.5,
      groundHeight: () => boss.position.y,
      onLand: (position) => {
        game.events.emit('sound', {
          cue: 'sfx.boss.slam2',
          source: 'boss',
          position: { x: position.x, y: position.y, z: position.z },
        });
        slamAt(game, position);
        // 破片: 地面から放射状に
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          this.normal.set(Math.sin(a), 0.7, Math.cos(a)).normalize();
          view.particles.hit(position, this.normal, 1.6);
        }
      },
    });
  }

  private clearShield(): void {
    this.thrown?.object.removeFromParent();
    this.thrown = null;
  }

  dispose(): void {
    this.clearShield();
    this.view.postProcess.setScreenEffect({ rim: 0 });
  }
}

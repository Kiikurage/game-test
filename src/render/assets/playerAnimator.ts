import { LoopRepeat, Quaternion, Vector3, type AnimationAction, type Object3D } from 'three/webgpu';
import type { PlayerAnimationState } from '../../game/player/player';
import { MOVEMENT } from '../../game/data';
import type { CharacterAssets } from './characterAssets';
import type { Character } from './character';
import type { ClipName } from './clips';

/**
 * プレイヤーの移動アニメーション（暫定の「速度ブレンド」実装。本格的なステートマシンは #32）。
 *
 * 構造: `PlayerAnimationState`（game 層が毎ステップ出す状態に依存しない描画情報）を受け取り、
 * 「レイヤー」ごとの目標ウェイトを決め、クリップの時刻を直接指定して合成する。
 * #32 はこのクラスを同じ入力（`update(dt, state)`）のまま置き換えればよい。
 *
 * - 立ち / 歩き / 走り / ダッシュ: 水平速度で 4 つのループをブレンド。位相は共通で、速度に比例して進める（足滑りを抑える）。
 * - ロックオン中の横・後ろ移動: 移動方向に脚（体全体）を向け、背骨で逆回転して上半身を対象へ向ける
 *   （前進クリップだけで 8 方向を手続きで構成。後退は逆再生）。
 * - ロール / バックステップ / 落下 / 着地: 1 回再生のクリップを状態のフレームに同期させる。
 */

export type PlayerAnimLayer =
  'idle' | 'walk' | 'jog' | 'sprint' | 'roll' | 'backstep' | 'fall' | 'land';

const LAYER_CLIP: Readonly<Record<PlayerAnimLayer, ClipName>> = {
  idle: 'Idle_Loop',
  walk: 'Walk_Loop',
  jog: 'Jog_Fwd_Loop',
  sprint: 'Sprint_Loop',
  roll: 'Roll',
  backstep: 'Sword_Dash',
  fall: 'Jump_Loop',
  land: 'Jump_Land',
};

/**
 * 各ループで「左足が最も前に出る」位相（0..1）。クリップの時刻 = (共通位相 + この値) % 1 とすると、
 * 歩き・走り・ダッシュの足の運びが揃い、ブレンド中に足が交差して見えない。
 * （Walk / Jog / Sprint を 60 分割でサンプルして測定）
 */
export const GAIT_PHASE_OFFSET = { walk: 0, jog: 0.967, sprint: 0.875 } as const;

/** クリップが「その場で」想定している移動速度（m/s。接地中の足の後退速度から測定）。足滑りの少ない再生速度を求める基準。 */
export const GAIT_NOMINAL_SPEED = { walk: 1.2, jog: 4.6, sprint: 7.5 } as const;

/** ロールのクリップを何倍速で再生し、どこまで使うか。調整値。 */
export const ROLL_CLIP = { timeScale: 2.625, endTime: 1.4 } as const;
/** バックステップ: 前方への踏み込み（Sword_Dash）を逆再生して、後ろへ跳び退く動きにする。 */
export const BACKSTEP_CLIP = { timeScale: 1.1, startTime: 0.4 } as const;

const ONE_SHOT_LAYERS: readonly PlayerAnimLayer[] = ['roll', 'backstep', 'fall', 'land'];
const LOCOMOTION_LAYERS: readonly PlayerAnimLayer[] = ['idle', 'walk', 'jog', 'sprint'];

const Y_AXIS = new Vector3(0, 1, 0);
const SPINE_BONES = ['spine_01', 'spine_02', 'spine_03'] as const;
/** 体を移動方向へ向ける最大角（ロックオン中の横移動）。 */
const MAX_LEG_YAW = (60 * Math.PI) / 180;

function wrap(a: number): number {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  else if (r <= -Math.PI) r += Math.PI * 2;
  return r;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export class PlayerAnimator {
  private readonly actions = new Map<PlayerAnimLayer, AnimationAction>();
  private readonly weights = new Map<PlayerAnimLayer, number>();
  private readonly durations = new Map<PlayerAnimLayer, number>();
  private gaitPhase = 0;
  private idlePhase = 0;
  private legYaw = 0;
  private readonly spineBones: Object3D[] = [];
  private readonly tmpQ = new Quaternion();
  private readonly tmpParentQ = new Quaternion();
  private readonly tmpD = new Quaternion();

  /** 指定すると、そのレイヤーを指定の時刻（秒）で固定表示する（撮影・調整用。通常は null）。 */
  debugPose: { layer: PlayerAnimLayer; time: number } | null = null;

  /** 現在最もウェイトの大きいクリップ（デバッグ・E2E 用）。 */
  dominantClip: ClipName = 'Idle_Loop';

  constructor(
    private readonly character: Character,
    assets: CharacterAssets,
  ) {
    for (const layer of Object.keys(LAYER_CLIP) as PlayerAnimLayer[]) {
      const clip = assets.getClip(LAYER_CLIP[layer]);
      const action = character.mixer.clipAction(clip);
      action.setLoop(LoopRepeat, Infinity);
      action.clampWhenFinished = false;
      action.timeScale = 0; // 時刻は update で直接指定する
      action.enabled = true;
      action.setEffectiveWeight(layer === 'idle' ? 1 : 0);
      action.play();
      this.actions.set(layer, action);
      this.weights.set(layer, layer === 'idle' ? 1 : 0);
      this.durations.set(layer, clip.duration);
    }
    for (const name of SPINE_BONES) {
      const bone = character.root.getObjectByName(name);
      if (bone) this.spineBones.push(bone);
    }
  }

  /** ロックオン中の脚の向き（ラジアン、モデルの向きに対する相対）。描画側がモデルのヨーに足す。 */
  get bodyYawOffset(): number {
    return this.legYaw;
  }

  update(dt: number, s: PlayerAnimationState): void {
    const targets = this.computeTargets(s);
    this.advanceTimes(dt, s, targets);
    if (this.debugPose) this.applyDebugPose(this.debugPose, targets);
    this.applyWeights(dt, targets);
    this.character.mixer.update(0);
  }

  private computeTargets(s: PlayerAnimationState): Record<PlayerAnimLayer, number> {
    const t: Record<PlayerAnimLayer, number> = {
      idle: 0,
      walk: 0,
      jog: 0,
      sprint: 0,
      roll: 0,
      backstep: 0,
      fall: 0,
      land: 0,
    };
    switch (s.state) {
      case 'roll':
        t.roll = 1;
        return t;
      case 'backstep':
        t.backstep = 1;
        return t;
      case 'fall':
        // 小さな段差の乗り降りで落下モーションがちらつかないよう、少し落ち続けてから切り替える
        if (s.stateFrame > 8) {
          t.fall = 1;
          return t;
        }
        break;
      case 'land':
        t.land = 1;
        return t;
      default:
        break;
    }
    // 速度でブレンド: 0 → 歩き → 走り → ダッシュ
    const v = s.speed;
    const { walk, run, dash } = MOVEMENT;
    if (v <= walk) {
      const k = smoothstep(0, walk * 0.9, v);
      t.idle = 1 - k;
      t.walk = k;
    } else if (v <= run) {
      const k = (v - walk) / (run - walk);
      t.walk = 1 - k;
      t.jog = k;
    } else {
      const k = Math.min(1, (v - run) / (dash - run));
      t.jog = 1 - k;
      t.sprint = k;
    }
    return t;
  }

  private advanceTimes(
    dt: number,
    s: PlayerAnimationState,
    targets: Record<PlayerAnimLayer, number>,
  ): void {
    // 立ち: ゆっくり進める
    const idleDur = this.durations.get('idle') ?? 1;
    this.idlePhase = (this.idlePhase + dt / idleDur) % 1;
    this.setTime('idle', this.idlePhase * idleDur);

    // 歩行系: 共通の位相を速度に比例して進める。サイクルあたりの距離をウェイトで混ぜる。
    const wSum = targets.walk + targets.jog + targets.sprint;
    if (wSum > 0.001) {
      const cycleDist =
        (targets.walk * GAIT_NOMINAL_SPEED.walk * (this.durations.get('walk') ?? 1) +
          targets.jog * GAIT_NOMINAL_SPEED.jog * (this.durations.get('jog') ?? 1) +
          targets.sprint * GAIT_NOMINAL_SPEED.sprint * (this.durations.get('sprint') ?? 1)) /
        wSum;
      // ロックオン中の後退は逆再生
      const reverse =
        s.lockedOn &&
        s.localVelocity.z < -0.5 &&
        Math.abs(s.localVelocity.z) > Math.abs(s.localVelocity.x);
      const cycles = (dt * s.speed) / cycleDist;
      this.gaitPhase = (((this.gaitPhase + (reverse ? -cycles : cycles)) % 1) + 1) % 1;
    }
    for (const layer of ['walk', 'jog', 'sprint'] as const) {
      const phase = (this.gaitPhase + GAIT_PHASE_OFFSET[layer]) % 1;
      this.setTime(layer, phase * (this.durations.get(layer) ?? 1));
    }

    // 1 回再生系: 状態のフレームに同期（F1 = 経過 0 フレーム）
    const elapsed = Math.max(0, s.stateFrame - 1) / 60;
    this.setTime('roll', Math.min(ROLL_CLIP.endTime, elapsed * ROLL_CLIP.timeScale));
    this.setTime(
      'backstep',
      Math.max(0, BACKSTEP_CLIP.startTime - elapsed * BACKSTEP_CLIP.timeScale),
    );
    const fallDur = this.durations.get('fall') ?? 1;
    this.setTime('fall', (elapsed % fallDur) * 1);
    const landDur = (this.durations.get('land') ?? 1) - 0.05;
    this.setTime('land', Math.min(landDur, elapsed * 1.6));

    // 脚の向き（ロックオン中の横・後退移動）
    let wantedLegYaw = 0;
    if (s.lockedOn && s.speed > 0.8 && (s.state === 'move' || s.state === 'dash')) {
      // 移動方向（モデル基準, 0 = 前, + = 右...）。local x は右が正、z は前が正。
      let angle = Math.atan2(-s.localVelocity.x, s.localVelocity.z); // + = 左（yaw 増加方向）
      if (Math.abs(angle) > Math.PI / 2) angle = wrap(angle - Math.sign(angle) * Math.PI); // 後退は逆再生なので前向きに折り返す
      wantedLegYaw = Math.max(-MAX_LEG_YAW, Math.min(MAX_LEG_YAW, angle));
    }
    this.legYaw += (wantedLegYaw - this.legYaw) * (1 - Math.exp(-dt * 14));
  }

  private applyDebugPose(
    pose: { layer: PlayerAnimLayer; time: number },
    targets: Record<PlayerAnimLayer, number>,
  ): void {
    for (const layer of Object.keys(LAYER_CLIP) as PlayerAnimLayer[]) {
      targets[layer] = layer === pose.layer ? 1 : 0;
      this.weights.set(layer, targets[layer]);
    }
    this.setTime(pose.layer, pose.time);
    this.legYaw = 0;
  }

  private setTime(layer: PlayerAnimLayer, time: number): void {
    const action = this.actions.get(layer);
    if (action) action.time = time;
  }

  private applyWeights(dt: number, targets: Record<PlayerAnimLayer, number>): void {
    let total = 0;
    let best: PlayerAnimLayer = 'idle';
    let bestW = -1;
    for (const layer of Object.keys(LAYER_CLIP) as PlayerAnimLayer[]) {
      const current = this.weights.get(layer) ?? 0;
      const target = targets[layer];
      // 1 回再生系は入るときも出るときも素早く（回避の切れ味）。移動系は速度の変化に合わせて滑らかに。
      const oneShot = ONE_SHOT_LAYERS.includes(layer);
      const rate = oneShot
        ? target > current
          ? 40
          : 18
        : LOCOMOTION_LAYERS.includes(layer)
          ? 16
          : 12;
      const next = current + (target - current) * (1 - Math.exp(-dt * rate));
      this.weights.set(layer, next < 0.001 ? 0 : next);
      total += next < 0.001 ? 0 : next;
    }
    // 合計が 1 になるよう正規化して適用
    for (const layer of Object.keys(LAYER_CLIP) as PlayerAnimLayer[]) {
      const w = (this.weights.get(layer) ?? 0) / (total || 1);
      this.actions.get(layer)?.setEffectiveWeight(w);
      if (w > bestW) {
        bestW = w;
        best = layer;
      }
    }
    this.dominantClip = LAYER_CLIP[best];
  }

  /**
   * 上半身を脚の向きと逆に回し、体は移動方向・上半身は対象方向にする。
   * モデルのルート変換（`bodyYawOffset` を含む）を設定した後、`update` の後に呼ぶ。
   */
  applyTwist(): void {
    if (Math.abs(this.legYaw) < 1e-3 || this.spineBones.length === 0) return;
    const per = -this.legYaw / this.spineBones.length;
    for (const bone of this.spineBones) {
      const parent = bone.parent;
      if (!parent) continue;
      parent.updateWorldMatrix(true, false);
      parent.getWorldQuaternion(this.tmpParentQ);
      // ワールドの Y 軸回りに per だけ回す: local' = parent⁻¹ · R · parent · local
      this.tmpD.setFromAxisAngle(Y_AXIS, per);
      this.tmpQ.copy(this.tmpParentQ).invert().multiply(this.tmpD).multiply(this.tmpParentQ);
      bone.quaternion.premultiply(this.tmpQ);
      bone.updateMatrixWorld(true);
    }
  }
}

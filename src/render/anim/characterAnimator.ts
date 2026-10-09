import { Quaternion, Vector3, type AnimationClip, type Object3D } from 'three/webgpu';
import type { StateKind } from '../../game/anim/characterFsm';
import { simFrameToClipTime, SIM_FPS, type ClipEventEntry } from '../../game/anim/eventMarkers';
import {
  GAIT_PHASE_OFFSET,
  PLAYER_LOCOMOTION,
  locomotionBlend,
  type LocomotionBlend,
  type LocomotionProfile,
} from '../../game/anim/locomotion';
import type { Character } from '../assets/character';
import type { ClipName } from '../assets/clips';
import { upperBodyBoneNames } from './boneMask';
import { LayeredAnimation } from './layeredAnimation';

/**
 * キャラクターのアニメーションコントローラ（プレイヤー・雑魚・ボス共通。`render` 層）。
 *
 * `game` 層が毎ステップ出す `CharacterAnimState`（状態・状態フレーム・速度・歩行位相）だけを読み、
 * クリップのウェイトと時刻を決める。ゲームの状態は変更しない（イベントマーカーの発火は game 側。
 * ここは「マーカー表の再生範囲と速度で、状態フレームに合わせてクリップを進める」だけ）。
 *
 * - 移動系（Idle / Move）: 立ち ⇔ 歩き ⇔ 走り ⇔ ダッシュのブレンド。位相は game の `GaitClock` のもの。
 *   ロックオン中は立ちが戦闘待機（Sword_Idle）になる。
 * - Action 系: マーカー表（`actionEntry(actionId)`）の再生範囲・再生速度で状態フレームに同期（仕様のフレームに
 *   クリップを合わせる。0.3 節）。表がない状態は `states` のクリップ指定で動く。
 * - クロスフェード時間は `fade`（既定）と状態ごとの指定。上半身 / 下半身は `LayeredAnimation` のチャンネル。
 * - ヒットストップ中（`frozen`）は時刻もウェイトも止める。
 *
 * 状態を足す手順: ゲーム側の状態グラフに状態 ID、マーカー表に `<prefix>.<動作 ID>` を足せば、
 * `actionEntry` が引ける限りこのクラスは変更なしで再生する。
 */

export interface CharacterAnimState {
  readonly state: string;
  readonly kind: StateKind;
  readonly actionId: string | null;
  /** 現在の状態に入ってからのフレーム数（F1 起点）。 */
  readonly stateFrame: number;
  /** マーカー表のない動作の全体フレーム数（着地など。なければ 0）。 */
  readonly totalFrames: number;
  readonly speed: number;
  readonly localVelocity: { readonly x: number; readonly z: number };
  readonly lockedOn: boolean;
  readonly gaitPhase: number;
  readonly gaitPhaseStep: number;
  readonly frozen: boolean;
}

/** マーカー表のない状態のクリップ指定。 */
export interface StateClipSpec {
  readonly clip: ClipName;
  /** クリップ内で使う範囲（秒）。既定は全体。 */
  readonly range?: readonly [start: number, end: number];
  /** true: 範囲をループ再生（再生速度 `rate`）。false: 範囲全体を状態の全体フレームに合わせる。 */
  readonly loop?: boolean;
  /** ループのときの再生速度（既定 1）。 */
  readonly rate?: number;
  /** この状態フレームを超えるまでは移動系のポーズのまま（落下モーションのちらつき防止）。 */
  readonly delayFrames?: number;
  /** `totalFrames` が 0 のときに範囲全体を合わせるフレーム数。 */
  readonly fallbackFrames?: number;
  readonly fadeIn?: number;
  readonly fadeOut?: number;
}

export interface CharacterAnimatorConfig {
  /** 動作 ID → マーカー表のエントリ（`player.roll` など）。 */
  readonly actionEntry: (actionId: string) => ClipEventEntry | undefined;
  /** 状態 ID → クリップ指定。表で引ける Action 状態は書かなくてよい。 */
  readonly states?: Readonly<Record<string, StateClipSpec>>;
  /** 表で引く動作に使うフェード時間（状態 ID 別。なければ `fade.action`）。 */
  readonly actionFades?: Readonly<Record<string, { fadeIn: number; fadeOut: number }>>;
  readonly profile?: LocomotionProfile;
  /** ロックオン中の立ち（戦闘待機）。 */
  readonly combatIdle?: ClipName;
  readonly fade?: {
    readonly locomotion?: number;
    readonly action?: { readonly fadeIn: number; readonly fadeOut: number };
  };
  /** 起動時に作っておく状態（初回の再生でのカクつきを避ける）。 */
  readonly preload?: readonly string[];
}

type Resolve = (name: ClipName) => AnimationClip;

const Y_AXIS = new Vector3(0, 1, 0);
const SPINE_BONES = ['spine_01', 'spine_02', 'spine_03'] as const;
/** 体を移動方向へ向ける最大角（ロックオン中の横移動）。 */
const MAX_LEG_YAW = (60 * Math.PI) / 180;

const LOCO_LAYERS = ['idle', 'walk', 'jog', 'sprint'] as const;
const LOCO_CLIP: Readonly<Record<(typeof LOCO_LAYERS)[number], ClipName>> = {
  idle: 'Idle_Loop',
  walk: 'Walk_Loop',
  jog: 'Jog_Fwd_Loop',
  sprint: 'Sprint_Loop',
};
const COMBAT_IDLE_LAYER = 'combatIdle';
const UPPER_OVERRIDE_PREFIX = 'upper:';

function wrap(a: number): number {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  else if (r <= -Math.PI) r += Math.PI * 2;
  return r;
}

const wrap01 = (x: number): number => ((x % 1) + 1) % 1;

/** 1 フレームの計画: どのレイヤをどの時刻で表示するか。 */
interface Plan {
  readonly layer: string;
  readonly time: number;
}

export class CharacterAnimator {
  private readonly layers: LayeredAnimation;
  private readonly clipDuration = new Map<string, number>();
  private readonly blend: LocomotionBlend = { idle: 1, walk: 0, jog: 0, sprint: 0 };
  private readonly profile: LocomotionProfile;
  private readonly warned = new Set<string>();
  private idlePhase = 0;
  private legYaw = 0;
  private upperOverride: { layer: string; weight: number; time: number } | null = null;
  private readonly spineBones: Object3D[] = [];
  private readonly tmpQ = new Quaternion();
  private readonly tmpParentQ = new Quaternion();
  private readonly tmpD = new Quaternion();

  /** 指定すると、そのレイヤーを指定の時刻（秒）で固定表示する（撮影・調整用。通常は null）。 */
  debugPose: { layer: string; time: number } | null = null;

  /** 下半身チャンネルで最もウェイトの大きいクリップ（デバッグ・E2E 用）。 */
  dominantClip: string = LOCO_CLIP.idle;

  constructor(
    character: Character,
    private readonly resolve: Resolve,
    private readonly config: CharacterAnimatorConfig,
  ) {
    this.profile = config.profile ?? PLAYER_LOCOMOTION;
    const root = character.root;
    this.layers = new LayeredAnimation(character.mixer, root, upperBodyBoneNames(root));
    const loco = config.fade?.locomotion ?? 0.1;
    for (const id of LOCO_LAYERS) this.addLayer(id, LOCO_CLIP[id], { fadeIn: loco, fadeOut: loco });
    if (config.combatIdle) {
      this.addLayer(COMBAT_IDLE_LAYER, config.combatIdle, { fadeIn: 0.15, fadeOut: 0.15 });
    }
    for (const state of config.preload ?? []) this.ensureStateLayer(state, state);
    this.layers.setTarget('idle', 1);
    this.layers.snapToTargets();
    for (const bone of SPINE_BONES) {
      const b = root.getObjectByName(bone);
      if (b) this.spineBones.push(b);
    }
  }

  /** ロックオン中の脚の向き（ラジアン、モデルの向きに対する相対）。描画側がモデルのヨーに足す。 */
  get bodyYawOffset(): number {
    return this.legYaw;
  }

  /**
   * 上半身だけ別のクリップを載せる（0 で解除）。下半身は移動のまま。ガード構え・回復の飲む動作など、
   * 動きながら出す動作用。`time` はそのクリップの時刻（秒）。毎フレーム呼ぶ（呼ばなければ解除される）。
   */
  setUpperBody(clip: ClipName | null, weight = 1, time = 0): void {
    if (!clip || weight <= 0) {
      this.upperOverride = null;
      return;
    }
    const id = `${UPPER_OVERRIDE_PREFIX}${clip}`;
    if (!this.layers.has(id)) this.addLayer(id, clip, { fadeIn: 0.1, fadeOut: 0.12 });
    this.upperOverride = { layer: id, weight: Math.min(1, weight), time };
  }

  /** 毎フレーム呼ぶ。`alpha`: 直前ステップ → 最新ステップの補間係数。 */
  update(dt: number, s: CharacterAnimState, alpha = 1): void {
    // ヒットストップ中は凍結（時刻もブレンドも）。最新ステップの姿勢で止める。
    const a = s.frozen ? 1 : alpha;
    const animDt = s.frozen ? 0 : dt;

    this.layers.clearTargets();
    if (this.debugPose) {
      this.applyDebugPose(this.debugPose);
    } else {
      const plan = this.planAction(s, a);
      if (plan) this.applyAction(plan);
      else this.applyLocomotion(s, a, animDt);
      this.applyUpperOverride(plan === null);
    }
    this.updateLegYaw(s, animDt);
    this.layers.update(animDt);
    this.dominantClip = this.layers.dominantClip('lower') ?? this.dominantClip;
  }

  // ---- 計画 ----

  /** Action 系（Stagger / Dead も含め、移動系以外）の再生計画。移動系なら null。 */
  private planAction(s: CharacterAnimState, alpha: number): Plan | null {
    if (s.kind === 'idle' || s.kind === 'move') {
      // 移動系でも、クリップ指定のある状態（落下）は動作として扱う
      const spec = this.config.states?.[s.state];
      if (!spec || s.stateFrame <= (spec.delayFrames ?? 0)) return null;
    }
    // 状態に入ってから経過したフレーム（描画は 1 ステップ遅れで補間する。F1 の開始 = 0）
    const elapsed = Math.max(0, s.stateFrame - 2 + alpha);

    const spec = this.config.states?.[s.state];
    const entry = spec ? undefined : this.entryFor(s);
    if (entry) {
      const layer = this.ensureStateLayer(s.state, s.actionId ?? s.state);
      if (!layer) return null;
      return { layer, time: simFrameToClipTime(entry, elapsed + 1) };
    }
    if (spec) {
      const layer = this.ensureStateLayer(s.state, s.state);
      if (!layer) return null;
      const dur = this.clipDuration.get(layer) ?? 1;
      const [start, end] = spec.range ?? [0, dur];
      const len = Math.max(1e-3, end - start);
      let time: number;
      if (spec.loop) {
        time = start + (((elapsed / SIM_FPS) * (spec.rate ?? 1)) % len);
      } else {
        const total = s.totalFrames > 0 ? s.totalFrames : (spec.fallbackFrames ?? 30);
        time = start + Math.min(1, elapsed / total) * len;
      }
      return { layer, time };
    }
    if (s.kind === 'action') this.warnOnce(s.state, `no animation for state "${s.state}"`);
    return null;
  }

  private entryFor(s: CharacterAnimState): ClipEventEntry | undefined {
    const id = s.actionId ?? s.state;
    return this.config.actionEntry(id);
  }

  private applyAction(plan: Plan): void {
    this.layers.setTarget(plan.layer, 1);
    this.layers.setTime(plan.layer, plan.time);
  }

  private applyLocomotion(s: CharacterAnimState, alpha: number, animDt: number): void {
    const b = locomotionBlend(s.speed, this.profile, this.blend);
    const combat = s.lockedOn && this.config.combatIdle !== undefined;
    const idleLayer = combat ? COMBAT_IDLE_LAYER : 'idle';
    this.layers.setTarget(idleLayer, b.idle);
    this.layers.setTarget('walk', b.walk);
    this.layers.setTarget('jog', b.jog);
    this.layers.setTarget('sprint', b.sprint);

    // 立ち: 実時間でゆっくり進める
    this.idlePhase += animDt;
    for (const id of combat ? [COMBAT_IDLE_LAYER] : ['idle']) {
      const d = this.clipDuration.get(id) ?? 1;
      this.layers.setTime(id, this.idlePhase % d);
    }
    // 歩行系: game の位相（前ステップ → 最新ステップを alpha で補間）
    const phase = s.gaitPhase + s.gaitPhaseStep * (alpha - 1);
    for (const g of ['walk', 'jog', 'sprint'] as const) {
      const d = this.clipDuration.get(g) ?? 1;
      this.layers.setTime(g, wrap01(phase + GAIT_PHASE_OFFSET[g]) * d);
    }
  }

  private applyUpperOverride(locomoting: boolean): void {
    const o = this.upperOverride;
    if (!o) return;
    // 上半身チャンネルだけ、移動系の目標を (1 - w) 倍にして上書きレイヤを w だけ載せる。
    // Action 中は全身がその動作なので載せない。
    if (!locomoting) return;
    for (const id of [...LOCO_LAYERS, COMBAT_IDLE_LAYER]) {
      if (!this.layers.has(id)) continue;
      // 下半身の目標は触らず、上半身側だけ減らす
      this.scaleUpperTarget(id, 1 - o.weight);
    }
    this.layers.setTarget(o.layer, o.weight, 'upper');
    this.layers.setTime(o.layer, o.time);
  }

  private scaleUpperTarget(id: string, k: number): void {
    // LayeredAnimation はチャンネル別の目標を読み出す API を持たないので、下半身と同じ値を再設定する
    const w = this.layers.targetOf(id, 'lower');
    this.layers.setTarget(id, w * k, 'upper');
  }

  private applyDebugPose(pose: { layer: string; time: number }): void {
    const id = this.ensureStateLayer(pose.layer, pose.layer) ?? pose.layer;
    if (!this.layers.has(id)) return;
    this.layers.setTarget(id, 1);
    this.layers.setTime(id, pose.time);
    this.layers.snapToTargets();
    this.legYaw = 0;
  }

  private updateLegYaw(s: CharacterAnimState, dt: number): void {
    let wanted = 0;
    if (
      !this.debugPose &&
      s.lockedOn &&
      s.speed > 0.8 &&
      (s.kind === 'move' || s.kind === 'idle') &&
      s.state !== 'fall'
    ) {
      // 移動方向（モデル基準, 0 = 前）。local x は右が正、z は前が正。
      let angle = Math.atan2(-s.localVelocity.x, s.localVelocity.z); // + = 左（yaw 増加方向）
      if (Math.abs(angle) > Math.PI / 2) angle = wrap(angle - Math.sign(angle) * Math.PI); // 後退は逆再生なので前向きに折り返す
      wanted = Math.max(-MAX_LEG_YAW, Math.min(MAX_LEG_YAW, angle));
    }
    this.legYaw += (wanted - this.legYaw) * (1 - Math.exp(-dt * 14));
  }

  // ---- レイヤの用意 ----

  private addLayer(
    id: string,
    clipName: ClipName,
    options: { fadeIn: number; fadeOut: number },
  ): void {
    const clip = this.resolve(clipName);
    this.clipDuration.set(id, clip.duration);
    this.layers.addLayer(id, clip, options);
  }

  /**
   * 状態に対応するレイヤ（なければ作る）。レイヤ ID は状態 ID。
   * クリップ指定（`states`）→ マーカー表（動作 ID）の順に引く。どちらもなければ null。
   */
  private ensureStateLayer(state: string, actionId: string): string | null {
    if (this.layers.has(state)) return state;
    const spec = this.config.states?.[state];
    const clipName =
      spec?.clip ?? (this.config.actionEntry(actionId)?.clip as ClipName | undefined);
    if (!clipName) return null;
    const fades =
      this.config.actionFades?.[state] ?? this.config.fade?.action ?? DEFAULT_ACTION_FADE;
    this.addLayer(state, clipName, {
      fadeIn: spec?.fadeIn ?? fades.fadeIn,
      fadeOut: spec?.fadeOut ?? fades.fadeOut,
    });
    return state;
  }

  private warnOnce(key: string, message: string): void {
    if (this.warned.has(key)) return;
    this.warned.add(key);
    console.warn(message);
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

const DEFAULT_ACTION_FADE = { fadeIn: 0.05, fadeOut: 0.1 } as const;

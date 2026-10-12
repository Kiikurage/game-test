/**
 * プレイヤーのアクション別フレームデータ（仕様書 2.3 節の表と補足の転記）と落下攻撃（14.3.3 節）。
 * 値は `playerActions.json`（スキーマは下、読み込みは `loadData.ts`）。全体フレームは表の値と一致する（playerActions.test.ts）。
 *
 * 転記の規約:
 * - 発生・持続・硬直は表の値。判定のない動作（ロール・バックステップ・回復）は持続 0 とし、
 *   回復は「F26 で HP 加算」を `startup: 25` + `applyFrame: 26` で表す。
 * - キャンセル窓は仕様の文言から F 番号に直した値（根拠は各動作の `note` と仕様書）。
 *   窓の終端が全体を超えるもの（軽攻撃の連続入力窓 = 全体 + 12F）は動作終了後も受け付ける。
 *   例: light1 の次の攻撃は 持続終了 + 4F（F20）から 全体 + 12F（F48）、ロールは持続終了の 2F 後（F18）から。
 */
import { s, type Infer, type Schema } from '../../core/schema';
import { loadData } from './loadData';
import json from './playerActions.json';
import {
  totalFrames,
  type CancelTarget,
  type PlayerActionData,
  type PlayerActionId,
} from './types';

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });
const frameWindow = s.refine(s.object({ start: frames, end: frames }), (w) =>
  w.start > w.end ? `start (${w.start}) > end (${w.end})` : undefined,
);
const cancelTargets: readonly CancelTarget[] = [
  'lightAttack',
  'heavyAttack',
  'attack',
  'dodge',
  'guard',
  'heal',
  'move',
];
const cancel = s.object({
  to: s.literal(...cancelTargets),
  start: frames,
  end: frames,
});

type Shape = Record<string, Schema<unknown>>;

/** 1 動作のスキーマ。`extra` はその動作に必須の項目（弧・無敵・スーパーアーマーなど）。 */
function action<const Id extends PlayerActionId, E extends Shape>(id: Id, extra: E) {
  return s.object({
    id: s.literal(id),
    startup: frames,
    active: frames,
    recovery: frames,
    staminaCost: pos,
    poiseDamage: pos,
    moveDistance: pos,
    cancels: s.array(cancel),
    note: s.optional(s.string()),
    ...extra,
  });
}

const attack = { damageMultiplier: pos };
const superArmor = s.object({ start: frames, end: frames, poiseBonus: pos });

export const PlayerActionsDataSchema = s.object({
  actions: s.object({
    light1: action('light1', { ...attack, arcDeg: pos }),
    light2: action('light2', { ...attack, arcDeg: pos }),
    light3: action('light3', { ...attack, arcDeg: pos, range: pos }),
    /** 発生 F6 以降、持続終了までスーパーアーマー（強靭度 +poiseBonus）。 */
    heavy: action('heavy', { ...attack, superArmor }),
    /** フル溜め（溜め `chargeFrames` の後に発生へ）。 */
    heavyCharged: action('heavyCharged', { ...attack, chargeFrames: frames, superArmor }),
    runAttack: action('runAttack', attack),
    guardCounter: action('guardCounter', attack),
    backstab: action('backstab', attack),
    /** 発生は着地時（0）。全体は「着地 + 持続 + 硬直」。 */
    plunge: action('plunge', attack),
    roll: action('roll', { invuln: frameWindow }),
    backstep: action('backstep', { invuln: frameWindow }),
    /** `applyFrame` で HP を `healAmount` 加算（healApply マーカー）。 */
    heal: action('heal', { applyFrame: frames, healAmount: pos }),
    /** 残数 0 で入力したときの空振り動作（回復なし・SE のみ）。 */
    healEmpty: action('healEmpty', {}),
  }),
  /**
   * 落下攻撃（Drop Strike）と落下 / 着地の数値（仕様書 14.3.3 節）。フレームデータ・スタミナ・強靭度削りは
   * `actions.plunge`、重力は `tuning.player.gravity`。
   */
  plunge: s.object({
    /** 落下攻撃を出せる、地面からの最小の高さ（m）。これ以上離れて下降中が「落下」。 */
    minClearance: pos,
    /** 有効な落下高さ（踏み出した足場から着地点まで。m）。 */
    minHeight: pos,
    maxHeight: pos,
    /** この高さ以上は倍率 `actions.plunge.damageMultiplier`、未満（〜minHeight）は `lowMultiplier`。 */
    highHeight: pos,
    lowMultiplier: pos,
    /** 未発見（Idle / Suspicious）の敵への倍率の係数。 */
    unawareFactor: pos,
    /** 入力時に必要なスタミナ（消費も同じ値）。 */
    staminaMin: pos,
    /** 着地点を中心とする判定の円の半径（m）。ガード不能。 */
    radius: pos,
    hitStopFrames: frames,
    /** 空中補正（m/s）と、ロックオン対象への補正（標準 / 強。入力補助 11.2 節）。 */
    airCorrection: pos,
    airLockCorrection: pos,
    airLockCorrectionAssist: pos,
    /** ロックオン対象へ引く補正が、対象に近づくと弱まる目安の時間（秒）。 */
    airLockPullSeconds: pos,
    /** 攻撃しないで着地したときの硬直: この高さ以上で `landFrames`、未満は硬直なし。 */
    landStiffnessHeight: pos,
    landFrames: frames,
    /** 落下の始点からこの距離（m）までは地上と同じ操作。以降は踏み出しの速度 ± `airCorrection`。 */
    freeSteerDrop: pos,
    /** 入力時に「下に敵がいる」とみなす水平距離（m）。 */
    targetReach: pos,
  }),
  /** 落下攻撃の倍率: 未発見の敵に対して（2.3 節「未発見の敵 3.30」）。 */
  plungeUnawareMultiplier: pos,
  /** 強攻撃の溜め中の移動速度（m/s）。 */
  heavyChargeMoveSpeed: pos,
  /** 走り攻撃の発動条件: 走り最高速に対するこの割合以上の速さで動いている（ダッシュは常に可）。 */
  runAttackMinSpeedRatio: s.number({ min: 0, max: 1 }),
});
export type PlayerActionsData = Infer<typeof PlayerActionsDataSchema>;

const data = loadData(PlayerActionsDataSchema, json, 'playerActions.json');

export const PLAYER_ACTIONS = data.actions satisfies Record<PlayerActionId, PlayerActionData>;

/** 落下攻撃の倍率: 未発見の敵に対して。 */
export const PLUNGE_UNAWARE_MULTIPLIER = data.plungeUnawareMultiplier;

/** 落下攻撃と落下 / 着地の数値（14.3.3 節）。 */
export const PLUNGE = data.plunge;

/** 強攻撃の溜め中の移動速度（m/s）。 */
export const HEAVY_CHARGE_MOVE_SPEED = data.heavyChargeMoveSpeed;

/**
 * フル溜めに達した時点で追加で消費するスタミナ（34 − 28）。溜め開始時に溜めなしの 28 を消費し、
 * 溜めが 30F に達した時点で差分を消費する（合計 34。2.3 節「動作開始時に消費」を保つ）。
 */
export const HEAVY_FULL_CHARGE_STAMINA_EXTRA =
  PLAYER_ACTIONS.heavyCharged.staminaCost - PLAYER_ACTIONS.heavy.staminaCost;

/** 走り攻撃の発動条件: 走り最高速（4.5 m/s）に対するこの割合以上の速さで動いている（ダッシュは常に可）。 */
export const RUN_ATTACK_MIN_SPEED_RATIO = data.runAttackMinSpeedRatio;

/** ロール終了時（F32 = ロールの全体）にボタンが押されていればダッシュへ移行する。 */
export const ROLL_DASH_TRANSITION_FRAME = totalFrames(PLAYER_ACTIONS.roll);

/** 空振りの回復動作（残数 0 で入力）の全体フレーム。回復なし・SE のみ。 */
export const HEAL_EMPTY_FRAMES = totalFrames(PLAYER_ACTIONS.healEmpty);

export const PLAYER_ACTION_IDS = Object.keys(PLAYER_ACTIONS) as PlayerActionId[];

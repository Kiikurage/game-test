import type { PlayerActionData, PlayerActionId } from './types';

/**
 * プレイヤーのアクション別フレームデータ（仕様書 2.3 節の表と補足の転記）。値は初期値で調整対象。
 * 全体フレームは表の値と一致する（playerActions.test.ts で保証）。
 *
 * 転記の規約:
 * - 発生・持続・硬直は表の値。判定のない動作（ロール・バックステップ・回復）は持続 0 とし、
 *   回復は「F26 で HP 加算」を `startup: 25` + `applyFrame: 26` で表す。
 * - キャンセル窓は仕様の文言から F 番号に直した値（コメントに根拠）。
 *   窓の終端が全体を超えるもの（軽攻撃の連続入力窓 = 全体 + 12F）は動作終了後も受け付ける。
 */
export const PLAYER_ACTIONS = {
  light1: {
    id: 'light1',
    startup: 12,
    active: 4,
    recovery: 20,
    staminaCost: 14,
    damageMultiplier: 1.0,
    poiseDamage: 20,
    moveDistance: 0.5,
    arcDeg: 110,
    cancels: [
      // 次の軽攻撃/強攻撃: 持続終了 + 4F（F20）から 全体終了 + 12F（F48）まで
      { to: 'lightAttack', start: 20, end: 48 },
      { to: 'heavyAttack', start: 20, end: 48 },
      // ロール/バックステップ: 持続終了の 2F 後（F18）から
      { to: 'dodge', start: 18, end: 36 },
      // ガード: 持続終了の 6F 後（F22）から
      { to: 'guard', start: 22, end: 36 },
    ],
    note: '横斬り',
  },
  light2: {
    id: 'light2',
    startup: 10,
    active: 4,
    recovery: 22,
    staminaCost: 14,
    damageMultiplier: 1.05,
    poiseDamage: 20,
    moveDistance: 0.5,
    arcDeg: 90,
    cancels: [
      { to: 'lightAttack', start: 18, end: 48 },
      { to: 'heavyAttack', start: 18, end: 48 },
      { to: 'dodge', start: 16, end: 36 },
      { to: 'guard', start: 20, end: 36 },
    ],
    note: '斬り下ろし',
  },
  light3: {
    id: 'light3',
    startup: 16,
    active: 6,
    recovery: 30,
    staminaCost: 20,
    damageMultiplier: 1.3,
    poiseDamage: 35,
    moveDistance: 1.0,
    arcDeg: 40,
    range: 2.2,
    cancels: [
      // コンボ終点: 軽攻撃には繋がらず、強攻撃のみ可（窓は 持続終了 + 4F から 全体 + 12F）
      { to: 'heavyAttack', start: 26, end: 64 },
      { to: 'dodge', start: 24, end: 52 },
      { to: 'guard', start: 28, end: 52 },
    ],
    note: '突き。コンボ終点',
  },
  heavy: {
    id: 'heavy',
    startup: 22,
    active: 6,
    recovery: 38,
    staminaCost: 28,
    damageMultiplier: 1.8,
    poiseDamage: 60,
    moveDistance: 0.8,
    // 発生 F6 以降、持続終了（F28）までスーパーアーマー（強靭度 +40）
    superArmor: { start: 6, end: 28, poiseBonus: 40 },
    // ロール/バックステップへは F44（持続終了 + 16F）から
    cancels: [{ to: 'dodge', start: 44, end: 66 }],
    note: '溜めなし',
  },
  heavyCharged: {
    id: 'heavyCharged',
    startup: 22,
    active: 6,
    recovery: 38,
    chargeFrames: 30,
    staminaCost: 34,
    damageMultiplier: 2.3,
    poiseDamage: 80,
    moveDistance: 1.0,
    superArmor: { start: 6, end: 28, poiseBonus: 40 },
    cancels: [{ to: 'dodge', start: 44, end: 66 }],
    note: 'フル溜め（溜め 30F の後に発生へ。溜め中は歩き速度 1.0 m/s）',
  },
  runAttack: {
    id: 'runAttack',
    startup: 14,
    active: 5,
    recovery: 30,
    staminaCost: 20,
    damageMultiplier: 1.2,
    poiseDamage: 40,
    moveDistance: 2.0,
    cancels: [],
    note: 'ダッシュまたは走り中に攻撃',
  },
  guardCounter: {
    id: 'guardCounter',
    startup: 14,
    active: 5,
    recovery: 28,
    staminaCost: 16,
    damageMultiplier: 1.4,
    poiseDamage: 50,
    moveDistance: 0.8,
    cancels: [],
    note: 'ガード被弾から 30F 以内に攻撃。盾の打撃',
  },
  backstab: {
    id: 'backstab',
    startup: 10,
    active: 3,
    recovery: 34,
    staminaCost: 16,
    damageMultiplier: 4.0,
    poiseDamage: 100,
    moveDistance: 0.9,
    cancels: [],
    note: '致命の一撃（#39）。未発見の敵の背面 ±60°・1.6m 以内で軽攻撃。背後へ吸着',
  },
  plunge: {
    id: 'plunge',
    // 発生は着地時（0）。全体は「着地 + 28」
    startup: 0,
    active: 4,
    recovery: 24,
    staminaCost: 20,
    damageMultiplier: 2.2,
    poiseDamage: 60,
    moveDistance: 0,
    cancels: [],
    note: '落下攻撃（#39）。高さ 1.5m 以上、ガード不能、空中補正 ±1.5 m/s',
  },
  roll: {
    id: 'roll',
    startup: 3,
    active: 0,
    recovery: 29,
    staminaCost: 20,
    poiseDamage: 0,
    moveDistance: 3.2,
    invuln: { start: 4, end: 15 },
    // F26 から攻撃・ガード・回復・移動へキャンセル可
    cancels: [
      { to: 'attack', start: 26, end: 32 },
      { to: 'guard', start: 26, end: 32 },
      { to: 'heal', start: 26, end: 32 },
      { to: 'move', start: 26, end: 32 },
    ],
  },
  backstep: {
    id: 'backstep',
    startup: 2,
    active: 0,
    recovery: 20,
    staminaCost: 12,
    poiseDamage: 0,
    moveDistance: 2.0,
    invuln: { start: 1, end: 8 },
    cancels: [{ to: 'attack', start: 18, end: 22 }],
    note: 'ロックオン中または移動入力なしでロール入力',
  },
  heal: {
    id: 'heal',
    // F26 で HP 加算（healApply）。F1–F25 はロール・攻撃・ガードにキャンセル不可
    startup: 25,
    active: 0,
    recovery: 29,
    staminaCost: 0,
    poiseDamage: 0,
    moveDistance: 0,
    applyFrame: 26,
    healAmount: 120,
    cancels: [
      { to: 'dodge', start: 30, end: 54 },
      { to: 'attack', start: 36, end: 54 },
      { to: 'guard', start: 36, end: 54 },
    ],
    note: '回復中の移動 1.0 m/s。F26 より前に被弾して仰け反ると回復は失われ瓶だけ消費',
  },
  healEmpty: {
    id: 'healEmpty',
    // 残数 0 で入力したときの空振り動作（回復なし・SE のみ）。全体 20F
    startup: 20,
    active: 0,
    recovery: 0,
    staminaCost: 0,
    poiseDamage: 0,
    moveDistance: 0,
    cancels: [],
    note: '空振り（瓶 0 本で入力）。回復しない。移動 1.0 m/s',
  },
} as const satisfies Record<PlayerActionId, PlayerActionData>;

/** 落下攻撃の倍率: 未発見の敵に対して（2.3 節「未発見の敵 3.30」）。 */
export const PLUNGE_UNAWARE_MULTIPLIER = 3.3;

/**
 * 落下攻撃（Drop Strike）と落下 / 着地の数値（仕様書 14.3.3 節）。フレームデータ・スタミナ・強靭度削りは
 * `PLAYER_ACTIONS.plunge`、重力は `tuning.player.gravity`（20 m/s²）。
 */
export const PLUNGE = {
  /** 落下攻撃を出せる、地面からの最小の高さ（m）。これ以上離れて下降中が「落下」。 */
  minClearance: 0.6,
  /** 有効な落下高さ（踏み出した足場から着地点まで。m）。 */
  minHeight: 1.0,
  maxHeight: 3.0,
  /** この高さ以上は倍率 2.2、未満（〜minHeight）は `lowMultiplier`。 */
  highHeight: 1.5,
  lowMultiplier: 1.6,
  /** 未発見（Idle / Suspicious）の敵への倍率の係数（2.2 × 1.5 = 3.3）。 */
  unawareFactor: 1.5,
  /** 入力時に必要なスタミナ（消費も同じ値）。 */
  staminaMin: 20,
  /** 着地点を中心とする判定の円の半径（m）。持続は 4F、ガード不能。 */
  radius: 1.4,
  hitStopFrames: 10,
  /** 空中補正（踏み出し時の速度に対する入力の補正の上限。m/s）と、ロックオン対象への補正（標準 / 強。入力補助 11.2 節）。 */
  airCorrection: 1.5,
  airLockCorrection: 2.5,
  airLockCorrectionAssist: 3.5,
  /** ロックオン対象へ引く補正が、対象に近づくと弱まる目安の時間（秒。距離 ÷ これ以下に抑える）。 */
  airLockPullSeconds: 0.25,
  /** 攻撃しないで着地したときの硬直: この高さ以上で `landFrames`、未満は硬直なし。 */
  landStiffnessHeight: 2.0,
  landFrames: 10,
  /** 落下の始点からこの距離（m）までは地上と同じ操作（小さな段差で粘らない）。以降は踏み出しの速度 ± `airCorrection`。 */
  freeSteerDrop: 0.5,
  /** 入力時に「下に敵がいる」とみなす水平距離（m）。判定の円 1.4m + 空中補正で動ける分。 */
  targetReach: 2.5,
} as const;

/** 強攻撃の溜め中の移動速度（m/s）。 */
export const HEAVY_CHARGE_MOVE_SPEED = 1.0;

/**
 * フル溜めに達した時点で追加で消費するスタミナ（34 − 28）。溜め開始時に溜めなしの 28 を消費し、
 * 溜めが 30F に達した時点で差分を消費する（合計 34。2.3 節「動作開始時に消費」を保つ）。
 */
export const HEAVY_FULL_CHARGE_STAMINA_EXTRA =
  PLAYER_ACTIONS.heavyCharged.staminaCost - PLAYER_ACTIONS.heavy.staminaCost;

/** 走り攻撃の発動条件: 走り最高速（4.5 m/s）に対するこの割合以上の速さで動いている（ダッシュは常に可）。 */
export const RUN_ATTACK_MIN_SPEED_RATIO = 0.75;

/** ロール終了時（F32）にボタンが押されていればダッシュへ移行する。 */
export const ROLL_DASH_TRANSITION_FRAME = 32;

/** 空振りの回復動作（残数 0 で入力）の全体フレーム。回復なし・SE のみ。 */
export const HEAL_EMPTY_FRAMES = 20;

export const PLAYER_ACTION_IDS = Object.keys(PLAYER_ACTIONS) as PlayerActionId[];

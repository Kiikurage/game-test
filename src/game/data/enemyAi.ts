import type { LocomotionProfile } from '../anim/locomotion';
import { s, type Infer } from '../../core/schema';
import json from './enemyAi.json';
import { loadData } from './loadData';

/**
 * 雑魚敵の共通 AI パラメータ（仕様書 5.1 節 / 14.3.1 節）。初期値で調整対象。
 * 距離は m、速度は m/s、時間はフレーム（60Hz）または秒。
 */

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });
/** [最小, 最大]（一様乱数の範囲など）。 */
const range = s.refine(s.tuple(frames, frames), ([a, b]) => (a > b ? `${a} > ${b}` : undefined));

const EnemyTypeStatsSchema = s.object({
  hp: s.number({ min: 1 }),
  poise: pos,
  height: pos,
  radius: pos,
  turnDegPerSecond: pos,
  loadout: s.literal('soldier', 'shieldbearer'),
  bodyScale: pos,
});

export const EnemyAiDataSchema = s.object({
  stats: s.object({ undead_soldier: EnemyTypeStatsSchema, undead_shield: EnemyTypeStatsSchema }),
  vision: s.object({
    range: pos,
    fovDeg: s.number({ min: 0, max: 360 }),
    combatFovDeg: s.number({ min: 0, max: 360 }),
    eyeHeight: pos,
    targetHeight: pos,
    distanceBands: s.array(s.object({ upTo: pos, rate: pos }), { minLength: 1 }),
    /** 内側（全倍率）と外側の 2 段。 */
    angleBands: s.tuple(
      s.object({ withinDeg: pos, scale: pos }),
      s.object({ withinDeg: pos, scale: pos }),
    ),
    motionScale: s.object({ still: pos, walk: pos, run: pos, dash: pos }),
    darkScale: pos,
    suspiciousScale: pos,
  }),
  /** 聴覚。音の種類ごとの半径（3D 距離、壁越し可）。combat は攻撃・ガードの命中音、land は落下着地（高さ 2m 以上）。 */
  noiseRadius: s.object({
    walk: pos,
    run: pos,
    dash: pos,
    combat: pos,
    flask: pos,
    land: pos,
    wallCollapse: pos,
    bell: pos,
  }),
  hearing: s.object({
    gainPerSecond: pos,
    oneShotNoiseSeconds: pos,
    runNoiseMinSpeed: pos,
    walkNoiseMinSpeed: pos,
    landNoiseMinHeight: pos,
  }),
  gauge: s.object({ max: pos, suspicious: pos, decayPerSecond: pos }),
  ai: s.object({
    /** Alert の硬直（気付きから）。 */
    alertFrames: frames,
    /** Alert で一緒に気付かせる味方の距離。 */
    allyAlertRadius: pos,

    /** 追跡・帰還・巡回・Suspicious の移動速度。 */
    chaseSpeed: pos,
    returnSpeed: pos,
    patrolSpeed: pos,
    suspiciousSpeed: pos,
    /** 加速度（m/s²）。 */
    acceleration: pos,

    /** 視線喪失からこの時間（F）で Return。 */
    lostSightFrames: frames,
    /** 出発地点からこの距離を超えたら強制 Return。 */
    leashRadius: pos,
    /** Return 中の HP 回復（最大 HP に対する毎秒の割合）。 */
    returnHealPerSecond: pos,
    /** Return を終える（出発地点に着いたとみなす）距離。 */
    homeArrivalRadius: pos,

    /** この距離以内になったら Chase → Approach。Approach で離れすぎたら Chase に戻る。 */
    approachRange: pos,
    approachExitRange: pos,
    /** Approach でペースを止める距離（これ以内で停止して旋回する）。 */
    holdRange: pos,
    /** ペースを止めて旋回する時間（F。範囲内の一様乱数）。0.5〜1.5 秒。 */
    holdFrames: range,
    /** Approach で間合いへ詰めるときの速度。 */
    approachSpeed: pos,
    /** Recover 後の攻撃クールダウン（F。範囲内の一様乱数）。HP 25% 以下は短い（焦り）。 */
    cooldownFrames: range,
    cooldownFramesDesperate: range,

    /**
     * 攻撃トークン（5.1 節）: 同時に Attack 状態に入れる敵の最大数と、持てなかった敵が待機中に
     * 対象の周りを回る円の半径（m）・最大速度（m/s）。トークンの再試行間隔（F）も。
     */
    maxAttackers: frames,
    orbitRadius: pos,
    orbitSpeed: pos,
    tokenRetryFrames: frames,

    /** Suspicious: 感知源を向く旋回、歩く最大距離、到着後に見回す時間。 */
    suspiciousTurnDegPerSecond: pos,
    suspiciousMaxWalk: pos,
    /** 鐘の音を聞いたときの最大の歩く距離（鐘は例外。14.3.1 節）。 */
    suspiciousMaxWalkBell: pos,
    suspiciousLookFrames: frames,
    /** 見回しの首振り（度）と周期（F）。 */
    suspiciousLookSweepDeg: pos,
    suspiciousLookPeriodFrames: frames,

    /** 巡回の既定の半径と、端での待ち。 */
    patrolRadius: pos,
    patrolPauseFrames: frames,

    /** 向きのずれがこの角度（度）以下なら全速で前進、以上なら止まって旋回だけする（間は線形）。 */
    moveYawFullSpeedDeg: pos,
    moveYawStopDeg: pos,
  }),
  /** 敵の移動アニメーションの速度の基準（歩き・走り・ダッシュのブレンド点）。 */
  locomotion: s.object({ walk: pos, run: pos, dash: pos }),
});
export type EnemyAiData = Infer<typeof EnemyAiDataSchema>;

const data = loadData(EnemyAiDataSchema, json, 'enemyAi.json');

/** 敵の種別ごとの基本ステータス（5.2 / 5.3 節）。 */
export interface EnemyTypeStats {
  readonly hp: number;
  /** 強靭度（ひるみは #50 以降）。 */
  readonly poise: number;
  /** 身長（m）。ロックオンの胸元・カメラ距離に使う。 */
  readonly height: number;
  /** 移動用カプセルの半径（m）。 */
  readonly radius: number;
  /** 通常の旋回速度（度/秒）。 */
  readonly turnDegPerSecond: number;
  /** 描画の装備一式と体格倍率（見た目。game は読まない）。 */
  readonly loadout: 'soldier' | 'shieldbearer';
  readonly bodyScale: number;
}

export const ENEMY_STATS = data.stats satisfies Record<string, EnemyTypeStats>;

export type EnemyTypeId = keyof typeof ENEMY_STATS;

/** プレイヤーの動作の分類（視覚の倍率と足音の半径に使う）。 */
export type PlayerMotion = 'still' | 'walk' | 'run' | 'dash';

/** 視覚（5.1 節の最大範囲と、14.3.1 節の気付きゲージの増加量）。 */
/**
 * range・fovDeg: 最大の視認距離と水平 FOV（全角）/ combatFovDeg: 戦闘中（Alert 以降）の視野角（背後へ回り込まれても
 * 見失わない）/ eyeHeight・targetHeight: 視線を引く目の高さとプレイヤーの狙う高さ（足元から）/
 * distanceBands: `upTo` 以内ならゲージ増加量 `rate`（毎秒）/ angleBands: 正面から `withinDeg` 以内（片側）なら倍率 `scale`
 * （それ以外 = FOV 外は 0）/ motionScale: プレイヤーの動作による倍率 / darkScale: 暗所（環境の問い合わせは
 * `EnemyDeps.darkness`）の倍率 / suspiciousScale: Suspicious 中の倍率。
 */
export const ENEMY_VISION = data.vision;

/** 聴覚。音の種類ごとの半径（3D 距離、壁越し可）。 */
export const NOISE_RADIUS = data.noiseRadius;
export type NoiseKind = keyof typeof NOISE_RADIUS;

/** 聴覚の増加量（毎秒）。 */
export const HEARING_GAIN_PER_SECOND = data.hearing.gainPerSecond;
/** 音が一発ものの場合に、気付きの判定へ効く時間（秒）。 */
export const ONE_SHOT_NOISE_SECONDS = data.hearing.oneShotNoiseSeconds;
/** 走りの音とみなす水平速度（m/s）。これ未満の移動は歩き。 */
export const RUN_NOISE_MIN_SPEED = data.hearing.runNoiseMinSpeed;
/** 歩きの音を出す最低の水平速度（m/s）。 */
export const WALK_NOISE_MIN_SPEED = data.hearing.walkNoiseMinSpeed;
/** 着地音を出す落下の高さ（m）。 */
export const LAND_NOISE_MIN_HEIGHT = data.hearing.landNoiseMinHeight;

/** 気付きゲージ（0〜100）。 */
/** max: 上限 / suspicious: この値以上で Suspicious / decayPerSecond: 感知がないときの減少（毎秒）。 */
export const ENEMY_GAUGE = data.gauge;

/** 状態遷移（Alert / Chase / Approach / Return / Suspicious / 巡回）の数値。各項目の意味は `enemyAi.ts` のスキーマ。 */
export const ENEMY_AI = data.ai;

/** 敵の移動アニメーションの速度の基準（歩き・走り・ダッシュのブレンド点）。 */
export const ENEMY_LOCOMOTION: LocomotionProfile = data.locomotion;

import type { LocomotionProfile } from '../anim/locomotion';

/**
 * 雑魚敵の共通 AI パラメータ（仕様書 5.1 節 / 14.3.1 節）。初期値で調整対象。
 * 距離は m、速度は m/s、時間はフレーム（60Hz）または秒。
 */

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

export const ENEMY_STATS = {
  undead_soldier: {
    hp: 120,
    poise: 50,
    height: 1.8,
    radius: 0.35,
    turnDegPerSecond: 240,
    loadout: 'soldier',
    bodyScale: 1,
  },
  undead_shield: {
    hp: 200,
    poise: 80,
    height: 1.9,
    radius: 0.38,
    // 盾持ちは旋回が遅い（5.3 節）
    turnDegPerSecond: 150,
    loadout: 'shieldbearer',
    bodyScale: 1.05,
  },
} as const satisfies Record<string, EnemyTypeStats>;

export type EnemyTypeId = keyof typeof ENEMY_STATS;

/** プレイヤーの動作の分類（視覚の倍率と足音の半径に使う）。 */
export type PlayerMotion = 'still' | 'walk' | 'run' | 'dash';

/** 視覚（5.1 節の最大範囲と、14.3.1 節の気付きゲージの増加量）。 */
export const ENEMY_VISION = {
  /** 最大の視認距離と水平 FOV（全角）。 */
  range: 14,
  fovDeg: 140,
  /**
   * 戦闘中（Alert 以降）の視野角。敵は相手の位置を意識しているので、背後へ回り込まれても首を振って見失わない
   * （距離と視線の遮蔽だけで判定する）。
   */
  combatFovDeg: 360,
  /** 視線を引く目の高さ（敵の足元から）と、プレイヤーの狙う高さ（足元から。胸元）。 */
  eyeHeight: 1.6,
  targetHeight: 1.2,
  /** 距離帯ごとのゲージ増加量（毎秒）。`upTo` 以内なら `rate`。 */
  distanceBands: [
    { upTo: 3, rate: 240 },
    { upTo: 8, rate: 120 },
    { upTo: 14, rate: 40 },
  ],
  /** 角度ごとの倍率（敵の正面基準）。`withinDeg` 以内（片側）なら `scale`。それ以外（FOV 外）は 0。 */
  angleBands: [
    { withinDeg: 40, scale: 1 },
    { withinDeg: 70, scale: 0.4 },
  ],
  /** プレイヤーの動作による倍率。 */
  motionScale: { still: 0.6, walk: 0.6, run: 1, dash: 1.4 } satisfies Record<PlayerMotion, number>,
  /** 暗所（地下墓所・水路・たいまつから 4m 超）の倍率。環境の問い合わせは `EnemyDeps.darkness`。 */
  darkScale: 0.7,
  /** Suspicious 中の倍率。 */
  suspiciousScale: 1.5,
} as const;

/** 聴覚。音の種類ごとの半径（3D 距離、壁越し可）。 */
export const NOISE_RADIUS = {
  walk: 2,
  run: 5,
  dash: 8,
  /** 攻撃・ガードの命中音。 */
  combat: 8,
  flask: 3,
  /** 落下着地（高さ 2m 以上）。 */
  land: 6,
  wallCollapse: 12,
  bell: 15,
} as const;
export type NoiseKind = keyof typeof NOISE_RADIUS;

/** 聴覚の増加量（毎秒）。 */
export const HEARING_GAIN_PER_SECOND = 120;
/** 音が一発ものの場合に、気付きの判定へ効く時間（秒）。 */
export const ONE_SHOT_NOISE_SECONDS = 0.5;
/** 走りの音とみなす水平速度（m/s）。これ未満の移動は歩き。 */
export const RUN_NOISE_MIN_SPEED = 3.6;
/** 歩きの音を出す最低の水平速度（m/s）。 */
export const WALK_NOISE_MIN_SPEED = 0.3;
/** 着地音を出す落下の高さ（m）。 */
export const LAND_NOISE_MIN_HEIGHT = 2;

/** 気付きゲージ（0〜100）。 */
export const ENEMY_GAUGE = {
  max: 100,
  /** この値以上で Suspicious。 */
  suspicious: 50,
  /** 感知がないときの減少（毎秒）。 */
  decayPerSecond: 40,
} as const;

export const ENEMY_AI = {
  /** Alert の硬直（気付きから）。 */
  alertFrames: 24,
  /** Alert で一緒に気付かせる味方の距離。 */
  allyAlertRadius: 8,

  /** 追跡・帰還・巡回・Suspicious の移動速度。 */
  chaseSpeed: 3.5,
  returnSpeed: 3.0,
  patrolSpeed: 1.2,
  suspiciousSpeed: 1.8,
  /** 加速度（m/s²）。 */
  acceleration: 12,

  /** 視線喪失からこの時間（F）で Return。 */
  lostSightFrames: 6 * 60,
  /** 出発地点からこの距離を超えたら強制 Return。 */
  leashRadius: 25,
  /** Return 中の HP 回復（最大 HP に対する毎秒の割合）。 */
  returnHealPerSecond: 0.2,
  /** Return を終える（出発地点に着いたとみなす）距離。 */
  homeArrivalRadius: 0.3,

  /** この距離以内になったら Chase → Approach。Approach で離れすぎたら Chase に戻る。 */
  approachRange: 5,
  approachExitRange: 6.5,
  /** Approach でペースを止める距離（これ以内で停止して旋回する）。 */
  holdRange: 3,
  /** ペースを止めて旋回する時間（F。範囲内の一様乱数）。0.5〜1.5 秒。 */
  holdFrames: [30, 90],
  /** Approach で間合いへ詰めるときの速度。 */
  approachSpeed: 2.5,
  /** Recover 後の攻撃クールダウン（F。範囲内の一様乱数）。HP 25% 以下は短い（焦り）。 */
  cooldownFrames: [30, 90],
  cooldownFramesDesperate: [30, 60],

  /** Suspicious: 感知源を向く旋回、歩く最大距離、到着後に見回す時間。 */
  suspiciousTurnDegPerSecond: 120,
  suspiciousMaxWalk: 6,
  suspiciousLookFrames: 180,
  /** 見回しの首振り（度）と周期（F）。 */
  suspiciousLookSweepDeg: 40,
  suspiciousLookPeriodFrames: 90,

  /** 巡回の既定の半径と、端での待ち。 */
  patrolRadius: 6,
  patrolPauseFrames: 90,

  /** 向きのずれがこの角度（度）以下なら全速で前進、以上なら止まって旋回だけする（間は線形）。 */
  moveYawFullSpeedDeg: 20,
  moveYawStopDeg: 80,
} as const;

/** 敵の移動アニメーションの速度の基準（歩き・走り・ダッシュのブレンド点）。 */
export const ENEMY_LOCOMOTION: LocomotionProfile = {
  walk: 1.8,
  run: 3.5,
  dash: 6.5,
};

/** カメラとロックオンの仕様値（仕様書 3 章の転記）。初期値で調整対象。実行時の調整は `game/tuning.ts` 経由。 */

/** フリーカメラ（3.1 節）。 */
export const CAMERA = {
  /** プレイヤー背後の距離（m）。 */
  distance: 4.2,
  /** 注視点: 足元からの高さ（肩の高さ, m）。 */
  pivotHeight: 1.5,
  /** 縦 FOV（度）。 */
  fovDeg: { mobile: 50, pc: 55 },
  /** ピッチ（度）。正が見下ろし。min = 見上げ側の限界、max = 見下ろし側の限界。 */
  pitchDeg: { min: -30, max: 60, initial: 12 },
  /** 位置の指数平滑の時定数（秒）。回転は入力に即時（遅延なし）。 */
  followTau: 0.12,
  /** カメラ衝突の球の半径（m）。 */
  collisionRadius: 0.25,
  /** 壁手前へ押し込むまでのフレーム数 / 解消後に元の距離へ戻すフレーム数。 */
  collisionPushFrames: 3,
  collisionRecoverFrames: 24,
  /** 自動回り込み: 走り中に左右入力をこのフレーム数続けたら、毎フレームこの角度で進行方向へ寄る（フリー時のみ）。 */
  autoFollow: { holdFrames: 20, degPerFrame: 0.3 },
} as const;

/** ロックオン（3.2 節）。 */
export const LOCK_ON = {
  /** 取得距離 / 解除距離（m。ヒステリシス）。 */
  acquireRange: 15,
  releaseRange: 20,
  /** 取得できる画面内の範囲（カメラ前方からの半角, 度）。 */
  viewHalfAngleDeg: { horizontal: 35, vertical: 25 },
  /** スコア = 画面中心からの角度（度）× angle + 距離（m）× distance。最小を選ぶ。 */
  score: { angle: 0.6, distance: 0.4 },
  /** カメラのリセット動作のフレーム数（候補なし・解除時）。 */
  resetFrames: 18,
  /** 視線遮断がこのフレーム続いたら解除。 */
  lostSightFrames: 120,
  /** 対象死亡後、次の対象へ自動移行するまでの秒数と、その探索範囲（m）。 */
  deathRetargetDelaySeconds: 0.5,
  deathRetargetRange: 10,
  /** ターゲット切替後、再切替を受け付けないフレーム数。 */
  switchCooldownFrames: 20,
  /** 対象の胸元の高さ = 身長 × この値。 */
  chestHeightRatio: 0.65,
  camera: {
    /** 注視点の混合: プレイヤー 0.65 : 敵 0.35。 */
    playerWeight: 0.65,
    /** ヨーの指数平滑の時定数（秒）と、これを超えたら即時に追いつかせる水平角（度）。 */
    yawTau: 0.12,
    maxYawErrorDeg: 40,
    /** 手動のピッチ入力で許可する範囲（±度）。 */
    pitchOffsetLimitDeg: 10,
    /** 敵が高いほど見上げる。仰角（度）にこの係数を掛けてピッチから引く。 */
    elevationFactor: 1.3,
    /** カメラ距離 = base + max(0, 対象身長 − playerHeight) × heightFactor、最大 maxDistance。 */
    distanceBase: 4.2,
    distanceHeightFactor: 1.2,
    distanceMax: 7.0,
    playerHeight: 1.8,
  },
} as const;

import { CAMERA, LOCK_ON, MOVEMENT } from './data';

/**
 * プレイヤー・カメラ・ロックオンの調整値を一箇所に集約したもの。
 * 仕様書由来の値は `game/data/` から初期化し、仕様書にない「手触り」の値はここで持つ。
 * 実行時に書き換え可能（`?debug` の調整パネルから変更できる。`ui/tuningPanel.ts`）。
 * ロジックは毎ステップここを読むので、書き換えは即座に反映される。
 */
export type Tuning = {
  readonly player: {
    /** 歩き / 走りの入力強さのしきい値（0..1）。仕様: 25〜60% が歩き、以上が走り。 */
    walkMinInput: number;
    walkMaxInput: number;
    runMinInput: number;
    /** 入力が最小のときの速度が歩きに対して占める割合（動き出しの即応性のため 0 にはしない）。 */
    minSpeedFraction: number;
    walk: number;
    run: number;
    dash: number;
    lockOnSide: number;
    lockOnBack: number;
    lockOnDash: number;
    /** 加速 / 減速にかけるフレーム（走り最高速まで）。 */
    accelFrames: number;
    stopFrames: number;
    /** フリー時の旋回の最高角速度（度/秒）。 */
    turnDegPerSecond: number;
    /** 旋回の指数追従の強さ（1/秒）。大きいほど入力方向へ素早く向く。角速度の上限は turnDegPerSecond。 */
    turnResponse: number;
    /** ロックオン中の対象方向への旋回（度/秒）と追従の強さ。 */
    lockOnTurnDegPerSecond: number;
    lockOnTurnResponse: number;
    /** ロール / バックステップ開始時の向きの合わせ込み（度/秒）。 */
    rollTurnDegPerSecond: number;
    /** 攻撃の発生中（当たり窓が開くまで）の旋回（度/秒）と追従の強さ。以降は向き固定。 */
    attackTurnDegPerSecond: number;
    attackTurnResponse: number;
    gravity: number;
    /** 接地が切れてから落下状態になるまでの猶予フレーム。 */
    coyoteFrames: number;
    /** この高さ（m）以上落ちると着地硬直。 */
    landMinHeight: number;
    landFrames: number;
    hardLandHeight: number;
    hardLandFrames: number;
    /** 着地硬直中の移動速度の係数。 */
    landSpeedFactor: number;
    /** 空中での水平加速度（m/s²）。 */
    airAccel: number;
    /** カプセル衝突の余白（m）と、スナップ距離・オートステップの最小幅。 */
    controllerOffset: number;
    snapToGround: number;
    autostepMinWidth: number;
  };
  readonly camera: {
    distance: number;
    pivotHeight: number;
    fovMobile: number;
    fovPc: number;
    pitchMin: number;
    pitchMax: number;
    pitchInitial: number;
    followTau: number;
    collisionRadius: number;
    collisionPushFrames: number;
    collisionRecoverFrames: number;
    autoFollow: boolean;
    autoFollowHoldFrames: number;
    autoFollowDegPerFrame: number;
    /** 垂直方向の追従の時定数（秒）。段差・坂での上下の揺れを抑える。 */
    followTauVertical: number;
    /** 入力感度への倍率（ロックオン中のピッチ入力にも掛かる）。 */
    lookScale: number;
  };
  readonly lockOn: {
    acquireRange: number;
    releaseRange: number;
    viewHalfH: number;
    viewHalfV: number;
    resetFrames: number;
    lostSightFrames: number;
    switchCooldownFrames: number;
    /** マウスなどの 1 ステップあたりのカメラ回転量（rad）がこれを超えたら「弾き」としてターゲット切替扱いにする。 */
    flickLookThreshold: number;
    playerWeight: number;
    yawTau: number;
    maxYawErrorDeg: number;
    pitchOffsetLimitDeg: number;
    elevationFactor: number;
    distanceBase: number;
    distanceHeightFactor: number;
    distanceMax: number;
  };
};

function createTuning(): Tuning {
  return {
    player: {
      walkMinInput: 0.25,
      walkMaxInput: 0.55,
      runMinInput: 0.72,
      minSpeedFraction: 0.45,
      walk: MOVEMENT.walk,
      run: MOVEMENT.run,
      dash: MOVEMENT.dash,
      lockOnSide: MOVEMENT.lockOn.side,
      lockOnBack: MOVEMENT.lockOn.back,
      lockOnDash: MOVEMENT.lockOn.dash,
      accelFrames: MOVEMENT.accelFrames,
      stopFrames: MOVEMENT.stopFrames,
      turnDegPerSecond: MOVEMENT.turnDegPerSecond,
      turnResponse: 22,
      lockOnTurnDegPerSecond: 1080,
      lockOnTurnResponse: 18,
      rollTurnDegPerSecond: 1800,
      attackTurnDegPerSecond: 540,
      attackTurnResponse: 30,
      gravity: 22,
      coyoteFrames: 4,
      landMinHeight: 1.2,
      landFrames: 10,
      hardLandHeight: 3,
      hardLandFrames: 22,
      landSpeedFactor: 0.35,
      airAccel: 9,
      controllerOffset: 0.02,
      snapToGround: 0.4,
      autostepMinWidth: 0.1,
    },
    camera: {
      distance: CAMERA.distance,
      pivotHeight: CAMERA.pivotHeight,
      fovMobile: CAMERA.fovDeg.mobile,
      fovPc: CAMERA.fovDeg.pc,
      pitchMin: CAMERA.pitchDeg.min,
      pitchMax: CAMERA.pitchDeg.max,
      pitchInitial: CAMERA.pitchDeg.initial,
      followTau: CAMERA.followTau,
      collisionRadius: CAMERA.collisionRadius,
      collisionPushFrames: CAMERA.collisionPushFrames,
      collisionRecoverFrames: CAMERA.collisionRecoverFrames,
      autoFollow: true,
      autoFollowHoldFrames: CAMERA.autoFollow.holdFrames,
      autoFollowDegPerFrame: CAMERA.autoFollow.degPerFrame,
      followTauVertical: 0.16,
      lookScale: 1,
    },
    lockOn: {
      acquireRange: LOCK_ON.acquireRange,
      releaseRange: LOCK_ON.releaseRange,
      viewHalfH: LOCK_ON.viewHalfAngleDeg.horizontal,
      viewHalfV: LOCK_ON.viewHalfAngleDeg.vertical,
      resetFrames: LOCK_ON.resetFrames,
      lostSightFrames: LOCK_ON.lostSightFrames,
      switchCooldownFrames: LOCK_ON.switchCooldownFrames,
      flickLookThreshold: 0.1,
      playerWeight: LOCK_ON.camera.playerWeight,
      yawTau: LOCK_ON.camera.yawTau,
      maxYawErrorDeg: LOCK_ON.camera.maxYawErrorDeg,
      pitchOffsetLimitDeg: LOCK_ON.camera.pitchOffsetLimitDeg,
      elevationFactor: LOCK_ON.camera.elevationFactor,
      distanceBase: LOCK_ON.camera.distanceBase,
      distanceHeightFactor: LOCK_ON.camera.distanceHeightFactor,
      distanceMax: LOCK_ON.camera.distanceMax,
    },
  };
}

/** 現在の調整値（ミュータブル）。 */
export const tuning: Tuning = createTuning();

/** 初期値へ戻す。 */
export function resetTuning(): void {
  const fresh = createTuning();
  for (const group of Object.keys(fresh) as (keyof Tuning)[]) {
    Object.assign(tuning[group], fresh[group]);
  }
}

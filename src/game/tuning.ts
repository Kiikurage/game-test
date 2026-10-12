import { BOSS_KILL_SLOWMO, CAMERA, HIT_FLASH, HIT_STOP, LOCK_ON, MOVEMENT } from './data';
import { PLAYER_CONTROL } from './data/playerControl';

/**
 * プレイヤー・カメラ・ロックオンの調整値を一箇所に集約したもの。
 * 仕様書由来の値は `game/data/` から、プレイヤーの「手触り」の値は `data/playerControl.json` から初期化する。
 * `Game` が生成時に自分用の値を作って `game.tuning` に持つ（Game 同士・テスト間で干渉しない）。
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
    /** 着地硬直中の移動速度の係数。 */
    landSpeedFactor: number;
    /** 空中での水平加速度（m/s²）。 */
    airAccel: number;
    /** カプセル衝突の余白（m）と、スナップ距離・オートステップの最小幅。 */
    controllerOffset: number;
    snapToGround: number;
    autostepMinWidth: number;
  };
  /** ヒットストップ・撃破スロー・付随演出（仕様書 4.1 節。手触りの肝なので `?debug` で調整できる）。 */
  readonly hitStop: {
    /** false で全部オフ（ヒットストップなしとの比較用）。 */
    enabled: boolean;
    /** 凍結フレーム数（60Hz）。 */
    playerLight: number;
    playerHeavy: number;
    playerHeavyCharged: number;
    playerBackstab: number;
    enemyHitsPlayer: number;
    bossHitsPlayer: number;
    guardSuccess: number;
    justGuard: number;
    kill: number;
    /** 雑魚敵の撃破（トドメ）の凍結フレーム数。スローは入れない（#277）。 */
    enemyKill: number;
    /** ボス撃破のスロー（グローバルのタイムスケールと、その長さ = シミュレーションフレーム数）。 */
    killSlowmoScale: number;
    bossKillSlowmoFrames: number;
    /** フル溜め強攻撃の画面振動（度・フレーム）。 */
    redFlashFrames: number;
    whiteFlashFrames: number;
  };
  /** 被弾リアクション（`?debug` で調整）。押し戻しは距離（仕様書 4.4 節）を何ステップで滑らせるか。 */
  readonly reaction: {
    lightSlideFrames: number;
    heavySlideFrames: number;
    guardSlideFrames: number;
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

/** 初期値の調整値を新しく作る。 */
export function createTuning(): Tuning {
  return {
    player: {
      ...PLAYER_CONTROL.tuning,
      walk: MOVEMENT.walk,
      run: MOVEMENT.run,
      dash: MOVEMENT.dash,
      lockOnSide: MOVEMENT.lockOn.side,
      lockOnBack: MOVEMENT.lockOn.back,
      lockOnDash: MOVEMENT.lockOn.dash,
      accelFrames: MOVEMENT.accelFrames,
      stopFrames: MOVEMENT.stopFrames,
      turnDegPerSecond: MOVEMENT.turnDegPerSecond,
    },
    hitStop: {
      enabled: true,
      playerLight: HIT_STOP.playerLight,
      playerHeavy: HIT_STOP.playerHeavy,
      playerHeavyCharged: HIT_STOP.playerHeavyCharged,
      playerBackstab: HIT_STOP.playerBackstab,
      enemyHitsPlayer: HIT_STOP.enemyHitsPlayer,
      bossHitsPlayer: HIT_STOP.bossHitsPlayer,
      guardSuccess: HIT_STOP.guardSuccess,
      justGuard: HIT_STOP.justGuard,
      kill: HIT_STOP.kill,
      enemyKill: HIT_STOP.enemyKill,
      killSlowmoScale: BOSS_KILL_SLOWMO.timeScale,
      bossKillSlowmoFrames: BOSS_KILL_SLOWMO.frames,
      redFlashFrames: HIT_FLASH.redFrames,
      whiteFlashFrames: HIT_FLASH.whiteFrames,
    },
    reaction: {
      lightSlideFrames: PLAYER_CONTROL.reactionSlideFrames.light,
      heavySlideFrames: PLAYER_CONTROL.reactionSlideFrames.heavy,
      guardSlideFrames: PLAYER_CONTROL.reactionSlideFrames.guard,
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

/** `tuning` を初期値へ戻す（同じオブジェクトを書き換えるので、参照を持つ側にも反映される）。 */
export function resetTuning(tuning: Tuning): void {
  const fresh = createTuning();
  for (const group of Object.keys(fresh) as (keyof Tuning)[]) {
    Object.assign(tuning[group], fresh[group]);
  }
}

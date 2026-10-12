/**
 * プレイヤー操作の手触りの値（仕様書にない調整値）。値は `playerControl.json`（読み込みは `loadData.ts`）。
 * `tuning` は `game/tuning.ts` の `tuning.player` の初期値（`?debug` の調整パネルで実行時に変えられる）。
 */
import { s, type Infer } from '../../core/schema';
import { loadData } from './loadData';
import json from './playerControl.json';

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });
const input = s.number({ min: 0, max: 1 });
/** 回避の移動量の配分（`dashProfile`）: F1–`ramp` で立ち上がり、`hold` まで最大、`end` で 0。 */
const dashShape = s.refine(s.object({ ramp: frames, hold: frames, end: frames }), (p) =>
  p.ramp <= p.hold && p.hold <= p.end ? undefined : `expected ramp <= hold <= end`,
);

export const PlayerControlDataSchema = s.object({
  tuning: s.object({
    /** 歩き / 走りの入力強さのしきい値（0..1）。仕様: 25〜60% が歩き、以上が走り。 */
    walkMinInput: input,
    walkMaxInput: input,
    runMinInput: input,
    /** 入力が最小のときの速度が歩きに対して占める割合。 */
    minSpeedFraction: input,
    /** 旋回の指数追従の強さ（1/秒）。 */
    turnResponse: pos,
    lockOnTurnDegPerSecond: pos,
    lockOnTurnResponse: pos,
    rollTurnDegPerSecond: pos,
    attackTurnDegPerSecond: pos,
    attackTurnResponse: pos,
    /** 重力（m/s²）。 */
    gravity: pos,
    coyoteFrames: frames,
    landSpeedFactor: input,
    airAccel: pos,
    controllerOffset: pos,
    snapToGround: pos,
    autostepMinWidth: pos,
  }),
  /** 被弾の押し戻し（4.4 節の距離）を何ステップで滑らせるか（`tuning.reaction` の初期値）。 */
  reactionSlideFrames: s.object({ light: frames, heavy: frames, guard: frames }),
  /** 落下速度の上限（m/s）。 */
  maxFallSpeed: pos,
  /** 走り（スタミナ回復が止まる）とみなす速さ: 歩きの最高速 + この値（m/s）を超える。 */
  sprintSpeedMargin: pos,
  /** ダッシュを始められる最小の入力強さ。 */
  dashMinInput: input,
  /** 回復中などの移動（`driftVelocity`）が最高速になる入力強さ。 */
  driftFullInput: s.number({ min: 0.01, max: 1 }),
  /** 強制歩行の移動入力の強さ（0.25..0.55 は歩き）。 */
  forcedWalkInput: input,
  /** `Player.shove` の既定のステップ数。 */
  shoveFrames: s.number({ min: 1, integer: true }),
  dodge: s.object({
    /** ロール中の旋回の追従の強さ（1/秒）。 */
    turnResponse: pos,
    rollProfile: dashShape,
    backstepProfile: dashShape,
  }),
  /** 落下攻撃の入力時、足元からこれより下にいる敵を「下にいる」とみなす（m）。 */
  plungeTargetBelow: pos,
});
export type PlayerControlData = Infer<typeof PlayerControlDataSchema>;

export const PLAYER_CONTROL = loadData(PlayerControlDataSchema, json, 'playerControl.json');

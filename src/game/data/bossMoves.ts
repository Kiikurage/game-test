/**
 * ボスの技（仕様書 6.3 節の # 1〜7）の数値。値は `bossMoves.json`。
 *
 * 技ごとに `name` / `phases` / `approach`（省略 = その場で予備動作）/ `stages`（フェーズ 1。`phase2Stages` が無ければ
 * フェーズ 2 も同じ）/ `phase2Stages` と、技のフック（判定形状・移動）が使う `params` を持つ。
 * 段の各項目の意味は `EnemyAttackDef`（types.ts）と `BossStageDef`（boss/bossMove.ts）。
 * 技の振る舞い（フック）は `boss/moves/<技>.move.ts` が持ち、ここの値を読んで登録する。
 */
import { s, type Infer, type Schema } from '../../core/schema';
import json from './bossMoves.json';
import { enemyAttackShape } from './enemyAttack';
import { loadData } from './loadData';

const pos = s.number({ min: 0 });
const frames = s.number({ min: 0, integer: true });

const BossStageSchema = s.object({
  ...enemyAttackShape,
  /** 予備動作中の旋回速度の倍率（既定 1）。 */
  trackRate: s.optional(pos),
  /** スーパーアーマー区間（段の F。両端含む）。 */
  superArmor: s.optional(
    s.refine(s.object({ start: frames, end: frames }), (w) =>
      w.start > w.end ? `start (${w.start}) > end (${w.end})` : undefined,
    ),
  ),
  /** 未ガードで命中したときの後退距離（m）。 */
  knockback: s.optional(pos),
  /** 直前の段から途切れず続く段（連続攻撃の発生の下限を免除）。 */
  chained: s.optional(s.boolean()),
});
export type BossStageData = Infer<typeof BossStageSchema>;

const stages = s.array(BossStageSchema, { minLength: 1 });
const range = s.object({ min: s.number(), max: s.number() });

function move<P extends Record<string, Schema<unknown>>>(params: P) {
  return s.object({
    name: s.string(),
    phases: s.array(s.literal(1, 2), { minLength: 1 }),
    approach: s.optional(
      s.object({
        speed: s.literal('walk', 'run'),
        stopRange: pos,
        maxFrames: s.optional(frames),
      }),
    ),
    stages,
    phase2Stages: s.optional(stages),
    params: s.object(params),
  });
}

export const BossMovesDataSchema = s.object({
  /**
   * 技の検証の基準（`checkBossMove`）。minLockedFrames: 向きを固定してから判定が出るまでの最低 F（ロールで躱す猶予）/
   * minFollowUpStartup: 連続攻撃の 2 段目以降（`followUp`）の発生の下限。
   */
  rules: s.object({ minLockedFrames: frames, minFollowUpStartup: frames }),
  /** apexOffset: 扇形の頂点をボスの前へずらす距離（m。これより手前は斧の内側で当たらない）。 */
  overhead: move({ apexOffset: pos }),
  /** height: 判定の高さ（足元から。m）。 */
  sweep: move({ height: range }),
  combo3: move({}),
  /**
   * 追撃（斬り下ろし）の踏み込み: 刃先が対象に届く距離（slashReachTarget）まで、最大 slashLungeMax m を
   * 段の F1〜slashLungeFrames で詰める。
   */
  shieldBash: move({ slashReachTarget: pos, slashLungeMax: pos, slashLungeFrames: frames }),
  /**
   * crouchFrames: 屈み（以降は滞空。滞空 = 発生 − 屈み）/ lockAfterCrouchFrames: 跳び上がってから着地点を固定するまで /
   * telegraphFrame: 着地点の予告を出し始める F / maxDistance: 跳べる最大距離 / peakHeight: 滞空の最高点 /
   * clearanceMargin・pushFrames: 着地でプレイヤーを押し出す余裕（m）と長さ（F）。
   */
  leap: move({
    crouchFrames: frames,
    lockAfterCrouchFrames: frames,
    telegraphFrame: frames,
    maxDistance: pos,
    peakHeight: pos,
    clearanceMargin: pos,
    pushFrames: frames,
  }),
  /** height: 判定の高さ / bladeOffset: 刃の向きのオフセット（rad）/ windup: 回転ごとの予備動作の捻り（rad）。 */
  spin: move({ height: range, bladeOffset: s.number(), windup: s.tuple(pos, pos) }),
  /**
   * runFrames: 1 本の波が射程（段の range）を走り切る F / width: 波の幅 / lineInterval: 波を出す間隔 /
   * lineAnglesDeg: 波の向き（正面から）/ telegraphFrame: 予告の線を出し始める F / hitHeight: 判定の高さ /
   * slamForward・slamRadius: 斧が地面へ入る点（ボスの前方 m）と衝撃の円の半径（演出）。
   */
  ashWave: s.refine(
    move({
      runFrames: frames,
      width: pos,
      lineInterval: frames,
      lineAnglesDeg: s.array(s.number(), { minLength: 1 }),
      telegraphFrame: frames,
      hitHeight: pos,
      /** 斧が地面へ入る点（ボスの前方 m）と衝撃の円の半径（m）。 */
      slamForward: pos,
      slamRadius: pos,
    }),
    (m) => {
      const p = m.params;
      const active = p.lineInterval * (p.lineAnglesDeg.length - 1) + p.runFrames;
      return m.stages[0]?.active === active
        ? undefined
        : `stages[0].active must be lineInterval × (lines − 1) + runFrames = ${active}`;
    },
  ),
});
export type BossMovesData = Infer<typeof BossMovesDataSchema>;

export const BOSS_MOVES_DATA = loadData(BossMovesDataSchema, json, 'bossMoves.json');

import { sectorShape } from '../../combat';
import { BOSS_MOVES_DATA } from '../../data/bossMoves';
import { registerBossMove, type BossMoveContext, type BossStageDef } from '../bossMove';
import { OVERHEAD_APEX_OFFSET } from './overhead.move';

/**
 * 技 4 盾打ち → 斬り下ろし（フェーズ 1 のみ。仕様書 6.3 節）。近距離の技。
 *
 * | 段 | 発生 | 持続 | 硬直 | ダメージ | 強靭度 | ガード時スタミナ | 判定 |
 * | 1 盾打ち | 26 | 5 | 12 | 60 | 60 | 40 | 前方 90°・命中で 3m 吹き飛ばし |
 * | 2 斬り下ろし | 36 | 6 | 50 | 100 | 70 | 60 | 大上段の短縮版（前方 60°・射程 4.2m） |
 *
 * 学習用トラップ: 盾打ちを食らうと 3m 吹き飛ばされて転倒し、そこへ追撃が来る（転倒中に大ダメージ）。
 * 盾打ちを側面へのロールで躱せば、追撃は向き固定の正面を空振りする。
 *
 * - 盾打ちの射程は 2.6m（仕様書に数値がないので、`approach` の停止距離 2.6m から届く値に置いた本実装の判断。盾の先は約 2.3m まで出るので、#225 で 3.0m から詰めた）。
 * - 追撃は 1 段目の硬直（12F）の後に始まる。向きの追尾は F12 まで・0.5 倍（旋回 45°/s ≒ 9°）と弱く、
 *   盾打ちの間に側面へ回り込まれると正面から外れる。
 * - 追撃の踏み込み: 転倒して 3m 離れた相手に届かせるため、追撃の頭の F1〜F18 に、相手との距離が `SLASH_REACH_TARGET`
 *   になるまで前へ踏み込む（最大 `SLASH_LUNGE_MAX`）。踏み込みは**向きの方向**へ進むので、側面へ避けた相手には当たらない。
 *
 * テレグラフ: 盾打ちは `normal`（発生 26F の素早い一撃。ただし重い被弾なのでガード推奨）、追撃は `heavy`
 * （発生 36F の強攻撃。ガードは可能なので `unblockable` ではない）。
 * クリップ: 盾打ち `Shield_Dash`、追撃は大上段（`Sword_Heavy_Combo`）の短縮版（マーカー表: `anim/data/bossClips.json`）。
 */

/** 盾打ちの射程（m）。 */
const { params: P, ...MOVE } = BOSS_MOVES_DATA.shieldBash;

export const SHIELD_BASH_RANGE = MOVE.stages[0]?.range ?? 0;
export const SHIELD_BASH_KNOCKBACK = MOVE.stages[0]?.knockback ?? 0;
/** 追撃の踏み込み: 相手との距離をこの値（m）まで詰める。 */
export const SLASH_REACH_TARGET = P.slashReachTarget;
/** 追撃の踏み込みの最大距離（m）。 */
export const SLASH_LUNGE_MAX = P.slashLungeMax;
/** 追撃の踏み込みを行う F（段の F1〜）。 */
export const SLASH_LUNGE_FRAMES = P.slashLungeFrames;

/** 追撃の踏み込みの総距離（m）。向きの方向に測った相手までの距離から決める。 */
export function slashLungeDistance(forwardDistance: number): number {
  return Math.min(SLASH_LUNGE_MAX, Math.max(0, forwardDistance - SLASH_REACH_TARGET));
}

/** 技の実行ごとの追撃の踏み込み量（ボスごと）。 */
const lunge = new WeakMap<object, number>();

registerBossMove({
  id: 'shieldBash',
  ...MOVE,
  hooks: {
    onStageStart(ctx) {
      if (ctx.stageIndex !== 1) return;
      const { boss, target } = ctx;
      const dx = target.x - boss.position.x;
      const dz = target.z - boss.position.z;
      const forward = dx * Math.sin(boss.yaw) + dz * Math.cos(boss.yaw);
      lunge.set(boss, slashLungeDistance(forward));
    },
    onStep(ctx) {
      if (ctx.stageIndex !== 1 || ctx.frame > SLASH_LUNGE_FRAMES) return;
      const total = lunge.get(ctx.boss) ?? 0;
      if (total <= 0) return;
      const step = total / SLASH_LUNGE_FRAMES;
      ctx.boss.moveBy(Math.sin(ctx.boss.yaw) * step, Math.cos(ctx.boss.yaw) * step);
    },
    onEnd(ctx) {
      lunge.delete(ctx.boss);
    },
    shape: (ctx: BossMoveContext, stage: BossStageDef) => {
      const { position, yaw } = ctx.boss;
      if (ctx.stageIndex === 0) return sectorShape(position, yaw, stage.arcDeg, stage.range);
      // 追撃は大上段と同じ形（扇形の頂点を斧の付け根へずらす）
      const origin = {
        x: position.x + Math.sin(yaw) * OVERHEAD_APEX_OFFSET,
        y: position.y,
        z: position.z + Math.cos(yaw) * OVERHEAD_APEX_OFFSET,
      };
      return sectorShape(origin, yaw, stage.arcDeg, stage.range - OVERHEAD_APEX_OFFSET);
    },
  },
});

import { sectorShape } from '../../combat';
import { BOSS_MOVES_DATA } from '../../data/bossMoves';
import { registerBossMove, type BossMoveContext, type BossStageDef } from '../bossMove';

/**
 * 技 2 薙ぎ払い（仕様書 6.3 節）。発生 40（P2: 34）・持続 10・硬直 48（P2: 40）・ダメージ 95（P2: 105）・前方 200°・射程 5.0m。
 * 判定は床面から 0.5〜2.5m の高さ（腰〜頭の高さの横薙ぎ）。射程が広いので後ろへのバックステップは届く
 * （2.0m 下がっても 5.0m の内側に残る）。避けるには正面へ向かう前方ロールで潜る（無敵が持続の 10F を覆う）かガード。
 * P2 は 2 連発（2 発目は逆方向に振り返す。発生 24F・ダメージ 90）とスーパーアーマー（予備動作〜持続、各段）。
 * クリップは 1 発目 `Sword_Regular_B`、2 発目 `Melee_Hook`（逆方向の振り。マーカー表: `anim/data/bossClips.json`）。
 *
 * テレグラフ: 両段とも `heavy`（広範囲の強攻撃。ガードは可能なので `unblockable` ではない）。
 * 2 発目は連続攻撃（`followUp`）で `heavy` フラグ（発生 34F 以上）は付けないが、色は同じ赤橙で予告する。
 */

/** 判定の高さ（足元から。m）。 */
const { params: P, ...MOVE } = BOSS_MOVES_DATA.sweep;

export const SWEEP_HEIGHT = P.height;
export const SWEEP_GAP = MOVE.phase2Stages?.[0]?.recovery ?? 0;
export const SWEEP_SWING = { 'sweep.1': 'rightToLeft', 'sweep.2': 'leftToRight' } as const;

registerBossMove({
  id: 'sweep',
  ...MOVE,
  hooks: {
    shape: (ctx: BossMoveContext, stage: BossStageDef) =>
      sectorShape(
        ctx.boss.position,
        ctx.boss.yaw,
        stage.arcDeg,
        stage.range,
        SWEEP_HEIGHT.min,
        SWEEP_HEIGHT.max,
      ),
  },
});

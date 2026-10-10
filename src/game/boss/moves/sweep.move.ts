import { sectorShape } from '../../combat';
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
export const SWEEP_HEIGHT = { min: 0.5, max: 2.5 } as const;
/** 1 発目と 2 発目の間（1 発目の硬直）。三連撃の段間と同じ 8F。 */
export const SWEEP_GAP = 8;
/** 各段の振りの向き（ボスから見て。1 発目は右から左、P2 の 2 発目は逆）。クリップのミラー指定・演出用。 */
export const SWEEP_SWING = { 'sweep.1': 'rightToLeft', 'sweep.2': 'leftToRight' } as const;

const SWEEP_P1: BossStageDef = {
  id: 'sweep.1',
  startup: 40,
  active: 10,
  recovery: 48,
  damage: 95,
  poiseDamage: 60,
  guardStaminaCost: 52,
  moveDistance: 0,
  arcDeg: 200,
  range: 5.0,
  heavy: true,
  telegraph: 'heavy',
  // 追尾は発生の 12F 前まで（向き固定の猶予）。旋回は基準の 0.8 倍
  trackEndFrame: 28,
  trackRate: 0.8,
};

const SWEEP_P2_1: BossStageDef = {
  ...SWEEP_P1,
  startup: 34,
  recovery: SWEEP_GAP,
  damage: 105,
  trackEndFrame: 22,
  superArmor: { start: 1, end: 34 + SWEEP_P1.active },
};

/** P2 の 2 発目。逆方向に振り返す。 */
const SWEEP_P2_2: BossStageDef = {
  id: 'sweep.2',
  startup: 24,
  active: 10,
  recovery: 40,
  damage: 90,
  poiseDamage: 60,
  guardStaminaCost: 52,
  moveDistance: 0,
  arcDeg: 200,
  range: 5.0,
  telegraph: 'heavy',
  followUp: true,
  // 1 発目の向きのまま振り返す（追尾はほぼしない）
  trackEndFrame: 6,
  trackRate: 0.5,
  superArmor: { start: 1, end: 24 + 10 },
};

registerBossMove({
  id: 'sweep',
  name: '薙ぎ払い',
  phases: [1, 2],
  stages: [SWEEP_P1],
  phase2Stages: [SWEEP_P2_1, SWEEP_P2_2],
  approach: { speed: 'walk', stopRange: 3.0 },
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

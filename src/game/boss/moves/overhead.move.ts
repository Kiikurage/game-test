import { sectorShape } from '../../combat';
import { BOSS_MOVES_DATA } from '../../data/bossMoves';
import { registerBossMove, type BossMoveContext, type BossStageDef } from '../bossMove';

/**
 * 技 1 大上段斬り（仕様書 6.3 節）。発生 48（P2: 42）・持続 8・硬直 52（P2: 44）・ダメージ 110（P2: 120）。
 * 追尾は F30 まで（P1 は旋回 90°/s。P2 はフェーズの旋回速度 120°/s）、以降は向き固定 = 左右のロール（F36–F46 で入力）で躱せる。
 * P2 はスーパーアーマー（予備動作〜持続）。クリップは `Sword_Heavy_Combo` の 1 打目（マーカー表: `anim/data/bossClips.json`）。
 *
 * テレグラフ: `heavy`（強攻撃。5.1 節の「ガード不能・強攻撃 = 赤橙」）。ガード自体は可能（スタミナ 60 を削られるので非推奨）で
 * ガード不能ではないため `unblockable` にはしない。
 *
 * 判定: 前方 60°・射程 4.2m。扇形の頂点をボスの 1.5m 前（斧の付け根の位置）に置き、そこから 2.7m 伸ばす（ボスの原点から最大 4.2m。#225 で刃先の見た目に合わせて 4.5m から 0.3m 詰めた）。
 * 頂点より手前（斧の内側）は当たらないので、前方ロールで射程の内側へ入って潜り抜けられる（6.3 節「回避の想定」）。
 */

const { params: P, ...MOVE } = BOSS_MOVES_DATA.overhead;
const [OVERHEAD_P1] = MOVE.stages;

/** 扇形の頂点をボスの前へずらす距離（m）。ボスの体の半径 0.9m + 余裕。これより手前は斧の内側で当たらない。 */
export const OVERHEAD_APEX_OFFSET = P.apexOffset;
/** ボスの原点から測った射程（m）。 */
export const OVERHEAD_REACH = OVERHEAD_P1?.range ?? 0;

registerBossMove({
  id: 'overhead',
  ...MOVE,
  hooks: {
    shape: (ctx: BossMoveContext, stage: BossStageDef) => {
      const { position, yaw } = ctx.boss;
      const origin = {
        x: position.x + Math.sin(yaw) * OVERHEAD_APEX_OFFSET,
        y: position.y,
        z: position.z + Math.cos(yaw) * OVERHEAD_APEX_OFFSET,
      };
      return sectorShape(origin, yaw, stage.arcDeg, stage.range - OVERHEAD_APEX_OFFSET);
    },
  },
});

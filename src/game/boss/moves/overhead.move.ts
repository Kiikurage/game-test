import { sectorShape } from '../../combat';
import { registerBossMove, type BossMoveContext, type BossStageDef } from '../bossMove';

/**
 * 技 1 大上段斬り（仕様書 6.3 節）。発生 48（P2: 42）・持続 8・硬直 52（P2: 44）・ダメージ 110（P2: 120）。
 * 追尾は F30 まで（P1 は旋回 90°/s。P2 はフェーズの旋回速度 120°/s）、以降は向き固定 = 左右のロール（F36–F46 で入力）で躱せる。
 * P2 はスーパーアーマー（予備動作〜持続）。クリップは `Sword_Heavy_Combo` の 1 打目（マーカー表: `anim/data/bossClips.json`）。
 *
 * テレグラフ: `heavy`（強攻撃。5.1 節の「ガード不能・強攻撃 = 赤橙」）。ガード自体は可能（スタミナ 60 を削られるので非推奨）で
 * ガード不能ではないため `unblockable` にはしない。
 *
 * 判定: 前方 60°・射程 4.5m。扇形の頂点をボスの 1.5m 前（斧の付け根の位置）に置き、そこから 3.0m 伸ばす（ボスの原点から最大 4.5m）。
 * 頂点より手前（斧の内側）は当たらないので、前方ロールで射程の内側へ入って潜り抜けられる（6.3 節「回避の想定」）。
 */

/** 扇形の頂点をボスの前へずらす距離（m）。ボスの体の半径 0.9m + 余裕。これより手前は斧の内側で当たらない。 */
export const OVERHEAD_APEX_OFFSET = 1.5;
/** ボスの原点から測った射程（m）。 */
export const OVERHEAD_REACH = 4.5;

const COMMON = {
  id: 'overhead.1',
  active: 8,
  poiseDamage: 70,
  guardStaminaCost: 60,
  moveDistance: 0,
  arcDeg: 60,
  range: OVERHEAD_REACH,
  heavy: true,
  telegraph: 'heavy',
  trackEndFrame: 30,
} as const satisfies Partial<BossStageDef>;

const OVERHEAD_P1: BossStageDef = {
  ...COMMON,
  startup: 48,
  recovery: 52,
  damage: 110,
  trackDegPerSecond: 90,
};

const OVERHEAD_P2: BossStageDef = {
  ...COMMON,
  startup: 42,
  recovery: 44,
  damage: 120,
  superArmor: { start: 1, end: 42 + COMMON.active },
};

registerBossMove({
  id: 'overhead',
  name: '大上段斬り',
  phases: [1, 2],
  stages: [OVERHEAD_P1],
  phase2Stages: [OVERHEAD_P2],
  // 近・中距離の技。接近しながら（歩き）、射程に入ったら足を止めてから予備動作に入る
  approach: { speed: 'walk', stopRange: 3.2 },
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

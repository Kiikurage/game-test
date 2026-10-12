/**
 * プレイヤーの攻撃判定の形（`combat/playerAttack.ts` の手続き的な武器カプセルの軌道）。
 * 値は `playerHitShapes.json`（読み込みは `loadData.ts`）。高さ・距離は m、角度は度。
 * 弧・射程は `PLAYER_ACTIONS`（2.3 節）。`{ start, sweep }` は持続中の進行 p（0..1）で `start + sweep * p`。
 */
import { s, type Infer } from '../../core/schema';
import { loadData } from './loadData';
import json from './playerHitShapes.json';

const pos = s.number({ min: 0 });
const num = s.number();
const ramp = s.object({ start: num, sweep: num });

export const PlayerHitShapesDataSchema = s.object({
  /** 武器の判定カプセル（2.3 節: 半径 0.25m、長さ 1.1m、剣先から根元まで）。 */
  weapon: s.object({ radius: pos, length: pos }),
  /** 握り（手元から刃の根元まで）。 */
  grip: pos,
  /** 突き（light3・致命の一撃）: 手元の高さ、判定開始時の握りの位置（体の前）、弧に対する左右の振れの割合。 */
  thrust: s.object({ height: pos, gripStart: pos, sweepRatio: s.number({ min: 0, max: 1 }) }),
  /** 軽攻撃 1（横斬り）・2: 手元の高さと仰角。 */
  light1: s.object({ height: pos, elevationDeg: ramp }),
  light2: s.object({ height: pos, elevationDeg: ramp }),
  /** 走り攻撃: 体の右から左へ水平に薙ぐ弧、手元の高さ、仰角。 */
  runAttack: s.object({ arcDeg: pos, height: pos, elevationDeg: ramp }),
  /** 強攻撃の振り下ろし: 手元の高さ、体の前への距離、仰角。 */
  heavy: s.object({ height: pos, forward: pos, elevationDeg: ramp }),
  /** ガードカウンター（盾の打撃）: 左右のずれ（右が正）、前への距離、縦長カプセルの下端・上端・半径。 */
  guardCounter: s.object({ side: num, distance: ramp, bottom: pos, top: pos, radius: pos }),
});
export type PlayerHitShapesData = Infer<typeof PlayerHitShapesDataSchema>;

export const PLAYER_HIT_SHAPES = loadData(PlayerHitShapesDataSchema, json, 'playerHitShapes.json');

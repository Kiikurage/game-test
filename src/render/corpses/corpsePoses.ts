import type { CorpsePose } from '../../core/corpses';
import type { BoneTurn } from './poseMath';

/**
 * 遺体ポーズ 4 種（仕様書 14.7 節）。アニメーションクリップは使わず、T ポーズ（knight.glb の bind pose）に
 * ボーン回転を加えて作る（`BoneTurn`: キャラクター空間の軸まわり、親から順）。静止ポーズなので、焼き込んで
 * スキニング更新を止める（`corpseFactory.ts`）。
 *
 * キャラクター空間: +X がキャラクターの左、+Y が上、+Z が前。
 * 回転の向きの目安（T ポーズの左腕は +X へ、右腕は -X へ伸び、脚は -Y へ垂れている）:
 *   左腕を下ろす = upperarm_l の Z -80°、右腕を下ろす = upperarm_r の Z +80°
 *   股関節を前へ曲げる = thigh の X 負、膝を曲げる（足が後ろへ）= calf の X 正
 *   上体を前へ倒す = spine の X 正、うなだれる = Head の X 正
 */
export interface CorpsePoseDef {
  readonly turns: readonly BoneTurn[];
  /** 全身をキャラクターの足元を中心に回す（度、XYZ）。うつ伏せで寝かせるのに使う。 */
  readonly lay?: readonly [number, number, number];
  /** 焼き込み後に原点を決めるための基準（`CorpsePlacement` の原点の意味と対応）。 */
  readonly anchor: {
    /** `min` = 最も低い点を y=0、`seat` = 骨盤の高さから座面分を引いた高さを y=0（脚は座面より下へ垂れる）。 */
    readonly y: 'min' | { readonly seat: number };
    readonly x: 'pelvis' | 'bbox';
    /** `back` = 体（胴）の最後ろを z=0、`head` = 頭の最前を z=0（祭壇の面）。 */
    readonly z: 'pelvis' | 'bbox' | 'back' | 'head';
  };
}

export const CORPSE_POSE_DEFS: Readonly<Record<CorpsePose, CorpsePoseDef>> = {
  // 岩棚・噴水の縁に腰かけたまま事切れた姿。上体は前へ崩れ、頭が垂れ、手は膝の上。
  sitting: {
    turns: [
      { bone: 'thigh_l', euler: [-88, 0, -4] },
      { bone: 'thigh_r', euler: [-92, 0, 6] },
      { bone: 'calf_l', euler: [84, 0, 0] },
      { bone: 'calf_r', euler: [96, 0, 0] },
      { bone: 'spine_01', euler: [10, 0, 0] },
      { bone: 'spine_02', euler: [14, 0, 4] },
      { bone: 'spine_03', euler: [10, 0, 4] },
      { bone: 'neck_01', euler: [12, 0, 0] },
      { bone: 'Head', euler: [22, 12, 12] },
      { bone: 'upperarm_l', euler: [0, 0, -78] },
      { bone: 'lowerarm_l', euler: [-62, -10, 0] },
      { bone: 'upperarm_r', euler: [0, 0, 74] },
      { bone: 'lowerarm_r', euler: [-72, 14, 0] },
    ],
    anchor: { y: { seat: 0.11 }, x: 'pelvis', z: 'pelvis' },
  },
  // 門とは逆向きに這い、力尽きた姿。頭が +Z 向き、片腕を前へ伸ばし、顔は横を向く。
  prone: {
    turns: [
      { bone: 'upperarm_r', euler: [0, 0, -78] },
      { bone: 'lowerarm_r', euler: [0, 0, -8] },
      { bone: 'upperarm_l', euler: [0, 0, -38] },
      { bone: 'lowerarm_l', euler: [0, -35, 0] },
      { bone: 'thigh_r', euler: [0, 0, -24] },
      { bone: 'calf_r', euler: [55, 0, 0] },
      { bone: 'thigh_l', euler: [0, 0, 6] },
      { bone: 'spine_02', euler: [0, 12, 0] },
      { bone: 'neck_01', euler: [0, 16, 0] },
      { bone: 'Head', euler: [0, 62, 0] },
    ],
    lay: [90, 0, 0],
    anchor: { y: 'min', x: 'bbox', z: 'bbox' },
  },
  // 祭壇の前にひざまずき、額を祭壇に付けた姿。腕は前へ伸びて祭壇に載る。
  praying: {
    turns: [
      { bone: 'thigh_l', euler: [-8, 0, -3] },
      { bone: 'thigh_r', euler: [-8, 0, 3] },
      { bone: 'calf_l', euler: [100, 0, 0] },
      { bone: 'calf_r', euler: [100, 0, 0] },
      { bone: 'foot_l', euler: [-30, 0, 0] },
      { bone: 'foot_r', euler: [-30, 0, 0] },
      { bone: 'spine_01', euler: [30, 0, 0] },
      { bone: 'spine_02', euler: [30, 0, 0] },
      { bone: 'spine_03', euler: [24, 0, 0] },
      { bone: 'neck_01', euler: [12, 0, 0] },
      { bone: 'Head', euler: [16, 0, 0] },
      { bone: 'upperarm_l', euler: [0, -88, 0] },
      { bone: 'lowerarm_l', euler: [0, 12, 0] },
      { bone: 'upperarm_r', euler: [0, 88, 0] },
      { bone: 'lowerarm_r', euler: [0, -12, 0] },
    ],
    anchor: { y: 'min', x: 'pelvis', z: 'head' },
  },
  // 石棺にもたれて座り込み、そのまま息絶えた姿（瀕死の騎士）。脚は前へ投げ出し（片膝は軽く曲げて外へ）、頭は肩へ傾く。
  leaning: {
    turns: [
      { bone: 'thigh_l', euler: [-84, 0, -10] },
      { bone: 'calf_l', euler: [10, 0, 0] },
      { bone: 'thigh_r', euler: [-76, 0, 16] },
      { bone: 'calf_r', euler: [30, 0, 0] },
      { bone: 'spine_01', euler: [-4, 0, 0] },
      { bone: 'spine_02', euler: [-6, 0, 5] },
      { bone: 'spine_03', euler: [-4, 0, 6] },
      { bone: 'neck_01', euler: [4, 0, 8] },
      { bone: 'Head', euler: [10, 0, 24] },
      { bone: 'upperarm_l', euler: [0, 0, -72] },
      { bone: 'lowerarm_l', euler: [-18, 0, 0] },
      { bone: 'upperarm_r', euler: [0, 0, 62] },
      { bone: 'lowerarm_r', euler: [-80, 20, 0] },
    ],
    anchor: { y: { seat: 0.11 }, x: 'pelvis', z: 'back' },
  },
};

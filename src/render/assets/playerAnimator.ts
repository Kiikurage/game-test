import { findPlayerClipEvents } from '../../game/anim/playerClips';
import { CharacterAnimator, type CharacterAnimatorConfig } from '../anim/characterAnimator';
import type { Character } from './character';
import type { CharacterAssets } from './characterAssets';

/**
 * プレイヤーのアニメーション設定（コントローラ本体は `CharacterAnimator`）。
 *
 * 状態を足すとき（攻撃 #46・ガード #53・被弾 #50）:
 *  - `Player` の状態グラフに状態 ID を足し、マーカー表（`src/game/anim/data/playerClips.json`）に
 *    `player.<動作 ID>` を足せば、再生範囲・再生速度・クロスフェードは自動で決まる（ここは変更不要）。
 *  - マーカー表を持たない状態だけ、`states` にクリップを指定する。
 *  - 状態ごとのクロスフェード時間は `actionFades`、起動時に作っておく状態は `preload`。
 */
export const PLAYER_ANIMATOR_CONFIG: CharacterAnimatorConfig = {
  actionEntry: (id) => findPlayerClipEvents(`player.${id}`),
  states: {
    // 小さな段差の乗り降りで落下モーションがちらつかないよう、少し落ち続けてから切り替える
    fall: { clip: 'Jump_Loop', loop: true, delayFrames: 8, fadeIn: 0.12, fadeOut: 0.08 },
    // 着地硬直（10F / 22F）に、着地クリップの衝撃〜立ち上がりを合わせる
    land: { clip: 'Jump_Land', range: [0, 1.0], fadeIn: 0.04, fadeOut: 0.12, fallbackFrames: 10 },
    // 被弾（#50）: 仰け反り 24F に Hit_Chest（0.33s）、転倒 48F に Hit_Knockback（0.83s）を引き伸ばして合わせる
    flinch: { clip: 'Hit_Chest', fadeIn: 0.03, fadeOut: 0.1, fallbackFrames: 24 },
    knockdown: { clip: 'Hit_Knockback', fadeIn: 0.03, fadeOut: 0.12, fallbackFrames: 48 },
    // ガード崩し（#53）: 54F に Idle_Shield_Break（1.07s）を合わせる
    guardBreak: { clip: 'Idle_Shield_Break', fadeIn: 0.04, fadeOut: 0.15, fallbackFrames: 54 },
  },
  // 回避は切れ味重視: 入りは素早く、戻りはやや長く
  actionFades: {
    roll: { fadeIn: 0.04, fadeOut: 0.1 },
    backstep: { fadeIn: 0.04, fadeOut: 0.1 },
    // ガードカウンター（盾の打撃。マーカー表 player.guardCounter）
    guardCounter: { fadeIn: 0.04, fadeOut: 0.12 },
  },
  combatIdle: 'Sword_Idle',
  preload: [
    'roll',
    'backstep',
    'fall',
    'land',
    'flinch',
    'knockdown',
    'light1',
    'light2',
    'light3',
    'guardBreak',
    'guardCounter',
    'heal',
    'healEmpty',
  ],
};

/** 描画のデバッグ用に固定表示できるレイヤ（状態 ID または `idle` / `walk` / `jog` / `sprint`）。 */
export type PlayerAnimLayer = string;

export class PlayerAnimator extends CharacterAnimator {
  constructor(character: Character, assets: CharacterAssets) {
    super(character, (name) => assets.getClip(name), PLAYER_ANIMATOR_CONFIG);
  }
}

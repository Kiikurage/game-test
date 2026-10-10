import { findEnemyClipEvents } from '../../game/anim/enemyClips';
import { ENEMY_LOCOMOTION } from '../../game/data';
import { CharacterAnimator, type CharacterAnimatorConfig } from '../anim/characterAnimator';
import type { Character } from './character';
import type { CharacterAssets } from './characterAssets';

/**
 * 雑魚敵（亡者兵・盾持ち共通）のアニメーション設定。コントローラ本体は `CharacterAnimator`（プレイヤーと共通）。
 *
 * 移動系の状態（Idle / Suspicious / Chase / Approach / Recover / Return）は速度のブレンドで動き、
 * 戦闘の構え（Alert 以降）の立ちは Sword_Idle。クリップ指定が要る Action 系だけ `states` に書く。
 * 攻撃（#54）はマーカー表（`enemy.undead.<攻撃 ID>`。`src/game/anim/data/undeadClips.json`）で再生範囲・速度を決める。
 * Attack は 1 つの状態で、`Enemy.fsm.actionId`（A1 / A2 / A3）ごとにクリップが決まる。
 */
export const ENEMY_ANIMATOR_CONFIG: CharacterAnimatorConfig = {
  actionEntry: findEnemyClipEvents,
  profile: ENEMY_LOCOMOTION,
  states: {
    // 気付きの硬直（24F）: 構えて相手を見据える
    alert: { clip: 'Sword_Idle', loop: true, fadeIn: 0.08, fadeOut: 0.1 },
    staggered: { clip: 'Hit_Chest', fallbackFrames: 30, fadeIn: 0.04, fadeOut: 0.1 },
    dead: { clip: 'Death01', fallbackFrames: 90, fadeIn: 0.06, fadeOut: 0.1 },
  },
  // 予備動作へはすばやく入る（読ませる動き）、戻りはやや長く
  actionFades: { attack: { fadeIn: 0.08, fadeOut: 0.15 } },
  combatIdle: 'Sword_Idle',
  fade: { locomotion: 0.15 },
};

export class EnemyAnimator extends CharacterAnimator {
  constructor(character: Character, assets: CharacterAssets) {
    super(character, (name) => assets.getClip(name), ENEMY_ANIMATOR_CONFIG);
  }
}

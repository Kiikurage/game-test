import { ENEMY_LOCOMOTION } from '../../game/data';
import { CharacterAnimator, type CharacterAnimatorConfig } from '../anim/characterAnimator';
import type { Character } from './character';
import type { CharacterAssets } from './characterAssets';

/**
 * 雑魚敵（亡者兵・盾持ち共通）のアニメーション設定。コントローラ本体は `CharacterAnimator`（プレイヤーと共通）。
 *
 * 移動系の状態（Idle / Suspicious / Chase / Approach / Recover / Return）は速度のブレンドで動き、
 * 戦闘の構え（Alert 以降）の立ちは Sword_Idle。クリップ指定が要る Action 系だけ `states` に書く。
 * 攻撃（#54）はマーカー表（`actionEntry`）を足すか、ここへクリップを足す。
 */
export const ENEMY_ANIMATOR_CONFIG: CharacterAnimatorConfig = {
  // 敵のマーカー表は #54 以降（今は状態ごとのクリップ指定だけ）
  actionEntry: () => undefined,
  profile: ENEMY_LOCOMOTION,
  states: {
    // 気付きの硬直（24F）: 構えて相手を見据える
    alert: { clip: 'Sword_Idle', loop: true, fadeIn: 0.08, fadeOut: 0.1 },
    // 攻撃の実行は #54。差し替えるまでの暫定（通常は到達しない）
    attack: { clip: 'Sword_Attack', fallbackFrames: 60, fadeIn: 0.06, fadeOut: 0.12 },
    staggered: { clip: 'Hit_Chest', fallbackFrames: 30, fadeIn: 0.04, fadeOut: 0.1 },
    dead: { clip: 'Death01', fallbackFrames: 90, fadeIn: 0.06, fadeOut: 0.1 },
  },
  combatIdle: 'Sword_Idle',
  fade: { locomotion: 0.15 },
};

export class EnemyAnimator extends CharacterAnimator {
  constructor(character: Character, assets: CharacterAssets) {
    super(character, (name) => assets.getClip(name), ENEMY_ANIMATOR_CONFIG);
  }
}

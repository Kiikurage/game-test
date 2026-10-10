import { CharacterAnimator, type CharacterAnimState } from '../anim/characterAnimator';
import type { CharacterAnimatorConfig } from '../anim/characterAnimator';
import type { BossCharacter } from '../assets/bossCharacter';
import type { CharacterAssets } from '../assets/characterAssets';
import { findBossClipEvents } from '../../game/anim/bossClips';
import { BOSS_LOCOMOTION, toModelSpeed } from './bossGait';

/**
 * ボスのアニメーションコントローラ（本体は `CharacterAnimator`、雑魚・プレイヤーと同じ）。
 * 移動（立ち・歩き・走り）はここで完結する。技・フェーズ移行・死亡などの Action 状態は、
 * ボス AI（E5-2 以降）が `states`（クリップ指定）またはマーカー表（`actionEntry`）で足す。
 *
 * **歩行位相と速度は拡大後の歩幅に合わせてモデル空間へ換算する**（`bossGait.ts`）:
 *   game 側の `GaitClock.advance(toModelSpeed(speed), dt, { profile: BOSS_LOCOMOTION })` で位相を進め、
 *   `CharacterAnimState.speed` にも `toModelSpeed(speed)` を入れる。`bossMoveState` がそれを組み立てる。
 */
export const BOSS_ANIMATOR_CONFIG: CharacterAnimatorConfig = {
  actionEntry: (id) => findBossClipEvents(id),
  profile: BOSS_LOCOMOTION,
  states: {
    // 撃破（#86）: 膝をつき崩れ落ちる。再生位置は `BossDefeatFx.animState` が撃破 F から決める
    dead: { clip: 'Death01', fallbackFrames: 60, fadeIn: 0.12, fadeOut: 0.1 },
  },
  combatIdle: 'Sword_Idle',
  // 巨体は動きの切り替わりが緩やか
  fade: { locomotion: 0.25 },
};

export class BossAnimator extends CharacterAnimator {
  constructor(boss: BossCharacter, assets: CharacterAssets) {
    super(boss.character, (name) => assets.getClip(name), BOSS_ANIMATOR_CONFIG);
  }
}

/** 移動中のアニメーション状態を作る（`speed` は実速度 m/s。歩行位相は `GaitClock` のもの）。 */
export function bossMoveState(
  speed: number,
  gait: { readonly phase: number; readonly lastDelta: number },
  options: { lockedOn?: boolean; frozen?: boolean } = {},
): CharacterAnimState {
  return {
    state: speed > 0.01 ? 'move' : 'idle',
    kind: speed > 0.01 ? 'move' : 'idle',
    actionId: null,
    stateFrame: 1,
    totalFrames: 0,
    speed: toModelSpeed(speed),
    localVelocity: { x: 0, z: speed },
    lockedOn: options.lockedOn ?? true,
    gaitPhase: gait.phase,
    gaitPhaseStep: gait.lastDelta,
    frozen: options.frozen ?? false,
  };
}

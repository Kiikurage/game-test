import type { HitEvent } from '../combat';
import { deathOf } from '../death/death.system';
import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import type { CameraClip, CameraClipOptions, CameraEffects } from './cameraEffects';

// カメラ演出の発火（仕様書 3.3 節）。`HitEvent`（`onHit`）を購読して、命中と同じステップで振動・FOV キックを始める。
// ヒットストップの凍結・`hitStop` イベントと同じステップ（0F 遅延）。演出の進行はヒットストップでは止まらない
// （`CameraEffects` の冒頭コメント参照）。
//
// | 命中 | 演出 |
// | --- | --- |
// | プレイヤーが被弾、ボスの攻撃 または 重い被弾（`kind: 'heavy'`） | 被弾（重）: 0.8°・12F + FOV +2°（8F で戻る） |
// | プレイヤーが被弾（それ以外） | 被弾（軽）: 0.3°・6F |
// | プレイヤーの強攻撃（`heavy` / `heavyCharged`）が命中 | 0.4°・8F |
// | ガード・ジャストガード（`kind: 'guard'`）、軽攻撃の命中 | なし |
//
// 死亡演出（`death.system.ts`。FOV −4° を 90F、振動なし）と整合させる: 死亡処理中・死亡する命中では何も出さず、
// 再生中の演出も止める。FOV の縮小は死亡側が `camera.presentation` で行い、こちらは加算するだけ（干渉しない）。
//
// ほかの演出（ボスの叩きつけ・フェーズ移行・技ごとのカメラ）は `cameraEffectsOf(game)` の API を呼ぶ:
//   const fx = cameraEffectsOf(game);
//   fx.slam(distance)                 // ボスの叩きつけ（距離はプレイヤーとの水平距離。減衰あり）
//   fx.playClip(PHASE_TRANSITION_CLIP) // 距離・FOV・振動のキーフレーム（`cameraClips.ts`）
// 位置から距離を出す版は `slamAt(game, position)`。

/** `game` のカメラ演出（ボスの技・フェーズ移行・デバッグが呼ぶ）。 */
export function cameraEffectsOf(game: Game): CameraEffects {
  return game.camera.effects;
}

/** ボスの叩きつけ。`position` はワールド座標（y は無視）。プレイヤーとの水平距離で減衰する。 */
export function slamAt(game: Game, position: { readonly x: number; readonly z: number }): void {
  const feet = game.player.feet;
  const distance = Math.hypot(position.x - feet.x, position.z - feet.z);
  game.camera.effects.slam(distance);
}

/** カメラ演出クリップを再生する（`cameraEffectsOf(game).playClip` の短縮）。 */
export function playCameraClip(game: Game, clip: CameraClip, options?: CameraClipOptions): void {
  game.camera.effects.playClip(clip, options);
}

/** 命中に対する演出の種類（純粋関数。テスト用に公開）。 */
export type HitCameraReaction = 'hitLight' | 'hitHeavy' | 'playerHeavyHit' | null;

export function cameraReactionFor(e: HitEvent, attackerIsBoss: boolean): HitCameraReaction {
  if (e.guard !== 'none' || e.kind === 'guard' || e.kind === 'guardBreak') return null;
  if (e.targetId === 'player') {
    if (e.killed) return null; // 死亡演出（振動なし）に任せる
    return attackerIsBoss || e.kind === 'heavy' ? 'hitHeavy' : 'hitLight';
  }
  if (e.attackerId === 'player' && (e.attackId === 'heavy' || e.attackId === 'heavyCharged')) {
    return 'playerHeavyHit';
  }
  return null;
}

registerGameSystem('cameraEffects', (game) => {
  const fx = game.camera.effects;
  return {
    update: () => {
      // 死亡処理中は演出を出さない（FOV 縮小は死亡側。振動なし）。再生中のものも止める
      if (deathOf(game).active && fx.active) fx.clear();
    },
    onHit: (e) => {
      if (deathOf(game).active) return;
      const reaction = cameraReactionFor(e, game.bossIds.has(e.attackerId));
      if (reaction) fx[reaction]();
    },
  };
});

import { PHASE_TRANSITION_CLIP } from '../camera/cameraClips';
import { cameraEffectsOf } from '../camera/cameraEffects.system';
import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { bossSystemOf } from './boss.system';
import {
  BOSS_TRANSITION,
  BOSS_TRANSITION_FRAMES,
  cuesBetween,
  type BossTransitionCue,
} from './bossTransition';

/**
 * ボスのフェーズ移行の演出の進行（#84 / 仕様書 6.5・3.3・10.2 節）。ボスの移行 F（`Boss.transitionFrame`）に同期して、
 * 節目（`bossTransition` イベント）・カメラ演出・BGM（ダッキング / レイヤー）・咆哮の SE を発行する。
 * 描画（盾投げ・咆哮・熾火・赤い縁取り）は `render/boss/bossTransitionFx.ts` が `frame` を読む。
 *
 * | F | 発行 |
 * | --- | --- |
 * | 0（開始） | `bossTransition` start（HP バーの境界の光 20F の起点）・カメラ `PHASE_TRANSITION_CLIP`（F60 で引き・FOV・振動、F100–F120 で戻る） |
 * | 12 / 13 | flinchEnd / shieldThrow・`bgmLayer`（`bgm.boss-layer` を 6 秒で重ねる） |
 * | 60 | roar・`bgmDuck` −6dB / 30F・`sfx.boss.roar` |
 * | 100 | roarEnd・`bgmDuck` 解除（30F） |
 * | 120 | end（戦闘再開） |
 *
 * 移行の途中でボスがリセットされた（プレイヤーの死亡など）ら、再生中のカメラ演出・ダッキングを止めて `end`（`aborted: true`）を発行する。
 */
export class BossTransitionDirector {
  private last = -1;

  constructor(private readonly game: Game) {}

  /** 演出中の移行 F（開始 0〜119）。演出中でなければ -1。 */
  get frame(): number {
    return this.last;
  }

  update(): void {
    const boss = bossSystemOf(this.game).boss;
    const f = boss?.transitionFrame ?? -1;
    if (f >= 0) {
      for (const cue of cuesBetween(this.last, f)) this.fire(cue, false);
      this.last = f;
    } else if (this.last >= 0) {
      // 移行が終わった（F120。ボスはフェーズ 2）か、途中でリセット・撤去された
      if (boss?.phase === 2) {
        for (const cue of cuesBetween(this.last, BOSS_TRANSITION.end)) this.fire(cue, false);
      } else {
        this.abort();
      }
      this.last = -1;
    }
  }

  private abort(): void {
    const { game } = this;
    cameraEffectsOf(game).clear();
    if (this.last >= BOSS_TRANSITION.roar && this.last < BOSS_TRANSITION.roarEnd) {
      game.events.emit('bgmDuck', { db: 0, frames: BOSS_TRANSITION.duckFrames });
    }
    game.events.emit('bossTransition', { id: 'boss', cue: 'end', frame: this.last, aborted: true });
  }

  private fire(cue: BossTransitionCue, aborted: boolean): void {
    const { game } = this;
    const boss = bossSystemOf(game).boss;
    if (!boss) return;
    game.events.emit('bossTransition', {
      id: boss.id,
      cue,
      frame: BOSS_TRANSITION_FRAMES[cue],
      aborted,
    });
    switch (cue) {
      case 'start':
        cameraEffectsOf(game).playClip(PHASE_TRANSITION_CLIP);
        break;
      case 'shieldThrow':
        game.events.emit('bgmLayer', {
          layer: BOSS_TRANSITION.bgmLayer,
          frames: BOSS_TRANSITION.bgmLayerFrames,
        });
        break;
      case 'roar':
        game.events.emit('bgmDuck', {
          db: BOSS_TRANSITION.duckDb,
          frames: BOSS_TRANSITION.duckFrames,
        });
        game.events.emit('sound', {
          cue: 'sfx.boss.roar',
          source: 'boss',
          position: { x: boss.position.x, y: boss.position.y + 3, z: boss.position.z },
        });
        break;
      case 'roarEnd':
        game.events.emit('bgmDuck', { db: 0, frames: BOSS_TRANSITION.duckFrames });
        break;
      default:
        break;
    }
  }
}

const directors = new WeakMap<Game, BossTransitionDirector>();

/** `game` のフェーズ移行の演出（描画が `frame` を読む）。 */
export function bossTransitionOf(game: Game): BossTransitionDirector {
  const d = directors.get(game);
  if (!d) throw new Error('boss transition system is not registered for this game');
  return d;
}

registerGameSystem('boss-transition', (game) => {
  const director = new BossTransitionDirector(game);
  directors.set(game, director);
  return {
    update: () => {
      director.update();
    },
  };
});

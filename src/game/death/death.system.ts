import { ACTIONS } from '../../core/input';
import type { DeathPhase } from '../../core/gameEvents';
import { bonfiresOf } from '../bonfire/bonfire';
import { DEATH } from '../data/death';
import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { DeathTimeline, type DeathVisual } from './deathTimeline';

// 死亡処理（仕様書 8.1 / 8.2 / 8.3 / 3.3 節）。HP 0 を検知して F0 から演出のタイムラインを進め、F300 で篝火へ再開する。
//
// - F0: 入力無効（プレイヤーを `dead` へ。HUD は `bonfire.system.ts` が死亡中に隠す）・ロックオン解除・BGM ダッキング指示（`bgmDuck`）。
//   ヒットストップ 12F は命中時の標準処理（`decideHitStop`）が行う。
// - F12–: カメラを引き FOV を縮める（`game.camera.presentation`）。F30–: 画面の彩度・明度・周辺減光（`visual.grade`。
//   描画は `render/death/death.view.ts`）。F60: 「倒れた」表示。F90 以降はボタン入力でスキップ。F240–F300 黒へ。
// - F300: `bonfiresOf(game).respawn()`（HP・瓶・敵の復活・`rest` イベント・立ち上がり）。篝火が無い場面（テストシーン）は
//   初期位置へ戻す。ボスなどのリセットは `rest`（cause: 'respawn'）を購読する。取得済みアイテム・ショートカットはセーブなので触らない。
// 各節目は `death` イベントで通知する（`GameEventMap.death`）。

export class DeathController {
  private readonly timeline = new DeathTimeline();
  /** 発行した節目の記録（デバッグ・E2E 用）。 */
  readonly log: { readonly phase: DeathPhase; readonly frame: number }[] = [];

  constructor(private readonly game: Game) {}

  /** 演出中か（F0 から再開まで）。 */
  get active(): boolean {
    return this.timeline.active;
  }

  get frame(): number {
    return this.timeline.frame;
  }

  get skipped(): boolean {
    return this.timeline.skipped;
  }

  /** 画面・カメラ演出の現在値（描画側が読む）。 */
  get visual(): DeathVisual {
    return this.timeline.visual;
  }

  /** 毎ステップ（`death.system.ts`）。 */
  update(): void {
    const { game, timeline } = this;
    if (!timeline.active && (game.playerTarget.health.dead || game.player.dead)) {
      this.begin();
    } else if (timeline.active) {
      this.keepDead();
      const frame = timeline.frame + 1;
      for (const phase of timeline.step(this.skipPressed())) this.emit(phase, frame);
    } else {
      timeline.step();
    }
    this.applyCamera();
  }

  private begin(): void {
    const { game } = this;
    if (!game.player.dead) game.player.die();
    this.keepDead();
    for (const phase of this.timeline.begin()) this.emit(phase, 0);
  }

  /** 死亡中の状態の保持: ロックオンを外す（HUD は死亡中 `bonfire.system.ts` が隠す）。 */
  private keepDead(): void {
    const { game } = this;
    if (game.lockOn.active) game.lockOn.release('external');
  }

  private skipPressed(): boolean {
    const { buttons } = this.game.inputSnapshot;
    return ACTIONS.some((a) => buttons[a].pressed);
  }

  private emit(phase: DeathPhase, frame: number): void {
    const { game } = this;
    if (phase === 'start') {
      game.events.emit('bgmDuck', { db: DEATH.bgmDuckDb, frames: DEATH.bgmDuckFrames });
    }
    if (phase === 'respawn') this.respawn();
    const { x, y, z } = game.player.feet;
    this.log.push({ phase, frame });
    game.events.emit('death', {
      phase,
      frame,
      skipped: this.timeline.skipped,
      position: { x, y, z },
    });
    if (phase === 'respawn') {
      game.events.emit('bgmDuck', { db: 0, frames: DEATH.bgmReleaseFrames });
    }
  }

  /** 再開: 篝火のリスポーン（HP・瓶・敵の復活・`rest` イベント）。篝火が無ければ初期位置。 */
  private respawn(): void {
    const { game } = this;
    game.timeScale.reset();
    if (!bonfiresOf(game).respawn()) {
      game.respawn();
      game.player.stamina.refill();
      game.respawnEnemies();
    }
  }

  private applyCamera(): void {
    const { fovOffsetDeg, armOffsetM, pivotDropM } = this.timeline.visual;
    this.game.camera.presentation.fovOffsetDeg = fovOffsetDeg;
    this.game.camera.presentation.armOffsetM = armOffsetM;
    this.game.camera.presentation.pivotDropM = pivotDropM;
  }
}

const controllers = new WeakMap<Game, DeathController>();

/** `game` の死亡処理（描画・HUD・デバッグが状態を読む）。 */
export function deathOf(game: Game): DeathController {
  let c = controllers.get(game);
  if (!c) {
    c = new DeathController(game);
    controllers.set(game, c);
  }
  return c;
}

registerGameSystem('death', (game) => {
  const death = deathOf(game);
  return {
    update: () => {
      death.update();
    },
  };
});

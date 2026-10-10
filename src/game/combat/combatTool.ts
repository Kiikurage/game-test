import type { Game } from '../game';
import { setDebugSlow } from '../timeScale';
import { describePlayerAction, type PlayerActionInfo } from './actionDebug';

/**
 * 戦闘デバッグツール（#51）のゲーム側。`?debug&scene=combat` で、プレイヤーのアクション名・フレーム・窓と
 * 資源（HP・スタミナ・回復瓶・強靭度）、訓練用ダミーの状態を読み、回復・ダミーのリセット・スロー再生を操作する。
 * UI（DOM）は `render/combat/combatTool.view.ts`、判定の可視化は `render/combatDebugView.ts`（`?debug` 共通）。
 * スロー・フレーム送りは、ボス技の検証ツールと同じ仕組み（`timeScale` のスロー + dev フックの `pause` / `advance`）。
 */

export interface CombatToolDummyInfo {
  readonly id: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly poise: number;
  readonly poiseMax: number;
  readonly staggered: boolean;
  /** プレイヤーからの距離（m）。 */
  readonly distance: number;
}

export interface CombatToolInfo {
  readonly player: {
    readonly hp: number;
    readonly maxHp: number;
    readonly stamina: number;
    readonly staminaMax: number;
    readonly flask: number;
    readonly flaskMax: number;
    readonly poise: number;
    readonly poiseMax: number;
    readonly dead: boolean;
  };
  readonly action: PlayerActionInfo;
  /** プレイヤーに最も近い訓練用ダミー（なければ null）。 */
  readonly dummy: CombatToolDummyInfo | null;
  /** スロー再生の倍率（1 = 通常）。 */
  readonly slow: number;
}

export class CombatDebugTool {
  private slow = 1;

  constructor(private readonly game: Game) {}

  /** HP・スタミナ・回復瓶・強靭度を全回復する。 */
  restorePlayer(): void {
    const { game } = this;
    game.playerTarget.health.refill();
    game.player.stamina.refill();
    game.player.flask.refill();
    game.player.reactor.poise.reset();
  }

  /** 訓練用ダミー（と、置かれていれば敵）の HP・強靭度を全回復する。 */
  resetDummies(): void {
    const { game } = this;
    for (const d of game.dummies) {
      game.combat.allTargets.get(d.id)?.health.refill();
      game.reactors.get(d.id)?.reset();
    }
    for (const e of game.enemies.enemies) {
      if (!e.alive) continue;
      game.combat.allTargets.get(e.id)?.health.refill();
      game.reactors.get(e.id)?.reset();
    }
  }

  /** プレイヤーを初期位置へ戻し（向きも初期）、ダミーも全回復する。 */
  reposition(): void {
    this.game.respawn();
    this.resetDummies();
  }

  /** スロー再生の倍率（1 で通常速度）。 */
  setSlow(scale: number): void {
    this.slow = scale;
    setDebugSlow(this.game.timeScale, scale);
  }

  info(): CombatToolInfo {
    const { game } = this;
    const { player } = game;
    const anim = player.animation;
    const poise = player.reactor.poise;
    const feet = player.feet;
    let dummy: CombatToolDummyInfo | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const d of game.dummies) {
      const dist = Math.hypot(d.position.x - feet.x, d.position.z - feet.z);
      const heart = game.combat.allTargets.get(d.id);
      const reactor = game.reactors.get(d.id);
      if (!heart || !reactor || dist >= best) continue;
      best = dist;
      dummy = {
        id: d.id,
        hp: heart.health.current,
        maxHp: heart.health.max,
        poise: reactor.poise.current,
        poiseMax: reactor.poise.max,
        staggered: reactor.poise.staggered,
        distance: dist,
      };
    }
    const health = game.playerTarget.health;
    return {
      player: {
        hp: health.current,
        maxHp: health.max,
        stamina: player.stamina.current,
        staminaMax: player.stamina.max,
        flask: player.flask.count,
        flaskMax: player.flask.max,
        poise: poise.current,
        poiseMax: poise.max,
        dead: player.dead,
      },
      action: describePlayerAction({
        state: player.state,
        actionId: anim.actionId,
        frame: player.stateFrame,
        invulnerable: player.invulnerable,
        poiseBonus: poise.bonus,
        frozen: player.frozen,
      }),
      dummy,
      slow: this.slow,
    };
  }
}

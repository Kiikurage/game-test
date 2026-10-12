import { capsule, capsuleShape, vec3, type HitEvent } from './combat';
import type { EnemyDebugInfo } from './enemy/enemy';
import type { MarkerType } from './anim/eventMarkers';
import type { Game } from './game';

/** デバッグ・E2E 用の `Game.debugHitPlayer` の引数。 */
export interface DebugHitOptions {
  readonly from?: 'front' | 'back' | 'left' | 'right';
  readonly damage?: number;
  readonly poiseDamage?: number;
  readonly guardStaminaCost?: number;
  /** 攻撃者の方位を、プレイヤーの正面からの角度（度、右が正）で直接指定する。`from` より優先。 */
  readonly bearingDeg?: number;
}

/**
 * デバッグ・E2E 用: 敵の攻撃を 1 発、プレイヤーへ当てる（実際の敵の攻撃動作が入るまでのダミー）。
 * `from` は攻撃者のいる方向（プレイヤーの向きに対して。front = 正面、back = 背面、left / right = 側面）。
 * 攻撃者はプレイヤーから 1.5m 離れた位置にいる。ガード判定・削り・スタミナ消費・ヒットストップ・
 * 被弾リアクションは本物の命中と同じ経路を通る。命中イベントの配列を返す。
 */
export function debugHitPlayer(game: Game, options: DebugHitOptions = {}): HitEvent[] {
  const { player, combat } = game;
  const bearings = { front: 0, right: 90, back: 180, left: -90 } as const;
  const bearing = ((options.bearingDeg ?? bearings[options.from ?? 'front']) * Math.PI) / 180;
  const dir = player.yaw + bearing;
  const p = player.feet;
  const origin = vec3(p.x + Math.sin(dir) * 1.5, p.y, p.z + Math.cos(dir) * 1.5);
  const attack = combat.startAttack('debug-enemy', 'enemy', {
    id: 'debug-swing',
    damage: options.damage ?? 30,
    poiseDamage: options.poiseDamage ?? 20,
    guardStaminaCost: options.guardStaminaCost ?? 20,
  });
  const shape = capsuleShape(
    capsule(vec3(p.x - 0.1, p.y + 1, p.z - 0.1), vec3(p.x + 0.1, p.y + 1, p.z + 0.1), 0.15),
    origin,
  );
  const events = combat.resolve(attack, shape);
  combat.endAttack(attack);
  return events;
}

/** E2E / デバッグ用の状態。 */
export function buildDebugState(game: Game): GameDebugState {
  const p = game.player;
  return {
    player: {
      state: p.state,
      stateFrame: p.stateFrame,
      position: { x: p.feet.x, y: p.feet.y, z: p.feet.z },
      yaw: p.yaw,
      speed: p.speed,
      grounded: p.grounded,
      stamina: p.stamina.current,
      invulnerable: p.invulnerable,
      poiseBonus: p.reactor.poise.bonus,
      guard: {
        phase: p.animation.guard.phase,
        frame: p.guardFrame,
        counterOpen: p.guardCounterOpen,
        breaks: p.guardBreakCount,
      },
    },
    camera: {
      position: {
        x: game.camera.position.x,
        y: game.camera.position.y,
        z: game.camera.position.z,
      },
      yaw: game.camera.yaw,
      pitch: game.camera.pitch,
      armLength: game.camera.armLength,
      forward: { x: game.camera.forward.x, y: game.camera.forward.y, z: game.camera.forward.z },
      pivot: { x: game.camera.pivot.x, y: game.camera.pivot.y, z: game.camera.pivot.z },
    },
    lockOn: {
      targetId: game.lockOn.target?.id ?? null,
      lastEvent: game.lastLockOnEvent,
    },
    markers: { ...game.markerCounts },
    enemies: game.enemies.debugInfo,
    combat: {
      playerHp: game.playerTarget.health.current,
      playerDead: game.player.dead,
      flask: game.player.flask.count,
      playerFreeze: game.player.fsm.freezeRemaining,
      timeScale: game.timeScale.current,
    },
  };
}

export interface GameDebugState {
  readonly player: {
    readonly state: string;
    readonly stateFrame: number;
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
    readonly yaw: number;
    readonly speed: number;
    readonly grounded: boolean;
    readonly stamina: number;
    readonly invulnerable: boolean;
    /** 強靭度の一時加算の残り（強攻撃のスーパーアーマー中は 40 から削られる）。 */
    readonly poiseBonus: number;
    /** ガードの状態（見た目の段階・構えのフレーム・ガードカウンターの受付中・崩された回数）。 */
    readonly guard: {
      readonly phase: string;
      readonly frame: number;
      readonly counterOpen: boolean;
      readonly breaks: number;
    };
  };
  readonly camera: {
    readonly position: { readonly x: number; readonly y: number; readonly z: number };
    readonly yaw: number;
    readonly pitch: number;
    readonly armLength: number;
    readonly forward: { readonly x: number; readonly y: number; readonly z: number };
    readonly pivot: { readonly x: number; readonly y: number; readonly z: number };
  };
  readonly lockOn: { readonly targetId: string | null; readonly lastEvent: string };
  /** イベントマーカーの種別ごとの発火回数。 */
  readonly markers: Readonly<Record<MarkerType, number>>;
  /** 敵の状態（気付きゲージ・見失いなど）。 */
  readonly enemies: readonly EnemyDebugInfo[];
  /** 判定の状態（プレイヤー HP・死亡・回復瓶の残り）。 */
  readonly combat: {
    readonly playerHp: number;
    readonly playerDead: boolean;
    readonly flask: number;
    /** プレイヤーの凍結の残り・現在のタイムスケール。 */
    readonly playerFreeze: number;
    readonly timeScale: number;
  };
}

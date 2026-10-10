// 篝火（#55、仕様書 8.3 節）: 点火・休憩・復活効果・リスポーン位置。
//
// - 篝火はレベルの `interactables`（kind: 'bonfire'）から作り、インタラクション基盤（`interaction.ts`）に登録する。
//   状況アクションの文言は「火を灯す」（未点火）→「休む」（点火済み）→「立ち上がる」（座っている間）。
// - 初回点火: 近くで入力すると `BONFIRE.igniteFrames`（2s）かがんで火を灯し、完了で点火（セーブ + `bonfireLit` イベント）。
//   途中で被弾すると中断し、点火されない。
// - 休憩: 座り込み（2s）→ 保持 → 再入力で立ち上がり（2s）。座り込みの開始時に効果を適用する
//   （HP・スタミナ・回復瓶を全回復、通常敵を全復活、`rest` イベント、セーブ）。
// - リスポーン（死亡処理 #64 が呼ぶ）: `bonfiresOf(game).respawn()`。篝火から 1.5m 南で、篝火の方を向いて座った状態から
//   立ち上がる（2s・移動不可・被弾しない）。休憩と同じ効果を適用する。
import type { Game } from '../game';
import { BONFIRE } from '../data/bonfire';
import { yawOf } from '../player/movement';
import { interactionOf } from '../interaction/interaction';

export interface RespawnPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** 向き（ヨー）。篝火の方を向く。 */
  readonly yaw: number;
}

interface BonfireEntry {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  lit: boolean;
}

export class BonfireController {
  private readonly entries = new Map<string, BonfireEntry>();
  /** 直近に点火・休憩した篝火（リスポーン先の既定。なければ最初の点火済み、それもなければ最初の篝火）。 */
  private lastId: string | null = null;
  /** 点火の動作中の篝火（完了で点火。被弾などで中断されると取り消す）。 */
  private igniting: string | null = null;

  constructor(private readonly game: Game) {
    const interaction = interactionOf(game);
    const saved = new Set(game.save.get().bonfires);
    for (const spawn of game.interactableSpawns) {
      if (spawn.kind !== 'bonfire') continue;
      const entry: BonfireEntry = {
        id: spawn.id,
        x: spawn.x,
        z: spawn.z,
        lit: saved.has(spawn.id),
      };
      this.entries.set(entry.id, entry);
      interaction.register({
        id: entry.id,
        kind: 'bonfire',
        x: entry.x,
        z: entry.z,
        radius: BONFIRE.radiusM,
        label: () => (game.player.resting ? '立ち上がる' : entry.lit ? '休む' : '火を灯す'),
        interact: () => {
          this.interact(entry);
        },
      });
    }
  }

  /** 篝火の ID 一覧。 */
  get ids(): readonly string[] {
    return [...this.entries.keys()];
  }

  isLit(id: string): boolean {
    return this.entries.get(id)?.lit ?? false;
  }

  /** 篝火の位置（なければ null）。 */
  position(id: string): { readonly x: number; readonly z: number } | null {
    return this.entries.get(id) ?? null;
  }

  /** 直近に使った（点火・休憩した）篝火の ID。リスポーンの既定の行き先。 */
  get currentId(): string | null {
    if (this.lastId) return this.lastId;
    for (const e of this.entries.values()) if (e.lit) return e.id;
    return this.entries.keys().next().value ?? null;
  }

  /** 点火動作の途中か（デバッグ・テスト用）。 */
  get isIgniting(): boolean {
    return this.igniting !== null;
  }

  /**
   * リスポーン位置と向き: 篝火から南（-z）へ `BONFIRE.respawnDistanceM`、篝火の方（北）を向く。
   * `id` 省略時は `currentId`。篝火がなければ null。高さは地形に合わせる。
   */
  respawnPoint(id: string | null = this.currentId): RespawnPoint | null {
    const e = id === null ? undefined : this.entries.get(id);
    if (!e) return null;
    const x = e.x;
    const z = e.z - BONFIRE.respawnDistanceM;
    return { x, y: this.game.heightAt(x, z) + 0.02, z, yaw: yawOf(e.x - x, e.z - z) };
  }

  /**
   * 死亡後のリスポーン（死亡処理 #64 が呼ぶ）。プレイヤーを `respawnPoint` へ置き、HP・スタミナ・回復瓶を全回復、
   * 通常敵を全復活し（`rest` イベント `cause: 'respawn'`）、座った状態から立ち上がらせる（`standUpFrames`、移動不可・被弾しない）。
   * 篝火がなければ false（何もしない）。
   */
  respawn(id: string | null = this.currentId): boolean {
    const point = this.respawnPoint(id);
    const entry = id === null ? undefined : this.entries.get(id);
    if (!point || !entry) return false;
    const { game } = this;
    this.igniting = null;
    game.teleportPlayer(point.x, point.z, point.yaw, point.y);
    game.lockOn.release('external');
    this.applyRestEffects(entry, 'respawn');
    game.player.beginScripted('standUp', { frames: BONFIRE.standUpFrames });
    return true;
  }

  /** 毎ステップ（`bonfire.system.ts`）。点火動作の完了・中断を見る。 */
  update(): void {
    const id = this.igniting;
    if (id === null) return;
    const { player } = this.game;
    const entry = this.entries.get(id);
    if (!entry || player.state !== 'interact') {
      this.igniting = null; // 被弾などで中断
      return;
    }
    if (player.stateFrame >= BONFIRE.igniteFrames) {
      this.igniting = null;
      this.light(entry);
    }
  }

  private interact(entry: BonfireEntry): void {
    const { player } = this.game;
    if (player.resting) {
      player.beginScripted('standUp', { frames: BONFIRE.standUpFrames });
      return;
    }
    const faceYaw = yawOf(entry.x - player.feet.x, entry.z - player.feet.z);
    if (!entry.lit) {
      if (player.beginScripted('interact', { frames: BONFIRE.igniteFrames, faceYaw })) {
        this.igniting = entry.id;
      }
      return;
    }
    if (player.beginScripted('sitDown', { frames: BONFIRE.sitDownFrames, faceYaw })) {
      this.applyRestEffects(entry, 'rest');
    }
  }

  private light(entry: BonfireEntry): void {
    entry.lit = true;
    this.lastId = entry.id;
    this.game.save.igniteBonfire(entry.id);
    this.game.events.emit('bonfireLit', {
      id: entry.id,
      position: { x: entry.x, y: this.game.heightAt(entry.x, entry.z), z: entry.z },
      bannerSeconds: BONFIRE.bannerSeconds,
    });
  }

  /** 休憩・リスポーンの効果（8.2 / 8.3 節）。ボスはイベントを購読して自分で戻る。 */
  private applyRestEffects(entry: BonfireEntry, cause: 'rest' | 'respawn'): void {
    const { game } = this;
    const { player } = game;
    this.lastId = entry.id;
    player.health.refill();
    player.stamina.refill();
    player.flask.refill();
    game.respawnEnemies();
    // 休憩はセーブのタイミング（点火済みであることを確実に保存する）。リスポーンでは点火しない
    if (cause === 'rest') game.save.igniteBonfire(entry.id);
    game.events.emit('rest', {
      cause,
      bonfireId: entry.id,
      position: { x: entry.x, y: game.heightAt(entry.x, entry.z), z: entry.z },
      defeatedBosses: game.save.get().bosses,
    });
  }
}

const controllers = new WeakMap<Game, BonfireController>();

/** `game` の篝火（なければ作る）。死亡処理（#64）・ボス・HUD・描画がこれを読む。 */
export function bonfiresOf(game: Game): BonfireController {
  let c = controllers.get(game);
  if (!c) {
    c = new BonfireController(game);
    controllers.set(game, c);
  }
  return c;
}

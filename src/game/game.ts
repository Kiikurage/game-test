import { EventBus, type FootstepSurface, type GameEventMap } from '../core/gameEvents';
import { MARKER_TYPES, type MarkerType } from './anim/eventMarkers';
import { Vector3 } from 'three';
import type { InputReader, InputSnapshot } from '../core/input';
import { ThirdPersonCamera, type CameraCollision } from './camera/thirdPersonCamera';
import { LockOnController, type LockOnEvent } from './lockOn/lockOnController';
import type { DummyTarget, LockOnTarget } from './lockOn/targets';
import { LAND_NOISE_MIN_HEIGHT, PLAYER_STATS, type NoiseKind } from './data';
import { AttackTokens } from './enemy/attackRunner';
import type { EnemyManager } from './enemy/enemyManager';
import { EnemyRoster } from './enemy/enemyRoster';
import { createPhysics, type Physics } from './physics';
import { Player } from './player/player';
import {
  DebugSwing,
  type Freezable,
  type HitReactor,
  HitResolver,
  PlayerAttackDriver,
  PLAYER_HEARTBOXES,
  UprightTarget,
  type HitEvent,
} from './combat';
import { handleHit, type HitContext } from './hitHandling';
import { registerCombatant, type Combatant } from './combat/combatant';
import { ReactorRegistry } from './combat/reactorRegistry';
import { TimeScale } from './timeScale';
import { createGameSystems, type GameSystem } from './systems';
import { createTuning, type Tuning } from './tuning';
import type { InteractableSpawn } from './world/level';
import { SaveStore, type SaveGateway } from '../core/persistence';
import { DUMMIES, PLAYER_SPAWN, PLAYGROUND_BOXES } from './world/playground';
import { StaticWorld } from './world/staticWorld';
import { spawnDummies } from './world/dummies';
import { NULL_INPUT, type GameOptions, type StaticCylinderSpec } from './gameOptions';
import { cameraFrameInput, resolveSwitch } from './stepInputs';
import { publishMarker, publishPlayerEvent } from './eventPublishing';
import {
  buildDebugState,
  debugHitPlayer,
  type DebugHitOptions,
  type GameDebugState,
} from './gameDebug';

export {
  NULL_INPUT,
  type GameOptions,
  type StaticCylinderSpec,
  type TerrainCollisionMesh,
} from './gameOptions';
export type { GameDebugState } from './gameDebug';

// `*.system.ts`（登録式のゲームシステム。systems.ts 参照）を自動で読み込む。新機能は game.ts を編集しない。
import.meta.glob('./**/*.system.ts', { eager: true });

/**
 * ゲームのシミュレーション状態（60Hz 固定ステップ）。描画（three）には依存せず、
 * 描画側は `player.transform` / `camera.transform` 等の補間用 Transform を読み取るだけにする。
 *
 * 部品: 静的な衝突と問い合わせ（`world/staticWorld`）、ダミー（`world/dummies`）、被弾側の登録簿
 * （`combat/reactorRegistry`）、命中の演出（`combat/impact`）、雑魚敵（`enemy/enemyRoster`）、
 * デバッグ（`gameDebug`）。Game は組み立てとステップ順序だけを持つ。
 *
 * 1 ステップの順序: ロックオン → カメラの向き → プレイヤー → 敵 → 反応体 → 攻撃 → システム → 判定 → 物理 → カメラの位置（衝突）。
 */
export class Game {
  /** game が発行するイベント（音など）。audio 層が購読する。game は Web Audio に依存しない。 */
  readonly events = new EventBus<GameEventMap>();

  readonly player: Player;
  /** セーブの窓口（篝火の点火・休憩など。`core/persistence`）。 */
  readonly save: SaveGateway;
  /** 調べる対象の配置（篝火・レバー・門など。`src/game/interaction` と各機能のシステムが読む）。 */
  readonly interactableSpawns: readonly InteractableSpawn[];
  /** 雑魚敵（生成・AI・音の受け口）。敵は `lockOnTargets` にも登録される。 */
  readonly enemies: EnemyManager;
  /** 攻撃トークン（同時に攻撃できる敵の数。5.1 節）。 */
  readonly attackTokens = new AttackTokens();
  /** 調整値（Game ごとに持つ。`?debug` の調整パネルが書き換える）。 */
  readonly tuning: Tuning = createTuning();
  readonly camera = new ThirdPersonCamera(this.tuning);
  readonly lockOn = new LockOnController(this.tuning);
  /** ロックオン対象。敵（#40 以降）は `LockOnTarget` を実装してここへ追加する。 */
  readonly lockOnTargets: LockOnTarget[] = [];
  /** テストシーンのダミー（描画用に別持ち）。 */
  readonly dummies: readonly DummyTarget[];
  /** 判定・ダメージ解決（#40）。攻撃側は `combat.startAttack` / `resolve`、被弾側は `combat.addTarget`。 */
  readonly combat = new HitResolver({
    isBlocked: (from, to) => this.staticWorld.isBlocked(from, to),
  });
  /** プレイヤーの被弾側（ハートボックス・HP・無敵）。 */
  readonly playerTarget = new UprightTarget('player', 'player', PLAYER_STATS.hp, PLAYER_HEARTBOXES);
  /** ?debug 用の仮の攻撃（判定と可視化の動作確認。実際の攻撃動作は #46）。 */
  readonly debugSwing = new DebugSwing(this.combat);
  /** プレイヤーの攻撃動作（軽攻撃 3 段）と判定のつなぎ。 */
  readonly attackDriver = new PlayerAttackDriver(this.combat);
  /** プレイヤー以外の被弾側の強靭度・押し戻し・ヒットストップの凍結口・ボス ID。 */
  private readonly registry = new ReactorRegistry();
  /**
   * プレイヤー以外の被弾側の強靭度・押し戻し（`HitReactor`）。テストシーンのダミーは亡者兵相当（強靭度 50）。
   * 敵（#42 以降）は自分の `HitReactor` を作って `addReactor` し、命中時の反応を自分の状態機械へ反映する。
   */
  readonly reactors = this.registry.reactors;
  /**
   * グローバルのタイムスケール（撃破スローなど）。メインループが `current` を実時間へ掛ける。
   * シミュレーションはスロー中もフレーム単位で決定的（`timeScale.ts`）。
   */
  readonly timeScale = new TimeScale();
  /** ボスの ID（ボスの攻撃・撃破でヒットストップ / スローの長さが変わる）。`registerCombatant` が足す。 */
  readonly bossIds = this.registry.bossIds;
  /** イベントマーカーの発火回数（E2E・デバッグ用）。 */
  readonly markerCounts = Object.fromEntries(MARKER_TYPES.map((t) => [t, 0])) as Record<
    MarkerType,
    number
  >;
  /** 足音の地面の種類（#24 のレベルが場所ごとの種類を返すよう差し替える）。 */
  footstepSurface: (x: number, z: number, y?: number) => FootstepSurface = () => 'grass';
  /** 直近ステップのロックオンイベント（デバッグ・E2E 用）。 */
  lastLockOnEvent: LockOnEvent = 'none';

  /** 地形の高さ（足元の y の基準）。 */
  readonly heightAt: (x: number, z: number) => number;
  private input: InputReader;
  private pendingLockEvent: LockOnEvent | null = null;
  private readonly staticWorld: StaticWorld;
  private readonly roster: EnemyRoster;
  private readonly cameraCollision: CameraCollision;
  private readonly spawnPosition = new Vector3();
  private readonly spawnYaw: number;
  private readonly cameraForwardScratch = new Vector3();
  /** 登録式のシステム（`systems.ts`）。コンストラクタの最後に生成する。 */
  private systems: readonly GameSystem[] = [];

  private constructor(
    private readonly physics: Physics,
    options: GameOptions,
  ) {
    this.input = options.input ?? NULL_INPUT;
    this.save = options.save ?? new SaveStore(null);
    this.interactableSpawns = options.interactables ?? [];

    // 地形・足場 → テストシーンのダミー（コライダーの生成順を変えない）
    this.staticWorld = new StaticWorld(physics, options.terrain, options.boxes ?? PLAYGROUND_BOXES);
    const heightAt = options.terrainHeight ?? (() => 0);
    this.heightAt = heightAt;
    this.dummies = spawnDummies(options.dummies ?? DUMMIES, {
      physics,
      combat: this.combat,
      reactors: this.registry,
      tuning: this.tuning,
      lockOnTargets: this.lockOnTargets,
      heightAt,
    });

    const spawn = options.spawn ?? PLAYER_SPAWN;
    this.spawnYaw = spawn.yaw;
    this.spawnPosition.set(spawn.x, heightAt(spawn.x, spawn.z) + 0.02, spawn.z);

    // 地形・足場を問い合わせパイプラインへ反映してからプレイヤーを置く
    physics.step(1 / 60);
    this.player = new Player(
      physics,
      this.spawnPosition,
      this.spawnYaw,
      this.playerTarget.health,
      this.tuning,
    );
    this.cameraCollision = this.staticWorld.createCameraCollision(this.player.rigidBody);
    this.camera.reset(this.player.feet, this.spawnYaw);
    this.combat.addTarget(this.playerTarget);
    // ガード判定（構え完了・正面 120°・ジャストガード）はプレイヤーが決める（#53）
    this.playerTarget.guard = (query) => this.player.guardOutcome(query);
    this.syncPlayerTarget();
    this.registerFreezable('player', {
      freeze: (frames) => {
        this.player.hitStop(frames);
      },
    });

    // 敵（亡者兵など）。地形が問い合わせパイプラインへ反映された後に置く
    this.roster = new EnemyRoster(
      {
        physics,
        combat: this.combat,
        reactors: this.registry,
        attackTokens: this.attackTokens,
        tuning: this.tuning,
        events: this.events,
        lockOnTargets: this.lockOnTargets,
        heightAt,
        hasLineOfSight: (from, to) => this.staticWorld.hasLineOfSight(from, to),
        footstepSurface: (x, z, y) => this.footstepSurface(x, z, y),
        ...(options.enemyNavigator && { navigator: options.enemyNavigator }),
        ...(options.enemyDarkness && { darkness: options.enemyDarkness }),
        ...(options.hearingScale && { hearingScale: options.hearingScale }),
      },
      options.enemies ?? [],
    );
    this.enemies = this.roster.manager;
    const hitContext: HitContext = {
      player: this.player,
      registry: this.registry,
      roster: this.roster,
      events: this.events,
      timeScale: this.timeScale,
      tuning: this.tuning,
      systems: () => this.systems,
    };
    this.combat.onHit((e) => {
      handleHit(hitContext, e);
    });
    // 戦闘音（命中・ガード）は敵に聞こえる
    this.events.on('impact', (e) => {
      this.enemies.noises.emit(e.position, 'combat');
    });
    this.systems = createGameSystems(this);
  }

  static async create(options: GameOptions = {}): Promise<Game> {
    return new Game(await createPhysics(), options);
  }

  /** 最新ステップの入力スナップショット（登録式のシステムが「調べる」などのボタンを読む）。 */
  get inputSnapshot(): InputSnapshot {
    return this.input.snapshot;
  }

  /**
   * 全敵を出発地点へ戻して復活させる（篝火の休憩・死亡後のリスポーン。通常敵の復活）。倒れていた敵は被弾側・強靭度を
   * 登録し直す。ボスは敵とは別（`rest` イベントを購読して自分で戻る）。
   */
  respawnEnemies(): void {
    this.roster.respawnAll();
  }

  /** 入力を差し替える。 */
  setInput(input: InputReader): void {
    this.input = input;
  }

  /** 指定した対象を直接ロックオンする（次のステップでカメラが追従する。デバッグ・演出用）。 */
  lockOnTo(id: string): boolean {
    const target = this.lockOnTargets.find((t) => t.id === id);
    if (!target) return false;
    this.pendingLockEvent = this.lockOn.lock(target);
    return true;
  }

  /** 静的な箱（門など。id は `BoxSpec.id`）の衝突を有効 / 無効にする。該当する id がなければ false。 */
  setBoxEnabled(id: string, enabled: boolean): boolean {
    if (!this.staticWorld.setBoxEnabled(id, enabled)) return false;
    this.enemies.navigator.setGateClosed?.(id, enabled); // 敵の経路も門の開閉に合わせる
    return true;
  }

  /** 静的な円柱の衝突（柱・大岩など）を追加する。 */
  addStaticCylinders(cylinders: readonly StaticCylinderSpec[]): void {
    this.staticWorld.addStaticCylinders(cylinders);
  }

  /** 固定タイムステップで 1 ステップ進める。 */
  update(dt: number): void {
    this.timeScale.step();
    const snap = this.input.snapshot;
    const { camera, player } = this;

    // 1. ロックオン（カメラは前ステップの姿勢で判定する）
    this.cameraForwardScratch.copy(camera.forward);
    const switchDir = resolveSwitch(snap, this.lockOn, this.tuning);
    const lockEvent = this.lockOn.update({
      toggle: snap.buttons.lockOn.pressed,
      switchDir,
      targets: this.lockOnTargets,
      playerPosition: player.feet,
      camera: { position: camera.position, forward: this.cameraForwardScratch },
      isVisible: (from, to) => this.staticWorld.hasLineOfSight(from, to),
    });
    this.lastLockOnEvent = this.pendingLockEvent ?? lockEvent;
    this.pendingLockEvent = null;

    // 2. カメラの向き（このステップの回転入力を、移動の基準方向に反映する）
    const cameraInput = () =>
      cameraFrameInput(snap, player, this.lockOn, this.lastLockOnEvent, this.tuning);
    camera.updateAim(dt, cameraInput());

    // 3. プレイヤー → 物理 → カメラの位置
    player.update(dt, {
      input: this.input,
      cameraYaw: camera.yaw,
      lockTarget: this.lockOn.target,
    });
    for (const e of player.events) {
      publishPlayerEvent(this.events, e, player.feet, this.playerTarget.health.current);
      if (e.type === 'land' && e.fallHeight >= LAND_NOISE_MIN_HEIGHT) {
        this.enemies.noises.emit(player.feet, 'land');
      }
    }
    // 敵の判定（このステップの攻撃）がこのステップのプレイヤーの位置・無敵を見るよう、先に被弾側を更新する
    this.syncPlayerTarget();
    this.roster.update(dt, player);
    for (const m of player.markerEvents) {
      publishMarker(this.events, this.markerCounts, this.footstepSurface, 'player', m, player.feet);
    }
    this.syncPlayerTarget();
    this.registry.step();
    this.attackDriver.update(player);
    // 攻撃側（プレイヤー）が凍結中は、仮の攻撃のフレームも進めない
    if (!player.fsm.isFrozenStep) this.debugSwing.update(player.feet, player.yaw);
    for (const system of this.systems) system.update?.(dt);
    this.combat.step();
    this.physics.step(dt);
    camera.updatePlacement(dt, cameraInput(), this.cameraCollision);
  }

  /** 音を発生させる（敵に聞こえる）。鐘・壁の崩壊・回復瓶など、game 内外の音源から呼ぶ。 */
  emitNoise(position: { x: number; y: number; z: number }, kind: NoiseKind): void {
    this.enemies.noises.emit(position, kind);
  }

  /**
   * 半径を指定して音を出す（`emitSound` Effect の受け口。鐘 15m・壁の崩壊 12m など）。敵はこの音を聞いて
   * 気付きゲージが溜まり、Idle なら Suspicious になって音の位置（ナビメッシュ上の最寄り点）へ歩く。
   * `kind: 'bell'` は歩く距離が最大 15m になる。反響ゾーンの倍率は半径へ自動で掛かる。
   */
  emitSound(
    position: { x: number; y: number; z: number },
    radiusM: number,
    kind: 'bell' | 'crash',
  ): void {
    this.enemies.noises.emitRadius(
      position,
      radiusM,
      undefined,
      kind === 'bell' ? 'bell' : 'wallCollapse',
    );
  }

  /**
   * 敵などの被弾側を登録する。`reactor` は命中時の強靭度・押し戻しの計算に使い、毎ステップ `step` する。
   * `target` は崩し中の被ダメージ 1.5 倍を反映する `UprightTarget`（`HitResolver` に登録済みのもの）。
   */
  addReactor(id: string, reactor: HitReactor, target?: UprightTarget): void {
    this.registry.add(id, reactor, target);
  }

  removeReactor(id: string): void {
    this.registry.remove(id);
  }

  /** ヒットストップの凍結口を登録する（敵・ボス。`CharacterFsm` はそのまま渡せる）。 */
  registerFreezable(id: string, target: Freezable): void {
    this.registry.registerFreezable(id, target);
  }

  unregisterFreezable(id: string): void {
    this.registry.unregisterFreezable(id);
  }

  /** 登録式のシステムが持つ敵（ボスなど）をまとめて登録する（`combat/combatant.ts`）。戻り値で登録を解く。 */
  registerCombatant(combatant: Combatant): () => void {
    return registerCombatant(combatant, this.combat, this.registry, this.lockOnTargets);
  }

  /** ハートボックスをプレイヤーの現在位置へ置き、無敵状態を反映する。 */
  private syncPlayerTarget(): void {
    const { player, playerTarget } = this;
    playerTarget.place(player.feet.x, player.feet.y, player.feet.z, player.yaw);
    playerTarget.invulnerable = player.invulnerable;
    // ガード崩し中は被ダメージ 1.5 倍（2.3 節）
    playerTarget.staggered = player.guardBroken;
  }

  /** プレイヤーを任意の位置へ移す（デバッグ・E2E）。カメラはプレイヤーの背後へ即座に置く。 */
  teleportPlayer(x: number, z: number, yaw: number, y = this.heightAt(x, z) + 0.02): void {
    this.player.teleport(new Vector3(x, y, z), yaw);
    this.camera.reset(this.player.feet, yaw);
  }

  /** デバッグ・E2E 用: 敵の攻撃を 1 発、プレイヤーへ当てる（`gameDebug.ts` の `debugHitPlayer`）。 */
  debugHitPlayer(options: DebugHitOptions = {}): HitEvent[] {
    return debugHitPlayer(this, options);
  }

  /** プレイヤーを初期位置へ戻す（デバッグ・リスポーン）。 */
  respawn(): void {
    this.playerTarget.health.refill();
    this.player.teleport(this.spawnPosition, this.spawnYaw);
    this.camera.reset(this.player.feet, this.spawnYaw);
    this.lockOn.release('external');
    // 死亡・篝火では回復瓶を最大数まで補充する（2.1 節）
    this.player.flask.refill();
  }

  /** E2E / デバッグ用の状態。 */
  get debugState(): GameDebugState {
    return buildDebugState(this);
  }
}

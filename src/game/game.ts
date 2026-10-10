import { EventBus, type FootstepSurface, type GameEventMap } from '../core/gameEvents';
import { MARKER_TYPES, type MarkerType } from './anim/eventMarkers';
import type { AnimMarkerEvent } from './anim/markerDispatcher';
import { Euler, Quaternion, Vector3 } from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { InputReader, InputSnapshot } from '../core/input';
import { ThirdPersonCamera, type CameraCollision } from './camera/thirdPersonCamera';
import { LockOnController, type LockOnEvent } from './lockOn/lockOnController';
import { DummyTarget, type LockOnTarget } from './lockOn/targets';
import { ENEMY_STATS, LAND_NOISE_MIN_HEIGHT, UNDEAD_ATTACK_RULES, type NoiseKind } from './data';
import { RapierEnemyBody } from './enemy/enemyBody';
import { AttackTokens } from './enemy/attackRunner';
import { createUndeadAttack } from './enemy/undeadAttack';
import { EnemyManager } from './enemy/enemyManager';
import { NO_ATTACK, type Enemy, type EnemyDebugInfo } from './enemy/enemy';
import { directNavigator, type Navigator } from './enemy/navigation';
import { motionNoise, playerMotion } from './enemy/perception';
import { createPhysics, type Physics } from './physics';
import { Player, type PlayerEvent } from './player/player';
import {
  DebugSwing,
  decideHitStop,
  type Freezable,
  HOLLOW_SOLDIER_REACTOR,
  SHIELDBEARER_REACTOR,
  HitReactor,
  HitResolver,
  PlayerAttackDriver,
  PLAYER_HEARTBOXES,
  UprightTarget,
  uprightHeartbox,
  type HitEvent,
  type HitReaction,
} from './combat';
import { PLAYER_STATS } from './data';
import { TimeScale } from './timeScale';
import { tuning } from './tuning';
import {
  CAMERA_QUERY_GROUPS,
  SIGHT_QUERY_GROUPS,
  TARGET_GROUPS,
  WORLD_GROUPS,
} from './world/groups';
import type { EnemySpawn } from './world/level';
import {
  DUMMIES,
  PLAYER_SPAWN,
  PLAYGROUND_BOXES,
  type BoxSpec,
  type DummySpec,
} from './world/playground';

/** 何も入力しない InputReader（入力システムなしで Game を作るテスト・起動時用）。 */
export const NULL_INPUT: InputReader = (() => {
  const idle = { pressed: false, held: false, released: false };
  const snapshot: InputSnapshot = {
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    sprint: false,
    targetSwitch: 0,
    buttons: {
      lightAttack: idle,
      heavyAttack: idle,
      dodge: idle,
      guard: idle,
      lockOn: idle,
      item: idle,
      interact: idle,
    },
    device: 'kbm',
  };
  return {
    snapshot,
    consumeBuffered: () => false,
    hasBuffered: () => false,
    clearBuffer: () => undefined,
  };
})();

/** 地形の衝突メッシュ（描画と同じ頂点から作ると見た目と当たりが一致する）。 */
export interface TerrainCollisionMesh {
  readonly vertices: Float32Array;
  readonly indices: Uint32Array;
}

export interface GameOptions {
  /** ゲームロジックが読む入力。省略時は何も入力されない。 */
  readonly input?: InputReader;
  /** 地形の衝突メッシュ。省略時は y=0 の平らな地面（半径 100m）。 */
  readonly terrain?: TerrainCollisionMesh;
  /** 地形の高さ関数（ダミーの接地位置に使う）。省略時は 0。 */
  readonly terrainHeight?: (x: number, z: number) => number;
  /** 静的な箱（壁・段差など）。省略時はテストシーンの足場。レベルデータ（`world/level.ts`）はここへ渡す。 */
  readonly boxes?: readonly BoxSpec[];
  /** ロックオン用のダミー。省略時はテストシーンのダミー（レベルでは空配列を渡す）。 */
  readonly dummies?: readonly DummySpec[];
  /** 敵の配置（レベルデータの `enemies`）。省略時は敵なし。 */
  readonly enemies?: readonly EnemySpawn[];
  /** 敵の経路問い合わせ。省略時は直線。レベルでは `levelGameOptions` が格子ナビゲータを渡す。 */
  readonly enemyNavigator?: Navigator;
  /** プレイヤーの開始位置と向き（ヨー）。省略時はテストシーンの広場。 */
  readonly spawn?: { readonly x: number; readonly z: number; readonly yaw: number };
}

/** 静的な円柱（柱・岩など）の衝突。`y` は底面の高さ。 */
export interface StaticCylinderSpec {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
  /** XYZ オイラー角（ラジアン）。指定すると倒れた柱として扱い、`y` は中心の高さになる。 */
  readonly euler?: readonly [number, number, number];
}

const HIT_LOG_MAX = 32;
const GROUND_FALLBACK_HALF = 100;
/** テストシーンのダミーの HP（判定の確認用。実質壊れない）。 */
const DUMMY_HP = 99999;
const TMP_QUAT = new Quaternion();
const EULER_X = new Vector3(1, 0, 0);
const EULER_Y = new Vector3(0, 1, 0);

/**
 * ゲームのシミュレーション状態（60Hz 固定ステップ）。描画（three）には依存せず、
 * 描画側は `player.transform` / `camera.transform` 等の補間用 Transform を読み取るだけにする。
 *
 * 1 ステップの順序: ロックオン → カメラの向き → プレイヤー → 物理 → カメラの位置（衝突）。
 */
export class Game {
  /** game が発行するイベント（音など）。audio 層が購読する。game は Web Audio に依存しない。 */
  readonly events = new EventBus<GameEventMap>();

  readonly player: Player;
  /** 雑魚敵（生成・AI・音の受け口）。敵は `lockOnTargets` にも登録される。 */
  readonly enemies: EnemyManager;
  /** 攻撃トークン（同時に攻撃できる敵の数。5.1 節）。 */
  readonly attackTokens = new AttackTokens();
  readonly camera = new ThirdPersonCamera();
  readonly lockOn = new LockOnController();
  /** ロックオン対象。敵（#40 以降）は `LockOnTarget` を実装してここへ追加する。 */
  readonly lockOnTargets: LockOnTarget[] = [];
  /** テストシーンのダミー（描画用に別持ち）。 */
  readonly dummies: DummyTarget[] = [];
  /** 判定・ダメージ解決（#40）。攻撃側は `combat.startAttack` / `resolve`、被弾側は `combat.addTarget`。 */
  readonly combat = new HitResolver({
    isBlocked: (from, to) => this.isBlockedByWorld(from, to),
  });
  /** プレイヤーの被弾側（ハートボックス・HP・無敵）。 */
  readonly playerTarget = new UprightTarget('player', 'player', PLAYER_STATS.hp, PLAYER_HEARTBOXES);
  /** ?debug 用の仮の攻撃（判定と可視化の動作確認。実際の攻撃動作は #46）。 */
  readonly debugSwing = new DebugSwing(this.combat);
  /** プレイヤーの攻撃動作（軽攻撃 3 段）と判定のつなぎ。 */
  readonly attackDriver = new PlayerAttackDriver(this.combat);
  /**
   * プレイヤー以外の被弾側の強靭度・押し戻し（`HitReactor`）。テストシーンのダミーは亡者兵相当（強靭度 50）。
   * 敵（#42 以降）は自分の `HitReactor` を作って `addReactor` し、命中時の反応を自分の状態機械へ反映する。
   */
  readonly reactors = new Map<string, HitReactor>();
  /**
   * グローバルのタイムスケール（撃破スローなど）。メインループが `current` を実時間へ掛ける。
   * シミュレーションはスロー中もフレーム単位で決定的（`timeScale.ts`）。
   */
  readonly timeScale = new TimeScale();
  /** ボスの ID（ボスの攻撃・撃破でヒットストップ / スローの長さが変わる）。ボス（E5）が自分の ID を足す。 */
  readonly bossIds = new Set<string>();
  /** ヒットストップの累計回数と直近の凍結フレーム数（デバッグ・E2E 用）。 */
  hitStopCount = 0;
  lastHitStopFrames = 0;
  /** 命中イベントの累計（デバッグ・E2E 用）と直近のイベント。 */
  readonly hitLog: HitEvent[] = [];
  hitCount = 0;
  /** プレイヤーイベント（ロール開始など）の累計回数（デバッグ・E2E 用）。 */
  readonly eventCounts = {
    rollStart: 0,
    backstepStart: 0,
    healStart: 0,
    healApply: 0,
    healEmpty: 0,
    attackStart: 0,
    land: 0,
    staminaEmpty: 0,
  };
  /** イベントマーカーの発火回数（E2E・デバッグ用）。 */
  readonly markerCounts = Object.fromEntries(MARKER_TYPES.map((t) => [t, 0])) as Record<
    MarkerType,
    number
  >;
  /** 足音の地面の種類（#24 のレベルが場所ごとの種類を返すよう差し替える）。 */
  footstepSurface: (x: number, z: number) => FootstepSurface = () => 'grass';
  /** 直近ステップのロックオンイベント（デバッグ・E2E 用）。 */
  lastLockOnEvent: LockOnEvent = 'none';

  /** 強靭度崩し中の 1.5 倍を反映する対象（`reactors` と同じ ID）。 */
  private readonly reactiveTargets = new Map<string, UprightTarget>();
  private readonly dummyReactorIds = new Set<string>();
  /** 敵 AI 本体とその被弾側（ハートボックス）の対応（id → 敵）。被弾リアクションを敵の状態へ反映するのに使う。 */
  private readonly enemyHearts = new Map<string, { enemy: Enemy; heart: UprightTarget }>();
  private readonly slideScratch = { x: 0, z: 0 };
  /** プレイヤーのロール中・ロール終了からの経過ステップ（敵の攻撃選択が「ロール直後」を見る）。 */
  private stepsSinceRoll = Number.POSITIVE_INFINITY;
  /** ヒットストップで凍結するもの（ID → 凍結口）。プレイヤー・登録済みの被弾リアクタは自動、敵は自分で `registerFreezable`。 */
  private readonly freezables = new Map<string, Freezable[]>();
  private input: InputReader;
  private pendingLockEvent: LockOnEvent | null = null;
  private readonly cameraCollision: CameraCollision;
  private readonly spawnPosition = new Vector3();
  private readonly spawnYaw: number;
  private readonly heightAt: (x: number, z: number) => number;
  private readonly cameraForwardScratch = new Vector3();
  private readonly boxColliders = new Map<string, RAPIER.Collider>();

  private constructor(
    private readonly physics: Physics,
    options: GameOptions,
  ) {
    this.input = options.input ?? NULL_INPUT;
    const { rapier, world } = physics;

    // 地形
    if (options.terrain) {
      world.createCollider(
        rapier.ColliderDesc.trimesh(
          options.terrain.vertices,
          options.terrain.indices,
        ).setCollisionGroups(WORLD_GROUPS),
      );
    } else {
      world.createCollider(
        rapier.ColliderDesc.cuboid(GROUND_FALLBACK_HALF, 0.5, GROUND_FALLBACK_HALF)
          .setTranslation(0, -0.5, 0)
          .setCollisionGroups(WORLD_GROUPS),
      );
    }

    // テストシーンの足場とダミー
    for (const b of options.boxes ?? PLAYGROUND_BOXES) {
      const q = TMP_QUAT.setFromAxisAngle(EULER_Y, ((b.yawDeg ?? 0) * Math.PI) / 180);
      const qx = new Quaternion().setFromAxisAngle(EULER_X, ((b.pitchDeg ?? 0) * Math.PI) / 180);
      q.multiply(qx);
      const collider = world.createCollider(
        rapier.ColliderDesc.cuboid(b.hx, b.hy, b.hz)
          .setTranslation(b.x, b.y, b.z)
          .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
          .setCollisionGroups(WORLD_GROUPS),
      );
      if (b.enabled === false) collider.setEnabled(false);
      this.boxColliders.set(b.id, collider);
    }
    const heightAt = options.terrainHeight ?? (() => 0);
    this.heightAt = heightAt;
    for (const d of options.dummies ?? DUMMIES) {
      const y = heightAt(d.x, d.z);
      const target = new DummyTarget(d.id, d.x, y, d.z, d.height, d.radius);
      this.dummies.push(target);
      this.lockOnTargets.push(target);
      const heart = new UprightTarget(d.id, 'enemy', DUMMY_HP, [
        uprightHeartbox(d.radius, d.height),
      ]);
      heart.place(d.x, y, d.z, 0);
      this.combat.addTarget(heart);
      const reactor = new HitReactor(HOLLOW_SOLDIER_REACTOR);
      this.reactors.set(d.id, reactor);
      this.registerFreezable(d.id, reactor);
      this.reactiveTargets.set(d.id, heart);
      this.dummyReactorIds.add(d.id);
      world.createCollider(
        rapier.ColliderDesc.cylinder(d.height / 2, d.radius)
          .setTranslation(d.x, y + d.height / 2, d.z)
          .setCollisionGroups(TARGET_GROUPS),
      );
    }

    const spawn = options.spawn ?? PLAYER_SPAWN;
    this.spawnYaw = spawn.yaw;
    this.spawnPosition.set(spawn.x, heightAt(spawn.x, spawn.z) + 0.02, spawn.z);

    // 地形・足場を問い合わせパイプラインへ反映してからプレイヤーを置く
    physics.step(1 / 60);
    this.player = new Player(physics, this.spawnPosition, this.spawnYaw, this.playerTarget.health);
    this.cameraCollision = this.createCameraCollision(rapier);
    this.camera.reset(this.player.feet, this.spawnYaw);
    this.combat.addTarget(this.playerTarget);
    this.syncPlayerTarget();
    this.registerFreezable('player', {
      freeze: (frames) => {
        this.player.hitStop(frames);
      },
    });
    this.combat.onHit((e) => {
      this.hitCount++;
      this.hitLog.push(e);
      if (this.hitLog.length > HIT_LOG_MAX) this.hitLog.shift();
      const reaction = this.applyReaction(e);
      if (reaction) this.reactEnemy(e.targetId, reaction, e);
      if (e.targetId === 'player' && e.killed) this.player.die();
      this.applyHitStop(e);
      this.events.emit('hit', {
        kind: e.kind,
        source: e.attackerId === 'player' ? 'player' : 'enemy',
        position: e.position,
      });
    });

    // 敵（亡者兵など）。地形が問い合わせパイプラインへ反映された後に置く
    this.enemies = new EnemyManager({
      lineOfSight: (from, to) => this.hasLineOfSight(from as Vector3, to as Vector3),
      navigator: options.enemyNavigator ?? directNavigator,
      // 亡者兵の攻撃（A1〜A3）。盾持ちの攻撃は別チケット（それまでは攻撃しない）
      createAttack: (init, random) =>
        init.type === 'undead_soldier'
          ? createUndeadAttack({
              combat: this.combat,
              tokens: this.attackTokens,
              random,
              poiseOf: (id) => this.reactors.get(id)?.poise,
            })
          : NO_ATTACK,
      createBody: (init) => {
        const stats = ENEMY_STATS[init.type];
        return new RapierEnemyBody(
          physics,
          init.x,
          heightAt(init.x, init.z) + 0.02,
          init.z,
          stats.height,
          stats.radius,
        );
      },
    });
    for (const spawnPoint of options.enemies ?? []) {
      this.registerEnemy(this.enemies.spawn(spawnPoint));
    }
    // 戦闘音（命中・ガード）は敵に聞こえる
    this.events.on('hit', (e) => {
      if (e.position) this.enemies.noises.emit(e.position, 'combat');
    });
  }

  /** 敵をロックオン対象・被弾側（ハートボックスと強靭度）として登録する。 */
  private registerEnemy(enemy: Enemy): void {
    this.lockOnTargets.push(enemy);
    const stats = ENEMY_STATS[enemy.type];
    const heart = new UprightTarget(enemy.id, 'enemy', enemy.maxHp, [
      uprightHeartbox(stats.radius, stats.height),
    ]);
    heart.place(enemy.position.x, enemy.position.y, enemy.position.z, enemy.yaw);
    this.combat.addTarget(heart);
    const profile = enemy.type === 'undead_shield' ? SHIELDBEARER_REACTOR : HOLLOW_SOLDIER_REACTOR;
    this.addReactor(enemy.id, new HitReactor(profile), heart);
    // ヒットストップ（攻撃側・被弾側）で状態フレーム・移動を凍結する（Enemy.update が先頭で consumeFreeze する）
    this.registerFreezable(enemy.id, enemy.fsm);
    this.enemyHearts.set(enemy.id, { enemy, heart });
  }

  /** 命中の結果を敵 AI へ反映する: HP、気付き（被弾で Alert）、崩しの行動不能、死亡。 */
  private reactEnemy(id: string, reaction: HitReaction, e: HitEvent): void {
    const entry = this.enemyHearts.get(id);
    if (!entry) return;
    const { enemy, heart } = entry;
    enemy.hp = heart.health.current;
    if (heart.health.dead) {
      enemy.kill();
      this.combat.removeTarget(id);
      this.removeReactor(id);
      this.enemyHearts.delete(id);
      return;
    }
    enemy.provoke(e.attackerPosition.x, e.attackerPosition.z);
    if (reaction.blocksAction) enemy.stagger(reaction.frames);
  }

  /** 敵のハートボックスを現在位置へ追従させ、押し戻しの変位を敵の体へ足す。 */
  private syncEnemyHearts(): void {
    for (const { enemy, heart } of this.enemyHearts.values()) {
      if (!enemy.alive) continue;
      heart.place(enemy.position.x, enemy.position.y, enemy.position.z, enemy.yaw);
      enemy.hp = heart.health.current;
    }
  }

  static async create(options: GameOptions = {}): Promise<Game> {
    return new Game(await createPhysics(), options);
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
    const collider = this.boxColliders.get(id);
    if (!collider) return false;
    collider.setEnabled(enabled);
    this.enemies.navigator.setGateClosed?.(id, enabled); // 敵の経路も門の開閉に合わせる
    return true;
  }

  /** 静的な円柱の衝突（柱・大岩など）を追加する。 */
  addStaticCylinders(cylinders: readonly StaticCylinderSpec[]): void {
    const { rapier, world } = this.physics;
    for (const c of cylinders) {
      const desc = rapier.ColliderDesc.cylinder(c.height / 2, c.radius).setCollisionGroups(
        WORLD_GROUPS,
      );
      if (c.euler) {
        const q = new Quaternion().setFromEuler(new Euler(c.euler[0], c.euler[1], c.euler[2]));
        desc.setTranslation(c.x, c.y, c.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      } else {
        desc.setTranslation(c.x, c.y + c.height / 2, c.z);
      }
      world.createCollider(desc);
    }
  }

  /** 固定タイムステップで 1 ステップ進める。 */
  update(dt: number): void {
    this.timeScale.step();
    const snap = this.input.snapshot;
    const { camera, player } = this;

    // 1. ロックオン（カメラは前ステップの姿勢で判定する）
    this.cameraForwardScratch.copy(camera.forward);
    const switchDir = this.resolveSwitch(snap);
    const lockEvent = this.lockOn.update({
      toggle: snap.buttons.lockOn.pressed,
      switchDir,
      targets: this.lockOnTargets,
      playerPosition: player.feet,
      camera: { position: camera.position, forward: this.cameraForwardScratch },
      isVisible: (from, to) => this.hasLineOfSight(from, to),
    });
    this.lastLockOnEvent = this.pendingLockEvent ?? lockEvent;
    this.pendingLockEvent = null;

    // 2. カメラの向き（このステップの回転入力を、移動の基準方向に反映する）
    const cameraInput = () => ({
      look: snap.look,
      playerPosition: player.feet,
      playerYaw: player.yaw,
      moveInput: snap.move,
      running:
        player.state === 'dash' ||
        (player.state === 'move' && player.speed > tuning.player.walk + 0.5),
      lockTarget: this.lockOn.target,
      lockEvent: this.lastLockOnEvent,
      device: snap.device,
    });
    camera.updateAim(dt, cameraInput());

    // 3. プレイヤー → 物理 → カメラの位置
    player.update(dt, {
      input: this.input,
      cameraYaw: camera.yaw,
      lockTarget: this.lockOn.target,
    });
    for (const e of player.events) {
      this.eventCounts[e.type]++;
      this.publishPlayerEvent(e);
      if (e.type === 'land' && e.fallHeight >= LAND_NOISE_MIN_HEIGHT) {
        this.enemies.noises.emit(player.feet, 'land');
      }
    }
    // 敵の判定（このステップの攻撃）がこのステップのプレイヤーの位置・無敵を見るよう、先に被弾側を更新する
    this.syncPlayerTarget();
    this.updateEnemies(dt);
    for (const m of player.markerEvents) this.publishMarker('player', m, player.feet);
    this.syncPlayerTarget();
    this.stepReactors();
    this.attackDriver.update(player);
    // 攻撃側（プレイヤー）が凍結中は、仮の攻撃のフレームも進めない
    if (!player.fsm.isFrozenStep) this.debugSwing.update(player.feet, player.yaw);
    this.combat.step();
    this.physics.step(dt);
    camera.updatePlacement(dt, cameraInput(), this.cameraCollision);
  }

  /**
   * 敵を 1 ステップ進める。プレイヤーの足音（歩き・走り・ダッシュ/ロール）をこのステップ分の音として出し、
   * 敵はそれと視覚から気付く。
   */
  private updateEnemies(dt: number): void {
    if (this.enemies.enemies.length === 0) return;
    const { player } = this;
    const motion = playerMotion(player.state, player.speed);
    const kind = motionNoise(motion);
    if (kind) this.enemies.noises.emit(player.feet, kind, { duration: dt });
    // ロール中とロール終了から 20F 以内は「ロール直後」（ロール連打を咎める攻撃選択の入力）
    this.stepsSinceRoll = player.state === 'roll' ? 0 : this.stepsSinceRoll + 1;
    this.enemies.update(dt, {
      position: player.feet,
      motion,
      recentRoll: this.stepsSinceRoll <= UNDEAD_ATTACK_RULES.rollPunishFrames,
    });
    this.syncEnemyHearts();
    this.publishEnemyFootsteps();
  }

  /** 敵の足音（位置つき）をイベントバスへ流す。 */
  private publishEnemyFootsteps(): void {
    for (const enemy of this.enemies.enemies) {
      for (const m of enemy.markerEvents) {
        if (m.type !== 'footstep') continue;
        const f = enemy.position;
        this.events.emit('footstep', {
          surface: this.footstepSurface(f.x, f.z),
          gait: m.gait ?? 'run',
          source: 'enemy',
          position: { x: f.x, y: f.y, z: f.z },
        });
      }
    }
  }

  /** 音を発生させる（敵に聞こえる）。鐘・壁の崩壊・回復瓶など、game 内外の音源から呼ぶ。 */
  emitNoise(position: { x: number; y: number; z: number }, kind: NoiseKind): void {
    this.enemies.noises.emit(position, kind);
  }

  /**
   * 敵などの被弾側を登録する。`reactor` は命中時の強靭度・押し戻しの計算に使い、毎ステップ `step` する。
   * `target` は崩し中の被ダメージ 1.5 倍を反映する `UprightTarget`（`HitResolver` に登録済みのもの）。
   */
  addReactor(id: string, reactor: HitReactor, target?: UprightTarget): void {
    this.reactors.set(id, reactor);
    this.registerFreezable(id, reactor);
    if (target) this.reactiveTargets.set(id, target);
  }

  removeReactor(id: string): void {
    this.reactors.delete(id);
    this.freezables.delete(id);
    this.reactiveTargets.delete(id);
    this.dummyReactorIds.delete(id);
  }

  /**
   * 登録済みの反応体を 1 ステップ進める（強靭度の回復・崩しの残り・被弾後無敵）。ダミーは押し戻しを受けないので
   * 変位を捨てる（敵は自分で `reactor.consumeSlide` を呼んで移動に足す）。
   */
  private stepReactors(): void {
    for (const [id, reactor] of this.reactors) {
      // ヒットストップ中は強靭度の回復・崩しの残り・被弾後無敵・押し戻しも止める
      if (reactor.consumeFreeze()) continue;
      reactor.step();
      if (this.dummyReactorIds.has(id)) reactor.consumeSlide(this.slideScratch);
      const enemyEntry = this.enemyHearts.get(id);
      if (enemyEntry) {
        // 被弾の押し戻しは敵の次の移動に足す（壁・地形には体が従う）
        reactor.consumeSlide(this.slideScratch);
        if (this.slideScratch.x !== 0 || this.slideScratch.z !== 0) {
          enemyEntry.enemy.pushBy(this.slideScratch.x, this.slideScratch.z);
        }
      }
      const target = this.reactiveTargets.get(id);
      if (target) target.staggered = reactor.staggered;
    }
  }

  /** 命中を被弾側の強靭度・押し戻し・仰け反りへ反映し、`hitReaction` を発行する。 */
  private applyReaction(e: HitEvent): HitReaction | undefined {
    const id = e.targetId;
    // 押し戻しの向き: 攻撃側の原点 → 命中位置
    const dx = e.position.x - e.attackerPosition.x;
    const dz = e.position.z - e.attackerPosition.z;
    let reaction: HitReaction;
    if (id === 'player') {
      reaction = this.player.receiveHit(e, dx, dz);
    } else {
      const reactor = this.reactors.get(id);
      if (!reactor) return undefined;
      reaction = reactor.react(e, dx, dz);
      const target = this.reactiveTargets.get(id);
      if (target) target.staggered = reactor.staggered;
    }
    this.events.emit('hitReaction', { targetId: id, ...reaction });
    return reaction;
  }

  /** ヒットストップの凍結口を登録する（敵・ボス。`CharacterFsm` はそのまま渡せる）。 */
  registerFreezable(id: string, target: Freezable): void {
    const list = this.freezables.get(id);
    if (list) list.push(target);
    else this.freezables.set(id, [target]);
  }

  unregisterFreezable(id: string): void {
    this.freezables.delete(id);
  }

  private freeze(id: string, frames: number): void {
    for (const f of this.freezables.get(id) ?? []) f.freeze(frames);
  }

  /**
   * 命中からヒットストップを決め、攻撃側・被弾側を同時に凍結する（4.1 節）。撃破スロー・画面振動も始め、
   * 演出用の `hitStop` イベントを発行する。凍結は次のステップから効く（同じステップの `hit` SE は 0F 遅延）。
   */
  private applyHitStop(e: HitEvent): void {
    const attackerIsPlayer = e.attackerId === 'player';
    const targetIsPlayer = e.targetId === 'player';
    const decision = decideHitStop(
      {
        event: e,
        attackerIsPlayer,
        targetIsPlayer,
        attackerIsBoss: this.bossIds.has(e.attackerId),
        targetIsBoss: this.bossIds.has(e.targetId),
      },
      tuning.hitStop,
    );
    if (decision.frames > 0) {
      this.freeze(e.attackerId, decision.frames);
      if (e.targetId !== e.attackerId) this.freeze(e.targetId, decision.frames);
      this.hitStopCount++;
    }
    this.lastHitStopFrames = decision.frames;
    if (decision.slowMotion) {
      // ヒットストップが明けてから、シミュレーションの 30F（ボスは 60F）の間スロー
      this.timeScale.start(decision.slowMotion.scale, decision.slowMotion.frames, decision.frames);
    }
    if (decision.shake) this.camera.addShake(decision.shake.amplitudeDeg, decision.shake.frames);

    // 飛び散る向き: 攻撃側 → 被弾側の水平方向 + わずかに上
    let nx = e.position.x - e.attackerPosition.x;
    let nz = e.position.z - e.attackerPosition.z;
    const len = Math.hypot(nx, nz);
    if (len > 1e-6) {
      nx /= len;
      nz /= len;
    } else {
      nx = 0;
      nz = 1;
    }
    const ny = 0.3;
    const nl = Math.hypot(nx, ny, nz);
    this.events.emit('hitStop', {
      attackerId: e.attackerId,
      targetId: e.targetId,
      kind: e.kind,
      frames: decision.frames,
      position: e.position,
      normal: { x: nx / nl, y: ny / nl, z: nz / nl },
      killed: e.killed,
      fromPlayer: attackerIsPlayer,
      toPlayer: targetIsPlayer,
      flash: decision.flash?.kind ?? null,
      flashFrames: decision.flash?.frames ?? 0,
      slowMotion: decision.slowMotion,
    });
  }

  /** 回復瓶のイベントを、音（`sound`）と HUD・パーティクル用の `heal` へ流す。 */
  private publishPlayerEvent(e: PlayerEvent): void {
    const feet = this.player.feet;
    const position = { x: feet.x, y: feet.y, z: feet.z };
    switch (e.type) {
      case 'healStart':
        this.events.emit('sound', { cue: 'sfx.heal-drink', position });
        break;
      case 'healApply':
        this.events.emit('sound', { cue: 'sfx.heal-glow', position });
        this.events.emit('heal', {
          amount: e.amount,
          hp: this.playerTarget.health.current,
          position,
        });
        break;
      default:
        break;
    }
  }

  /** アニメーションのイベントマーカーをイベントバスへ流す。足音は音のイベント（`footstep`）にも変換する。 */
  private publishMarker(owner: string, e: AnimMarkerEvent, feet: Vector3): void {
    this.markerCounts[e.type]++;
    const position = { x: feet.x, y: feet.y, z: feet.z };
    this.events.emit('animMarker', {
      owner,
      marker: e.type,
      actionId: e.actionId,
      frame: e.frame,
      position,
    });
    if (e.type === 'footstep') {
      this.events.emit('footstep', {
        surface: this.footstepSurface(feet.x, feet.z),
        gait: e.gait ?? 'run',
        source: 'player',
        position,
      });
    }
  }

  /** ターゲット切替要求: 入力層のフリック/ホイール/十字キー、またはロックオン中のマウスの急な横移動。 */
  private resolveSwitch(snap: InputSnapshot): -1 | 0 | 1 {
    if (snap.targetSwitch !== 0) return snap.targetSwitch;
    if (this.lockOn.active && Math.abs(snap.look.x) > tuning.lockOn.flickLookThreshold) {
      return snap.look.x > 0 ? 1 : -1;
    }
    return 0;
  }

  /** ハートボックスをプレイヤーの現在位置へ置き、無敵状態を反映する。 */
  private syncPlayerTarget(): void {
    const { player, playerTarget } = this;
    playerTarget.place(player.feet.x, player.feet.y, player.feet.z, player.yaw);
    playerTarget.invulnerable = player.invulnerable;
  }

  /** 攻撃者から命中位置までを地形・静的物が遮っているか（壁越しに当てない）。 */
  private isBlockedByWorld(
    from: { x: number; y: number; z: number },
    to: { x: number; y: number; z: number },
  ): boolean {
    const { rapier, world } = this.physics;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 1e-4) return false;
    const ray = new rapier.Ray(
      { x: from.x, y: from.y, z: from.z },
      { x: dx / dist, y: dy / dist, z: dz / dist },
    );
    const hit = world.castRay(ray, dist, true, undefined, SIGHT_QUERY_GROUPS);
    return hit !== null && hit.timeOfImpact < dist - 0.05;
  }

  /** `from` から `to` への視線が地形・静的物に遮られていないか。 */
  private hasLineOfSight(from: Vector3, to: Vector3): boolean {
    const { rapier, world } = this.physics;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 1e-4) return true;
    const ray = new rapier.Ray(
      { x: from.x, y: from.y, z: from.z },
      { x: dx / dist, y: dy / dist, z: dz / dist },
    );
    const hit = world.castRay(ray, dist, true, undefined, SIGHT_QUERY_GROUPS);
    // 対象の胸元の手前 0.3m までに何かあれば遮蔽
    return hit === null || hit.timeOfImpact > dist - 0.3;
  }

  private createCameraCollision(rapier: Physics['rapier']): CameraCollision {
    const { world } = this.physics;
    const shapes = new Map<number, RAPIER.Ball>();
    const identity = { x: 0, y: 0, z: 0, w: 1 };
    const body = this.player.rigidBody;
    return {
      castSphere(origin, dir, maxDistance, radius) {
        const key = Math.round(radius * 1000);
        let ball = shapes.get(key);
        if (!ball) {
          ball = new rapier.Ball(radius);
          shapes.set(key, ball);
        }
        const hit = world.castShape(
          { x: origin.x, y: origin.y, z: origin.z },
          identity,
          { x: dir.x, y: dir.y, z: dir.z },
          ball,
          0,
          maxDistance,
          true,
          undefined,
          CAMERA_QUERY_GROUPS,
          undefined,
          body,
        );
        return hit ? Math.min(maxDistance, hit.time_of_impact) : maxDistance;
      },
    };
  }

  /** プレイヤーを任意の位置へ移す（デバッグ・E2E）。カメラはプレイヤーの背後へ即座に置く。 */
  teleportPlayer(x: number, z: number, yaw: number, y = this.heightAt(x, z) + 0.02): void {
    this.player.teleport(new Vector3(x, y, z), yaw);
    this.camera.reset(this.player.feet, yaw);
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
    const p = this.player;
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
      },
      camera: {
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z,
        },
        yaw: this.camera.yaw,
        pitch: this.camera.pitch,
        armLength: this.camera.armLength,
        forward: { x: this.camera.forward.x, y: this.camera.forward.y, z: this.camera.forward.z },
        pivot: { x: this.camera.pivot.x, y: this.camera.pivot.y, z: this.camera.pivot.z },
      },
      lockOn: {
        targetId: this.lockOn.target?.id ?? null,
        lastEvent: this.lastLockOnEvent,
      },
      events: { ...this.eventCounts },
      markers: { ...this.markerCounts },
      enemies: this.enemies.debugInfo,
      combat: {
        hits: this.hitCount,
        playerHp: this.playerTarget.health.current,
        playerDead: this.player.dead,
        flask: this.player.flask.count,
        lastHitTarget: this.hitLog.at(-1)?.targetId ?? null,
        hitStops: this.hitStopCount,
        lastHitStopFrames: this.lastHitStopFrames,
        playerFreeze: this.player.fsm.freezeRemaining,
        timeScale: this.timeScale.current,
      },
    };
  }
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
  readonly events: Readonly<
    Record<
      | 'rollStart'
      | 'backstepStart'
      | 'attackStart'
      | 'healStart'
      | 'healApply'
      | 'healEmpty'
      | 'land'
      | 'staminaEmpty',
      number
    >
  >;
  /** イベントマーカーの種別ごとの発火回数。 */
  readonly markers: Readonly<Record<MarkerType, number>>;
  /** 敵の状態（気付きゲージ・見失いなど）。 */
  readonly enemies: readonly EnemyDebugInfo[];
  /** 判定の状態（命中の累計・プレイヤー HP・直近の被弾側）。 */
  readonly combat: {
    readonly hits: number;
    readonly playerHp: number;
    readonly playerDead: boolean;
    readonly flask: number;
    readonly lastHitTarget: string | null;
    /** ヒットストップの累計回数・直近の凍結フレーム数・プレイヤーの凍結の残り・現在のタイムスケール。 */
    readonly hitStops: number;
    readonly lastHitStopFrames: number;
    readonly playerFreeze: number;
    readonly timeScale: number;
  };
}

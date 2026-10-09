import { EventBus, type FootstepSurface, type GameEventMap } from '../core/gameEvents';
import { MARKER_TYPES, type MarkerType } from './anim/eventMarkers';
import type { AnimMarkerEvent } from './anim/markerDispatcher';
import { Euler, Quaternion, Vector3 } from 'three/webgpu';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { InputReader, InputSnapshot } from '../core/input';
import { ThirdPersonCamera, type CameraCollision } from './camera/thirdPersonCamera';
import { LockOnController, type LockOnEvent } from './lockOn/lockOnController';
import { DummyTarget, type LockOnTarget } from './lockOn/targets';
import { createPhysics, type Physics } from './physics';
import { Player } from './player/player';
import { tuning } from './tuning';
import {
  CAMERA_QUERY_GROUPS,
  SIGHT_QUERY_GROUPS,
  TARGET_GROUPS,
  WORLD_GROUPS,
} from './world/groups';
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

const GROUND_FALLBACK_HALF = 100;
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
  readonly camera = new ThirdPersonCamera();
  readonly lockOn = new LockOnController();
  /** ロックオン対象。敵（#40 以降）は `LockOnTarget` を実装してここへ追加する。 */
  readonly lockOnTargets: LockOnTarget[] = [];
  /** テストシーンのダミー（描画用に別持ち）。 */
  readonly dummies: DummyTarget[] = [];
  /** プレイヤーイベント（ロール開始など）の累計回数（デバッグ・E2E 用）。 */
  readonly eventCounts = { rollStart: 0, backstepStart: 0, land: 0, staminaEmpty: 0 };
  /** イベントマーカーの発火回数（E2E・デバッグ用）。 */
  readonly markerCounts = Object.fromEntries(MARKER_TYPES.map((t) => [t, 0])) as Record<
    MarkerType,
    number
  >;
  /** 足音の地面の種類（#24 のレベルが場所ごとの種類を返すよう差し替える）。 */
  footstepSurface: (x: number, z: number) => FootstepSurface = () => 'grass';
  /** 直近ステップのロックオンイベント（デバッグ・E2E 用）。 */
  lastLockOnEvent: LockOnEvent = 'none';

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
    this.player = new Player(physics, this.spawnPosition, this.spawnYaw);
    this.cameraCollision = this.createCameraCollision(rapier);
    this.camera.reset(this.player.feet, this.spawnYaw);
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
    for (const e of player.events) this.eventCounts[e.type]++;
    for (const m of player.markerEvents) this.publishMarker('player', m, player.feet);
    this.physics.step(dt);
    camera.updatePlacement(dt, cameraInput(), this.cameraCollision);
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
    this.player.teleport(this.spawnPosition, this.spawnYaw);
    this.camera.reset(this.player.feet, this.spawnYaw);
    this.lockOn.release('external');
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
    Record<'rollStart' | 'backstepStart' | 'land' | 'staminaEmpty', number>
  >;
  /** イベントマーカーの種別ごとの発火回数。 */
  readonly markers: Readonly<Record<MarkerType, number>>;
}

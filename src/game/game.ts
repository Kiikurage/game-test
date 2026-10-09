import { Quaternion, Vector3 } from 'three/webgpu';
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
import { DUMMIES, PLAYER_SPAWN, PLAYGROUND_BOXES } from './world/playground';

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
}

/** 静的な円柱（柱・岩など）の衝突。`y` は底面の高さ。 */
export interface StaticCylinderSpec {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly height: number;
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
  readonly player: Player;
  readonly camera = new ThirdPersonCamera();
  readonly lockOn = new LockOnController();
  /** ロックオン対象。敵（#40 以降）は `LockOnTarget` を実装してここへ追加する。 */
  readonly lockOnTargets: LockOnTarget[] = [];
  /** テストシーンのダミー（描画用に別持ち）。 */
  readonly dummies: DummyTarget[] = [];
  /** 直近ステップのロックオンイベント（デバッグ・E2E 用）。 */
  lastLockOnEvent: LockOnEvent = 'none';

  private input: InputReader;
  private readonly cameraCollision: CameraCollision;
  private readonly spawnPosition = new Vector3();
  private readonly cameraForwardScratch = new Vector3();

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
    for (const b of PLAYGROUND_BOXES) {
      const q = TMP_QUAT.setFromAxisAngle(EULER_Y, ((b.yawDeg ?? 0) * Math.PI) / 180);
      const qx = new Quaternion().setFromAxisAngle(EULER_X, ((b.pitchDeg ?? 0) * Math.PI) / 180);
      q.multiply(qx);
      world.createCollider(
        rapier.ColliderDesc.cuboid(b.hx, b.hy, b.hz)
          .setTranslation(b.x, b.y, b.z)
          .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
          .setCollisionGroups(WORLD_GROUPS),
      );
    }
    const heightAt = options.terrainHeight ?? (() => 0);
    for (const d of DUMMIES) {
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

    const spawnY = heightAt(PLAYER_SPAWN.x, PLAYER_SPAWN.z);
    this.spawnPosition.set(PLAYER_SPAWN.x, spawnY + 0.02, PLAYER_SPAWN.z);

    // 地形・足場を問い合わせパイプラインへ反映してからプレイヤーを置く
    physics.step(1 / 60);
    this.player = new Player(physics, this.spawnPosition, PLAYER_SPAWN.yaw);
    this.cameraCollision = this.createCameraCollision(rapier);
    this.camera.reset(this.player.feet, PLAYER_SPAWN.yaw);
  }

  static async create(options: GameOptions = {}): Promise<Game> {
    return new Game(await createPhysics(), options);
  }

  /** 入力を差し替える。 */
  setInput(input: InputReader): void {
    this.input = input;
  }

  /** 静的な円柱の衝突（柱・大岩など）を追加する。 */
  addStaticCylinders(cylinders: readonly StaticCylinderSpec[]): void {
    const { rapier, world } = this.physics;
    for (const c of cylinders) {
      world.createCollider(
        rapier.ColliderDesc.cylinder(c.height / 2, c.radius)
          .setTranslation(c.x, c.y + c.height / 2, c.z)
          .setCollisionGroups(WORLD_GROUPS),
      );
    }
  }

  /** 固定タイムステップで 1 ステップ進める。 */
  update(dt: number): void {
    const snap = this.input.snapshot;
    const { camera, player } = this;

    // 1. ロックオン（カメラは前ステップの姿勢で判定する）
    this.cameraForwardScratch.copy(camera.forward);
    const switchDir = this.resolveSwitch(snap);
    this.lastLockOnEvent = this.lockOn.update({
      toggle: snap.buttons.lockOn.pressed,
      switchDir,
      targets: this.lockOnTargets,
      playerPosition: player.feet,
      camera: { position: camera.position, forward: this.cameraForwardScratch },
      isVisible: (from, to) => this.hasLineOfSight(from, to),
    });

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
    this.physics.step(dt);
    camera.updatePlacement(dt, cameraInput(), this.cameraCollision);
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

  /** プレイヤーを初期位置へ戻す（デバッグ・リスポーン）。 */
  respawn(): void {
    this.player.teleport(this.spawnPosition, PLAYER_SPAWN.yaw);
    this.camera.reset(this.player.feet, PLAYER_SPAWN.yaw);
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
}

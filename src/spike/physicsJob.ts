// 物理（Rapier）の状態と固定ステップ job（#383 spike）。剛体の位置・回転を SoA に書く。
// メインスレッドでも Worker でも同じ job がそのまま動く（どちらで動くかは配置の設定が決める）。
import RAPIER from '@dimforge/rapier3d-compat';
import { defineJob } from '../core/placement/job';
import { defineState } from '../core/placement/state';

export const BODY_FIELDS = {
  px: 'f32',
  py: 'f32',
  pz: 'f32',
  qx: 'f32',
  qy: 'f32',
  qz: 'f32',
  qw: 'f32',
} as const;

/** 剛体の数（Worker 側でも同じ値が要るので固定。場面の `?n=` は使わない）。 */
export const BODY_COUNT = 800;
export const GROUND_HALF = 6;
export const BOX_HALF = 0.25;

interface PhysicsCtx {
  world: RAPIER.World;
  bodies: RAPIER.RigidBody[];
  seed: number;
}

function rnd(ctx: PhysicsCtx): number {
  ctx.seed = (ctx.seed * 1664525 + 1013904223) >>> 0;
  return ctx.seed / 4294967296;
}

function spawnPos(ctx: PhysicsCtx, i: number): { x: number; y: number; z: number } {
  return { x: (rnd(ctx) - 0.5) * 4, y: 2 + (i % 100) * 0.3, z: (rnd(ctx) - 0.5) * 4 };
}

export const physicsState = defineState('bodies', BODY_FIELDS, BODY_COUNT);

export const physicsJob = defineJob({
  id: 'physics',
  state: physicsState,
  reads: [],
  writes: ['px', 'py', 'pz', 'qx', 'qy', 'qz', 'qw'],
  rate: 'step',
  async init(a): Promise<PhysicsCtx> {
    await RAPIER.init();
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(GROUND_HALF, 0.5, GROUND_HALF).setTranslation(0, -0.5, 0),
    );
    const ctx: PhysicsCtx = { world, bodies: [], seed: 1 };
    for (let i = 0; i < BODY_COUNT; i++) {
      const p = spawnPos(ctx, i);
      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z),
      );
      world.createCollider(RAPIER.ColliderDesc.cuboid(BOX_HALF, BOX_HALF, BOX_HALF), body);
      ctx.bodies.push(body);
    }
    write(ctx, a);
    return ctx;
  },
  run(a, { dt }, ctx) {
    ctx.world.timestep = dt;
    ctx.world.step();
    // 落ちた箱は上から落とし直す（ずっと動き続ける負荷にする）
    for (let i = 0; i < ctx.bodies.length; i++) {
      const b = ctx.bodies[i];
      if (b && b.translation().y < -8) {
        const p = spawnPos(ctx, i % 40);
        b.setTranslation({ x: p.x, y: p.y + 20, z: p.z }, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: rnd(ctx) - 0.5, y: 0, z: rnd(ctx) - 0.5 }, true);
      }
    }
    write(ctx, a);
  },
});

function write(ctx: PhysicsCtx, a: { readonly [K in keyof typeof BODY_FIELDS]: Float32Array }) {
  for (let i = 0; i < ctx.bodies.length; i++) {
    const b = ctx.bodies[i];
    if (!b) continue;
    const t = b.translation();
    const r = b.rotation();
    a.px[i] = t.x;
    a.py[i] = t.y;
    a.pz[i] = t.z;
    a.qx[i] = r.x;
    a.qy[i] = r.y;
    a.qz[i] = r.z;
    a.qw[i] = r.w;
  }
}

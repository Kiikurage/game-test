// `?spike=particles|physics` のテスト場面（#383）。本番の Game / GameView は使わない。
// 配置は `?place=`（core/placement/placement.ts）で決まり、ここは配置を読まずに executor を組み立てる。
// 計測用に `window.__game`（frames / dev.gpuTiming / renderInfo / spikeInfo）を出す（scripts/perf.mjs の PERF_SPIKE）。
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshStandardNodeMaterial,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteNodeMaterial,
  WebGPURenderer,
} from 'three/webgpu';
import { float, instanceIndex, mix, storage, vec3, vec4 } from 'three/tsl';
import type { Executor } from '../core/placement/executors';
import { parsePlacement, placeOf, type Placement } from '../core/placement/placement';
import { SyncPoint } from '../core/placement/syncPoint';
import type { StateSchema } from '../core/placement/state';
import { GpuTimer } from '../render/pipeline/gpuTimer';
import { ensureCrossOriginIsolated } from './coi';
import type { PARTICLE_FIELDS } from './particlesJob';
import { createParticlesJob } from './particlesJob';
import { BODY_COUNT, BOX_HALF, GROUND_HALF, physicsJob } from './physicsJob';
import { createExecutor, gpuFieldsFor } from './runtime';

type Updater = (alpha: number) => void;

async function setupParticles(
  scene: Scene,
  renderer: WebGPURenderer,
  sync: SyncPoint,
  placement: Placement,
  count: number,
): Promise<Executor<StateSchema>> {
  const job = createParticlesJob(count);
  const exec = createExecutor(job, placeOf(placement, job.id), { renderer, sync });
  await exec.init();
  // 描画が読むフィールド。GPU で動くならそのバッファ、CPU なら同期点でアップロードされる配列
  const { attrs } = gpuFieldsFor(exec, sync, ['px', 'py', 'pz', 'life']);
  const read = (k: keyof typeof PARTICLE_FIELDS) =>
    storage(attrs[k], 'float', count).toReadOnly().element(instanceIndex);
  const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false });
  material.blending = AdditiveBlending;
  material.positionNode = vec3(read('px'), read('py'), read('pz'));
  material.scaleNode = float(0.06);
  const t = read('life').div(3).clamp(0, 1);
  material.colorNode = vec4(mix(vec3(0.9, 0.2, 0.05), vec3(1, 0.8, 0.3), t), t.mul(0.8));
  const sprite = new Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false;
  scene.add(sprite);
  return exec;
}

async function setupPhysics(
  scene: Scene,
  renderer: WebGPURenderer,
  sync: SyncPoint,
  placement: Placement,
): Promise<{ exec: Executor<StateSchema>; update: Updater }> {
  const exec = createExecutor(physicsJob, placeOf(placement, physicsJob.id), { renderer, sync });
  await exec.init();
  const ground = new Mesh(
    new BoxGeometry(GROUND_HALF * 2, 1, GROUND_HALF * 2),
    new MeshStandardNodeMaterial({ color: 0x556070 }),
  );
  ground.position.y = -0.5;
  scene.add(ground);
  const s = BOX_HALF * 2;
  const mesh = new InstancedMesh(
    new BoxGeometry(s, s, s),
    new MeshStandardNodeMaterial({ color: 0xc08050 }),
    BODY_COUNT,
  );
  mesh.frustumCulled = false;
  scene.add(mesh);
  const m = mesh.instanceMatrix.array as Float32Array;
  // 同期点で受けた previous / current を補間して行列にする（描画側は読むだけ）
  const update: Updater = (alpha) => {
    const p = exec.previous.arrays;
    const c = exec.current.arrays;
    const b = 1 - alpha;
    for (let i = 0; i < BODY_COUNT; i++) {
      const x = (p.px[i] ?? 0) * b + (c.px[i] ?? 0) * alpha;
      const y = (p.py[i] ?? 0) * b + (c.py[i] ?? 0) * alpha;
      const z = (p.pz[i] ?? 0) * b + (c.pz[i] ?? 0) * alpha;
      let qx = p.qx[i] ?? 0;
      let qy = p.qy[i] ?? 0;
      let qz = p.qz[i] ?? 0;
      let qw = p.qw[i] ?? 1;
      const cx = c.qx[i] ?? 0;
      const cy = c.qy[i] ?? 0;
      const cz = c.qz[i] ?? 0;
      const cw = c.qw[i] ?? 1;
      const sgn = qx * cx + qy * cy + qz * cz + qw * cw < 0 ? -1 : 1;
      // nlerp（1 ステップ分の差なので十分）
      qx = qx * b + cx * sgn * alpha;
      qy = qy * b + cy * sgn * alpha;
      qz = qz * b + cz * sgn * alpha;
      qw = qw * b + cw * sgn * alpha;
      const inv = 1 / Math.hypot(qx, qy, qz, qw);
      qx *= inv;
      qy *= inv;
      qz *= inv;
      qw *= inv;
      const o = i * 16;
      const x2 = qx + qx;
      const y2 = qy + qy;
      const z2 = qz + qz;
      const xx = qx * x2;
      const xy = qx * y2;
      const xz = qx * z2;
      const yy = qy * y2;
      const yz = qy * z2;
      const zz = qz * z2;
      const wx = qw * x2;
      const wy = qw * y2;
      const wz = qw * z2;
      m[o] = 1 - (yy + zz);
      m[o + 1] = xy + wz;
      m[o + 2] = xz - wy;
      m[o + 3] = 0;
      m[o + 4] = xy - wz;
      m[o + 5] = 1 - (xx + zz);
      m[o + 6] = yz + wx;
      m[o + 7] = 0;
      m[o + 8] = xz + wy;
      m[o + 9] = yz - wx;
      m[o + 10] = 1 - (xx + yy);
      m[o + 11] = 0;
      m[o + 12] = x;
      m[o + 13] = y;
      m[o + 14] = z;
      m[o + 15] = 1;
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return { exec: exec as unknown as Executor<StateSchema>, update };
}

export async function runSpike(root: HTMLElement, kind: string): Promise<void> {
  const q = new URLSearchParams(window.location.search);
  const placement = parsePlacement(q.get('place'));
  const perf = q.has('perf');
  const needSab = Object.values(placement).includes('worker-sab') || q.has('coi');
  const isolated = needSab ? await ensureCrossOriginIsolated() : window.crossOriginIsolated;
  if (needSab && !isolated && q.get('place')?.includes('worker-sab')) {
    throw new Error('worker-sab needs crossOriginIsolated (service worker failed)');
  }

  const renderer = new WebGPURenderer({
    antialias: false,
    powerPreference: 'high-performance',
    trackTimestamp: perf,
  });
  await renderer.init();
  const timer = new GpuTimer(renderer);
  const gpuTimer = timer.enabled ? timer : null;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(root.clientWidth || window.innerWidth, root.clientHeight || window.innerHeight);
  renderer.info.autoReset = false;
  root.appendChild(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(0x101218);
  scene.add(new HemisphereLight(0xc0d0ff, 0x302020, 1.2));
  const sun = new DirectionalLight(0xffffff, 2);
  sun.position.set(5, 10, 4);
  scene.add(sun);
  const camera = new PerspectiveCamera(
    55,
    renderer.domElement.width / renderer.domElement.height,
    0.1,
    200,
  );
  camera.position.set(0, 9, 22);
  camera.lookAt(0, 3, 0);

  const sync = new SyncPoint();
  let exec: Executor<StateSchema>;
  let update: Updater | null = null;
  if (kind === 'physics') {
    ({ exec, update } = await setupPhysics(scene, renderer, sync, placement));
  } else {
    const n = Number(q.get('n') ?? 100_000);
    exec = await setupParticles(scene, renderer, sync, placement, n);
  }

  const stats = { frameMs: 0, cpuMs: 0, maxCpuMs: 0, drawCalls: 0, triangles: 0 };
  /** reset 以降の job の計算時間の合計（ms。Worker なら Worker 側）とステップ数。 */
  const work = { ms: 0, steps: 0, frames: 0 };
  const game = {
    frames: 0,
    steps: 0,
    dev: {
      start: () => undefined,
      gpuTiming: () => gpuTimer?.summary() ?? null,
      resetGpuTiming: () => {
        gpuTimer?.reset();
        stats.maxCpuMs = 0;
        work.ms = 0;
        work.steps = 0;
        work.frames = 0;
      },
      renderInfo: () => ({ ...stats }),
      spikeInfo: () => ({
        kind,
        place: exec.place,
        crossOriginIsolated: window.crossOriginIsolated,
        workMs: exec.workMs === null ? null : work.ms,
        workSteps: work.steps,
        workFrames: work.frames,
        sample: Array.from(exec.current.arrays.py?.subarray(0, 4) ?? []),
      }),
    },
  };
  (window as unknown as { __game: typeof game }).__game = game;

  let last = performance.now();
  const loop = (now: number): void => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    stats.frameMs = stats.frameMs === 0 ? now - last : stats.frameMs * 0.9 + (now - last) * 0.1;
    last = now;
    const t0 = performance.now();
    renderer.info.reset();
    // 同期点: Worker との交換・GPU の dispatch・main での実行・アップロードはここで 1 回だけ
    const { steps, alpha } = sync.frame(dt);
    update?.(alpha);
    renderer.render(scene, camera);
    stats.cpuMs = performance.now() - t0;
    stats.maxCpuMs = Math.max(stats.maxCpuMs, stats.cpuMs);
    work.ms += exec.workMs ?? 0;
    work.steps += steps;
    work.frames++;
    stats.drawCalls = renderer.info.render.drawCalls;
    stats.triangles = renderer.info.render.triangles;
    gpuTimer?.endFrame();
    game.steps += steps;
    game.frames++;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  root.dataset.state = 'running';
}

// 配置の設定から executor を作る唯一の場所と、GPU 側の executor / ストレージ（#383 spike）。
// 実行場所の分岐はここ（createExecutor / gpuFieldsFor）だけにあり、job と描画は場所を知らない。
import { StorageBufferAttribute, type ComputeNode, type StorageBufferNode } from 'three/webgpu';
import { storage, uniform } from 'three/tsl';
import type { WebGPURenderer } from 'three/webgpu';
import {
  MainExecutor,
  WorkerExecutor,
  type Executor,
  type MessagePortLike,
  type SyncFrame,
} from '../core/placement/executors';
import type { JobDef } from '../core/placement/job';
import type { Place } from '../core/placement/placement';
import { allocState, type StateSchema, type StateStore } from '../core/placement/state';
import type { SyncPoint } from '../core/placement/syncPoint';

export interface GpuFields<S extends StateSchema> {
  readonly attrs: Readonly<Record<keyof S & string, StorageBufferAttribute>>;
  readonly nodes: Readonly<Record<keyof S & string, StorageBufferNode<'float'>>>;
}

/** 状態の各フィールドを、その配列をそのまま中身にしたストレージバッファにする。 */
function makeGpuFields<S extends StateSchema>(store: StateStore<S>): GpuFields<S> {
  const attrs: Record<string, StorageBufferAttribute> = {};
  const nodes: Record<string, StorageBufferNode<'float'>> = {};
  for (const [k, arr] of Object.entries(store.arrays)) {
    const attr = new StorageBufferAttribute(arr as Float32Array, 1);
    attrs[k] = attr;
    nodes[k] = storage(attr, 'float', store.def.capacity);
  }
  return { attrs, nodes } as unknown as GpuFields<S>;
}

/** GPU コンピュートで job を回す。状態の正本は GPU のバッファにあり、CPU の配列は初期値のまま（読み戻さない）。 */
export class GpuExecutor<S extends StateSchema, Ctx> implements Executor<S> {
  readonly place = 'gpu';
  readonly current: StateStore<S>;
  readonly previous: StateStore<S>;
  readonly workMs = null;
  fields!: GpuFields<S>;
  private node!: ComputeNode;
  private readonly dt = uniform(0);
  private readonly time = uniform(0);

  constructor(
    private readonly job: JobDef<S, Ctx>,
    private readonly renderer: WebGPURenderer,
  ) {
    if (!job.gpu) throw new Error(`job ${job.id} has no gpu kernel`);
    this.current = allocState(job.state);
    this.previous = this.current;
  }

  async init(): Promise<void> {
    await this.job.init?.(this.current.arrays);
    this.fields = makeGpuFields(this.current);
    this.node = this.job.gpu?.(this.fields.nodes, { dt: this.dt, time: this.time }) as ComputeNode;
  }

  sync(frame: SyncFrame): void {
    const runs = this.job.rate === 'frame' ? 1 : frame.steps;
    const dt = this.job.rate === 'frame' ? frame.frameDt : frame.stepDt;
    for (let i = 0; i < runs; i++) {
      this.dt.value = dt;
      this.time.value += dt;
      void this.renderer.compute(this.node);
    }
  }

  dispose(): void {
    // バッファは描画側と共有なので、ここでは捨てない
  }
}

export interface Deps {
  readonly renderer: WebGPURenderer;
  readonly sync: SyncPoint;
}

/** 配置 → executor。新しい実行場所を足すときはここだけを変える。 */
export function createExecutor<S extends StateSchema, Ctx>(
  job: JobDef<S, Ctx>,
  place: Place,
  { renderer, sync }: Deps,
): Executor<S> {
  let e: Executor<S>;
  switch (place) {
    case 'gpu':
      e = new GpuExecutor(job, renderer);
      break;
    case 'worker-sab':
    case 'worker-msg':
      e = new WorkerExecutor(
        job,
        new Worker(new URL('./spike.worker.ts', import.meta.url), {
          type: 'module',
        }) as unknown as MessagePortLike & { terminate(): void },
        place === 'worker-sab' ? 'sab' : 'msg',
      );
      break;
    case 'main':
      e = new MainExecutor(job);
      break;
  }
  return sync.add(e);
}

/**
 * 描画が GPU で読むフィールド（init 後に呼ぶ）。GPU で動く job ならそのバッファを共有し、
 * CPU で動く job なら配列を中身にしたバッファを作って、同期点で `reads` だけをアップロードする。
 */
export function gpuFieldsFor<S extends StateSchema>(
  executor: Executor<S>,
  sync: SyncPoint,
  reads: readonly (keyof S & string)[],
): GpuFields<S> {
  if (executor instanceof GpuExecutor) return (executor as GpuExecutor<S, unknown>).fields;
  const fields = makeGpuFields(executor.current);
  sync.onUpload(() => {
    for (const k of reads) fields.attrs[k].needsUpdate = true;
  });
  return fields;
}

import { describe, expect, it } from 'vitest';
import { MainExecutor, serveJobs, WorkerExecutor, type MessagePortLike } from './executors';
import { defineJob } from './job';
import { DEFAULT_PLACEMENT, parsePlacement } from './placement';
import { allocState, copyState, defineState, viewState } from './state';
import { SyncPoint } from './syncPoint';

const State = defineState('counter', { x: 'f32', n: 'u32' }, 4);
const job = defineJob({
  id: 'counter',
  state: State,
  reads: ['x'],
  writes: ['x', 'n'],
  rate: 'step',
  init(a) {
    a.x.fill(1);
  },
  run(a, { dt }) {
    for (let i = 0; i < a.x.length; i++) {
      a.x[i] = (a.x[i] ?? 0) + dt;
      a.n[i] = (a.n[i] ?? 0) + 1;
    }
  },
});

/** 同じスレッドで Worker 相当を繋ぐ（メッセージは非同期に届ける）。 */
function fakeWorker(): MessagePortLike & { terminate(): void } {
  const inside: MessagePortLike = { postMessage: () => undefined, onmessage: null };
  const outside: MessagePortLike & { terminate(): void } = {
    onmessage: null,
    postMessage: (m) => {
      queueMicrotask(() => inside.onmessage?.({ data: structuredClone(m) }));
    },
    terminate: () => undefined,
  };
  inside.postMessage = (m) => {
    queueMicrotask(() => outside.onmessage?.({ data: m }));
  };
  serveJobs(inside, { counter: job as never });
  return outside;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('placement', () => {
  it('lays out fields in one buffer and copies', () => {
    const a = allocState(State);
    expect(a.buffer.byteLength).toBe(32);
    a.arrays.x[3] = 5;
    const b = viewState(State, new ArrayBuffer(32));
    copyState(a, b);
    expect(b.arrays.x[3]).toBe(5);
  });

  it('parses ?place= over the defaults', () => {
    expect(parsePlacement('particles:gpu,physics:worker-sab,bad:x')).toEqual({
      ...DEFAULT_PLACEMENT,
      particles: 'gpu',
      physics: 'worker-sab',
    });
  });

  it('runs the same job on main and keeps the previous step', async () => {
    const sync = new SyncPoint();
    const e = sync.add(new MainExecutor(job));
    await e.init();
    sync.frame(2 / 60);
    expect(e.current.arrays.n[0]).toBe(2);
    expect(e.previous.arrays.n[0]).toBe(1);
  });

  it.each(['sab', 'msg'] as const)('runs the same job in a worker (%s)', async (t) => {
    const sync = new SyncPoint();
    const e = sync.add(new WorkerExecutor(job, fakeWorker(), t));
    await e.init();
    expect(e.current.arrays.x[0]).toBe(1);
    sync.frame(1 / 60);
    await flush();
    sync.frame(1 / 60);
    // 1 フレーム遅れで 1 ステップ目が見える
    expect(e.current.arrays.n[0]).toBe(1);
    expect(e.previous.arrays.n[0]).toBe(0);
    await flush();
    sync.frame(0);
    expect(e.current.arrays.n[0]).toBe(2);
    expect(e.previous.arrays.n[0]).toBe(1);
  });
});

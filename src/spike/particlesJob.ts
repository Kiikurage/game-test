// パーティクルの状態と更新 job（#383 spike）。同じ job に JS 版（run）と TSL コンピュート版（gpu）を持つ。
// どちらで動くかは配置の設定（core/placement/placement.ts）が決め、この job は知らない。
import type { StorageBufferNode, UniformNode } from 'three/webgpu';
import { Fn, If, cos, float, hash, instanceIndex, sin, uint } from 'three/tsl';
import { defineJob } from '../core/placement/job';
import { defineState } from '../core/placement/state';

export const PARTICLE_FIELDS = {
  px: 'f32',
  py: 'f32',
  pz: 'f32',
  vx: 'f32',
  vy: 'f32',
  vz: 'f32',
  life: 'f32',
} as const;

const GRAVITY = 9.8;
const SPEED = 9;
const LIFE = 3;

/** JS 版の乱数（0..1）。GPU 版の hash と同じ値にはしない（見た目の分布だけ揃える）。 */
function rand(seed: number): number {
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

export function createParticlesJob(capacity: number) {
  const state = defineState('particles', PARTICLE_FIELDS, capacity);
  return defineJob({
    id: 'particles',
    state,
    reads: ['px', 'py', 'pz', 'vx', 'vy', 'vz', 'life'],
    writes: ['px', 'py', 'pz', 'vx', 'vy', 'vz', 'life'],
    rate: 'frame',
    init(a) {
      // 寿命をばらして、最初のフレームに全粒が一斉に生まれないようにする
      for (let i = 0; i < capacity; i++) a.life[i] = -rand(i + 0.5) * LIFE;
    },
    run(a, { dt, time }) {
      const { px, py, pz, vx, vy, vz, life } = a;
      for (let i = 0; i < capacity; i++) {
        const l = (life[i] ?? 0) - dt;
        if (l <= 0) {
          const seed = i * 1.618 + time * 97.13;
          const ang = rand(seed) * Math.PI * 2;
          const up = 0.6 + rand(seed + 1) * 0.4;
          const side = Math.sqrt(1 - up * up) * SPEED;
          px[i] = 0;
          py[i] = 0.2;
          pz[i] = 0;
          vx[i] = Math.cos(ang) * side;
          vy[i] = up * SPEED;
          vz[i] = Math.sin(ang) * side;
          life[i] = LIFE * (0.5 + rand(seed + 2) * 0.5);
          continue;
        }
        life[i] = l;
        let y = (py[i] ?? 0) + (vy[i] ?? 0) * dt;
        let v = (vy[i] ?? 0) - GRAVITY * dt;
        if (y < 0) {
          y = 0;
          v = -v * 0.5;
        }
        py[i] = y;
        vy[i] = v;
        px[i] = (px[i] ?? 0) + (vx[i] ?? 0) * dt;
        pz[i] = (pz[i] ?? 0) + (vz[i] ?? 0) * dt;
      }
    },
    gpu(fields, params) {
      const f = fields as Record<keyof typeof PARTICLE_FIELDS, StorageBufferNode<'float'>>;
      const dt = params.dt as UniformNode<'float', number>;
      const time = params.time as UniformNode<'float', number>;
      return Fn(() => {
        const i = instanceIndex;
        If(i.greaterThanEqual(uint(capacity)), () => {
          return;
        });
        const life = f.life.element(i);
        const l = life.sub(dt).toVar();
        If(l.lessThanEqual(0), () => {
          const seed = i.add(uint(time.mul(9973)));
          const ang = hash(seed).mul(Math.PI * 2);
          const up = hash(seed.add(1)).mul(0.4).add(0.6);
          const side = float(1).sub(up.mul(up)).sqrt().mul(SPEED);
          f.px.element(i).assign(0);
          f.py.element(i).assign(0.2);
          f.pz.element(i).assign(0);
          f.vx.element(i).assign(cos(ang).mul(side));
          f.vy.element(i).assign(up.mul(SPEED));
          f.vz.element(i).assign(sin(ang).mul(side));
          life.assign(hash(seed.add(2)).mul(0.5).add(0.5).mul(LIFE));
        }).Else(() => {
          life.assign(l);
          const y = f.py.element(i).add(f.vy.element(i).mul(dt)).toVar();
          const v = f.vy.element(i).sub(dt.mul(GRAVITY)).toVar();
          If(y.lessThan(0), () => {
            y.assign(0);
            v.assign(v.negate().mul(0.5));
          });
          f.py.element(i).assign(y);
          f.vy.element(i).assign(v);
          f.px.element(i).addAssign(f.vx.element(i).mul(dt));
          f.pz.element(i).addAssign(f.vz.element(i).mul(dt));
        });
      })().compute(capacity, [64]);
    },
  });
}

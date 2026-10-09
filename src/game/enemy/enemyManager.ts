import { ENEMY_AI } from '../data';
import { Enemy, type AiTarget, type EnemyDebugInfo, type EnemyDeps, type EnemyInit } from './enemy';
import type { EnemyBody } from './enemyBody';
import { directNavigator, type Navigator } from './navigation';
import { NoiseField, type LineOfSight } from './perception';

/** 敵の生成・更新・味方への Alert の伝播・音の受け口を束ねる。 */
export interface EnemyManagerOptions {
  readonly lineOfSight: LineOfSight;
  /** 経路問い合わせ。省略時は直線（ナビゲーションメッシュは #43）。 */
  readonly navigator?: Navigator;
  /** 敵の体（衝突・接地）の作り方。 */
  readonly createBody: (init: EnemyInit) => EnemyBody;
  readonly darkness?: (x: number, z: number) => boolean;
  /** 乱数。省略時は敵の ID から決まる決定的な乱数（再現できるように）。 */
  readonly random?: (id: string) => () => number;
}

/** 文字列から決まる 0 以上 1 未満の乱数列（mulberry32）。 */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class EnemyManager {
  readonly enemies: Enemy[] = [];
  /** 音の受け口。足音・命中音などを発生側が `emit` する。 */
  readonly noises = new NoiseField();

  constructor(private readonly options: EnemyManagerOptions) {}

  /** 敵を 1 体生成して登録する。 */
  spawn(init: EnemyInit): Enemy {
    const random = (this.options.random ?? seededRandom)(init.id);
    const deps: EnemyDeps = {
      lineOfSight: this.options.lineOfSight,
      navigator: this.options.navigator ?? directNavigator,
      noises: this.noises,
      ...(this.options.darkness && { darkness: this.options.darkness }),
      alertAllies: (source) => {
        this.alertAllies(source);
      },
      random,
    };
    const enemy = new Enemy(init, this.options.createBody(init), deps);
    this.enemies.push(enemy);
    return enemy;
  }

  /** 1 ステップ進める。音は敵の更新の後に期限を進める。 */
  update(dt: number, target: AiTarget): void {
    for (const e of this.enemies) e.update(dt, target);
    this.noises.advance(dt);
  }

  /** `source` が気付いたとき、8m 以内の味方（Idle / Suspicious）を Alert にする。 */
  alertAllies(source: Enemy): void {
    const known = source.knownPosition;
    const x = known?.x ?? source.position.x;
    const z = known?.z ?? source.position.z;
    for (const e of this.enemies) {
      if (e === source || !e.alive) continue;
      const d = Math.hypot(
        e.position.x - source.position.x,
        e.position.y - source.position.y,
        e.position.z - source.position.z,
      );
      if (d <= ENEMY_AI.allyAlertRadius) e.provoke(x, z);
    }
  }

  get debugInfo(): EnemyDebugInfo[] {
    return this.enemies.map((e) => e.debugInfo);
  }
}

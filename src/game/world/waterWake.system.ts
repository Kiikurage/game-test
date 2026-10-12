import { registerGameSystem } from '../systems';

// 地下水路の水面を乱すもの（#270）の記録。描画側の波のシミュレーション（`render/waterway`）が読む。
//
// 水面の波紋・しぶきはシミュレーション時間（固定ステップ）で決まるようにしたい。描画は可変フレームで、
// `dev.advance` はループを通らずに `game.update` を進めるので、描画側はステップ数を知らない。そこで
// ステップごとの「水面を乱すもの」（足の移動・足音・ローリング・着地）をステップ番号付きでここに溜め、
// 描画側は前回読んだステップより新しいものを 1 ステップずつ取り出して波を進める。
//
// 水面の範囲はここでは判定しない（描画側が水のマスクと高さで捨てる）。
// ゲームの挙動には一切影響しない（記録するだけ）。

/** 乱れの種類。 */
export const WAKE_KIND = {
  /** 歩き・走りで水を押し分ける（毎ステップ。`strength` = 水平速度 m/s）。 */
  wake: 0,
  /** 足を水面に着いた（足音）。 */
  step: 1,
  /** ローリングの開始（大きなしぶき）。 */
  roll: 2,
  /** 落下からの着地（最大のしぶき。`strength` = 落下の速さの目安）。 */
  land: 3,
} as const;
export type WakeKind = (typeof WAKE_KIND)[keyof typeof WAKE_KIND];

export interface WakeRecord {
  readonly step: number;
  readonly kind: WakeKind;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly strength: number;
  /** プレイヤーか（しぶきの量の出し分け用）。 */
  readonly player: boolean;
}

/** 保持する記録の数（ステップあたり数件 × 数秒ぶん。描画が止まっていた間の古いものは捨ててよい）。 */
export const WAKE_CAPACITY = 1024;
const FIELDS = 7;
/** 敵の足の乱れを記録する範囲（プレイヤーからの距離 m）。 */
const ENEMY_RANGE = 28;
/** これより大きい 1 ステップの移動はワープ（テレポート・リスポーン）とみなして記録しない。 */
const TELEPORT_DISTANCE = 0.6;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** ステップ番号付きのリングバッファ。 */
export class WaterWake {
  /** 進んだステップ数（`game.update` 1 回 = 1）。記録中のステップは `step + 1`。 */
  step = 0;
  private readonly data = new Float64Array(WAKE_CAPACITY * FIELDS);
  /** これまでに書いた記録の総数。 */
  private written = 0;

  /** 現在のステップの記録を足す。 */
  record(kind: WakeKind, x: number, y: number, z: number, strength: number, player: boolean): void {
    const o = (this.written % WAKE_CAPACITY) * FIELDS;
    const d = this.data;
    d[o] = this.step + 1;
    d[o + 1] = kind;
    d[o + 2] = x;
    d[o + 3] = y;
    d[o + 4] = z;
    d[o + 5] = strength;
    d[o + 6] = player ? 1 : 0;
    this.written++;
  }

  /**
   * ステップ `afterStep` より新しい記録を古い順に渡す（`out` は使い回す。保持しないこと）。
   * 溢れて失われた記録は渡さない。
   */
  forEachSince(afterStep: number, visit: (r: WakeRecord) => void): void {
    const out: Mutable<WakeRecord> = {
      step: 0,
      kind: 0,
      x: 0,
      y: 0,
      z: 0,
      strength: 0,
      player: false,
    };
    const first = Math.max(0, this.written - WAKE_CAPACITY);
    // 新しい方から遡って開始位置を探す（記録はステップ順に並んでいる）
    let start = this.written;
    while (start > first) {
      const o = ((start - 1) % WAKE_CAPACITY) * FIELDS;
      if ((this.data[o] ?? 0) <= afterStep) break;
      start--;
    }
    const d = this.data;
    for (let i = start; i < this.written; i++) {
      const o = (i % WAKE_CAPACITY) * FIELDS;
      out.step = d[o] ?? 0;
      out.kind = (d[o + 1] ?? 0) as WakeKind;
      out.x = d[o + 2] ?? 0;
      out.y = d[o + 3] ?? 0;
      out.z = d[o + 4] ?? 0;
      out.strength = d[o + 5] ?? 0;
      out.player = d[o + 6] === 1;
      visit(out);
    }
  }
}

const AIRBORNE = new Set(['fall', 'plungeFall']);

/** 水面の乱れの記録（`game.systems.get(waterWakeSystem)`）。 */
export const waterWakeSystem = registerGameSystem('waterWake', (game) => {
  const wake = new WaterWake();
  const last = new Map<string, { x: number; z: number }>();
  let prevState = game.player.state;
  let fallFrames = 0;

  game.events.on('footstep', (e) => {
    if (!e.position) return;
    const p = e.position;
    wake.record(WAKE_KIND.step, p.x, p.y, p.z, e.gait === 'walk' ? 0.6 : 1, e.source === 'player');
  });

  const trail = (id: string, x: number, y: number, z: number, player: boolean): void => {
    const prev = last.get(id);
    if (prev) {
      const d = Math.hypot(x - prev.x, z - prev.z);
      if (d > 0.002 && d < TELEPORT_DISTANCE) wake.record(WAKE_KIND.wake, x, y, z, d * 60, player);
      prev.x = x;
      prev.z = z;
    } else {
      last.set(id, { x, z });
    }
  };

  return {
    state: wake,
    update: () => {
      const player = game.player;
      const f = player.feet;
      if (!player.dead) trail('player', f.x, f.y, f.z, true);
      const state = player.state;
      if (state === 'roll' && prevState !== 'roll')
        wake.record(WAKE_KIND.roll, f.x, f.y, f.z, 1, true);
      if (AIRBORNE.has(state)) fallFrames++;
      else {
        if (AIRBORNE.has(prevState) && fallFrames > 6) {
          wake.record(WAKE_KIND.land, f.x, f.y, f.z, Math.min(3, fallFrames / 20), true);
        }
        fallFrames = 0;
      }
      prevState = state;
      for (const enemy of game.enemies.enemies) {
        if (!enemy.alive) continue;
        const p = enemy.position;
        if (Math.hypot(p.x - f.x, p.z - f.z) > ENEMY_RANGE) {
          last.delete(enemy.id);
          continue;
        }
        trail(enemy.id, p.x, p.y, p.z, false);
      }
      wake.step++;
    },
  };
});

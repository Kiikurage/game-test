/**
 * game 層が発行するイベント（音・演出などの副作用を game から切り離すための口）。
 * game は音を直接鳴らさず、ここへイベントを発行するだけにする。audio 層が購読して再生する。
 */

export interface Vec3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type FootstepSurface = 'grass' | 'stone' | 'wood' | 'crypt';
export type FootstepGait = 'walk' | 'run' | 'roll';
export type HitKind = 'light' | 'heavy' | 'guard' | 'guardBreak';
/** 音の発生源。優先度と空間化（敵・ボスは位置つき）の判断に使う。 */
export type SoundSource = 'player' | 'boss' | 'enemy' | 'world';

export interface GameEventMap {
  /** 足音。 */
  footstep: {
    readonly surface: FootstepSurface;
    readonly gait: FootstepGait;
    readonly source: SoundSource;
    readonly position?: Vec3Like;
  };
  /** 命中・ガード。ヒットストップ開始と同じ tick で発行する（0F 遅延）。 */
  hit: {
    readonly kind: HitKind;
    readonly source: SoundSource;
    readonly position?: Vec3Like;
  };
  /**
   * アニメーションのイベントマーカーの発火（`hitStart` / `hitEnd` / `cancelOpen` / `invulnStart` / `invulnEnd` /
   * `healApply`。足音は `footstep` へも変換される）。命中判定・演出・SE が購読する。`owner` は発火したキャラクター。
   */
  animMarker: {
    readonly owner: string;
    readonly marker: string;
    readonly actionId: string;
    readonly frame: number;
    readonly position?: Vec3Like;
  };
  /**
   * 被弾リアクションの発生（強靭度・仰け反り・転倒・崩し・ガードの押し戻し。#50）。命中と同じステップで発行する。
   * `interruptsAction` は、回復・溜めなどの進行中の動作が失われる反応（E2-7 が購読する）。
   */
  hitReaction: {
    readonly targetId: string;
    readonly kind: 'none' | 'flinch' | 'stagger' | 'knockdown' | 'guardPush';
    readonly frames: number;
    readonly blocksAction: boolean;
    readonly interruptsAction: boolean;
    readonly knockback: number;
    readonly broke: boolean;
    readonly heavy: boolean;
  };
  /** 汎用: 素材 ID またはバリエーショングループ名（例 `sfx.boss-roar`）を直接指定して鳴らす。 */
  sound: {
    readonly cue: string;
    readonly source?: SoundSource;
    readonly position?: Vec3Like;
    /** 線形ゲインの追加倍率（既定 1）。 */
    readonly volume?: number;
  };
}

export type GameEventName = keyof GameEventMap;

/** 型付きの最小イベントバス（同期配信）。 */
export class EventBus<M extends object> {
  private readonly handlers = new Map<keyof M, Set<(payload: never) => void>>();

  /** 購読する。戻り値は購読解除。 */
  on<K extends keyof M>(name: K, handler: (payload: M[K]) => void): () => void {
    let set = this.handlers.get(name);
    if (!set) this.handlers.set(name, (set = new Set()));
    const h = handler as (payload: never) => void;
    set.add(h);
    return () => set.delete(h);
  }

  emit<K extends keyof M>(name: K, payload: M[K]): void {
    const set = this.handlers.get(name);
    if (!set) return;
    for (const h of [...set]) {
      try {
        (h as (payload: M[K]) => void)(payload);
      } catch (e) {
        // 購読側（audio など）の失敗でシミュレーションを止めない。
        console.error(`event handler for "${String(name)}" threw`, e);
      }
    }
  }
}

export type GameEventBus = EventBus<GameEventMap>;

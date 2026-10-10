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

/** 死亡演出の節目（仕様書 8.1 節。`DEATH` のフレーム表）。 */
export type DeathPhase =
  | 'start' // F0: HP 0・ヒットストップ・入力無効・BGM ダッキング
  | 'anim' // F12: 死亡アニメ・カメラの引き・FOV 縮小
  | 'grade' // F30: 彩度・明度・周辺減光へ
  | 'text' // F60: 「倒れた」表示（60F フェードイン）
  | 'skippable' // F90: ボタン入力でスキップ可能
  | 'hold' // F120: 保持（鐘の SE）
  | 'fadeOut' // F240（スキップ時は入力後）: 黒へフェードアウト
  | 'respawn'; // F300: 篝火で再開（リセット済み）

/** ボス戦のイベントのペイロード（`GameEventMap` の `boss*`）。 */
export interface BossBattleEvents {
  /** 交戦開始（`Boss.engage()`。HP バーを出す）。`boundaries` はフェーズ境界の HP（目盛りの位置）。 */
  bossEngaged: {
    readonly id: string;
    readonly hp: number;
    readonly maxHp: number;
    readonly phase: 1 | 2;
    readonly boundaries: readonly number[];
  };
  /** HP の変化。`damage` は減少量（0 以上。回復・リセットでは 0）。HP バーの白い残像の長さに使う。 */
  bossHpChanged: {
    readonly id: string;
    readonly hp: number;
    readonly maxHp: number;
    readonly damage: number;
    readonly phase: 1 | 2;
  };
  /**
   * フェーズ境界に到達した（HP が閾値以下になったあとの最初の硬直で、移行が始まった瞬間）。
   * ボスは `transitionFrames` の間、無敵で行動しない。その後 `to` のフェーズで戦闘を再開する。演出（咆哮・BGM 切替・バーの発光）はこれで始める。
   */
  bossPhaseBoundary: {
    readonly id: string;
    readonly from: 1 | 2;
    readonly to: 1 | 2;
    readonly hp: number;
    readonly transitionFrames: number;
  };
  /**
   * フェーズ移行の演出の節目（#84 / 6.5 節）。`bossPhaseBoundary` の後、ボスの移行 F に同期して発行する（`frame` = 移行の F。開始は 0）。
   * `end` は F120（戦闘再開）。移行の途中でボスがリセットされたときは、その場で `end`（`aborted: true`）を発行する。
   * 描画（盾投げ・咆哮・熾火・画面の縁）・UI（HP バーの境界の光）はこれと `bossTransitionOf(game).frame` を読む。
   */
  bossTransition: {
    readonly id: string;
    readonly cue: 'start' | 'flinchEnd' | 'shieldThrow' | 'roar' | 'roarEnd' | 'end';
    readonly frame: number;
    readonly aborted: boolean;
  };
  /** 撃破（HP 0）。 */
  bossDefeated: {
    readonly id: string;
    readonly position: Vec3Like;
  };
  /**
   * 撃破演出の節目（#86 / 8.4 節）。`bossDefeated`（F0）の後、シミュレーションの F に同期して発行する（`frame` = 撃破からのステップ数）。
   * 撃破テキスト（E6-3b）は `text`、霧の門の `unseal()` は `fogClear`、操作の復帰は `control` を購読する。
   * 描画（崩壊・ディゾルブ・熾火・篝火の点火）は `bossDefeatOf(game).frame` を読む。
   */
  bossDefeatCue: {
    readonly id: string;
    readonly cue: BossDefeatCue;
    readonly frame: number;
    readonly position: Vec3Like;
  };
  /** リセット（HP 満タン・フェーズ 1・待機位置へ。HP バーを消す）。`death` = プレイヤーの死亡、`rest` = 篝火の休憩、`removed` = 取り除いた。 */
  bossReset: {
    readonly id: string;
    readonly cause: 'death' | 'rest' | 'removed';
    readonly hp: number;
    readonly maxHp: number;
  };
  /** 技の判定が柱に触れた（破片の演出用フック。攻撃は柱で遮られない）。 */
  bossPillarHit: {
    readonly id: string;
    /** `BossDeps.pillars` の添字。 */
    readonly pillar: number;
    readonly position: Vec3Like;
    readonly moveId: string;
  };
}

/** 撃破演出の節目（F0 / F62 / F72 / F150 / F300 / F360。`BOSS_DEFEAT_FRAMES`）。 */
export type BossDefeatCue =
  'defeat' | 'touchdown' | 'collapse' | 'text' | 'fogClear' | 'bonfire' | 'control';

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
   * ヒットストップの発生（4.1 節）。命中・`hit` と同じステップで発行する。パーティクル・赤フラッシュ・白い閃光・
   * 画面振動・撃破スローの演出がこれを購読する（`frames` が 0 でも、演出だけのために発行する）。
   */
  hitStop: {
    readonly attackerId: string;
    readonly targetId: string;
    readonly kind: HitKind;
    /** 攻撃側・被弾側が凍結するフレーム数（60Hz）。 */
    readonly frames: number;
    /** 命中位置と、飛び散る向き（攻撃側 → 被弾側の水平方向 + わずかに上。単位ベクトル）。 */
    readonly position: Vec3Like;
    readonly normal: Vec3Like;
    /** この命中で被弾側が死亡した（死亡処理はヒットストップ中でも始める）。 */
    readonly killed: boolean;
    /** プレイヤーが攻撃側か（パーティクルなどの出し分け用）。 */
    readonly fromPlayer: boolean;
    /** プレイヤーが被弾側か。 */
    readonly toPlayer: boolean;
    /** 画面の閃光（赤: 敵の攻撃がプレイヤーに命中、白: ジャストガード）と、その長さ。 */
    readonly flash: 'red' | 'white' | null;
    readonly flashFrames: number;
    /** 撃破スロー（0.3 倍速）。なければ null。 */
    readonly slowMotion: { readonly scale: number; readonly frames: number } | null;
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
  /** 回復瓶で HP が加算された（F26）。HUD の HP ゲージ・光のパーティクル用。`amount` は実際に増えた HP。 */
  heal: {
    readonly amount: number;
    /** 加算後の HP。 */
    readonly hp: number;
    readonly position?: Vec3Like;
  };
  /**
   * 状況アクション（近くの「調べる」対象）の変化。`prompt` が null なら表示しない。HUD（E6-2b）が購読して
   * 「[E] 休む」のようなプロンプトを出す。実行中・実行不能の間は null。
   */
  interactPrompt: {
    readonly prompt: { readonly id: string; readonly kind: string; readonly label: string } | null;
  };
  /** 篝火に火が灯った（初回点火の完了）。バナー「篝火に火が灯った」（`bannerSeconds` 秒）が購読する（E6-3b）。 */
  bonfireLit: {
    readonly id: string;
    readonly position: Vec3Like;
    readonly bannerSeconds: number;
  };
  /**
   * 休憩（篝火で休む）またはリスポーン（死亡後）。HP・瓶・敵の復活は発行側が済ませている。
   * ボス（E5）はこれを購読し、`defeatedBosses` に自分がいなければ HP 全回復・待機位置へ戻る。
   * スポーン管理（E4-6）は敵の配置の検証などに使える。
   */
  rest: {
    readonly cause: 'rest' | 'respawn';
    readonly bonfireId: string;
    readonly position: Vec3Like;
    /** 撃破済みボスの ID（セーブ由来）。 */
    readonly defeatedBosses: readonly string[];
  };
  /**
   * プレイヤーの死亡演出の節目（8.1 節。死亡処理 `death.system.ts` が発行する）。`frame` は死亡（F0）からのフレーム。
   * 「倒れた」テキスト（E6-3b）は `text` で表示を始め `fadeOut` / `respawn` で消す。ボスなどの戦闘のリセットは
   * `respawn` の直前に発行される `rest`（`cause: 'respawn'`）を購読する（死亡開始時の処理は `start` を購読する）。
   */
  death: {
    readonly phase: DeathPhase;
    readonly frame: number;
    /** スキップ入力で短縮された演出か。 */
    readonly skipped: boolean;
    readonly position: Vec3Like;
  };
  /** BGM のダッキング指示。`db` が 0 なら解除（`frames` かけて戻す）。音量の実処理は audio 層。 */
  bgmDuck: {
    readonly db: number;
    readonly frames: number;
  };
  /**
   * BGM のレイヤー追加指示（フェーズ 2 の `bgm.boss-layer` など）。`bgm.boss` と同じ再生位置から `frames` かけてクロスフェードで重ねる。
   * 実処理は audio 層（購読は E7-4b）。
   */
  bgmLayer: {
    readonly layer: string;
    readonly frames: number;
  };
  /**
   * ボスの叩きつけ（跳躍叩きつけの着地など）。着地の衝撃の演出（パーティクル・破片）が購読する。
   * 画面振動は game 側が `slamAt`（カメラ演出）で出すので、ここでは出さない。
   */
  bossSlam: {
    readonly position: Vec3Like;
    /** 衝撃の円の半径（m）。 */
    readonly radius: number;
  };
  /**
   * ボス戦のイベント（#78 / 6.5・9.1 節）。ボス HP バー（E6-3a）・フェーズ移行の演出（E5-6）・BGM が購読する。
   * 型は `BossBattleEvents`。`id` はボスの ID（`'boss'`）。
   */
  bossEngaged: BossBattleEvents['bossEngaged'];
  bossHpChanged: BossBattleEvents['bossHpChanged'];
  bossPhaseBoundary: BossBattleEvents['bossPhaseBoundary'];
  bossTransition: BossBattleEvents['bossTransition'];
  bossDefeated: BossBattleEvents['bossDefeated'];
  bossDefeatCue: BossBattleEvents['bossDefeatCue'];
  /**
   * ボス入場演出の開始（#85 / 6.2 節）。霧の門の入場演出が終わって闘技場へ着いた瞬間に発行する。`frames` の間ボスは無敵で身構え、
   * 終わると `bossEngaged`（HP バー）で戦闘が始まる。描画（兜を上げて身構える）は `Boss.introFrame` を読む。
   */
  bossIntro: {
    readonly id: string;
    readonly frames: number;
  };
  /**
   * BGM の曲の切替指示（#85）。闘技場への入場で `bgm.boss`、プレイヤーの死亡・休憩で `bgm.area`（エリアの曲へ戻す）。
   * 実処理は audio 層（購読は E7-4b）。
   */
  bgmChange: {
    readonly track: 'bgm.boss' | 'bgm.area';
    readonly frames: number;
  };
  /** BGM をフェードアウトする指示（ボス撃破の崩壊 F72 から 90F。再生の実処理は audio 層。購読は E7-4b）。 */
  bgmFadeOut: {
    readonly frames: number;
  };
  /** 闘技場の台座の篝火で休憩した（垂直スライス終了画面 E6-4b へ遷移する合図）。 */
  verticalSliceEnd: {
    readonly bonfireId: string;
  };
  bossReset: BossBattleEvents['bossReset'];
  bossPillarHit: BossBattleEvents['bossPillarHit'];
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

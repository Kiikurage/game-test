import { POISE } from '../data';

/**
 * ボス「門番の骸 オルグ」の数値（仕様書 6.2 / 6.3 / 6.4 節）。技ごとの数値は各技のモジュール
 * （`moves/*.move.ts`）が持ち、ここには AI 全体の数値と重み表を置く。
 */

export type BossPhase = 1 | 2;

/** 技 ID（6.3 節の # 1〜7）。重み表のキー。 */
export const BOSS_MOVE_IDS = [
  'overhead', // 1 大上段斬り
  'sweep', // 2 薙ぎ払い
  'combo3', // 3 三連撃
  'shieldBash', // 4 盾打ち → 斬り下ろし（P1 のみ）
  'leap', // 5 跳躍叩きつけ
  'spin', // 6 回転斬り（P2 のみ）
  'ashWave', // 7 灰の波（P2 のみ）
] as const;
export type BossMoveId = (typeof BOSS_MOVE_IDS)[number];

/** 距離帯: 近 < 3.5m / 中 3.5〜8m / 遠 > 8m。 */
export type DistanceBand = 'close' | 'mid' | 'far';

export const BOSS_STATS = {
  hp: 2400,
  /** 強靭度（崩しのフェーズ制約は E5-7）。 */
  poise: POISE.boss.max,
  /** 身長 / 被弾判定のカプセル。 */
  height: 4.0,
  radius: 0.9,
  /** 歩き（接近）m/s。 */
  walkSpeed: 2.4,
  /** 走り m/s（フェーズ 2 は 4.8）。 */
  runSpeed: { 1: 4.2, 2: 4.8 },
  /** 旋回速度 度/秒（フェーズ 2 は 120）。 */
  turnDegPerSecond: { 1: 90, 2: 120 },
} as const;

/** 距離帯の境界（m）。ちょうど 3.5m は中、ちょうど 8m も中。 */
export const BOSS_BANDS = { closeBelow: 3.5, farAbove: 8 } as const;

export const BOSS_AI = {
  /** ビート（技の硬直後の睨み合い）の長さ [最小, 最大] F（両端含む）。 */
  beatFrames: { 1: [30, 60], 2: [20, 40] },
  /** 同じ技を連続で選べる最大回数（3 回連続は選ばない）。 */
  maxConsecutive: 2,
  /** 直前と同じ技の重み倍率（2 連続目を半分にする）。 */
  repeatWeightFactor: 0.5,
  /** 選べる技がないとき（連続制限で全滅など）に対象へ歩み寄る長さ（F）。その後ビートへ。 */
  repositionFrames: 30,
  /** 接近の打ち切り（技の定義が指定しなければ）F。 */
  approachMaxFrames: 240,
  /** 向きの合わせ込みの強さ（旋回は角速度の上限で決まるので大きめ。`Enemy` と同じ）。 */
  turnResponse: 40,
  /** 履歴に残す技の数。 */
  historyLength: 8,
} as const;

/** プレイヤー状態による補正（6.4 節）。 */
export const BOSS_CORRECTION = {
  /** 背後の判定角（ボスの真後ろから ±60°）。 */
  behindHalfDeg: 60,
  /** 背後に居続けて補正がかかるまでの F。 */
  behindFrames: 90,
  /** 背後張り付き時の、回転斬り（P2）・薙ぎ払いの重み倍率。 */
  behindWeightFactor: 2,
  /** 回復動作中に近距離のとき、予備動作中の追尾率の倍率。 */
  healTrackRate: 1.2,
  /** ロール連打とみなす回数と、ロール同士の間隔（前のロールの終わりから次の開始まで）の上限 F。 */
  rollStreak: 3,
  rollStreakGapFrames: 60,
  /** ロール連打後、近距離技で三連撃を選ぶ確率の加算（絶対値）。 */
  comboBonus: 0.2,
  /** 補正で三連撃を選んだときも保つ、1 技目の予備動作（発生）の下限 F。 */
  comboMinStartup: 30,
} as const;

/** スーパーアーマー区間の強靭度加算（実質、通常攻撃では削り切れない）。 */
export const BOSS_SUPER_ARMOR_BONUS = 100000;

export type WeightTable = Readonly<Partial<Record<BossMoveId, number>>>;

/**
 * 重み表（6.4 節）。`—`（その技を使えないフェーズ）は項目なし = 0。
 * 技が未登録（E5-3〜E5-5 で追加）のときは、その技を除いて残りで選ぶ。
 */
export const BOSS_WEIGHTS: Readonly<
  Record<BossPhase, Readonly<Record<DistanceBand, WeightTable>>>
> = {
  1: {
    close: { overhead: 25, sweep: 25, combo3: 25, shieldBash: 25, leap: 0 },
    mid: { overhead: 40, sweep: 20, combo3: 0, shieldBash: 0, leap: 40 },
    far: { overhead: 0, sweep: 0, combo3: 0, shieldBash: 0, leap: 100 },
  },
  2: {
    close: { overhead: 20, sweep: 25, combo3: 25, leap: 0, spin: 30, ashWave: 0 },
    mid: { overhead: 25, sweep: 15, combo3: 0, leap: 20, spin: 0, ashWave: 40 },
    far: { overhead: 0, sweep: 0, combo3: 0, leap: 40, spin: 0, ashWave: 60 },
  },
};

/** ボス戦のルール（6.2 / 6.5 / 6.6 節）。 */
export const BOSS_BATTLE = {
  /** フェーズ 2 へ移る HP（以下になったあとの最初の硬直で移行）。フェーズ境界 = HP バーの目盛り。 */
  phase2Hp: BOSS_STATS.hp / 2,
  /** フェーズ移行の長さ（F1〜F120。この間ボスは無敵で行動しない。演出の実行は E5-6）。 */
  transitionFrames: 120,
} as const;

/** 壁際の位置取り（6.6 節）。 */
export const BOSS_WALL = {
  /** プレイヤーが壁（アリーナの縁）からこの距離以内なら、追い詰められているとみなす（m）。 */
  playerWallGap: 2.0,
  /** 近距離技の発生前に下がる距離（m）と、その長さ（F）。 */
  stepBackDistance: 2.0,
  stepBackFrames: 18,
} as const;

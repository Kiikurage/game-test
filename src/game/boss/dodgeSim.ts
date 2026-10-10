import { HitResolver, PLAYER_HEARTBOXES, UprightTarget, type HitEvent } from '../combat';
import { PLAYER_ACTIONS, inWindow } from '../data';
import { seededRandom } from '../enemy/enemyManager';
import { dashProfile, yawOf } from '../player/movement';
import { Boss } from './boss';
import type { BossMoveId, BossPhase } from './bossData';
import { BOSS_MOVES, BossMoveRegistry } from './bossMove';
import { createStubMoves } from './stubMoves';
import './moves';

/**
 * ボス技の回避検証 API（E5-9）。three.js の描画・Rapier を使わない純粋なシミュレーションで、
 * 「この技を、このフレームのこの入力で回避できるか」を判定する。Vitest から回帰テストとして書ける。
 *
 * 本物の `Boss`（技のフレームデータ・追尾・判定形状）と `HitResolver`（判定・無敵）をそのまま回し、
 * プレイヤーは「入力フレームまで立ち止まり、入力でロール / バックステップをする」だけの単純なモデル:
 * - 無敵 F・移動距離は `PLAYER_ACTIONS`（ロール F4–F15 無敵・3.2m、バックステップ F1–F8・2.0m）。
 * - ロールの移動は `player.ts` と同じ `dashProfile`（立ち上がり・最高速・減速）。壁・地形は考えない（平地）。
 * - 向き: 入力時点の「プレイヤー → ボス」の方向を基準に、`toward`（ボスへ）/ `away` / `left` / `right`
 *   （プレイヤーがボスを向いたときの左右。左 = ボスの右手側）を選ぶ。
 *
 * フレーム番号: 技の 1 段目の F1 を 1 とし、複数段でも通しで数える（`moveFrame`）。
 * 入力フレーム `frame` = ロール F1 になるステップ（F4 から無敵が始まる）。
 */

export type DodgeAction = 'roll' | 'backstep';
/** ロール方向（プレイヤーがボスを向いたときの向き）。`{ yaw }` でワールドの向き（rad）も指定できる。 */
export type DodgeDirection = 'toward' | 'away' | 'left' | 'right' | { readonly yaw: number };

export interface DodgeInput {
  /** 入力するフレーム（技の F。ロール F1 がこのフレーム）。 */
  readonly frame: number;
  /** 既定 `roll`。 */
  readonly action?: DodgeAction;
  /** 既定 `toward`（バックステップは方向を持たず常に `away`）。 */
  readonly direction?: DodgeDirection;
}

export interface DodgeScenario {
  readonly move: BossMoveId;
  /** 使う技のレジストリ（省略時は登録済みの技 + スタブ）。 */
  readonly moves?: BossMoveRegistry;
  /** 既定 1。 */
  readonly phase?: BossPhase;
  /** ボス → プレイヤーの水平距離（m。既定 2.5）。 */
  readonly distance?: number;
  /** プレイヤーの位置: ボスの正面を 0° として、ボスから見て右（+x 側）を正とする角度（既定 0 = 真正面）。 */
  readonly bearingDeg?: number;
  /** 入力（なければ立ち尽くす）。 */
  readonly inputs?: readonly DodgeInput[];
  /** 乱数のシード（技の中で乱数を使うときだけ意味がある）。 */
  readonly seed?: string;
  /** 打ち切り（既定 600F）。 */
  readonly maxFrames?: number;
  /** フレームごとの記録を `trace` に残す（既定 false）。 */
  readonly trace?: boolean;
}

export interface DodgeHit {
  /** 命中したフレーム（技の通し F）。 */
  readonly moveFrame: number;
  /** 命中した段（1 始まり）と、その段の F。 */
  readonly stage: number;
  readonly stageFrame: number;
  readonly attackId: string;
  readonly damage: number;
}

export interface DodgeTraceFrame {
  readonly moveFrame: number;
  readonly stage: number;
  readonly stageFrame: number;
  readonly state: string;
  /** プレイヤーが無敵（ロール / バックステップの無敵 F）か。 */
  readonly invulnerable: boolean;
  readonly player: { readonly x: number; readonly z: number };
  readonly boss: { readonly x: number; readonly z: number; readonly yaw: number };
}

export interface DodgeResult {
  /** 技が終わるまでに 1 発も当たらなかった。 */
  readonly dodged: boolean;
  readonly hits: readonly DodgeHit[];
  /** 技が終わった（または打ち切った）フレーム数。 */
  readonly frames: number;
  /** 技の定義が見つからない・そのフェーズで使えない（このとき `dodged` は false）。 */
  readonly error?: string;
  readonly trace?: readonly DodgeTraceFrame[];
}

const DT = 1 / 60;
const DEFAULT_MAX_FRAMES = 600;
const DEFAULT_DISTANCE = 2.5;
const DEG = Math.PI / 180;

// player.ts の ROLL_PROFILE / BACKSTEP_PROFILE と同じ形（数値は PLAYER_ACTIONS）。
const ROLL_PROFILE = dashProfile(
  PLAYER_ACTIONS.roll.moveDistance,
  PLAYER_ACTIONS.roll.startup + PLAYER_ACTIONS.roll.recovery,
  { ramp: 3, hold: 15, end: 28 },
);
const BACKSTEP_PROFILE = dashProfile(
  PLAYER_ACTIONS.backstep.moveDistance,
  PLAYER_ACTIONS.backstep.startup + PLAYER_ACTIONS.backstep.recovery,
  { ramp: 2, hold: 8, end: 20 },
);

/** 既定の技レジストリ（登録済みの技 + 未実装の技のスタブ）。 */
export function defaultDodgeMoves(): BossMoveRegistry {
  return BossMoveRegistry.merged(BOSS_MOVES, createStubMoves());
}

interface ActiveDodge {
  readonly profile: readonly number[];
  readonly invuln: { readonly start: number; readonly end: number };
  readonly dirX: number;
  readonly dirZ: number;
  /** 動作に入ってからのフレーム（F1 起点）。 */
  frame: number;
}

/** プレイヤー → ボスの向きを基準にした進行方向（単位ベクトル）。 */
function directionVector(
  direction: DodgeDirection,
  player: { x: number; z: number },
  boss: { x: number; z: number },
): { x: number; z: number } {
  if (typeof direction === 'object') {
    return { x: Math.sin(direction.yaw), z: Math.cos(direction.yaw) };
  }
  const toward = yawOf(boss.x - player.x, boss.z - player.z);
  const fx = Math.sin(toward);
  const fz = Math.cos(toward);
  // 右 = (fz, -fx)（UprightTarget.place と同じ規約。ボスを向いたプレイヤーの右手）
  switch (direction) {
    case 'toward':
      return { x: fx, z: fz };
    case 'away':
      return { x: -fx, z: -fz };
    case 'right':
      return { x: fz, z: -fx };
    case 'left':
      return { x: -fz, z: fx };
  }
}

/**
 * 1 つのシナリオをシミュレーションして、当たったかを返す。
 * ボスは原点で +z（yaw 0）を向き、プレイヤーはボスの前方 `distance` m（`bearingDeg` で回り込み）に立つ。
 */
export function simulateDodge(scenario: DodgeScenario): DodgeResult {
  const phase = scenario.phase ?? 1;
  const moves = scenario.moves ?? defaultDodgeMoves();
  const combat = new HitResolver();
  const playerTarget = new UprightTarget('player', 'player', 1_000_000, PLAYER_HEARTBOXES);
  combat.addTarget(playerTarget);
  const boss = new Boss(
    { id: 'boss', x: 0, y: 0, z: 0, yaw: 0 },
    { combat, moves, random: seededRandom(scenario.seed ?? 'dodge-sim') },
  );
  boss.aiEnabled = false;
  boss.setPhase(phase);

  const distance = scenario.distance ?? DEFAULT_DISTANCE;
  const bearing = (scenario.bearingDeg ?? 0) * DEG;
  const player = { x: Math.sin(bearing) * distance, z: Math.cos(bearing) * distance };
  playerTarget.place(player.x, 0, player.z, Math.PI);

  const hits: DodgeHit[] = [];
  let frame = 0;
  combat.onHit((e: HitEvent) => {
    const info = boss.debugInfo;
    hits.push({
      moveFrame: frame,
      stage: info.stage,
      stageFrame: info.stageFrame,
      attackId: e.attackId,
      damage: e.damage,
    });
  });

  if (!boss.startMove(scenario.move, { skipApproach: true })) {
    return {
      dodged: false,
      hits,
      frames: 0,
      error: `技 "${scenario.move}" はフェーズ ${phase} で使えない（未登録または対象外）`,
    };
  }

  const inputs = [...(scenario.inputs ?? [])].sort((a, b) => a.frame - b.frame);
  let nextInput = 0;
  let dodge: ActiveDodge | null = null;
  const maxFrames = scenario.maxFrames ?? DEFAULT_MAX_FRAMES;
  const trace: DodgeTraceFrame[] = [];

  while (boss.currentMove !== null && frame < maxFrames) {
    frame++;
    // プレイヤー: 入力（動作中の入力は受け付けない）→ 動作を 1 フレーム進める
    const input = inputs[nextInput];
    if (input && input.frame <= frame) {
      nextInput++;
      if (!dodge && input.frame === frame) {
        const action = input.action ?? 'roll';
        const dir = directionVector(
          action === 'backstep' ? 'away' : (input.direction ?? 'toward'),
          player,
          boss.position,
        );
        dodge = {
          profile: action === 'roll' ? ROLL_PROFILE : BACKSTEP_PROFILE,
          invuln: PLAYER_ACTIONS[action].invuln,
          dirX: dir.x,
          dirZ: dir.z,
          frame: 0,
        };
      }
    }
    let invulnerable = false;
    let rolling = false;
    if (dodge) {
      dodge.frame++;
      const step = dodge.profile[dodge.frame - 1] ?? 0;
      player.x += dodge.dirX * step;
      player.z += dodge.dirZ * step;
      invulnerable = inWindow(dodge.frame, dodge.invuln);
      rolling = true;
      if (dodge.frame >= dodge.profile.length) dodge = null;
    }
    playerTarget.invulnerable = invulnerable;
    playerTarget.place(player.x, 0, player.z, Math.PI);

    boss.update(DT, { x: player.x, z: player.z, healing: false, rolling }, 0);
    combat.step();

    if (scenario.trace) {
      const info = boss.debugInfo;
      trace.push({
        moveFrame: frame,
        stage: info.stage,
        stageFrame: info.stageFrame,
        state: info.state,
        invulnerable,
        player: { x: player.x, z: player.z },
        boss: { x: boss.position.x, z: boss.position.z, yaw: boss.yaw },
      });
    }
  }

  return {
    dodged: hits.length === 0,
    hits,
    frames: frame,
    ...(scenario.trace && { trace }),
  };
}

/** 「この技をこの入力で回避できるか」の短縮形。 */
export function canDodge(
  scenario: Omit<DodgeScenario, 'inputs'>,
  input: DodgeInput | readonly DodgeInput[],
): boolean {
  const inputs: readonly DodgeInput[] = 'frame' in input ? [input] : input;
  return simulateDodge({ ...scenario, inputs }).dodged;
}

export interface FrameRange {
  readonly start: number;
  readonly end: number;
}

export interface DodgeWindowOptions {
  readonly action?: DodgeAction;
  readonly direction?: DodgeDirection;
  /** 探索する入力フレームの範囲（両端含む。既定 1〜技の長さ）。 */
  readonly from?: number;
  readonly to?: number;
}

export interface DodgeWindows {
  /** 回避に成功した入力フレームの一覧。 */
  readonly frames: readonly number[];
  /** `frames` を連続区間にまとめたもの（例: `[{ start: 36, end: 46 }]`）。 */
  readonly windows: readonly FrameRange[];
}

/**
 * 入力フレームを総当たりして、回避に成功する入力窓を求める。
 * 仕様書 6.3 節の「回避の想定」（例: 大上段は左右ロール F36–F46）の回帰テストに使う。
 */
export function findDodgeWindows(
  scenario: Omit<DodgeScenario, 'inputs' | 'trace'>,
  options: DodgeWindowOptions = {},
): DodgeWindows {
  const moves = scenario.moves ?? defaultDodgeMoves();
  const fixed = { ...scenario, moves };
  const base = simulateDodge({ ...fixed, inputs: [] });
  const from = options.from ?? 1;
  const to = options.to ?? Math.max(from, base.frames);
  const frames: number[] = [];
  for (let f = from; f <= to; f++) {
    const result = simulateDodge({
      ...fixed,
      inputs: [
        { frame: f, action: options.action ?? 'roll', direction: options.direction ?? 'toward' },
      ],
    });
    if (result.dodged) frames.push(f);
  }
  return { frames, windows: toRanges(frames) };
}

/** 昇順の整数列を連続区間にまとめる。 */
export function toRanges(frames: readonly number[]): FrameRange[] {
  const out: { start: number; end: number }[] = [];
  for (const f of frames) {
    const last = out[out.length - 1];
    if (last && f === last.end + 1) last.end = f;
    else out.push({ start: f, end: f });
  }
  return out;
}

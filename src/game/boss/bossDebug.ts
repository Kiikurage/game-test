import type { Game } from '../game';
import { PLAYER_ACTIONS, trackEndFrame } from '../data';
import { yawOf } from '../player/movement';
import { setDebugSlow } from '../timeScale';
import type { Boss } from './boss';
import { bossSystemOf } from './boss.system';
import { BOSS_MOVE_IDS, type BossMoveId, type BossPhase } from './bossData';
import { BOSS_MOVES, type BossMoveDef, type BossMoveRegistry } from './bossMove';
import { defaultDodgeMoves, findDodgeWindows, type FrameRange } from './dodgeSim';

/**
 * ボス技の回避検証ツール（E5-9）のゲーム側。`?debug&scene=boss` で、技のレジストリに登録された技
 * （未実装はスタブ）を指定して出し、フェーズ・距離・向き・連続発動・AI オフを切り替える。
 * UI（DOM）は `render/boss/bossDebug.view.ts`。ここは状態と操作・表示用の情報だけを持つ。
 *
 * 技の一覧は `BOSS_MOVES` + スタブから**毎回**作る（技が増えれば自動で一覧に出る）。
 * 回避の入力窓は純粋なシミュレーション（`dodgeSim.ts`）で求めたもの（仕様書 6.3 節の「回避の想定」と比べる）。
 */

export interface BossToolSettings {
  /** 発動する技（null = 未選択）。 */
  moveId: BossMoveId | null;
  phase: BossPhase;
  /** ボス → プレイヤーの距離（m）。 */
  distance: number;
  /** プレイヤーの位置: ボスの正面を 0° とし、ボスから見て右を正とする角度。 */
  bearingDeg: number;
  /** 技が終わったら（少し待って）また同じ技を出す。 */
  repeat: boolean;
  /** AI（ビート・技選択）。オフなら技は明示的に出したものだけ。 */
  ai: boolean;
  /** 発動前に接近の動作を行うか（オフなら指定した距離のまま予備動作に入る）。 */
  approach: boolean;
  /** スロー再生の倍率（1 = 通常）。 */
  slow: number;
}

export interface BossToolMove {
  readonly id: BossMoveId;
  readonly name: string;
  readonly phases: readonly BossPhase[];
  /** スタブ（未実装の仮技）か。 */
  readonly stub: boolean;
}

export type BossMoveSegment = 'startup' | 'active' | 'recovery';

/** 回避の入力窓（シミュレーションで求めたもの）。 */
export interface BossToolWindows {
  readonly left: readonly FrameRange[];
  readonly right: readonly FrameRange[];
  readonly toward: readonly FrameRange[];
  readonly backstep: readonly FrameRange[];
}

export interface BossToolInfo {
  readonly hasBoss: boolean;
  readonly moveId: BossMoveId | null;
  readonly moveName: string | null;
  readonly phase: BossPhase;
  readonly state: string;
  /** 段（1 始まり。技の実行中以外は 0）・段数・段内の F・技の通し F。 */
  readonly stage: number;
  readonly stageCount: number;
  readonly stageFrame: number;
  readonly moveFrame: number;
  /** 現在の段のフレームデータ。 */
  readonly frameData: {
    readonly startup: number;
    readonly active: number;
    readonly recovery: number;
    readonly trackEnd: number;
  } | null;
  readonly segment: BossMoveSegment | null;
  /** 追尾中（追尾終了フレームまで）か。 */
  readonly tracking: boolean;
  /** 判定が出ているか（持続中）。 */
  readonly hitboxActive: boolean;
  readonly player: {
    readonly state: string;
    /** ロール / バックステップに入ってからの F（それ以外は 0）。 */
    readonly dodgeFrame: number;
    readonly invulnerable: boolean;
    /** 無敵 F の窓（動作中のみ）。 */
    readonly invulnWindow: { readonly start: number; readonly end: number } | null;
  };
  readonly windows: BossToolWindows | null;
  /** 仕様書 6.3 節の「回避の想定」。 */
  readonly expectation: string | null;
  readonly settings: Readonly<BossToolSettings>;
}

/** 仕様書 6.3 節「回避の想定」の要約（表示で、シミュレーションの入力窓と見比べる）。 */
export const BOSS_DODGE_EXPECTATION: Readonly<Record<BossMoveId, string>> = {
  overhead: '左右へロール（F36–F46 で入力）。前ロールでも射程の内側へ潜れる',
  sweep: 'ボスの正面へ前ロールで潜る / ガード。バックステップは届く（P2 は 2 連発）',
  combo3: '1 段目を左ロール、2 段目をバックステップ、3 段目を左右ロール',
  shieldBash: '盾打ちを側面へロールして追撃を空振りさせる',
  leap: '着地直前（滞空 F22–F28）にボスの方向へロール / 大きく横へ離れる',
  spin: '1 回転目の終了直前にロール（隙は 12F）',
  ashWave: '直線の間へ移動、またはロールで横断（無敵 12F で 1 本通過）',
};

/** 連続発動の間隔（F）。 */
export const REPEAT_GAP_FRAMES = 60;

export const BOSS_TOOL_DEFAULTS: Readonly<BossToolSettings> = {
  moveId: null,
  phase: 1,
  distance: 2.5,
  bearingDeg: 0,
  repeat: false,
  ai: false,
  approach: false,
  slow: 1,
};

/** `?scene=boss` は回避検証シーン（ボスを AI オフで出し、`?debug` のときだけ UI が出る）。 */
export function isBossToolScene(search: string): boolean {
  return new URLSearchParams(search).get('scene') === 'boss';
}

/** 技の一覧（登録済み + 未実装のスタブ）。技の追加で自動的に増える。 */
export function listBossToolMoves(): BossToolMove[] {
  const all = defaultDodgeMoves().all();
  return BOSS_MOVE_IDS.flatMap((id) => {
    const def = all.find((m) => m.id === id);
    return def ? [{ id, name: def.name, phases: def.phases, stub: !BOSS_MOVES.has(id) }] : [];
  });
}

export class BossDebugTool {
  readonly settings: BossToolSettings = { ...BOSS_TOOL_DEFAULTS };
  private moveFrame = 0;
  private idleFrames = 0;
  private windowsKey = '';
  private windowsCache: BossToolWindows | null = null;

  constructor(private readonly game: Game) {}

  get boss(): Boss | null {
    return bossSystemOf(this.game).boss;
  }

  moves(): BossToolMove[] {
    return listBossToolMoves();
  }

  /** ボスがいなければ出す（AI オフ・戦闘前の状態）。 */
  ensureBoss(): Boss {
    const system = bossSystemOf(this.game);
    if (system.boss?.alive) return system.boss;
    const p = this.game.player.feet;
    const boss = system.spawn({ x: p.x, z: p.z - this.settings.distance, yaw: 0, engage: false });
    boss.aiEnabled = this.settings.ai;
    this.placeBoss(boss);
    return boss;
  }

  /** 設定の距離・角度になるよう、プレイヤーの北側にボスを置いてプレイヤーの方を向かせる。 */
  private placeBoss(boss: Boss): void {
    const p = this.game.player.feet;
    const d = this.settings.distance;
    boss.position.set(p.x, p.y, p.z - d);
    boss.yaw = yawOf(0, d) - (this.settings.bearingDeg * Math.PI) / 180;
    boss.transform.snap();
  }

  /** 選んだ技を（設定の距離・フェーズで）今すぐ出す。出せなければ false。 */
  fire(): boolean {
    const { moveId } = this.settings;
    if (!moveId) return false;
    const boss = this.ensureBoss();
    boss.aiEnabled = this.settings.ai;
    boss.setPhase(this.settings.phase);
    if (!this.settings.approach || boss.state === 'dormant') this.placeBoss(boss);
    const ok = boss.startMove(moveId, { skipApproach: !this.settings.approach });
    if (ok) {
      this.moveFrame = 0;
      this.idleFrames = 0;
    }
    return ok;
  }

  /** ボスを取り除いて、設定どおりの位置に出し直す（技は出さない）。 */
  reset(): void {
    bossSystemOf(this.game).remove();
    this.moveFrame = 0;
    this.idleFrames = 0;
    this.ensureBoss();
  }

  set<K extends keyof BossToolSettings>(key: K, value: BossToolSettings[K]): void {
    this.settings[key] = value;
    const boss = this.boss;
    switch (key) {
      case 'phase':
        boss?.setPhase(value as BossPhase);
        break;
      case 'ai':
        if (boss) {
          boss.aiEnabled = value as boolean;
          if (boss.aiEnabled) boss.engage();
        }
        break;
      case 'slow': {
        setDebugSlow(this.game.timeScale, value as number);
        break;
      }
      case 'distance':
      case 'bearingDeg':
        // 待機中は置き直す（技の最中は動かさない）
        if (boss && boss.currentMove === null) this.placeBoss(boss);
        break;
      default:
        break;
    }
  }

  /** 毎ステップ（`bossDebug.system.ts` が呼ぶ）。技の通し F と連続発動。 */
  update(): void {
    const boss = this.boss;
    if (!boss) return;
    if (boss.currentMove !== null) {
      this.moveFrame++;
      this.idleFrames = 0;
      return;
    }
    this.idleFrames++;
    if (this.settings.repeat && this.settings.moveId && this.idleFrames >= REPEAT_GAP_FRAMES) {
      this.fire();
    }
  }

  /** 表示用の情報（毎フレーム呼んでよい。入力窓はキャッシュ）。 */
  info(): BossToolInfo {
    const boss = this.boss;
    const { settings } = this;
    const dbg = boss?.debugInfo ?? null;
    const moveId = (dbg?.move as BossMoveId | null) ?? settings.moveId;
    const def = moveId ? this.defOf(moveId) : undefined;
    const stages = def
      ? settings.phase === 2 && def.phase2Stages
        ? def.phase2Stages
        : def.stages
      : [];
    const running = dbg !== null && dbg.move !== null;
    const stageNo = dbg ? dbg.stage : 0;
    const stage = running ? (stages[stageNo - 1] ?? null) : null;
    const f = dbg?.stageFrame ?? 0;
    const trackEnd = stage ? trackEndFrame(stage) : 0;
    const segment: BossMoveSegment | null =
      running && stage
        ? f <= stage.startup
          ? 'startup'
          : f <= stage.startup + stage.active
            ? 'active'
            : 'recovery'
        : null;
    const { player } = this.game;
    const dodging = player.state === 'roll' || player.state === 'backstep';
    return {
      hasBoss: boss !== null,
      moveId,
      moveName: def?.name ?? null,
      phase: dbg?.phase ?? settings.phase,
      state: dbg?.state ?? '-',
      stage: running ? stageNo : 0,
      stageCount: stages.length,
      stageFrame: running ? f : 0,
      moveFrame: running ? this.moveFrame : 0,
      frameData: stage
        ? {
            startup: stage.startup,
            active: stage.active,
            recovery: stage.recovery,
            trackEnd,
          }
        : null,
      segment,
      tracking: running && stage !== null && f <= trackEnd,
      hitboxActive: segment === 'active',
      player: {
        state: player.state,
        dodgeFrame: dodging ? player.stateFrame : 0,
        invulnerable: player.invulnerable,
        invulnWindow: dodging ? PLAYER_ACTIONS[player.state].invuln : null,
      },
      windows: moveId ? this.windows(moveId) : null,
      expectation: moveId ? BOSS_DODGE_EXPECTATION[moveId] : null,
      settings: { ...settings },
    };
  }

  private registryCache: BossMoveRegistry | null = null;

  private registry(): BossMoveRegistry {
    return (this.registryCache ??= defaultDodgeMoves());
  }

  private defOf(id: BossMoveId): BossMoveDef | undefined {
    return this.registry().get(id);
  }

  /** 選択中の技 × 設定の入力窓（左右ロール・前ロール・バックステップ）。 */
  private windows(moveId: BossMoveId): BossToolWindows | null {
    const { phase, distance, bearingDeg } = this.settings;
    const def = this.defOf(moveId);
    if (!def?.phases.includes(phase)) return null;
    const key = `${moveId}|${phase}|${distance}|${bearingDeg}`;
    if (key === this.windowsKey) return this.windowsCache;
    const scenario = { move: moveId, phase, distance, bearingDeg, moves: this.registry() };
    const w = (action: 'roll' | 'backstep', direction: 'left' | 'right' | 'toward') =>
      findDodgeWindows(scenario, { action, direction }).windows;
    this.windowsKey = key;
    this.windowsCache = {
      left: w('roll', 'left'),
      right: w('roll', 'right'),
      toward: w('roll', 'toward'),
      backstep: w('backstep', 'toward'),
    };
    return this.windowsCache;
  }
}

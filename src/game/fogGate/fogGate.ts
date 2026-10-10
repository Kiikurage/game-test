// 霧の門（#66、仕様書 7.1 / 7.2 節）: 中庭と闘技場をつなぐ門の状態・入場演出・封鎖。
//
//   const gate = fogGateOf(game);            // 霧の門がないレベルでは null
//   gate?.seal();                            // 通れなくする（コライダを有効に）
//   gate?.unseal();                          // 解除（ボス撃破: 霧が消えて通れる。再戦しない）
//   gate?.onEntered(({ position }) => ...);  // 入場演出が終わり、闘技場へ着いた（ボス入場 #85 が購読する）
//
// 状態:
//   closed   ボス戦前。霧の壁が門を塞いでいる（コライダ有効）。近付くと状況アクション「霧へ入る」。
//   entering 入場演出（90F）。入力を奪って霧へ歩み入り、F70 で闘技場の入場位置へ移る。コライダは無効。
//   sealed   ボス戦中。背後の門が霧で塞がれて戻れない（コライダ有効）。入場演出の完了で自動的にこの状態になる。
//   open     ボス撃破後（セーブ済みを含む）。霧は消え、通れる。入場演出もボスの再戦もない。
// 遷移: closed → entering → sealed → open（unseal）。プレイヤーが死亡すると entering / sealed → closed（霧が戻る。ボスは
// 同じ `death` / `rest` イベントで自分を戻す）。`unseal()` は撃破の解除で、どの状態からでも open にする。
import type { EventBus } from '../../core/gameEvents';
import { BOSS_ID } from '../boss/boss.system';
import { FOG_GATE } from '../data/fogGate';
import type { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { yawOf } from '../player/movement';
import type { InteractableSpawn } from '../world/level';

export type FogGateState = 'closed' | 'entering' | 'sealed' | 'open';

/** 入場演出が終わったときの通知。 */
export interface FogGateEntered {
  /** 闘技場の入場位置（足元の水平位置）。 */
  readonly position: { readonly x: number; readonly z: number };
  /** そこで向いている向き（ヨー。闘技場の中心）。 */
  readonly yaw: number;
}

const DEG = Math.PI / 180;

/** 入場演出の画面のヴェール（覆う霧）の濃さ 0..1。`frame` は演出開始からのフレーム（負なら 0）。 */
export function entryVeil(frame: number): number {
  const { veilStartFrame: a, veilFullFrame: b, veilClearFrame: c } = FOG_GATE;
  const smooth = (t: number): number => {
    const k = Math.min(1, Math.max(0, t));
    return k * k * (3 - 2 * k);
  };
  if (frame < 0) return 0;
  if (frame < b) return smooth((frame - a) / (b - a));
  return 1 - smooth((frame - b) / (c - b));
}

export class FogGate {
  private current: FogGateState;
  private entryFrame = -1;
  private unlock: (() => void) | null = null;
  private readonly enteredListeners = new Set<(e: FogGateEntered) => void>();
  private readonly stateListeners = new Set<(s: FogGateState, prev: FogGateState) => void>();
  /** 門の前方（通り抜ける向き）の単位ベクトルと、向き（ヨー）。 */
  private readonly forward: { x: number; z: number };
  private readonly gateYaw: number;
  private readonly target: { x: number; z: number; yaw: number };

  constructor(
    private readonly game: Game,
    private readonly spawn: InteractableSpawn,
    yawDeg: number,
  ) {
    this.gateYaw = yawDeg * DEG;
    this.forward = { x: Math.sin(this.gateYaw), z: Math.cos(this.gateYaw) };
    this.target = spawn.target ?? {
      x: spawn.x + this.forward.x * 8,
      z: spawn.z + this.forward.z * 8,
      yaw: this.gateYaw,
    };
    this.current = this.isDefeatedInSave() ? 'open' : 'closed';
    this.applyCollider();
    interactionOf(game).register({
      id: spawn.id,
      kind: 'gate',
      x: spawn.x,
      z: spawn.z,
      radius: FOG_GATE.radiusM,
      label: () => '霧へ入る',
      available: () => this.current === 'closed',
      interact: () => {
        this.enter();
      },
    });
    // プレイヤーの死亡（演出の開始）・リスポーンで霧が戻る
    game.events.on('death', (e) => {
      if (e.phase === 'start') this.reset();
    });
    game.events.on('rest', (e) => {
      if (e.cause === 'respawn') this.reset();
    });
    // ボス撃破演出（#86）の `bossDefeatCue`（cue: 'fogClear'、F300）で解除する。イベント定義が main に入る前後どちらでも
    // 動くよう、キーを文字列で購読する（定義が入ったら型付きの購読へ置き換えてよい）。
    (game.events as unknown as EventBus<Record<string, { readonly cue?: string }>>).on(
      'bossDefeatCue',
      (e) => {
        if (e.cue === 'fogClear') this.unseal();
      },
    );
  }

  get id(): string {
    return this.spawn.id;
  }

  get position(): { readonly x: number; readonly z: number } {
    return this.spawn;
  }

  get state(): FogGateState {
    return this.current;
  }

  /** 霧の壁が見えているか（open 以外）。 */
  get fogVisible(): boolean {
    return this.current !== 'open';
  }

  /** 通れないか（コライダが有効な状態）。 */
  get blocked(): boolean {
    return this.current === 'closed' || this.current === 'sealed';
  }

  /** 入場演出の経過フレーム（演出中と、ヴェールが晴れるまで。それ以外は -1）。 */
  get entryProgress(): number {
    return this.entryFrame;
  }

  /** 入場演出の画面のヴェール 0..1。 */
  get veil(): number {
    return entryVeil(this.entryFrame);
  }

  /** 入場演出中（操作不能）。 */
  get entering(): boolean {
    return this.current === 'entering';
  }

  /** 闘技場の入場位置と向き。 */
  get arrival(): FogGateEntered {
    return { position: { x: this.target.x, z: this.target.z }, yaw: this.target.yaw };
  }

  /** 門の通り抜ける向き（ヨー）。 */
  get yaw(): number {
    return this.gateYaw;
  }

  /**
   * 封鎖する（背後の門を霧で塞ぐ）。入場演出の完了で自動的に呼ばれるので、通常はボス側が呼ぶ必要はない。
   * すでに sealed、または入場演出中（完了時に封鎖される）なら false。
   */
  seal(): boolean {
    if (this.current === 'sealed' || this.current === 'entering') return false;
    this.setState('sealed');
    return true;
  }

  /**
   * 解除する（ボス撃破）。霧が消えて通れるようになる（open）。再戦はしない。演出中なら打ち切る。
   * すでに open なら false。
   */
  unseal(): boolean {
    if (this.current === 'open') return false;
    this.abortEntry();
    this.setState('open');
    return true;
  }

  /** 入場演出が終わったときの通知を購読する。戻り値で購読解除。 */
  onEntered(listener: (e: FogGateEntered) => void): () => void {
    this.enteredListeners.add(listener);
    return () => this.enteredListeners.delete(listener);
  }

  /** 状態の変化を購読する。戻り値で購読解除。 */
  onStateChange(listener: (state: FogGateState, prev: FogGateState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** 入場演出を始める（状況アクション「霧へ入る」の実行。デバッグ・テストからも呼べる）。始めたら true。 */
  enter(): boolean {
    if (this.current !== 'closed') return false;
    const { game } = this;
    this.setState('entering');
    this.entryFrame = 0;
    this.unlock = interactionOf(game).lock();
    game.lockOn.release('external');
    game.player.beginForcedWalk(FOG_GATE.enterFrames, () => this.walkYaw());
    return true;
  }

  /** 毎ステップ（`fogGate.system.ts`）。 */
  update(): void {
    if (this.current === 'closed' && this.isDefeatedInSave()) {
      this.setState('open'); // 撃破済みのセーブ（撃破の記録のあと）
    }
    if (this.entryFrame < 0) return;
    this.entryFrame++;
    if (this.current === 'entering') {
      if (this.game.player.dead) {
        this.reset();
        return;
      }
      if (this.entryFrame === FOG_GATE.teleportFrame) this.arrive();
      if (this.entryFrame >= FOG_GATE.enterFrames) this.finishEntry();
    }
    if (this.entryFrame > FOG_GATE.veilClearFrame && this.current !== 'entering') {
      this.entryFrame = -1;
    }
  }

  /** プレイヤーの向き: 入場位置へ移るまでは門の向こうへ、移ったあとは闘技場の中心へ。 */
  private walkYaw(): number {
    if (this.entryFrame >= FOG_GATE.teleportFrame) return this.target.yaw;
    const { feet } = this.game.player;
    const tx = this.spawn.x + this.forward.x * FOG_GATE.walkAheadM;
    const tz = this.spawn.z + this.forward.z * FOG_GATE.walkAheadM;
    return yawOf(tx - feet.x, tz - feet.z);
  }

  private arrive(): void {
    const { game, target } = this;
    game.teleportPlayer(target.x, target.z, target.yaw);
    // 移ったあとも残りの演出ぶん闘技場の中へ歩く（`teleport` は強制歩行を終えるので掛け直す）
    game.player.beginForcedWalk(FOG_GATE.enterFrames - this.entryFrame, () => this.walkYaw());
  }

  private finishEntry(): void {
    this.releaseLock();
    this.game.player.cancelForcedWalk();
    this.setState('sealed'); // 背後の門が塞がれる（コライダ有効）
    const arrival = this.arrival;
    for (const l of [...this.enteredListeners]) l(arrival);
  }

  private abortEntry(): void {
    if (this.current !== 'entering') return;
    this.releaseLock();
    this.game.player.cancelForcedWalk();
  }

  /** プレイヤーの死亡・リスポーン: 霧が戻る（closed）。撃破済みなら open のまま。 */
  private reset(): void {
    if (this.current === 'open') return;
    this.abortEntry();
    this.entryFrame = -1;
    this.setState(this.isDefeatedInSave() ? 'open' : 'closed');
  }

  private releaseLock(): void {
    this.unlock?.();
    this.unlock = null;
  }

  private isDefeatedInSave(): boolean {
    return this.game.save.get().bosses.includes(BOSS_ID);
  }

  private setState(next: FogGateState): void {
    const prev = this.current;
    if (prev === next) return;
    this.current = next;
    this.applyCollider();
    for (const l of [...this.stateListeners]) l(next, prev);
  }

  private applyCollider(): void {
    this.game.setBoxEnabled(this.spawn.id, this.blocked);
  }
}

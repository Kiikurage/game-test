import type { BossDefeatCue, Vec3Like } from '../../core/gameEvents';
import { bonfiresOf } from '../bonfire/bonfire';
import { cameraEffectsOf } from '../camera/cameraEffects.system';
import { ARENA_BONFIRE_ID } from '../data/bonfire';
import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { BOSS_DEFEAT, defeatCuesBetween, defeatDissolve, defeatFogDensity } from './bossDefeat';

/**
 * ボス撃破演出の進行（#86 / 仕様書 6.6・8.4 節）。`bossDefeated`（F0）に同期して、節目（`bossDefeatCue`）・カメラ・SE・
 * BGM フェードアウト・撃破のセーブ・台座の篝火を発行する。描画（崩壊・ディゾルブ・熾火・篝火の点火・霧）は
 * `render/boss/bossDefeat.view.ts` が `frame` を読む。タイムラインの表は `bossDefeat.ts`。
 *
 *   const defeat = bossDefeatOf(game);
 *   defeat.frame;                     // 撃破からのステップ数（撃破していなければ -1）
 *   defeat.on('fogClear', () => ...); // 節目の購読（霧の門 `unseal()` など）
 *   game.events.on('bossDefeatCue', (e) => ...);  // 同じ節目（`text` = 撃破テキスト、`control` = 操作可能）
 *
 * | F | 発行 |
 * | --- | --- |
 * | 0 | `defeat`・撃破のセーブ（`gametest.save.v1` の `bosses`。以降ボスは出ない）・`sfx.boss.defeat` |
 * | 62 | `touchdown`・`bossSlam`（砂塵）・画面振動 |
 * | 72 | `collapse`・`bgmFadeOut`（90F）・`sfx.defeat-ash` |
 * | 150 | `text`（「門番、潰えたり」。UI は E6-3b） |
 * | 300 | `fogClear`（霧の門が存在すれば `unseal()`）・`bonfire`（台座の篝火が灯る。`ui.bonfire-light`） |
 * | 360 | `control`（操作可能。台座の篝火で休める） |
 *
 * 台座の篝火で休憩したら `verticalSliceEnd`（垂直スライス終了画面 E6-4b の合図）を発行する。
 * 撃破済みのセーブから始めたときはボスも演出も出ず、台座の篝火は最初から灯っている（`BonfireController`）。
 */
export class BossDefeatDirector {
  private f = -1;
  private position: Vec3Like = { x: 0, y: 0, z: 0 };
  private bossId = 'boss';
  private readonly listeners = new Map<BossDefeatCue, Set<() => void>>();

  constructor(private readonly game: Game) {
    game.events.on('bossDefeated', (e) => {
      this.begin(e.id, e.position);
    });
    // 新しい戦闘（確認用にボスを出し直したときなど）で撃破演出は終わる
    game.events.on('bossEngaged', () => {
      this.f = -1;
    });
    game.events.on('rest', (e) => {
      if (e.cause === 'rest' && e.bonfireId === ARENA_BONFIRE_ID) {
        game.events.emit('verticalSliceEnd', { bonfireId: e.bonfireId });
      }
    });
  }

  /** 撃破からのステップ数（F0 = 撃破のステップ）。撃破していなければ -1。演出が終わっても増え続ける。 */
  get frame(): number {
    return this.f;
  }

  /** 撃破演出の途中か（F0–F360）。 */
  get active(): boolean {
    return this.f >= 0 && this.f < BOSS_DEFEAT.control;
  }

  /** 操作可能になったか（F360 以降。撃破済みのセーブから始めた場合も true）。 */
  get controlRestored(): boolean {
    return this.f < 0 || this.f >= BOSS_DEFEAT.control;
  }

  /** ディゾルブの進行 0..1（描画・確認用）。 */
  get dissolve(): number {
    return this.f < 0 ? 0 : defeatDissolve(this.f);
  }

  /** 撃破演出のフォグ密度（仕様書 8.4 節の 0.04 → 0.015）。 */
  get fogDensity(): number {
    return defeatFogDensity(this.f);
  }

  /** 節目を購読する（イベント `bossDefeatCue` の短縮）。戻り値で購読解除。 */
  on(cue: BossDefeatCue, handler: () => void): () => void {
    let set = this.listeners.get(cue);
    if (!set) this.listeners.set(cue, (set = new Set()));
    set.add(handler);
    return () => set.delete(handler);
  }

  private begin(id: string, position: Vec3Like): void {
    // 撃破は 1 回だけ（再撃破・デバッグの重複は無視）
    if (this.f >= 0) return;
    this.bossId = id;
    this.position = position;
    this.f = 0;
    this.fire('defeat');
  }

  update(): void {
    if (this.f < 0) return;
    const from = this.f;
    this.f++;
    for (const cue of defeatCuesBetween(from, this.f)) this.fire(cue);
  }

  private fire(cue: BossDefeatCue): void {
    const { game, position } = this;
    game.events.emit('bossDefeatCue', {
      id: this.bossId,
      cue,
      frame: this.f,
      position,
    });
    switch (cue) {
      case 'defeat':
        // 撃破をセーブ（以降ボスは復活しない。通常敵は休憩で復活する）
        game.save.defeatBoss(this.bossId);
        game.events.emit('sound', { cue: 'sfx.boss.defeat', source: 'boss', position });
        break;
      case 'touchdown': {
        game.events.emit('bossSlam', { position, radius: 2.6 });
        game.events.emit('sound', { cue: 'sfx.boss.slam', source: 'boss', position });
        const feet = game.player.feet;
        cameraEffectsOf(game).slam(Math.hypot(position.x - feet.x, position.z - feet.z));
        break;
      }
      case 'collapse':
        game.events.emit('bgmFadeOut', { frames: BOSS_DEFEAT.bgmFadeFrames });
        game.events.emit('sound', { cue: 'sfx.defeat-ash', source: 'boss', position });
        break;
      case 'fogClear':
        unsealFogGate(game);
        break;
      case 'bonfire':
        bonfiresOf(game).revealArenaBonfire(() => this.controlRestored);
        game.events.emit('sound', { cue: 'ui.bonfire-light', source: 'world', position });
        break;
      default:
        break;
    }
    for (const h of [...(this.listeners.get(cue) ?? [])]) h();
  }
}

/** 霧の門（#66）のモジュール。まだなければ空（`fogGateOf` を出していれば `unsealFogGate` が呼ぶ）。 */
const fogGateModules = import.meta.glob<Record<string, unknown>>('../**/fogGate*.system.ts', {
  eager: true,
});

/**
 * 霧の門の解除（`fogGateOf(game).unseal()`）。霧の門が `game/**` の `fogGate*.system.ts` に `fogGateOf` を出していれば呼ぶ。
 * まだなければ何もしない（購読側が `bossDefeatCue` の `fogClear` で呼んでもよい）。
 */
function unsealFogGate(game: Game): void {
  for (const mod of Object.values(fogGateModules)) {
    const of = mod['fogGateOf'];
    if (typeof of !== 'function') continue;
    const gate = (of as (g: Game) => unknown)(game) as { unseal?: () => void } | null | undefined;
    gate?.unseal?.();
  }
}

const directors = new WeakMap<Game, BossDefeatDirector>();

/** `game` のボス撃破演出（描画が `frame` を読む）。 */
export function bossDefeatOf(game: Game): BossDefeatDirector {
  const d = directors.get(game);
  if (!d) throw new Error('boss defeat system is not registered for this game');
  return d;
}

registerGameSystem('boss-defeat', (game) => {
  const director = new BossDefeatDirector(game);
  directors.set(game, director);
  return {
    update: () => {
      director.update();
    },
  };
});

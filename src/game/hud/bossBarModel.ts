import type { GameEventBus } from '../../core/gameEvents';
import { Afterimage, BOSS_AFTERIMAGE } from './afterimage';
import { HUD_FADE_FRAMES } from './hudModel';

/** ボス HP バーの表示仕様（仕様書 9.1 / 6.5 節）。 */
export const BOSS_BAR = {
  /** バーの上に出す名前。 */
  name: '門番の骸 オルグ',
  /** フェーズ移行でバーが白く光る長さ（F）。 */
  glowFrames: 20,
  /** 出現・消去のフェード（F）。 */
  fadeFrames: HUD_FADE_FRAMES,
} as const;

/** ボス HP バーが読む表示用状態（`BossBarModel` が満たす。ui は game に依存しない）。 */
export interface BossBarView {
  readonly name: string;
  /** 目盛りの位置（0..1、バーの左端から）。 */
  readonly boundaries: readonly number[];
  readonly hpRatio: number;
  readonly ghostRatio: number;
  /** フェーズ移行の発光 0..1（1 → 0 を `glowFrames` で）。 */
  readonly glow: number;
  /** 0..1。出現・消去のフェード。 */
  readonly opacity: number;
}

/**
 * ボス HP バーの状態。`attach` でボス戦のイベントを購読し、固定ステップごとに `step()` を呼ぶ（`bossBar.system.ts`）。
 * 残像・発光・フェードのフレーム計算はすべてここに閉じる（DOM 非依存でテストできる）。
 *
 * - 表示: `bossEngaged` で出し、`bossDefeated` / `bossReset` / プレイヤーの死亡（`death` の `start`）で消す。
 * - HP の減少分は白い残像（60F 待って減る）。`bossPhaseBoundary` で 20F 光る。
 */
export class BossBarModel implements BossBarView {
  readonly name: string = BOSS_BAR.name;
  boundaries: readonly number[] = [];
  hpRatio = 1;
  ghostRatio = 1;
  glow = 0;
  opacity = 0;

  private ghost = new Afterimage(1, BOSS_AFTERIMAGE);
  private glowElapsed = Infinity;
  private shown = false;
  private fade = 0;

  /** 表示中（フェードアウト中は false）。 */
  get visible(): boolean {
    return this.shown;
  }

  /** ボス戦のイベントを購読する。戻り値は購読解除。 */
  attach(events: GameEventBus): () => void {
    const offs = [
      events.on('bossEngaged', (e) => {
        this.hpRatio = ratio(e.hp, e.maxHp);
        this.boundaries = e.boundaries.map((hp) => ratio(hp, e.maxHp));
        this.ghost = new Afterimage(this.hpRatio, BOSS_AFTERIMAGE);
        this.ghostRatio = this.hpRatio;
        this.glowElapsed = Infinity;
        this.glow = 0;
        this.shown = true;
      }),
      events.on('bossHpChanged', (e) => {
        this.hpRatio = ratio(e.hp, e.maxHp);
      }),
      events.on('bossPhaseBoundary', () => {
        // 次の `step` で 0 になる（その `step` から数えて `glowFrames` 回の間光る）
        this.glowElapsed = -1;
      }),
      events.on('bossDefeated', () => {
        this.shown = false;
      }),
      events.on('bossReset', () => {
        this.shown = false;
      }),
      events.on('death', (e) => {
        if (e.phase === 'start') this.shown = false;
      }),
    ];
    return () => {
      for (const off of offs) off();
    };
  }

  /** 1 ステップ（1F）進める。 */
  step(): void {
    this.ghost.step(this.hpRatio);
    this.ghostRatio = this.ghost.ghost;

    if (this.glowElapsed !== Infinity) this.glowElapsed++;
    this.glow = Math.max(0, 1 - this.glowElapsed / BOSS_BAR.glowFrames);
    if (this.glow === 0) this.glowElapsed = Infinity;

    // 整数のフレーム数で進める（浮動小数の誤差を溜めない）
    this.fade = Math.min(BOSS_BAR.fadeFrames, Math.max(0, this.fade + (this.shown ? 1 : -1)));
    this.opacity = this.fade / BOSS_BAR.fadeFrames;
  }
}

function ratio(current: number, max: number): number {
  return max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
}

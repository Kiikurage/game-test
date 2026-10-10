import { Vector3 } from 'three/webgpu';
import type { Boss } from '../../game/boss/boss';
import {
  BOSS_DEFEAT,
  deathClipProgress,
  defeatDissolve,
  defeatEmber,
} from '../../game/boss/bossDefeat';
import { bossDefeatOf } from '../../game/boss/bossDefeat.system';
import type { Game } from '../../game/game';
import type { CharacterAnimState } from '../anim/characterAnimator';
import type { BossCharacter } from '../assets/bossCharacter';
import type { GameView } from '../gameView';
import type { EmberField } from '../particles';

/** 崩壊の灰を出す間隔（撃破 F。F72–F162 の間）。 */
const ASH_INTERVAL = 7;
/** 灰のバーストの体積（ボスの 2.2 倍の体格に合わせた円柱）。 */
const ASH_RADIUS = 1.5;
const ASH_HEIGHT = 4;
/** 上空へ舞い上がる熾火の柱。F72 から点き、`EMBER_COLUMN_END` で消え始める。 */
const EMBER_COLUMN = { radius: 1.7, height: 11 } as const;
const EMBER_COLUMN_END = BOSS_DEFEAT.collapse + 190;

/**
 * 表示用の撃破 F を進める。撃破のステップの値（`f`）へ追いつき、次のステップの手前までは実時間（`timeScale` 倍）で進める。
 * スローモーション（0.3 倍速）では 1 ステップが約 3.3 フレームなので、この補間で動きがなめらかになる。`f < 0` は -1。
 */
export function advanceShownFrame(shown: number, f: number, dt: number, timeScale: number): number {
  if (f < 0) return -1;
  if (shown < 0) return f;
  return Math.min(Math.max(shown + dt * 60 * timeScale, f), f + 0.999);
}

/**
 * ボス撃破の見た目（#86 / 8.4 節）。`bossDefeatOf(game).frame`（撃破からのステップ数）に同期する。
 *  - F12–F72: `Death01` で膝をつき崩れ落ちる（ヒットストップの間は止まる）。亀裂・眼窩が燃え上がる（熾火）。
 *  - F72–F162: 全身が灰になって消えるディゾルブ（亡者マテリアルのしきい値。縁が橙に燃える）。灰と熾火が剥がれて舞い上がり、
 *    上空へ昇る熾火の柱が立つ。
 * 表示用の F は実時間で進めて、ステップの間（スローモーションの 0.3 倍速では 1 ステップが約 3.3 フレーム）を補間する。
 */
export class BossDefeatFx {
  private shown = -1;
  private nextAsh = 0;
  private column: EmberField | null = null;
  private columnOff = false;
  private readonly feet = new Vector3();

  constructor(
    private readonly game: Game,
    private readonly view: GameView,
    private readonly model: BossCharacter,
  ) {}

  /** 表示中の撃破 F（小数。撃破していなければ -1）。 */
  get frame(): number {
    return this.shown;
  }

  /** 体がまだ見えているか（撃破後、灰になって消え切るまで）。 */
  get visible(): boolean {
    const f = Math.max(this.shown, bossDefeatOf(this.game).frame);
    return f >= 0 && defeatDissolve(f) < 1;
  }

  /** 毎フレーム（ボスの位置の同期の後、LOD 更新の前）。 */
  update(dt: number, boss: Boss): void {
    const f = bossDefeatOf(this.game).frame;
    if (f < 0 || boss.alive) {
      if (this.shown >= 0) this.reset();
      return;
    }
    this.shown = advanceShownFrame(this.shown, f, dt, this.game.timeScale.current);
    const shown = this.shown;
    const { model } = this;
    const dissolve = defeatDissolve(shown);
    model.look.setDissolve(dissolve);
    // 崩れ落ちる間に燃え上がり、消え切ったら熾火の足元の粒も止める（フェーズ 2 は元から最大）
    model.setEmber(dissolve >= 1 ? 0 : Math.max(defeatEmber(shown), boss.phase === 2 ? 1 : 0));

    if (shown >= BOSS_DEFEAT.collapse && dissolve < 1) this.emitAsh(shown, boss);
    this.updateColumn(shown, boss);
  }

  /** 撃破中のアニメーション状態（`Death01`。ヒットストップの間は先頭で止まる）。撃破していなければ `base` のまま。 */
  animState(base: CharacterAnimState): CharacterAnimState {
    if (this.shown < 0) return base;
    const p = deathClipProgress(this.shown);
    return {
      ...base,
      state: 'dead',
      kind: 'dead',
      actionId: null,
      // `CharacterAnimator` は状態フレーム F1 を再生位置 0 として読む
      stateFrame: p * BOSS_DEFEAT.clipFrames + 1,
      totalFrames: BOSS_DEFEAT.clipFrames,
      speed: 0,
      localVelocity: { x: 0, z: 0 },
      lockedOn: false,
      gaitPhaseStep: 0,
      frozen: false,
    };
  }

  private emitAsh(shown: number, boss: Boss): void {
    const { particles } = this.view;
    this.feet.copy(boss.position);
    if (this.nextAsh <= 0) {
      // 崩壊の頭: 体全体から一斉に剥がれる
      particles.deathAsh(this.feet, ASH_RADIUS, ASH_HEIGHT, 2.2);
      this.nextAsh = shown + ASH_INTERVAL;
      return;
    }
    if (shown < this.nextAsh) return;
    this.nextAsh = shown + ASH_INTERVAL;
    // 時間とともに上へ昇りながら薄れていく: 体の上半分から出して、舞い上がりを強める
    const k = defeatDissolve(shown);
    particles.deathAsh(this.feet, ASH_RADIUS * (1 - 0.3 * k), ASH_HEIGHT, 1.6 + 1.4 * k);
  }

  /** 上空へ昇る熾火の柱（F72 から。ディゾルブが終わったあともしばらく昇り続けて消える）。 */
  private updateColumn(shown: number, boss: Boss): void {
    if (shown >= BOSS_DEFEAT.collapse && !this.column && !this.columnOff) {
      this.column = this.view.particles.acquireEmberField(
        boss.position.x,
        boss.position.y,
        boss.position.z,
        EMBER_COLUMN.radius,
        EMBER_COLUMN.height,
      );
    }
    if (this.column && shown >= EMBER_COLUMN_END && !this.columnOff) {
      this.columnOff = true;
      this.column.setActive(false);
    }
    if (this.column && this.columnOff && shown >= EMBER_COLUMN_END + 600) {
      this.view.particles.releaseEmberField(this.column);
      this.column = null;
    }
  }

  /** 撃破していない状態へ戻す（ボスを出し直した）。 */
  private reset(): void {
    this.shown = -1;
    this.nextAsh = 0;
    this.columnOff = false;
    if (this.column) this.view.particles.releaseEmberField(this.column);
    this.column = null;
    this.model.look.setDissolve(0);
  }
}

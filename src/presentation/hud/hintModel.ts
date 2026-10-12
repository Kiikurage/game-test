import type { Action } from '../../core/input';
import { HINTS, type HintDef } from './guideData';

/** 1 ステップ分の観測（`hudPresentation.ts` が作る）。 */
export interface HintSample {
  readonly dt: number;
  /** 移動入力の大きさ 0..1。 */
  readonly moveMagnitude: number;
  /** このステップのカメラ回転量（rad、大きさ）。 */
  readonly lookMagnitude: number;
  readonly pressed: ReadonlySet<Action>;
  readonly lockedOn: boolean;
  /** 生きている敵が近くにいる。 */
  readonly enemyNear: boolean;
  /** 死亡中など、ヒントを出さない。 */
  readonly suppressed: boolean;
}

/**
 * 操作ヒントの進行。ヒントはグループ内で順番に出し、達成すると次へ進む（セッション内のみ。セーブしない）。
 * 敵が近いとき（combat）は開始時（opening）より優先する。DOM 非依存。
 */
export class HintModel {
  private readonly done = new Set<string>();
  private readonly progress = new Map<string, number>();
  private elapsed = 0;
  /** 表示中のヒント（なければ null）。 */
  current: HintDef | null = null;

  constructor(
    private readonly hints: readonly HintDef[] = HINTS,
    private readonly delaySeconds = 0,
  ) {}

  isDone(id: string): boolean {
    return this.done.has(id);
  }

  step(s: HintSample): void {
    this.elapsed += s.dt;
    // 表示中のヒントだけ達成を判定する（表示されていないものは進めない）
    const cur = this.current;
    if (cur && this.achieved(cur, s)) this.done.add(cur.id);
    this.current = s.suppressed ? null : this.pick(s);
  }

  private pick(s: HintSample): HintDef | null {
    if (s.enemyNear) {
      const combat = this.firstPending('combat');
      if (combat) return combat;
    }
    if (this.elapsed < this.delaySeconds) return null;
    return this.firstPending('opening');
  }

  private firstPending(group: HintDef['group']): HintDef | null {
    return this.hints.find((h) => h.group === group && !this.done.has(h.id)) ?? null;
  }

  private achieved(h: HintDef, s: HintSample): boolean {
    const g = h.goal;
    switch (g.type) {
      case 'move': {
        if (s.moveMagnitude < g.threshold) return false;
        const t = (this.progress.get(h.id) ?? 0) + s.dt;
        this.progress.set(h.id, t);
        return t >= g.seconds;
      }
      case 'look': {
        const r = (this.progress.get(h.id) ?? 0) + s.lookMagnitude;
        this.progress.set(h.id, r);
        return r >= g.radians;
      }
      case 'press':
        return s.pressed.has(g.action);
      case 'lockOn':
        return s.lockedOn || s.pressed.has('lockOn');
    }
  }
}

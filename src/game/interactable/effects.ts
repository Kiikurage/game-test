// Effect の実行エンジン（#122、仕様書 14.8 節）。Game 非依存の純粋なロジックで、副作用は `EffectHost` に任せる。
// - Effect は配列の順に 1 つずつ実行する。
// - `requires`（flagSet / flagUnset）を満たさない対象は使えない（`isUsable`）。
// - `once`: loot は取得済み（`loot.<id>` フラグ）なら非表示。他の種別は 2 回目以降は効果を実行しない（`done.<id>`）。
// - `cooldownF`: 実行から `cooldownF` ステップは使えない。
// - read は実行すると読んだ印（`read.<id>`）を立てる。loot は終わると `loot.<id>` を立てる。
import { lootFlag, readFlag, shownFlag } from '../data/world/lootTuning';
import type { Effect, Interactable } from '../data/world/types';

/** Effect の副作用の窓口。実装のない種別（emitSound など。#123）は省略してよい（何もしない）。 */
export interface EffectHost {
  hasFlag(flag: string): boolean;
  setFlag(flag: string): void;
  showText(textId: string): void;
  playSound?(cue: string, source: Interactable): void;
  giveItem(itemId: string, count: number, source: Interactable): void;
  emitSound?(radiusM: number, kind: 'bell' | 'crash', source: Interactable): void;
  playClip?(clip: string, durationF: number, source: Interactable): void;
  ambientDuck?(db: number, frames: number): void;
  dialogue?(lines: readonly string[], onEnd: () => void): void;
}

export const doneFlag = (id: string): string => `done.${id}`;

export function runEffects(
  effects: readonly Effect[],
  host: EffectHost,
  source: Interactable,
): void {
  for (const e of effects) {
    switch (e.type) {
      case 'showText':
        // 初回だけの文（鐘）: 出したら印を残し、2 回目以降は出さない
        if (e.firstOnly) {
          if (host.hasFlag(shownFlag(e.textId))) break;
          host.setFlag(shownFlag(e.textId));
        }
        host.showText(e.textId);
        break;
      case 'playSound':
        host.playSound?.(e.cue, source);
        break;
      case 'giveItem':
        host.giveItem(e.itemId, e.count ?? 1, source);
        break;
      case 'setFlag':
        host.setFlag(e.flag);
        break;
      case 'emitSound':
        host.emitSound?.(e.radiusM, e.kind, source);
        break;
      case 'playClip':
        host.playClip?.(e.clip, e.durationF, source);
        break;
      case 'ambientDuck':
        host.ambientDuck?.(e.db, e.frames);
        break;
      case 'dialogue':
        host.dialogue?.(e.lines, () => {
          runEffects(e.onEnd ?? [], host, source);
        });
        break;
    }
  }
}

/** 対象ごとの実行状態（クールダウン）を持ち、使えるか・実行を判定する。 */
export class InteractableRunner {
  private step = 0;
  private readonly lastFired = new Map<string, number>();

  constructor(private readonly host: EffectHost) {}

  /** 1 ステップ進める（クールダウンの計時）。 */
  update(): void {
    this.step++;
  }

  /** 取得済み（loot）・実行済み（once）か。 */
  isDone(def: Interactable): boolean {
    if (!def.once) return false;
    return this.host.hasFlag(def.kind === 'loot' ? lootFlag(def.id) : doneFlag(def.id));
  }

  cooldownRemaining(def: Interactable): number {
    const last = this.lastFired.get(def.id);
    if (last === undefined || def.cooldownF === undefined) return 0;
    return Math.max(0, last + def.cooldownF - this.step);
  }

  /** 状況ボタンの候補にしてよいか（requires・取得済み・クールダウン）。once の loot 以外の `once` は候補に残す。 */
  isUsable(def: Interactable): boolean {
    const { requires } = def;
    if (requires?.flagSet !== undefined && !this.host.hasFlag(requires.flagSet)) return false;
    if (requires?.flagUnset !== undefined && this.host.hasFlag(requires.flagUnset)) return false;
    if (def.kind === 'loot' && this.isDone(def)) return false;
    return this.cooldownRemaining(def) === 0;
  }

  /** 使えるかの判定を通さずに効果だけ実行する（壊れた壁・割れた床板など、状況ボタンを介さない対象）。 */
  run(def: Interactable): void {
    runEffects(def.effects, this.host, def);
  }

  /** 効果を実行する（使えないときは何もしない。戻り値は実行したか）。loot の動作時間は呼び出し側が待ってから呼ぶ。 */
  fire(def: Interactable): boolean {
    if (!this.isUsable(def)) return false;
    // once の非 loot は 2 回目以降、文を出さない（印だけ残る）
    if (def.once && def.kind !== 'loot' && this.isDone(def)) return false;
    if (def.kind === 'read') this.host.setFlag(readFlag(def.id));
    runEffects(def.effects, this.host, def);
    if (def.once) this.host.setFlag(def.kind === 'loot' ? lootFlag(def.id) : doneFlag(def.id));
    if (def.cooldownF !== undefined) this.lastFired.set(def.id, this.step);
    return true;
  }
}

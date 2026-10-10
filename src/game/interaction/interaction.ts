// インタラクション基盤（#55）: 近くの「調べる」対象を 1 つ選び、状況アクションとして公開し、入力で実行する。
//
// 篝火・レバー・霧の門・アイテム・碑文などが共通で使う。対象は `InteractionManager.register` で登録し、
// 毎ステップ `interaction.system.ts` が最寄りを選んで `prompt`（HUD が購読）を更新、入力があれば `interact()` を呼ぶ。
// このファイルは純粋なロジック（Game・three 非依存）なので単体でテストできる。
//
// 使い方（後続の機能）:
//   const off = interactionOf(game).register({
//     id: 'lever-g1', kind: 'lever', x, z, radius: 1.2,
//     label: () => '押す',
//     available: () => !opened,          // 省略可。false の間は候補にならない
//     interact: () => { ... },           // 実行。時間のかかる動作は player.beginScripted や lock() を使う
//   });
import { INTERACT } from '../data/bonfire';
import type { Game } from '../game';

/** 調べられる対象。座標は水平（x, z）。 */
export interface Interactable {
  readonly id: string;
  /** 種別（'bonfire' / 'lever' / 'gate' / 'item' / 'read' など）。HUD のアイコンの出し分けに使う。 */
  readonly kind: string;
  readonly x: number;
  readonly z: number;
  /** 反応半径（m、境界を含む）。既定は `INTERACT.defaultRadiusM`。 */
  readonly radius?: number;
  /** 状況ボタンの文言（状態で変わってよい。例: 篝火は「火を灯す」「休む」「立ち上がる」）。 */
  label(): string;
  /** false の間は候補にならない（取得済みのアイテム・条件を満たさない対象）。省略時は常に true。 */
  available?(): boolean;
  /** 実行する（状況アクションの入力が押され、実行可能なとき 1 回呼ばれる）。 */
  interact(): void;
}

/** HUD が読む状況アクション。 */
export interface InteractPrompt {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
}

export interface InteractionStepInput {
  /** プレイヤーの足元（水平）。 */
  readonly x: number;
  readonly z: number;
  /** 状況アクションを受け付けられるか（他の動作中・死亡中・実行中は false）。false の間は prompt も出ない。 */
  readonly canAct: boolean;
  /** 状況アクションのボタンがこのステップで押された。 */
  readonly pressed: boolean;
}

export class InteractionManager {
  private readonly items: Interactable[] = [];
  private current: InteractPrompt | null = null;
  private readonly listeners = new Set<(prompt: InteractPrompt | null) => void>();
  private locks = 0;

  /** 登録する。同じ id の重複はエラー。戻り値は登録解除。 */
  register(item: Interactable): () => void {
    if (this.items.some((i) => i.id === item.id)) {
      throw new Error(`interactable "${item.id}" already registered`);
    }
    this.items.push(item);
    return () => {
      const i = this.items.indexOf(item);
      if (i >= 0) this.items.splice(i, 1);
    };
  }

  get(id: string): Interactable | undefined {
    return this.items.find((i) => i.id === id);
  }

  get all(): readonly Interactable[] {
    return this.items;
  }

  /**
   * (x, z) に最も近い、反応半径内の対象（`available` なもの）。距離が同じなら先に登録したもの。
   * 半径の境界ちょうどは含む。
   */
  select(x: number, z: number): Interactable | null {
    let best: Interactable | null = null;
    let bestDist = Infinity;
    for (const item of this.items) {
      if (item.available && !item.available()) continue;
      const d = Math.hypot(item.x - x, item.z - z);
      if (d > (item.radius ?? INTERACT.defaultRadiusM) + 1e-9) continue;
      if (d < bestDist - 1e-9) {
        best = item;
        bestDist = d;
      }
    }
    return best;
  }

  /** 公開中の状況アクション（なければ null）。 */
  get prompt(): InteractPrompt | null {
    return this.current;
  }

  /** 状況アクションの変化（出た・消えた・文言が変わった）を購読する。戻り値は購読解除。 */
  onPromptChange(listener: (prompt: InteractPrompt | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** 実行中か（`lock` 中）。 */
  get busy(): boolean {
    return this.locks > 0;
  }

  /**
   * 時間のかかる実行の間、他の状況アクションを止める（会話・演出など、プレイヤーの状態では表せないもの）。
   * 戻り値の関数で解除する（二重に呼んでも安全）。
   */
  lock(): () => void {
    this.locks++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.locks--;
    };
  }

  /**
   * 1 ステップ進める。最寄りを選んで `prompt` を更新し、押されていれば実行する。
   * 実行した対象を返す（なければ null）。
   */
  step(input: InteractionStepInput): Interactable | null {
    const target = input.canAct && !this.busy ? this.select(input.x, input.z) : null;
    this.setPrompt(target && { id: target.id, kind: target.kind, label: target.label() });
    if (!target || !input.pressed) return null;
    target.interact();
    // 実行で文言・可否が変わる（点火 → 休む）。いったん消し、次のステップで選び直す（実行中は canAct が false）。
    this.setPrompt(null);
    return target;
  }

  private setPrompt(next: InteractPrompt | null): void {
    const prev = this.current;
    if (prev?.id === next?.id && prev?.kind === next?.kind && prev?.label === next?.label) return;
    this.current = next;
    for (const l of [...this.listeners]) l(next);
  }
}

const managers = new WeakMap<Game, InteractionManager>();

/** `game` のインタラクション（なければ作る）。各機能のシステムはこれに対象を登録する。 */
export function interactionOf(game: Game): InteractionManager {
  let m = managers.get(game);
  if (!m) {
    m = new InteractionManager();
    managers.set(game, m);
  }
  return m;
}

// データ駆動のインタラクト（#122）。`Interactable`（データ）を、インタラクション基盤（#55）の対象として登録し、
// 状況ボタンの入力で `Effect` を実行する。実動作があるのは read（読む）と loot（調べる）。
//
// - read: 立ち止まらずに実行。文（テキストパネル。最長 6 秒・2m 移動で閉じる）を出し、`read.<id>` をセーブする。
// - loot: `LOOT.frames` フレームかがむ（`interact` 状態。この間は無防備）。`LOOT.effectFrame` で効果（取得・文）が出る。
//   途中で被弾して動作が中断されたら出ない。終わると `loot.<id>` をセーブし、非表示になる。
// - giveItem: 所持数をセーブし、`ITEM_DEFS` の効果を適用して `itemPicked` を発行する（アイテム取得 #67 と同じ経路）。
import { ITEM, ITEM_DEFS } from '../data/items';
import { INTERACT_VERBS, lookupText } from '../data/texts';
import { IMPLEMENTED_KINDS } from '../data/world/interactables';
import { LOOT } from '../data/world/lootTuning';
import type { Interactable } from '../data/world/types';
import type { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { yawOf } from '../player/movement';
import { InteractableRunner, type EffectHost } from './effects';

/** セーブのフラグを引く。`boss.<id>` は撃破済みのボス（セーブの `bosses`）。 */
export function hasFlagIn(game: Game, flag: string): boolean {
  if (game.save.hasFlag(flag)) return true;
  return flag.startsWith('boss.') && game.save.get().bosses.includes(flag.slice('boss.'.length));
}

/** 文面データの 1 行（なければ ID）。 */
function textOf(id: string): string {
  const t = lookupText(id);
  return typeof t === 'string' ? t : (t?.join('') ?? id);
}

export class InteractableController {
  private readonly defs = new Map<string, Interactable>();
  private readonly offs = new Map<string, () => void>();
  private readonly runner: InteractableRunner;
  /** 調べる動作中の対象。 */
  private looting: Interactable | null = null;

  constructor(private readonly game: Game) {
    this.runner = new InteractableRunner(this.host());
    // 持っているアイテムの効果を復元する（回復瓶の最大数など）
    for (const def of Object.values(ITEM_DEFS)) {
      if (def.effect && game.save.getCount(def.id) >= 1) this.applyItemEffect(def.id);
    }
  }

  /** 登録した対象の ID。 */
  get ids(): readonly string[] {
    return [...this.defs.keys()];
  }

  /** まだ使える（取得済みでない・条件を満たす）対象の ID。 */
  get usableIds(): readonly string[] {
    return [...this.defs.values()].filter((d) => this.runner.isUsable(d)).map((d) => d.id);
  }

  get isLooting(): boolean {
    return this.looting !== null;
  }

  /** 対象を登録する（実動作のある種別だけ）。戻り値は登録解除。 */
  add(def: Interactable): () => void {
    if (!IMPLEMENTED_KINDS.has(def.kind) || def.prompt === null) {
      throw new Error(`interactable "${def.id}": kind ${def.kind} has no implementation yet`);
    }
    const verb = def.prompt;
    this.defs.set(def.id, def);
    const off = interactionOf(this.game).register({
      id: def.id,
      kind: def.kind,
      x: def.x,
      z: def.z,
      ...(def.radiusM !== undefined ? { radius: def.radiusM } : {}),
      label: () => INTERACT_VERBS[verb],
      available: () => this.runner.isUsable(def),
      interact: () => {
        if (def.kind === 'loot') this.beginLoot(def);
        else this.runner.fire(def);
      },
    });
    const release = () => {
      off();
      this.defs.delete(def.id);
      this.offs.delete(def.id);
    };
    this.offs.set(def.id, release);
    return release;
  }

  /** 毎ステップ（`interactable.system.ts`）。調べる動作の確定・中断を見る。 */
  update(): void {
    this.runner.update();
    const def = this.looting;
    if (!def) return;
    const { player } = this.game;
    if (player.state !== 'interact') {
      this.looting = null; // 被弾などで中断
      return;
    }
    if (player.stateFrame >= LOOT.effectFrame) {
      this.looting = null;
      this.runner.fire(def);
    }
  }

  private beginLoot(def: Interactable): void {
    const { player } = this.game;
    const faceYaw = yawOf(def.x - player.feet.x, def.z - player.feet.z);
    if (player.beginScripted('interact', { frames: LOOT.frames, faceYaw })) this.looting = def;
  }

  private applyItemEffect(itemId: string): void {
    const effect = ITEM_DEFS[itemId]?.effect;
    if (effect?.type === 'flaskMax') this.game.player.flask.increaseMax(effect.amount);
  }

  private host(): EffectHost {
    const { game } = this;
    return {
      hasFlag: (flag) => hasFlagIn(game, flag),
      setFlag: (flag) => {
        game.save.setFlag(flag);
      },
      showText: (textId) => {
        game.events.emit('showText', { id: textId, mode: 'read' });
      },
      giveItem: (itemId, count, source) => {
        const def = ITEM_DEFS[itemId];
        if (!def) return;
        const first = game.save.getCount(itemId) === 0;
        if (def.maxCount !== undefined) {
          game.save.setCount(itemId, Math.min(def.maxCount, game.save.getCount(itemId) + count));
        } else {
          game.save.collectItem(itemId);
        }
        if (first) this.applyItemEffect(itemId);
        game.events.emit('itemPicked', {
          id: source.id,
          itemId,
          name: textOf(def.nameId),
          message: textOf(def.noticeId),
          position: { x: source.x, y: game.heightAt(source.x, source.z), z: source.z },
          noticeSeconds: ITEM.noticeSeconds,
        });
      },
    };
  }
}

const controllers = new WeakMap<Game, InteractableController>();

/** `game` のインタラクト対象の管理（なければ作る）。 */
export function interactablesOf(game: Game): InteractableController {
  let c = controllers.get(game);
  if (!c) {
    c = new InteractableController(game);
    controllers.set(game, c);
  }
  return c;
}

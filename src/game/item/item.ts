// アイテム取得（#67、仕様書 2.1 / 1 章 / 9.1 節）。
//
// - 取得アイテムはレベルの `interactables`（kind: 'item'、`itemId` = `ITEM_DEFS` のキー）から作り、インタラクション基盤に登録する。
// - 入力で `ITEM.pickupFrames` かがみ、`ITEM.grantFrame` で手に入る（効果の適用・セーブ・`itemPicked` イベント）。
//   途中で被弾して動作が中断されたら取得しない。
// - 取得済みはセーブ（`items[itemId] >= 1`）に残り、次回起動では置かない（効果は起動時に再適用する）。
import type { Game } from '../game';
import { ITEM, ITEM_DEFS, type ItemDef, type ItemEffect } from '../data';
import { yawOf } from '../player/movement';
import { interactionOf } from '../interaction/interaction';
import type { InteractableSpawn } from '../world/level';

/** 効果の種類ごとの適用。種類を足すときはここに足す。 */
const EFFECTS: Record<ItemEffect['type'], (game: Game, effect: ItemEffect) => void> = {
  flaskMax: (game, effect) => {
    game.player.flask.increaseMax(effect.amount);
  },
};

interface PlacedItem {
  readonly spawn: InteractableSpawn;
  readonly def: ItemDef;
}

export class ItemController {
  private readonly placed = new Map<string, PlacedItem>();
  private readonly offs = new Map<string, () => void>();
  /** 拾う動作中のアイテム（`spawn.id`）。 */
  private picking: string | null = null;

  constructor(private readonly game: Game) {
    for (const spawn of game.interactableSpawns) {
      const def = spawn.kind === 'item' && spawn.itemId ? ITEM_DEFS[spawn.itemId] : undefined;
      if (!def) continue;
      if (game.save.getCount(def.id) >= 1) {
        // 取得済み: 置かず、効果だけ復元する
        this.applyEffect(def);
        continue;
      }
      const entry: PlacedItem = { spawn, def };
      this.placed.set(spawn.id, entry);
      this.offs.set(
        spawn.id,
        interactionOf(game).register({
          id: spawn.id,
          kind: 'item',
          x: spawn.x,
          z: spawn.z,
          radius: ITEM.radiusM,
          label: () => '拾う',
          interact: () => {
            this.begin(entry);
          },
        }),
      );
    }
  }

  /** 置かれている（未取得の）アイテムの ID（`spawn.id`）。 */
  get ids(): readonly string[] {
    return [...this.placed.keys()];
  }

  /** 拾う動作中か。 */
  get isPicking(): boolean {
    return this.picking !== null;
  }

  /** 毎ステップ（`item.system.ts`）。取得の確定・中断を見る。 */
  update(): void {
    const id = this.picking;
    if (id === null) return;
    const entry = this.placed.get(id);
    const { player } = this.game;
    if (!entry || player.state !== 'interact') {
      this.picking = null; // 被弾などで中断
      return;
    }
    if (player.stateFrame >= ITEM.grantFrame) {
      this.picking = null;
      this.grant(entry);
    }
  }

  private begin(entry: PlacedItem): void {
    const { player } = this.game;
    const faceYaw = yawOf(entry.spawn.x - player.feet.x, entry.spawn.z - player.feet.z);
    if (player.beginScripted('interact', { frames: ITEM.pickupFrames, faceYaw })) {
      this.picking = entry.spawn.id;
    }
  }

  private grant(entry: PlacedItem): void {
    const { game } = this;
    const { spawn, def } = entry;
    if (game.save.getCount(def.id) >= 1) return;
    this.placed.delete(spawn.id);
    this.offs.get(spawn.id)?.();
    this.offs.delete(spawn.id);
    game.save.collectItem(def.id);
    this.applyEffect(def);
    game.events.emit('itemPicked', {
      id: spawn.id,
      itemId: def.id,
      name: def.name,
      message: def.message,
      position: { x: spawn.x, y: game.heightAt(spawn.x, spawn.z), z: spawn.z },
      noticeSeconds: ITEM.noticeSeconds,
    });
  }

  private applyEffect(def: ItemDef): void {
    EFFECTS[def.effect.type](this.game, def.effect);
  }
}

const controllers = new WeakMap<Game, ItemController>();

/** `game` のアイテム（なければ作る）。 */
export function itemsOf(game: Game): ItemController {
  let c = controllers.get(game);
  if (!c) {
    c = new ItemController(game);
    controllers.set(game, c);
  }
  return c;
}

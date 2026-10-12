// アイテム取得（#67、仕様書 2.1 / 1 章 / 9.1 節）。#122 で、データ駆動のインタラクト基盤（`game/interactable`）に統合した。
//
// - 取得アイテムはレベルの `interactables`（kind: 'item'、`itemId` = `ITEM_DEFS` のキー）から、
//   `Interactable`（kind: 'loot'）+ `giveItem` の形で作り、基盤に登録する（動作・取得・セーブ・通知は基盤が行う）。
// - 取得済みはセーブ（`items[itemId] >= 1`）に残り、次回起動では置かない（効果は基盤の起動時に再適用する）。
import { ITEM, ITEM_DEFS } from '../data/items';
import { lootFlag } from '../data/world/lootTuning';
import type { Interactable } from '../data/world/types';
import type { Game } from '../game';
import { interactableSystem } from '../interactable/interactable.system';

export class ItemController {
  private readonly placed = new Set<string>();

  constructor(private readonly game: Game) {
    const base = game.systems.get(interactableSystem);
    for (const spawn of game.interactableSpawns) {
      const def = spawn.kind === 'item' && spawn.itemId ? ITEM_DEFS[spawn.itemId] : undefined;
      if (!def) continue;
      // 取得済みのセーブ（#67 の時点のデータ）は、取得済みの印も立てて置かない
      if (game.save.getCount(def.id) >= 1) game.save.setFlag(lootFlag(spawn.id));
      const interactable: Interactable = {
        id: spawn.id,
        kind: 'loot',
        x: spawn.x,
        z: spawn.z,
        site: 'main',
        radiusM: ITEM.radiusM,
        prompt: 'pick',
        once: true,
        effects: [{ type: 'giveItem', itemId: def.id }],
      };
      base.add(interactable);
      this.placed.add(spawn.id);
    }
  }

  /** 置かれている（未取得の）アイテムの ID（`spawn.id`）。 */
  get ids(): readonly string[] {
    const usable = new Set(this.game.systems.get(interactableSystem).usableIds);
    return [...this.placed].filter((id) => usable.has(id));
  }

  /** 拾う動作中か。 */
  get isPicking(): boolean {
    return this.game.systems.get(interactableSystem).isLooting;
  }
}

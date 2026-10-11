import { WORLD_INTERACTABLES } from '../../game/data/world/interactables';
import { interactablesOf } from '../../game/interactable/interactable';
import { itemsOf } from '../../game/item/item';
import { registerViewPlugin } from '../viewPlugins';
import { LootMarks } from './lootMark';
import { standHeight } from './standHeight';

// 未取得の拾得物・調べる対象（回復瓶 #67・遺品・遺体 #248）の目印。描画は `LootMarks`（共通）。
// 取得したら（`usableIds` から外れたら）消える。遺体は `corpse.view.ts` が別に描く。
registerViewPlugin('item', ({ game, view, level }) => {
  if (!level) return {};
  itemsOf(game); // 回復瓶の取得対象を登録しておく
  const interactables = interactablesOf(game);
  const sites = new Map(WORLD_INTERACTABLES.map((d) => [d.id, d.site]));
  const spots = level.data.interactables
    .filter((i) => i.kind === 'item' || i.kind === 'loot')
    .map((i) => {
      const site = sites.get(i.id);
      const ground =
        i.kind === 'item' ? level.heightAt(i.x, i.z) : standHeight(level, { x: i.x, z: i.z, site });
      return { id: i.id, x: i.x, z: i.z, ground };
    });
  if (spots.length === 0) return {};
  const marks = new LootMarks(view, spots);
  return {
    update: (dt) => {
      const { x, z } = game.player.feet;
      marks.update(dt, new Set(interactables.usableIds), x, z);
    },
  };
});

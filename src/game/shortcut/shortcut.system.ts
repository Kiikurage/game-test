import { SHORTCUT } from '../data/shortcut';
import { registerGameSystem } from '../systems';
import { Shortcut } from './shortcut';

// ショートカット（#65）。ロジックは shortcut.ts。鉄門・レバーは `LevelData.interactables`（'G1' / 'lever-g1'）から作る。
/** ショートカット（`game.systems.get(shortcutSystem)`）。鉄門のないレベル・テストシーンでは null。 */
export const shortcutSystem = registerGameSystem(
  'shortcut',
  (game) => {
    const gate = game.interactableSpawns.find((i) => i.id === SHORTCUT.gateId);
    const lever = game.interactableSpawns.find((i) => i.id === SHORTCUT.leverId);
    if (!gate || !lever) return { state: null as Shortcut | null };
    const shortcut = new Shortcut(game, gate, lever);
    return {
      state: shortcut,
      update: () => {
        shortcut.update();
      },
    };
  },
  // インタラクトの効果（フラグ）を同じステップで反映する
  { after: ['interactable'] },
);

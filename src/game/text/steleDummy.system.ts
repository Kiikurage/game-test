// 暫定: 篝火横の石碑 'stele-a' を「読む」対象にする（#120 の E2E・撮影用）。ダミー文面。
// E11-1a（#122）が Interactable の Effect と本番の文面を入れるときに、このファイルを置き換える。
import { INTERACT_VERBS } from '../data/texts';
import { registerGameSystem } from '../systems';
import { interactionOf } from '../interaction/interaction';

registerGameSystem('steleDummy', (game) => {
  const spawn = game.interactableSpawns.find((i) => i.id === 'stele-a');
  if (spawn) {
    interactionOf(game).register({
      id: spawn.id,
      kind: 'read',
      x: spawn.x,
      z: spawn.z,
      label: () => INTERACT_VERBS.read,
      interact: () => {
        game.events.emit('showText', { id: 'dummy.stele-a', mode: 'read' });
      },
    });
  }
  return {};
});

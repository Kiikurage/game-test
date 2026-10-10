import { FOG_GATE } from '../data/fogGate';
import type { Game } from '../game';
import { registerGameSystem } from '../systems';
import { FogGate } from './fogGate';

// 霧の門（#66）。ロジックは fogGate.ts。霧の門は `LevelData.interactables`（id: 'fog-gate'）から作る。
// game は `Level` を持たないので、門の向き（通り抜ける方向）は闘技場の入場位置（target）への方角から取る。
const gates = new WeakMap<Game, FogGate | null>();

/** `game` の霧の門。霧の門がないレベル・テストシーンでは null（`fogGateOf(game)?.unseal()` と書ける）。 */
export function fogGateOf(game: Game): FogGate | null {
  return gates.get(game) ?? null;
}

registerGameSystem('fogGate', (game) => {
  const spawn = game.interactableSpawns.find((i) => i.id === FOG_GATE.id && i.kind === 'gate');
  if (!spawn) {
    gates.set(game, null);
    return {};
  }
  const yaw = spawn.target
    ? Math.atan2(spawn.target.x - spawn.x, spawn.target.z - spawn.z)
    : Math.PI / 4;
  const gate = new FogGate(game, spawn, (yaw * 180) / Math.PI);
  gates.set(game, gate);
  return {
    update: () => {
      gate.update();
    },
  };
});

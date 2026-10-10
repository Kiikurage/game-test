import { registerGameSystem } from '../systems';
import type { Game } from '../game';
import { GRATE, HATCH } from './waterway';

// 脇道 side_waterway の仕掛け（#111）。腐った床板は踏むと割れて水路へ落ちる（落下ダメージなし）。
// 鉄格子は内側から押して開く（状況ボタン「押す」・90F の演出・セーブは E11）。ここでは割れる・開く状態と
// コライダのオン/オフだけを持ち、E11 は `waterwayOf(game).openGrate()` / `breakHatch()` を呼ぶ。
// 床板の中心は レベルの `interactables`（kind: 'hatch'）から取る。

/** 床板を踏んだと見なす範囲（床板の半幅より少し内側。縁をかすめただけでは割れない）。 */
const HATCH_TRIGGER = HATCH.half - 0.15;

export class WaterwayState {
  hatchBroken = false;
  grateOpen = false;

  constructor(private readonly game: Game) {}

  private spot(kind: 'hatch' | 'grate'): { x: number; z: number } | undefined {
    return this.game.interactableSpawns.find((i) => i.kind === kind);
  }

  /** 床板を割る（コライダを外す）。割れていなければ true。 */
  breakHatch(): boolean {
    if (this.hatchBroken) return false;
    this.hatchBroken = true;
    this.game.setBoxEnabled(HATCH.id, false);
    return true;
  }

  /** 鉄格子を開ける（コライダを外す）。開いていなければ true。 */
  openGrate(): boolean {
    if (this.grateOpen) return false;
    this.grateOpen = true;
    this.game.setBoxEnabled(GRATE.id, false);
    return true;
  }

  update(): void {
    if (this.hatchBroken) return;
    const hatch = this.spot('hatch');
    if (!hatch) return;
    const { player } = this.game;
    const feet = player.feet;
    if (!player.grounded) return;
    if (Math.abs(feet.x - hatch.x) > HATCH_TRIGGER || Math.abs(feet.z - hatch.z) > HATCH_TRIGGER) {
      return;
    }
    // 床板の上（礼拝堂の床の高さ）に立っているときだけ。水路の中（真下）では割れない
    if (feet.y < this.game.heightAt(hatch.x, hatch.z) - 0.5) return;
    this.breakHatch();
  }
}

const states = new WeakMap<Game, WaterwayState>();

/** `game` の水路の仕掛けの状態。 */
export function waterwayOf(game: Game): WaterwayState {
  let state = states.get(game);
  if (!state) {
    state = new WaterwayState(game);
    states.set(game, state);
  }
  return state;
}

registerGameSystem('waterway', (game) => {
  const state = waterwayOf(game);
  return {
    update: () => {
      state.update();
    },
  };
});

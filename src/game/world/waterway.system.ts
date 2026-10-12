import { WORLD_FLAGS } from '../data/world/lootTuning';
import '../interactable/worldEvents';
import { registerGameSystem } from '../systems';
import type { Game } from '../game';
import { GRATE, HATCH } from './waterway';

// 脇道 side_waterway の仕掛け（#111 / #123）。腐った床板は踏むと割れて水路へ落ちる（落下ダメージなし）。
// 鉄格子は内側から押して開く。どちらも動作は `Interactable`（`game/interactable`）が持つ:
//  - 床板（`hatch_c`、kind: floorHatch）: 近付くと軋み、踏むと `floorHatchBroken` を出す。ここはそれを受けて
//    割れた状態（描画の床板を消す）にし、コライダを外す。
//  - 鉄格子（`grate_d`、kind: push）: 押すと `world.grateDOpen` をセーブする。ここはそのフラグを読んで
//    開いた状態（描画の格子を消す）にする（再開後は最初から開いている）。
// `game.systems.get(waterwaySystem).breakHatch()` / `openGrate()` はデバッグ・テスト用の口として残している。

export class WaterwayState {
  hatchBroken = false;
  grateOpen = false;

  constructor(private readonly game: Game) {
    game.events.on('floorHatchBroken', (e) => {
      if (e.colliderId === HATCH.id) this.breakHatch(false);
    });
    this.syncGrate();
  }

  /** 床板を割る（コライダを外す）。割れていなければ true。`announce` は割れたイベントも出す（デバッグ用の口から）。 */
  breakHatch(announce = true): boolean {
    if (this.hatchBroken) return false;
    this.hatchBroken = true;
    this.game.setBoxEnabled(HATCH.id, false);
    if (announce) {
      this.game.events.emit('floorHatchBroken', {
        id: 'hatch_c',
        colliderId: HATCH.id,
        position: { x: HATCH.x, y: this.game.heightAt(HATCH.x, HATCH.z), z: HATCH.z },
      });
    }
    return true;
  }

  /** 鉄格子を開ける（コライダを外す）。開いていなければ true。 */
  openGrate(): boolean {
    if (this.grateOpen) return false;
    this.grateOpen = true;
    this.game.setBoxEnabled(GRATE.id, false);
    return true;
  }

  /** 開けたままのセーブ（`world.grateDOpen`）を反映する。 */
  private syncGrate(): void {
    if (!this.grateOpen && this.game.save.hasFlag(WORLD_FLAGS.grateDOpen)) this.openGrate();
  }

  update(): void {
    this.syncGrate();
  }
}

/** 水路の仕掛けの状態（`game.systems.get(waterwaySystem)`）。 */
export const waterwaySystem = registerGameSystem(
  'waterway',
  (game) => {
    const state = new WaterwayState(game);
    return {
      state,
      update: () => {
        state.update();
      },
    };
  },
  // インタラクトの効果（フラグ）を同じステップで反映する
  { after: ['interactable'] },
);

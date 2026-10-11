// ショートカット（#65、仕様書 7.1 節）: 鉄門 G1 とレバーの状態・操作・セーブ。
//
//   const sc = shortcutOf(game);            // 鉄門のないレベルでは null
//   sc?.state;                              // 'closed' | 'opening' | 'open'
//   sc?.onOpened(({ id }) => ...);          // 開通（レバーを引いた瞬間。`shortcutOpened` イベントも出る）
//
// - レバーは中庭側（北側。鉄門からレバーの向き）からだけ調べられる。南側（A 側）からは候補にならない。
// - 操作で `leverFrames` のレバー動作 → 扉が `gateFrames` かけて開く。開ききるとコライダを無効にする。
// - 開通は操作の瞬間にセーブ（`save.shortcuts` に 'G1'）。セーブ済みなら最初から開いた状態で始まる。
import type { Game } from '../game';
import { SHORTCUT } from '../data/shortcut';
import { interactionOf } from '../interaction/interaction';
import { yawOf } from '../player/movement';
import type { InteractableSpawn } from '../world/level';

export type ShortcutState = 'closed' | 'opening' | 'open';

const smooth = (t: number): number => {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
};

export class Shortcut {
  private current: ShortcutState;
  private frame = 0;
  private readonly openedListeners = new Set<(e: { readonly id: string }) => void>();

  constructor(
    private readonly game: Game,
    private readonly gate: InteractableSpawn,
    private readonly lever: InteractableSpawn,
  ) {
    this.current = game.save.get().shortcuts.includes(SHORTCUT.gateId) ? 'open' : 'closed';
    this.applyCollider();
    interactionOf(game).register({
      id: lever.id,
      kind: 'lever',
      x: lever.x,
      z: lever.z,
      radius: SHORTCUT.leverRadiusM,
      label: () => '押す',
      available: () => this.current === 'closed' && this.onNorthSide(),
      interact: () => {
        this.open();
      },
    });
  }

  get state(): ShortcutState {
    return this.current;
  }

  /** 通れないか（コライダが有効）。 */
  get blocked(): boolean {
    return this.current !== 'open';
  }

  /** レバーの倒れ具合 0（引く前）..1（引いた後）。 */
  get leverProgress(): number {
    if (this.current === 'open') return 1;
    return this.current === 'opening' ? smooth(this.frame / SHORTCUT.leverFrames) : 0;
  }

  /** 扉の開き具合 0（閉）..1（全開）。 */
  get gateProgress(): number {
    if (this.current === 'open') return 1;
    return this.current === 'opening'
      ? smooth((this.frame - SHORTCUT.gateStartFrame) / SHORTCUT.gateFrames)
      : 0;
  }

  /** プレイヤーが鉄門の北側（中庭側 = 鉄門からレバーへ向かう側）にいるか。 */
  private onNorthSide(): boolean {
    const { feet } = this.game.player;
    const fx = this.lever.x - this.gate.x;
    const fz = this.lever.z - this.gate.z;
    return (feet.x - this.gate.x) * fx + (feet.z - this.gate.z) * fz > 0;
  }

  /** 開通を購読する。戻り値で購読解除。 */
  onOpened(listener: (e: { readonly id: string }) => void): () => void {
    this.openedListeners.add(listener);
    return () => this.openedListeners.delete(listener);
  }

  /** レバーを引く（状況アクション「押す」の実行。デバッグ・テストからも呼べる）。始めたら true。 */
  open(): boolean {
    if (this.current !== 'closed') return false;
    const { game } = this;
    const { feet } = game.player;
    game.player.beginScripted('interact', {
      frames: SHORTCUT.leverFrames,
      faceYaw: yawOf(this.lever.x - feet.x, this.lever.z - feet.z),
    });
    this.current = 'opening';
    this.frame = 0;
    game.save.openShortcut(SHORTCUT.gateId);
    game.events.emit('shortcutOpened', {
      id: SHORTCUT.gateId,
      position: { x: this.gate.x, y: game.heightAt(this.gate.x, this.gate.z), z: this.gate.z },
    });
    for (const l of [...this.openedListeners]) l({ id: SHORTCUT.gateId });
    return true;
  }

  /** 毎ステップ（`shortcut.system.ts`）。 */
  update(): void {
    if (this.current !== 'opening') return;
    this.frame++;
    if (this.frame >= SHORTCUT.gateStartFrame + SHORTCUT.gateFrames) {
      this.current = 'open';
      this.applyCollider();
    }
  }

  private applyCollider(): void {
    this.game.setBoxEnabled(SHORTCUT.gateId, this.blocked);
  }
}

import type { GameEventMap } from '../core/gameEvents';
import { registerDevHooks } from '../devHooks';

/** E2E 用に発行できる BGM 関連イベント。 */
export type BgmDevEvent =
  | { readonly name: 'bgmChange'; readonly payload: GameEventMap['bgmChange'] }
  | { readonly name: 'bgmLayer'; readonly payload: GameEventMap['bgmLayer'] }
  | { readonly name: 'bgmFadeOut'; readonly payload: GameEventMap['bgmFadeOut'] }
  | { readonly name: 'bgmDuck'; readonly payload: GameEventMap['bgmDuck'] }
  | { readonly name: 'bossDefeatCue'; readonly payload: GameEventMap['bossDefeatCue'] };

declare module '../devHooks' {
  interface DevHooks {
    /** BGM 関連の game イベントを直接発行する（ボス戦を経由せず audio 層の購読を検証する）。 */
    emitBgmEvent(e: BgmDevEvent): void;
  }
}

registerDevHooks('bgm', ({ game }) => ({
  emitBgmEvent: (e) => {
    switch (e.name) {
      case 'bgmChange':
        game.events.emit('bgmChange', e.payload);
        break;
      case 'bgmLayer':
        game.events.emit('bgmLayer', e.payload);
        break;
      case 'bgmFadeOut':
        game.events.emit('bgmFadeOut', e.payload);
        break;
      case 'bgmDuck':
        game.events.emit('bgmDuck', e.payload);
        break;
      case 'bossDefeatCue':
        game.events.emit('bossDefeatCue', e.payload);
        break;
    }
  },
}));

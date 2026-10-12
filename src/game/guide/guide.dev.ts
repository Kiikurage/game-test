import { registerDevHooks } from '../../devHooks';
import { guideSystem } from './guide.system';

declare module '../../devHooks' {
  interface DevHooks {
    /** 操作ヒント・通知の状態（E2E・撮影用）。 */
    guide(): {
      hint: string | null;
      notice: string | null;
      pendingNotices: number;
      doneHints: readonly string[];
    };
    /** 通知を積む（撮影用）。 */
    pushNotice(text: string): void;
  }
}

registerDevHooks('guide', ({ game }) => ({
  guide: () => {
    const { hints, notices } = game.systems.get(guideSystem);
    return {
      hint: hints.current?.id ?? null,
      notice: notices.current?.text ?? null,
      pendingNotices: notices.pending,
      doneHints: ['move', 'camera', 'roll', 'lockOn', 'lightAttack'].filter((id) =>
        hints.isDone(id),
      ),
    };
  },
  pushNotice: (text) => {
    game.systems.get(guideSystem).notices.push(text);
  },
}));

import { registerDevHooks } from '../../devHooks';
import { hudPresentation } from './hudPresentation';

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

registerDevHooks('guide', ({ game }) => {
  // 組み立て時に作る（以後のステップ・イベントを購読する）
  const { hints, notices } = hudPresentation(game);
  return {
    guide: () => {
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
      notices.push(text);
    },
  };
});

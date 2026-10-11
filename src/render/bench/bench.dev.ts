import { registerDevHooks } from '../../devHooks';
import { benchStatus, type BenchStatus } from './bench';

declare module '../../devHooks' {
  interface DevHooks {
    /** ベンチマーク（`?bench`）の実行状況と結果テキスト（E2E 用）。 */
    bench(): BenchStatus;
  }
}

registerDevHooks('bench', () => ({
  bench: () => ({ ...benchStatus, rows: [...benchStatus.rows] }),
}));

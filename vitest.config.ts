import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Rapier を使う歩行・敵のテストは 1 本で数秒かかり、並列負荷（CI・複数エージェント）では既定の 5 秒を超えうる。
    // 時間依存でフレークさせないため余裕をとる（無限ループの検出が目的なので、実行時間そのものは検証しない）。
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});

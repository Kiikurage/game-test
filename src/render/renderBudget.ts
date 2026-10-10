import type { QualityLevel } from './quality';

/**
 * 描画負荷の予算（1 フレームの `renderer.info` の値。シャドウパスを含む）。
 * 計測視点（`scripts/perfViewpoints.mjs`）のすべてで、この値以下に収める。E2E（`e2e/perf.spec.ts`）で退行を検出する。
 * 根拠と内訳は docs/performance.md。
 */
export interface RenderBudget {
  readonly drawCalls: number;
  readonly triangles: number;
}

export const RENDER_BUDGET: Readonly<Record<QualityLevel, RenderBudget>> = {
  // 基準機 Xperia 1 V で 30fps を出すための目安（#180）。low は medium より軽くあるべきなので同じ上限
  low: { drawCalls: 150, triangles: 250_000 },
  medium: { drawCalls: 150, triangles: 250_000 },
  // PC 向け。草・影・LOD 距離が増える分だけ緩める
  high: { drawCalls: 200, triangles: 350_000 },
};

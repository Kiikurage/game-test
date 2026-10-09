import type { ParticleQuality } from '../quality';

/** 1 回のバーストで使う粒数（密度係数適用後）。有効なら最低 1。 */
export function burstCount(base: number, quality: ParticleQuality): number {
  if (quality.burstSlots === 0 || quality.burstDensity <= 0) return 0;
  return Math.max(1, Math.round(base * quality.burstDensity));
}

/** バーストレイヤの確保粒数（スロット数 × スロットサイズ）。 */
export function burstCapacity(slotSize: number, quality: ParticleQuality): number {
  return quality.burstSlots * slotSize;
}

export interface ParticleBudgetInput {
  readonly bonfires: number;
  readonly emberFields: number;
  /** 各バーストレイヤのスロットサイズの合計。 */
  readonly burstSlotSizeSum: number;
}

/** 全プリセットを同時に出したときの最大粒子数（計測・上限確認用）。 */
export function totalParticleBudget(q: ParticleQuality, input: ParticleBudgetInput): number {
  return (
    q.ambientAsh +
    input.bonfires * (q.bonfireFlames + q.bonfireSparks) +
    input.emberFields * q.emberField +
    q.burstSlots * input.burstSlotSizeSum
  );
}

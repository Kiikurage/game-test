import type RAPIER from '@dimforge/rapier3d-compat';

/** Rapier の薄いラッパー。固定ステップで world を進める。 */
export interface Physics {
  readonly rapier: typeof RAPIER;
  readonly world: RAPIER.World;
  step(dt: number): void;
}

const loadRapier = async (): Promise<typeof RAPIER> =>
  (await import('@dimforge/rapier3d-compat')).default;

/** Rapier チャンクのダウンロードだけ先に始める（レンダラー初期化と並行させる）。 */
export function preloadPhysics(): void {
  void loadRapier();
}

export async function createPhysics(): Promise<Physics> {
  // Rapier（WASM を含む大きなチャンク）は物理の生成時に初めて読み込む
  const RAPIER = await loadRapier();
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  return {
    rapier: RAPIER,
    world,
    step(dt) {
      world.timestep = dt;
      world.step();
    },
  };
}

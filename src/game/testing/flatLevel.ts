import {
  createLevel,
  type AreaDef,
  type EnemySpawn,
  type GateDef,
  type Level,
  type PropSpec,
} from '../world/level';

export interface FlatLevelOptions {
  /** 一辺（m）の正方形。原点は左下 (0, 0)。 */
  readonly size?: number;
  readonly props?: readonly PropSpec[];
  readonly gates?: readonly GateDef[];
  /** 穴（崖）。矩形の内側を `depth` だけ低くする（縁は 1m で落ちる = 40° 超の崖）。 */
  readonly pits?: readonly {
    readonly minX: number;
    readonly maxX: number;
    readonly minZ: number;
    readonly maxZ: number;
    readonly depth: number;
  }[];
  readonly enemies?: readonly EnemySpawn[];
  readonly spawn?: { readonly x: number; readonly z: number };
}

/**
 * ナビゲーション・敵 AI のテスト用の平らなレベル。壁・門・穴を足せる。
 * 地形はすべて高さ 0（穴は負）で、外周の崖は付けない（境界の外は透明壁）。
 */
export function createFlatLevel(options: FlatLevelOptions = {}): Level {
  const size = options.size ?? 40;
  const areas: AreaDef[] = (options.pits ?? []).map((pit, i) => ({
    id: (['A', 'B', 'C', 'D', 'E', 'F'] as const)[i % 6] ?? 'A',
    name: `pit-${i}`,
    shape: { type: 'rect', minX: pit.minX, maxX: pit.maxX, minZ: pit.minZ, maxZ: pit.maxZ },
    surface: 'stone',
    floor: { height: -pit.depth, margin: 0, blend: 0.8 },
  }));
  return createLevel({
    id: 'flat-test',
    name: 'flat-test',
    bounds: { minX: 0, maxX: size, minZ: 0, maxZ: size },
    terrain: {
      slopeX: 0,
      slopeZ: 0,
      hillAmplitude: 0,
      hillWavelength: 30,
      bumpAmplitude: 0,
      bumpWavelength: 3.5,
      routeBlend: 1,
      cliffHeight: 0,
      cliffWidth: 1,
      cellSize: 1,
      meshMargin: 4,
    },
    areas,
    route: [],
    gates: options.gates ?? [],
    bonfire: { x: 1, z: 1 },
    playerSpawn: { x: options.spawn?.x ?? 1, z: options.spawn?.z ?? 1, yaw: 0 },
    props: options.props ?? [],
    enemies: options.enemies ?? [],
    items: [],
    interactables: [],
  });
}

/** 壁（高さ 3m の箱）。中心と半幅で指定する。 */
export function wallProp(id: string, x: number, z: number, hx: number, hz: number): PropSpec {
  return { kind: 'block', id, style: 'wall', x, z, hx, hz, height: 3 };
}

/**
 * レベルの JSON（`levels/*.json`）の読み込み。スキーマで検証し、データに書けない部分を組み立てて `LevelData` にする。
 *
 * JSON は `LevelData` とほぼ同じ形で、次の 3 つだけが違う（コードの定数・別のデータと共有しているもの）。
 * - `waterway: { floorY, exitY }`: 地下水路（`waterway.ts` の `buildWaterway`）。`waterways`・`terrainHoles`・`zones` を生成する
 * - `props` の `{ "generate": "waterway" }`: その位置に水路の壁・床・天井を入れる。
 *   ブロックの `"carve": "waterway"` は、水路が通る所をくり抜いた塊（`carveMass`）に置き換える
 * - `interactables` の `{ "generate": "worldInteractables" }`: 配置データ（`data/world/interactables.ts`）のうち、
 *   実動作があり、置く場所の地形がこのレベルにあるもの（`main`・脇道 `sidePaths`・水路）をその位置に入れる
 */
import { parseData, s, type Infer, type Schema } from '../../core/schema';
import { IMPLEMENTED_KINDS, WORLD_INTERACTABLES } from '../data/world/interactables';
import type { InteractableSpawn, LevelData, PropSpec } from './level';
import { buildWaterway, carveMass } from './waterway';

const num = s.number();
const optNum = s.optional(num);
const xz = s.tuple(num, num);
const areaId = s.literal('A', 'B', 'C', 'D', 'E', 'F');
const rect = { minX: num, maxX: num, minZ: num, maxZ: num };
const Rect = s.object(rect);

const AreaShape = s.union('type', {
  circle: s.object({ type: s.literal('circle'), cx: num, cz: num, r: num }),
  rect: s.object({ type: s.literal('rect'), ...rect }),
});

const RoutePoint = s.object({ x: num, z: num, height: num, halfWidth: num });

const OpenPath = s.object({ id: s.string(), points: s.array(xz), halfWidth: num });

const BlockProp = s.object({
  kind: s.literal('block'),
  id: s.string(),
  style: s.literal(
    'wall',
    'rubble',
    'tower',
    'altar',
    'pew',
    'grave',
    'fence',
    'mausoleum',
    'stairs',
    'bonfire',
    'stone',
    'sarcophagus',
    'waterway',
    'hatch',
    'grate',
  ),
  x: num,
  z: num,
  hx: s.number({ min: 0 }),
  hz: s.number({ min: 0 }),
  height: num,
  yawDeg: optNum,
  baseY: optNum,
  navSolid: s.optional(s.boolean()),
  embed: optNum,
  /** 読み込み時に `waterway` でくり抜く（JSON だけのキー。`LevelData` には残らない）。 */
  carve: s.optional(s.literal('waterway')),
});

const PropEntry = s.union('kind', {
  block: BlockProp,
  stairs: s.object({
    kind: s.literal('stairs'),
    id: s.string(),
    x: num,
    z: num,
    yawDeg: num,
    steps: s.number({ min: 1, integer: true }),
    stepRise: num,
    stepRun: num,
    width: num,
    navSolid: s.optional(s.boolean()),
  }),
  cylinder: s.object({
    kind: s.literal('cylinder'),
    id: s.string(),
    style: s.literal('tree', 'column', 'fountain', 'pedestal'),
    x: num,
    z: num,
    radius: s.number({ min: 0 }),
    height: num,
  }),
  generate: s.object({ kind: s.literal('generate'), generate: s.literal('waterway') }),
});

const InteractableEntry = s.union('kind', {
  ...Object.fromEntries(
    (
      [
        'bonfire',
        'lever',
        'gate',
        'hatch',
        'grate',
        'item',
        'read',
        'loot',
        'pray',
        'bell',
        'talk',
        'push',
        'breakable',
        'floorHatch',
      ] as const
    ).map((kind) => [
      kind,
      s.object({
        id: s.string(),
        kind: s.literal(kind),
        area: s.nullable(areaId),
        x: num,
        z: num,
        target: s.optional(s.object({ x: num, z: num, yaw: num })),
        itemId: s.optional(s.string()),
      }),
    ]),
  ),
  generate: s.object({ kind: s.literal('generate'), generate: s.literal('worldInteractables') }),
}) as Schema<
  InteractableSpawn | { readonly kind: 'generate'; readonly generate: 'worldInteractables' }
>;

/** レベル JSON のスキーマ。 */
export const LevelFileSchema = s.object({
  id: s.string(),
  name: s.string(),
  bounds: Rect,
  terrain: s.object({
    slopeX: num,
    slopeZ: num,
    hillAmplitude: num,
    hillWavelength: num,
    bumpAmplitude: num,
    bumpWavelength: num,
    routeBlend: num,
    cliffHeight: num,
    cliffWidth: num,
    cellSize: s.number({ min: 0.01 }),
    meshMargin: num,
  }),
  perimeter: s.optional(
    s.object({
      rise: num,
      width: num,
      routeMargin: num,
      areaMargin: num,
      openPaths: s.array(OpenPath),
    }),
  ),
  areas: s.array(
    s.object({
      id: areaId,
      name: s.string(),
      shape: AreaShape,
      surface: s.literal('grass', 'stone', 'wood', 'underground', 'water'),
      perimeterMargin: optNum,
      floor: s.optional(s.object({ height: num, margin: num, blend: num })),
    }),
  ),
  route: s.array(RoutePoint, { minLength: 2 }),
  extraRoutes: s.optional(s.array(s.array(RoutePoint, { minLength: 2 }))),
  sidePaths: s.optional(
    s.array(
      s.object({
        id: s.string(),
        points: s.array(xz),
        halfWidth: num,
        rects: s.array(Rect),
        spots: s.array(s.object({ id: s.string(), x: num, z: num })),
      }),
    ),
  ),
  guards: s.optional(
    s.array(
      s.object({
        id: s.string(),
        x: num,
        y: num,
        z: num,
        hx: num,
        hy: num,
        hz: num,
        yawDeg: optNum,
        pitchDeg: optNum,
        enabled: s.optional(s.boolean()),
      }),
    ),
  ),
  waterway: s.optional(s.object({ floorY: num, exitY: num })),
  gates: s.array(
    s.object({
      id: s.string(),
      kind: s.literal('iron', 'fog'),
      x: num,
      z: num,
      yawDeg: num,
      width: num,
      height: num,
      blocking: s.boolean(),
      leverId: s.optional(s.string()),
    }),
  ),
  bonfire: s.object({ x: num, z: num }),
  playerSpawn: s.object({ x: num, z: num, yaw: num }),
  props: s.array(PropEntry),
  enemies: s.array(
    s.object({
      id: s.string(),
      type: s.literal('undead_soldier', 'undead_shield'),
      area: areaId,
      x: num,
      z: num,
      yaw: num,
      behavior: s.literal('idle_back', 'patrol', 'wait'),
      patrolRadius: optNum,
    }),
  ),
  items: s.array(
    s.object({
      id: s.string(),
      kind: s.literal('flask_up', 'relic', 'charm'),
      area: areaId,
      x: num,
      z: num,
    }),
  ),
  interactables: s.array(InteractableEntry),
});

export type LevelFile = Infer<typeof LevelFileSchema>;

function checkUniqueIds(label: string, ids: readonly string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`level: duplicate ${label} id "${id}"`);
    seen.add(id);
  }
}

/**
 * レベル JSON を検証して `LevelData` を組み立てる。不正なら `SchemaError`（`source` 付き）か `Error` を投げる。
 * `source` はエラーメッセージに付くファイル名。
 */
export function loadLevelData(json: unknown, source = 'level'): LevelData {
  const file = parseData(LevelFileSchema, json, source);
  const { waterway: waterwaySpec, props: propEntries, interactables: interEntries, ...rest } = file;
  const waterway = waterwaySpec ? buildWaterway(waterwaySpec.floorY, waterwaySpec.exitY) : null;
  const needWaterway = (what: string): NonNullable<typeof waterway> => {
    if (!waterway) throw new Error(`${source}: ${what} needs "waterway"`);
    return waterway;
  };

  const props: PropSpec[] = [];
  for (const entry of propEntries) {
    if (entry.kind === 'generate') {
      props.push(...needWaterway('props generate').props);
    } else if (entry.kind === 'block' && entry.carve) {
      const { carve, ...block } = entry;
      const w = needWaterway(`carve "${carve}" of "${entry.id}"`);
      props.push(...carveMass(block, w.rects, w.def.ceiling));
    } else {
      props.push(entry);
    }
  }

  const sites = new Set<string>([
    'main',
    ...(waterway ? ['side_waterway'] : []),
    ...(file.sidePaths ?? []).map((p) => p.id),
  ]);
  const interactables: InteractableSpawn[] = [];
  for (const entry of interEntries) {
    if (entry.kind !== 'generate') {
      interactables.push(entry);
      continue;
    }
    for (const d of WORLD_INTERACTABLES) {
      if (!IMPLEMENTED_KINDS.has(d.kind) || !sites.has(d.site)) continue;
      interactables.push({ id: d.id, kind: d.kind, area: null, x: d.x, z: d.z });
    }
  }

  checkUniqueIds(
    'prop',
    props.map((p) => p.id),
  );
  checkUniqueIds(
    'enemy',
    file.enemies.map((e) => e.id),
  );
  checkUniqueIds(
    'interactable',
    interactables.map((i) => i.id),
  );
  const interIds = new Set(interactables.map((i) => i.id));
  for (const g of file.gates) {
    if (g.leverId !== undefined && !interIds.has(g.leverId)) {
      throw new Error(`${source}: gate "${g.id}" refers to unknown lever "${g.leverId}"`);
    }
  }

  return {
    ...rest,
    ...(waterway && {
      waterways: [waterway.def],
      terrainHoles: waterway.holes,
      zones: waterway.zones,
    }),
    props,
    interactables,
  };
}

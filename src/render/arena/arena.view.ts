import { Group, Mesh, Vector3 } from 'three/webgpu';
import type { Game } from '../../game/game';
import { arenaMoodWeight, arenaOf, type ArenaDef } from '../../game/world/arena';
import type { Level } from '../../game/world/level';
import { ARENA_MOOD } from '../environment';
import { registerViewPlugin } from '../viewPlugins';
import {
  createColumnGeometry,
  createFloorDiscGeometry,
  createPedestalGeometry,
  createWallRingGeometry,
  mergeAll,
  triangleCount,
} from './arenaGeometry';
import { createArenaFloorMaterial, createArenaMasonryMaterial } from './arenaMaterials';
import {
  createFlameGeometry,
  createFlameMaterial,
  createSconceGeometry,
  createSconceMaterial,
  layoutTorches,
} from './arenaTorches';

/** 床の円盤を地面よりわずかに浮かせる（m）。 */
const FLOOR_LIFT = 0.012;
/** 壁の内側 / 外側の半径。内面は当たり判定（24 角形。角で 16.14m）より内側に出ない。 */
const WALL_INNER = 16.12;
const WALL_OUTER = 17.3;
/** ムードの時間方向のなじませ（1/秒）。リスポーンなどの瞬間移動でも急にぱっと変わらない。 */
const MOOD_RATE = 2.2;

/** 柱に技が当たったときの破片の口（フック）。E5-8b の破片の演出はこれを購読する。 */
export interface PillarHit {
  /** 柱の添字（`ArenaDef.pillars` / `bossPillarHit.pillar` と同じ）。 */
  readonly pillar: number;
  /** 破片が出る位置（柱の表面、ボス側。ワールド座標）。 */
  readonly position: Vector3;
  /** 破片が飛び散る向き（柱の中心から表面への水平な単位ベクトル）。 */
  readonly normal: Vector3;
  /** 当てた技の ID（デバッグ呼び出しは `'debug'`）。 */
  readonly moveId: string;
}

/**
 * 闘技場の描画の窓口。`arenaViewOf(game)` で取る（レベルに闘技場がない・`?scene=test` では `null`）。
 *
 *   const arena = arenaViewOf(game);
 *   arena.def.bonfireSlot;                          // 撃破後に篝火を灯す位置（台座の上面の中央）
 *   arena.onPillarHit((hit) => spawnDebris(hit));   // 柱の破片の口（E5-8b）
 */
export interface ArenaView {
  readonly def: ArenaDef;
  /** 柱の破片の口を購読する。戻り値で購読解除。購読者がいなくても、既定の砂煙（`particles.hit`）が出る。 */
  onPillarHit(listener: (hit: PillarHit) => void): () => void;
  /** 柱の破片の口を手動で開く（デバッグ・確認用。`bossPillarHit` と同じ経路）。 */
  emitPillarHit(pillar: number, moveId?: string, from?: { x: number; z: number }): void;
  /** これまでに破片の口が開いた回数。 */
  readonly pillarHitCount: number;
  /** 現在のムードの重み 0..1（0 = 黄昏のフィールド、1 = 闘技場）。 */
  readonly moodWeight: number;
  /** 描画の統計（三角形数・ドローコール数）。 */
  readonly stats: { readonly triangles: number; readonly meshes: number };
}

const views = new WeakMap<Game, ArenaView>();

/** `game` の闘技場の描画。闘技場を描いていないときは `null`。 */
export function arenaViewOf(game: Game): ArenaView | null {
  return views.get(game) ?? null;
}

function createArena(level: Level, def: ArenaDef) {
  const { center, floorY } = def;
  const root = new Group();
  root.name = 'arena';
  const torches = layoutTorches(def);

  // 床（敷石の円）
  const floor = new Mesh(
    createFloorDiscGeometry(center.x, center.z, floorY + FLOOR_LIFT, def.circle.radius + 0.5),
    createArenaFloorMaterial({
      cx: center.x,
      cz: center.z,
      radius: def.circle.radius,
      pillars: def.pillars,
      pedestalRadius: def.pedestal.radius,
      torches,
    }),
  );
  floor.name = 'arena:floor';
  floor.receiveShadow = true;
  root.add(floor);

  // 外周の壁: 霧の門側の切れ目を除く円弧。範囲は壁のコライダ（f-wall-*）の端から読む
  const walls = level.boxes.filter((b) => /^f-wall-\d+$/.test(b.id));
  const angleOf = (b: { x: number; z: number }): number =>
    Math.atan2(b.z - center.z, b.x - center.x);
  const first = walls.find((b) => b.id === 'f-wall-1');
  const last = walls.find((b) => b.id === `f-wall-${walls.length}`);
  if (first && last) {
    const ring = Math.hypot(first.x - center.x, first.z - center.z);
    const half = Math.atan(first.hx / ring);
    const a0 = angleOf(first);
    const span = (((angleOf(last) - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const wall = new Mesh(
      createWallRingGeometry({
        cx: center.x,
        cz: center.z,
        floorY,
        inner: WALL_INNER,
        outer: WALL_OUTER,
        height: first.hy * 2,
        start: a0 - half,
        end: a0 + span + half,
      }),
      createArenaMasonryMaterial({
        courseHeight: 0.62,
        blockWidth: 1.55,
        floorY,
        cracks: 0.55,
        grime: 1,
        torches,
      }),
    );
    wall.name = 'arena:wall';
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);
  }

  // 柱 4 本（1 メッシュに結合）
  const columns = new Mesh(
    mergeAll(
      def.pillars.map((p) =>
        createColumnGeometry({
          x: p.x,
          y: floorY,
          z: p.z,
          radius: p.radius,
          height: def.pillarHeight,
        }),
      ),
    ),
    createArenaMasonryMaterial({
      courseHeight: 0.84,
      blockWidth: 1e3,
      floorY,
      cracks: 0.7,
      grime: 1,
      torches,
    }),
  );
  columns.name = 'arena:columns';
  columns.castShadow = true;
  columns.receiveShadow = true;
  root.add(columns);

  // 中央の台座
  const pedestal = new Mesh(
    createPedestalGeometry({
      x: def.pedestal.x,
      z: def.pedestal.z,
      y: floorY,
      radius: def.pedestal.radius,
      height: def.pedestal.topY - floorY,
    }),
    createArenaMasonryMaterial({
      courseHeight: 0.3,
      blockWidth: 1.5,
      floorY,
      cracks: 0.45,
      grime: 0.8,
      torches,
    }),
  );
  pedestal.name = 'arena:pedestal';
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  // 壁のたいまつ（燭台 + 炎。光は石のマテリアルが足す）
  const sconces = new Mesh(createSconceGeometry(torches), createSconceMaterial());
  sconces.name = 'arena:sconces';
  sconces.castShadow = true;
  root.add(sconces);
  const flames = new Mesh(createFlameGeometry(torches), createFlameMaterial());
  flames.name = 'arena:flames';
  flames.frustumCulled = false;
  root.add(flames);

  let triangles = 0;
  let meshes = 0;
  root.traverse((o) => {
    const mesh = o as Mesh;
    if ((mesh as { isMesh?: boolean }).isMesh) {
      triangles += triangleCount(mesh.geometry);
      meshes++;
    }
  });
  return { root, triangles, meshes };
}

// 闘技場の見た目: 石畳の床・外周の壁・柱 4 本・中央の台座（`arenaOf(level)` と同じ寸法）と、
// 近づくと黄昏 → 夕闇（ほぼ夜）へ移るライティング（`Environment.setMood`）。
// 柱の破片の口（`PillarHit`）は `bossPillarHit` から開く。演出本体は E5-8b。
registerViewPlugin('arena', ({ game, view, level }) => {
  const def = level ? arenaOf(level) : null;
  if (!level || !def) return {};

  const built = createArena(level, def);
  view.scene.add(built.root);

  const listeners = new Set<(hit: PillarHit) => void>();
  let hitCount = 0;
  let weight = -1;
  const tmpPos = new Vector3();
  const tmpNormal = new Vector3();

  const open = (hit: PillarHit): void => {
    hitCount++;
    // 既定: 砂煙と火花（破片の演出が入るまでの代わり）
    view.particles.hit(hit.position, hit.normal, 1.15);
    for (const l of listeners) l(hit);
  };
  const fromEvent = (pillar: number, position: Vector3, moveId: string): void => {
    const p = def.pillars[pillar];
    if (!p) return;
    tmpNormal.set(position.x - p.x, 0, position.z - p.z);
    if (tmpNormal.lengthSq() < 1e-8) tmpNormal.set(1, 0, 0);
    tmpNormal.normalize();
    open({ pillar, position: position.clone(), normal: tmpNormal.clone(), moveId });
  };
  game.events.on('bossPillarHit', (e) => {
    fromEvent(e.pillar, tmpPos.set(e.position.x, e.position.y, e.position.z), e.moveId);
  });

  const api: ArenaView = {
    def,
    onPillarHit: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emitPillarHit: (pillar, moveId = 'debug', from) => {
      const p = def.pillars[pillar];
      if (!p) return;
      // `from` 側（省略時は闘技場の中心側）の柱の表面、腰の高さ
      const fx = (from?.x ?? def.center.x) - p.x;
      const fz = (from?.z ?? def.center.z) - p.z;
      const len = Math.hypot(fx, fz) || 1;
      fromEvent(
        pillar,
        tmpPos.set(p.x + (fx / len) * p.radius, def.floorY + 1.5, p.z + (fz / len) * p.radius),
        moveId,
      );
    },
    get pillarHitCount() {
      return hitCount;
    },
    get moodWeight() {
      return Math.max(0, weight);
    },
    stats: { triangles: built.triangles, meshes: built.meshes },
  };
  views.set(game, api);

  return {
    update: (dt) => {
      const { feet } = game.player;
      const target = arenaMoodWeight(def, feet.x, feet.z);
      // 初回は即座に（ロード直後の見た目が一瞬ずれない）。以降は指数でなじませる
      weight =
        weight < 0
          ? target
          : weight + (target - weight) * (1 - Math.exp(-Math.min(dt, 0.1) * MOOD_RATE));
      if (Math.abs(weight - target) < 1e-3) weight = target;
      view.environment.setMood(ARENA_MOOD, weight);
    },
  };
});

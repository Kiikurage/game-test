import {
  BoxGeometry,
  CircleGeometry,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  type Camera,
  type Scene,
  Vector3,
} from 'three/webgpu';
import {
  CORPSE_POSES,
  CORPSE_VARIANTS,
  corpsePlacement,
  isCorpsePose,
  isCorpseVariant,
  type CorpsePlacement,
  type CorpsePose,
} from '../../core/corpses';
import type { CharacterAssets } from '../assets/characterAssets';
import { EquipmentAssets } from '../assets/equipment';
import { CorpseFactory } from './corpseFactory';

/**
 * 遺体ポーズの確認用プレビュー（`?corpse=` クエリ。showcase.ts から呼ぶ）。
 *   `?corpse=sitting|prone|praying|leaning`  1 体（`&variant=traveler|pilgrim|warrior|broad`、`&view=front|side|back|top`）
 *   `?corpse=all`                            4 ポーズを横並び（バリアントは順に変える）
 *   `?corpse=crowd&n=12`                     十数体を並べる（負荷の確認用）
 * 背景のフィールドは隠し、プレビュー専用の補助光を足す（ゲーム本体のライティングには影響しない）。
 */
export interface CorpsePreviewState {
  /** ポーズ:バリアント → 原点基準の境界 [minX,minY,minZ,maxX,maxY,maxZ]（確認用）。 */
  readonly bounds: Record<string, number[]>;
  readonly count: number;
  readonly triangles: number;
  readonly drawMeshes: number;
}

const STONE = new MeshStandardMaterial({ color: 0x5a554e, roughness: 0.95 });
const GROUND = new MeshStandardMaterial({ color: 0x4a4238, roughness: 1 });

function block(w: number, h: number, d: number, x: number, y: number, z: number): Mesh {
  const mesh = new Mesh(new BoxGeometry(w, h, d), STONE);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** ポーズの基準面を示す台（座面・祭壇・石棺）。 */
function fixture(pose: CorpsePose, p: CorpsePlacement): Mesh {
  const [x, y, z] = p.position;
  const m =
    pose === 'sitting'
      ? block(1.4, 0.6, 0.8, 0, -0.3, 0)
      : pose === 'praying'
        ? block(1.4, 0.95, 0.5, 0, 0.475, 0.25)
        : pose === 'leaning'
          ? block(1.6, 0.9, 0.6, 0, 0.45, -0.3)
          : block(0.01, 0.01, 0.01, 0, 0, 0);
  // 基準点まわりの台を、遺体と同じ位置・向きに置く
  m.position.applyAxisAngle(new Vector3(0, 1, 0), p.yaw);
  m.position.add(new Vector3(x, y, z));
  m.rotation.y = p.yaw;
  return m;
}

export async function placeCorpsePreview(
  scene: Scene,
  camera: Camera,
  characters: CharacterAssets,
  params: URLSearchParams,
): Promise<CorpsePreviewState> {
  const mode = params.get('corpse') ?? 'all';
  for (const child of scene.children) {
    if (!(child as { isLight?: boolean }).isLight) child.visible = false;
  }
  const ground = new Mesh(new CircleGeometry(40, 48), GROUND);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(new GridHelper(20, 40, 0x887766, 0x66584a));
  scene.add(new HemisphereLight(0xc8d0d8, 0x30281e, 1.6));
  const fill = new DirectionalLight(0xffe6c8, 1.4);
  fill.position.set(2.5, 5, 7);
  scene.add(fill);

  const equipment = await EquipmentAssets.load();
  const ratio = Number(params.get('simplify') ?? 0.5);
  const factory = await CorpseFactory.create(
    characters,
    equipment,
    Number.isFinite(ratio) && ratio > 0 ? ratio : 0.5,
  );
  const variantParam = params.get('variant');
  const variant = isCorpseVariant(variantParam) ? variantParam : undefined;

  const placements: CorpsePlacement[] = [];
  if (isCorpsePose(mode)) {
    placements.push(
      corpsePlacement({ pose: mode, x: 0, z: 0, y: mode === 'sitting' ? 0.6 : 0, variant }, 0),
    );
  } else if (mode === 'crowd') {
    const n = Math.min(40, Math.max(1, Number(params.get('n') ?? 12) || 12));
    for (let i = 0; i < n; i++) {
      const pose = CORPSE_POSES[i % CORPSE_POSES.length] ?? 'sitting';
      placements.push(
        corpsePlacement(
          { pose, x: (i % 6) * 2.2 - 5.5, z: -Math.floor(i / 6) * 2.6, yaw: i * 0.9 },
          i,
        ),
      );
    }
  } else {
    CORPSE_POSES.forEach((pose, i) => {
      placements.push(
        corpsePlacement(
          { pose, x: (i - 1.5) * 1.9, z: 0, variant: variant ?? CORPSE_VARIANTS[i] },
          i,
        ),
      );
    });
  }

  let triangles = 0;
  let drawMeshes = 0;
  const bounds: Record<string, number[]> = {};
  for (const p of placements) {
    const t = factory.template(p.pose, p.variant);
    triangles += t.triangles;
    bounds[`${p.pose}:${p.variant}`] = [...t.bounds.min.toArray(), ...t.bounds.max.toArray()];
    drawMeshes += t.meshCount;
    scene.add(factory.create(p));
    if (mode !== 'crowd') scene.add(fixture(p.pose, p));
  }

  const view = params.get('view');
  if (mode === 'crowd') {
    camera.position.set(0, 7, 7);
    camera.lookAt(0, 0, -2.5);
  } else if (placements.length === 1) {
    const d = 2.6;
    const [x, y, z] = placements[0]?.position ?? [0, 0, 0];
    const eye =
      view === 'side'
        ? [x + d, y + 1.1, z]
        : view === 'back'
          ? [x, y + 1.2, z - d]
          : view === 'top'
            ? [x, y + 3.4, z + 0.5]
            : [x + 0.6, y + 1.3, z + d];
    camera.position.set(eye[0] ?? 0, eye[1] ?? 0, eye[2] ?? 0);
    camera.lookAt(x, y + 0.3, z);
  } else {
    camera.position.set(0, 2.0, 6.4);
    camera.lookAt(0, 0.2, 0);
  }
  const state = { count: placements.length, triangles, drawMeshes, bounds };
  Object.assign(window, { __corpsePreview: state });
  return state;
}

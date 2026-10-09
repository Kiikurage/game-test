import {
  BoxGeometry,
  CircleGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  type Camera,
  type Object3D,
  type Scene,
} from 'three/webgpu';
import { gateSwordPlacements } from '../../core/plantedSwords';
import type { Character } from './character';
import type { ExplorationAssets, GreatswordMount } from './exploration';

/**
 * 探索用メッシュの確認用プレビュー（`?props=` クエリ。showcase.ts から呼ぶ）。
 *   `sword-hand` / `sword-back`  騎士に墓守の大剣を持たせる / 背負わせる（`?view=front|back|left|right`）
 *   `jar`                        騎士が獣脂の壺を持つ
 *   `all`                        全メッシュを横並び（鐘は梁から吊る）
 *   `swords`                     霧の門前の突き立つ剣 12 本
 *   `bell` / `statue` / `cairn`  単体の近景
 */
export const EXPLORATION_PREVIEWS = [
  'sword-hand',
  'sword-back',
  'jar',
  'all',
  'swords',
  'bell',
  'statue',
  'cairn',
] as const;

export type ExplorationPreview = (typeof EXPLORATION_PREVIEWS)[number];

export function parseExplorationPreview(value: string | null): ExplorationPreview | undefined {
  return EXPLORATION_PREVIEWS.find((p) => p === value);
}

/** 騎士に持たせるプレビューか（剣・盾を外すために showcase が使う）。 */
export function isCharacterPreview(preview: ExplorationPreview | undefined): boolean {
  return preview === 'sword-hand' || preview === 'sword-back' || preview === 'jar';
}

/** 騎士に探索用の装備を付ける。 */
export function applyCharacterPreview(
  assets: ExplorationAssets,
  character: Character,
  preview: ExplorationPreview,
): void {
  if (preview === 'jar') {
    assets.holdOilJar(character);
    return;
  }
  const mount: GreatswordMount = preview === 'sword-back' ? 'back' : 'hand';
  assets.setGreatswordMount(character, mount);
}

const BEAM = new MeshStandardMaterial({ color: 0x2a211a, roughness: 0.95 });
const GROUND = new MeshStandardMaterial({ color: 0x4a4238, roughness: 1 });

function block(w: number, h: number, d: number, x: number, y: number, z: number): Mesh {
  const mesh = new Mesh(new BoxGeometry(w, h, d), BEAM);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function place(scene: Scene, object: Object3D, x: number, y: number, z: number, yaw = 0): void {
  object.position.set(x, y, z);
  object.rotation.y = yaw;
  scene.add(object);
}

function look(camera: Camera, from: [number, number, number], at: [number, number, number]): void {
  camera.position.set(...from);
  camera.lookAt(...at);
}

/**
 * プレビュー用に背景のフィールドを隠して地面だけ敷き、騎士以外のメッシュを置いてカメラを寄せる。
 * keep はそのまま残すオブジェクト（騎士）。ライトは残す。
 */
export function placeExplorationPreview(
  scene: Scene,
  camera: Camera,
  assets: ExplorationAssets,
  preview: ExplorationPreview,
  keep: readonly Object3D[],
): void {
  for (const child of scene.children) {
    if (!(child as { isLight?: boolean }).isLight && !keep.includes(child)) child.visible = false;
  }
  const ground = new Mesh(new CircleGeometry(40, 48), GROUND);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // 逆光で形が潰れないよう、プレビューだけの補助光（ゲーム本体のライティングには影響しない）
  scene.add(new HemisphereLight(0xc8d0d8, 0x30281e, 1.6));
  const fill = new DirectionalLight(0xffe6c8, 1.4);
  fill.position.set(2.5, 5, 7);
  scene.add(fill);
  const Z = -1.6;
  switch (preview) {
    case 'all': {
      const sword = assets.create('GravekeeperGreatsword');
      place(scene, sword, -1.9, 0.25, Z);
      sword.rotation.set(0, Math.PI * 0.5, 0);
      const jar = assets.create('OilJar');
      place(scene, jar, -1.2, 0.115, Z);
      const beam = block(2.4, 0.22, 0.28, 0, 3.1, Z);
      scene.add(beam);
      const bell = assets.create('Bell');
      place(scene, bell, 0, 3.0, Z);
      place(scene, assets.create('PrayingStatue'), 1.3, 0, Z);
      const cairns = assets.createCairns([
        { position: [2.5, 0, Z], yaw: 0.4 },
        { position: [3.1, 0, Z + 0.3], yaw: 2.1, scale: 0.8 },
      ]);
      scene.add(cairns);
      look(camera, [0.6, 1.9, 3.6], [0.6, 1.5, Z]);
      break;
    }
    case 'swords': {
      // 霧の門の代わりに壁を置く
      const gate = { x: 0, z: -3 };
      scene.add(block(5, 4.5, 0.5, gate.x, 2.25, gate.z - 0.4));
      scene.add(assets.createPlantedSwords(gateSwordPlacements({ gate, approachYaw: 0 })));
      look(camera, [0, 2.4, 3.4], [0, 0.4, -1.4]);
      break;
    }
    case 'bell': {
      scene.add(block(1.6, 0.2, 0.26, 0, 2.2, Z));
      place(scene, assets.create('Bell'), 0, 2.1, Z);
      look(camera, [1.9, 1.6, 1.1], [0, 1.45, Z]);
      break;
    }
    case 'statue': {
      place(scene, assets.create('PrayingStatue'), 0.8, 0, Z);
      look(camera, [1.9, 1.15, 0.5], [0.8, 0.65, Z]);
      break;
    }
    case 'cairn': {
      scene.add(
        assets.createCairns([
          { position: [0, 0, Z], yaw: 0.3 },
          { position: [0.8, 0, Z - 0.2], yaw: 1.9, scale: 0.85 },
        ]),
      );
      look(camera, [0.9, 0.65, 0.5], [0.4, 0.28, Z]);
      break;
    }
    default:
      break;
  }
}

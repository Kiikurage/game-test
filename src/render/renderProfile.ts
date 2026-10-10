import {
  Frustum,
  Matrix4,
  Sphere,
  type BufferGeometry,
  type Camera,
  type Mesh,
  type Object3D,
  type Scene,
} from 'three/webgpu';

/** 描画負荷の内訳（`?debug` と性能テストで使う）。 */
export type ProfileCategory =
  | 'terrain'
  | 'environment'
  | 'grass'
  | 'graybox'
  | 'character'
  | 'particles'
  | 'telegraph'
  | 'other';

export interface CategoryProfile {
  /** メインパスで描かれるメッシュ数（= ドローコール数の見積り）と三角形数。 */
  draws: number;
  tris: number;
  /** シャドウパスで描かれるメッシュ数と三角形数。 */
  shadowDraws: number;
  shadowTris: number;
}

export type RenderProfile = Record<ProfileCategory, CategoryProfile>;

export interface ProfileRoots {
  readonly particles?: Object3D;
  readonly telegraph?: Object3D;
}

const CATEGORIES: readonly ProfileCategory[] = [
  'terrain',
  'environment',
  'grass',
  'graybox',
  'character',
  'particles',
  'telegraph',
  'other',
];

function emptyProfile(): RenderProfile {
  const out = {} as RenderProfile;
  for (const c of CATEGORIES) out[c] = { draws: 0, tris: 0, shadowDraws: 0, shadowTris: 0 };
  return out;
}

function triangleCount(geometry: BufferGeometry): number {
  const index = geometry.index;
  return (index ? index.count : geometry.getAttribute('position').count) / 3;
}

function categoryOf(mesh: Object3D, roots: ProfileRoots): ProfileCategory {
  if (mesh.name === 'ground') return 'terrain';
  if (mesh.name.startsWith('env:')) return 'environment';
  if (mesh.name.startsWith('grass:')) return 'grass';
  if (mesh.name.startsWith('graybox:')) return 'graybox';
  for (let o: Object3D | null = mesh; o; o = o.parent) {
    if ((o as { isBone?: boolean }).isBone || (o as { isSkinnedMesh?: boolean }).isSkinnedMesh) {
      return 'character';
    }
    if (o === roots.particles) return 'particles';
    if (o === roots.telegraph) return 'telegraph';
  }
  return 'other';
}

const projScreen = new Matrix4();
const sphere = new Sphere();

function frustumOf(camera: Camera): Frustum {
  camera.updateMatrixWorld();
  projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  return new Frustum().setFromProjectionMatrix(projScreen);
}

function inFrustum(mesh: Mesh, frustum: Frustum): boolean {
  if (!mesh.frustumCulled) return true;
  const geometry = mesh.geometry;
  if (geometry.boundingSphere === null) geometry.computeBoundingSphere();
  if (!geometry.boundingSphere) return true;
  sphere.copy(geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
  return frustum.intersectsSphere(sphere);
}

/**
 * シーンを走査して、カテゴリ別のドローコール数・三角形数（メインパス / シャドウパス）を見積もる。
 * 視錐台カリングと visible は three のレンダラと同じ判定（`renderer.info` の実測と突き合わせて使う）。
 */
export function profileScene(
  scene: Scene,
  camera: Camera,
  shadowCamera: Camera | null,
  roots: ProfileRoots = {},
): RenderProfile {
  const profile = emptyProfile();
  const mainFrustum = frustumOf(camera);
  const shadowFrustum = shadowCamera ? frustumOf(shadowCamera) : null;
  scene.updateMatrixWorld();
  const visit = (object: Object3D): void => {
    if (!object.visible) return;
    const mesh = object as Mesh & { count: number; isInstancedMesh?: boolean };
    if ((mesh as { isMesh?: boolean }).isMesh === true) {
      const entry = profile[categoryOf(mesh, roots)];
      const tris = triangleCount(mesh.geometry) * (mesh.isInstancedMesh ? mesh.count : 1);
      if (mesh.layers.test(camera.layers) && inFrustum(mesh, mainFrustum)) {
        entry.draws++;
        entry.tris += tris;
      }
      if (
        mesh.castShadow &&
        shadowCamera &&
        shadowFrustum &&
        mesh.layers.test(shadowCamera.layers) &&
        inFrustum(mesh, shadowFrustum)
      ) {
        entry.shadowDraws++;
        entry.shadowTris += tris;
      }
    }
    for (const child of object.children) visit(child);
  };
  visit(scene);
  return profile;
}

/** プロファイルの合計（メインパス + シャドウパス）。 */
export function totalProfile(profile: RenderProfile): { draws: number; tris: number } {
  let draws = 0;
  let tris = 0;
  for (const c of CATEGORIES) {
    const p = profile[c];
    draws += p.draws + p.shadowDraws;
    tris += p.tris + p.shadowTris;
  }
  return { draws, tris };
}

const fmtTris = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));

/** HUD 用の 1 カテゴリ 1 行の表示（`terrain  1/44.4k  +0/0`: メイン draws/tris と、シャドウ draws/tris）。 */
export function formatProfile(profile: RenderProfile): string[] {
  const lines: string[] = [];
  for (const c of CATEGORIES) {
    const p = profile[c];
    if (p.draws + p.shadowDraws === 0) continue;
    lines.push(
      `${c.padEnd(11)} ${p.draws}/${fmtTris(p.tris)}  shadow ${p.shadowDraws}/${fmtTris(p.shadowTris)}`,
    );
  }
  return lines;
}

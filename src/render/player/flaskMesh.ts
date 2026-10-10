import {
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  MeshStandardNodeMaterial,
  Vector2,
} from 'three/webgpu';

/**
 * 回復瓶（#173。自作のプロシージャルメッシュ、素材ライセンスの問題なし）。
 * 原点は瓶の底の中心、首が +Y。ガラス（半透明）・中の液体（琥珀色に発光）・コルク栓の 3 メッシュ。
 * 寸法は実物大の小瓶（高さ約 12cm）を `FLASK_SCALE` 倍して、画面で読み取れる大きさにしている。
 */

export const FLASK_SCALE = 1.5;
/** 握る位置（瓶の高さ方向、底から）。手のひらが瓶の腹に当たる。 */
export const FLASK_GRIP_Y = 0.042 * FLASK_SCALE;
/** 底から栓の先までの長さ。 */
export const FLASK_LENGTH = 0.148 * FLASK_SCALE;

const pts = (pairs: readonly (readonly [number, number])[]): Vector2[] =>
  pairs.map(([r, y]) => new Vector2(r, y));

/** ガラスの外形（丸みのある小瓶。肩から細い首へ、口の縁）。 */
const GLASS_PROFILE = pts([
  [0.0, 0.0],
  [0.026, 0.002],
  [0.04, 0.012],
  [0.047, 0.03],
  [0.046, 0.052],
  [0.037, 0.075],
  [0.022, 0.092],
  [0.016, 0.104],
  [0.016, 0.118],
  [0.02, 0.121],
  [0.02, 0.127],
  [0.0, 0.127],
]);

/** 液体（ガラスの内側。満杯でも肩の少し下まで）。 */
const LIQUID_PROFILE = pts([
  [0.0, 0.006],
  [0.024, 0.008],
  [0.037, 0.017],
  [0.043, 0.032],
  [0.042, 0.05],
  [0.034, 0.07],
  [0.0, 0.074],
]);

export interface FlaskMesh {
  readonly root: Group;
  /** 液体の量 0..1（0 で液体を隠す）。 */
  setFill(fill: number): void;
  /** 液体の発光の強さ（1 = 通常。飲む瞬間に強める）。 */
  setGlow(glow: number): void;
  dispose(): void;
}

export function createFlask(): FlaskMesh {
  const glassGeometry = new LatheGeometry(GLASS_PROFILE, 14);
  const liquidGeometry = new LatheGeometry(LIQUID_PROFILE, 12);
  const corkGeometry = new CylinderGeometry(0.0155, 0.0135, 0.03, 8);

  const glassMaterial = new MeshStandardNodeMaterial({
    color: 0xaecbc4,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const liquidMaterial = new MeshBasicNodeMaterial({ color: 0xffffff });
  // 琥珀色（HDR。トーンマップとブルームで発光して見える）
  liquidMaterial.color.setRGB(1.25, 0.55, 0.07);
  const corkMaterial = new MeshStandardNodeMaterial({ color: 0x6e4a2a, roughness: 0.9 });

  const glass = new Mesh(glassGeometry, glassMaterial);
  glass.renderOrder = 2;
  const liquid = new Mesh(liquidGeometry, liquidMaterial);
  const cork = new Mesh(corkGeometry, corkMaterial);
  cork.position.y = 0.127 + 0.012;

  const root = new Group();
  root.name = 'attach:flask';
  root.scale.setScalar(FLASK_SCALE);
  root.add(liquid, glass, cork);
  // 影は落とさない（小さく、ガラスは透ける）
  for (const m of [glass, liquid, cork]) {
    m.castShadow = false;
    m.receiveShadow = false;
    m.frustumCulled = false;
  }

  const base = liquidMaterial.color.clone();
  return {
    root,
    setFill(fill) {
      const f = Math.min(1, Math.max(0, fill));
      liquid.visible = f > 0.02;
      // 量が減ると液面が下がる（高さ方向だけ縮める。底に溜まって見える）
      liquid.scale.set(1, 0.25 + 0.75 * f, 1);
    },
    setGlow(glow) {
      liquidMaterial.color.copy(base).multiplyScalar(glow);
    },
    dispose() {
      glassGeometry.dispose();
      liquidGeometry.dispose();
      corkGeometry.dispose();
      glassMaterial.dispose();
      liquidMaterial.dispose();
      corkMaterial.dispose();
    },
  };
}

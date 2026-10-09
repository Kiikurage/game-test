// 剣と盾（プロシージャル自作、素材ライセンスの問題なし）。
// 座標系: 剣は握り（グリップ中心）が原点、刃が +Y、刃の平面の法線が ±Z。
//         盾は中心が原点、表面が +Z、持ち手が背面（-Z 側）。単位はメートル。
import { Document } from '@gltf-transform/core';
import {
  box as rawBox,
  countInvertedTriangles,
  loft,
  lathe,
  merge,
  transform,
} from './geometry.mjs';

/** 巻き順を検証した上で返すボックス。 */
function box(...args) {
  const g = rawBox(...args);
  if (countInvertedTriangles(g) > 0) throw new Error('box winding is inverted');
  return g;
}

const hexRing = (w, t) => [
  [w / 2, 0],
  [w * 0.3, t / 2],
  [-w * 0.3, t / 2],
  [-w / 2, 0],
  [-w * 0.3, -t / 2],
  [w * 0.3, -t / 2],
];

function buildSwordGeometry() {
  const blade = loft([
    { y: 0.1, ring: hexRing(0.064, 0.016) },
    { y: 0.72, ring: hexRing(0.054, 0.012) },
    { y: 0.9, ring: hexRing(0.034, 0.008) },
    { y: 0.98, ring: [[0, 0]] },
  ]);
  const guard = merge(
    box(0, 0.088, 0, 0.23, 0.026, 0.034),
    box(0.122, 0.088, 0, 0.018, 0.04, 0.04),
    box(-0.122, 0.088, 0, 0.018, 0.04, 0.04),
  );
  const grip = lathe(
    [
      [
        [0.016, -0.085],
        [0.016, 0.075],
      ],
      [
        [0.016, 0.075],
        [0, 0.075],
      ],
      [
        [0, -0.085],
        [0.016, -0.085],
      ],
    ],
    12,
  );
  const pommel = lathe(
    [
      [
        [0, -0.142],
        [0.022, -0.135],
        [0.03, -0.116],
        [0.026, -0.098],
        [0, -0.082],
      ],
    ],
    14,
  );
  return { blade, guard, grip, pommel };
}

function buildShieldGeometry() {
  // y 軸まわりの回転体として作り、最後に y 軸 → z 軸へ回す。
  const R = 0.3;
  const face = lathe(
    [
      [
        [R - 0.02, 0.034],
        [0.07, 0.056],
        [0.0, 0.06],
      ],
    ],
    32,
  );
  const rim = lathe(
    [
      [
        [R - 0.025, -0.004],
        [R - 0.006, -0.012],
        [R + 0.012, 0.0],
        [R + 0.012, 0.03],
        [R - 0.006, 0.046],
        [R - 0.025, 0.036],
      ],
    ],
    32,
  );
  const back = lathe(
    [
      [
        [0.0, 0.0],
        [R - 0.025, -0.004],
      ],
    ],
    32,
  );
  const boss = lathe(
    [
      [
        [0.085, 0.056],
        [0.088, 0.07],
        [0.07, 0.095],
        [0.04, 0.112],
        [0.0, 0.118],
      ],
    ],
    20,
  );
  const handle = merge(box(0, -0.03, 0, 0.026, 0.026, 0.17), box(0, -0.012, 0.0, 0.05, 0.02, 0.05));
  const toZ = ([x, y, z]) => [x, -z, y];
  return {
    face: transform(face, toZ),
    rim: transform(merge(rim, back), toZ),
    boss: transform(boss, toZ),
    handle: transform(handle, toZ),
  };
}

/** @returns {{ document: Document, triangles: number }} */
export function buildPropsDocument() {
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene('Props');

  const steel = doc
    .createMaterial('Steel')
    .setBaseColorFactor([0.78, 0.8, 0.86, 1])
    .setMetallicFactor(0.55)
    .setRoughnessFactor(0.4);
  const darkSteel = doc
    .createMaterial('DarkSteel')
    .setBaseColorFactor([0.42, 0.44, 0.5, 1])
    .setMetallicFactor(0.55)
    .setRoughnessFactor(0.5);
  const leather = doc
    .createMaterial('Leather')
    .setBaseColorFactor([0.1, 0.065, 0.045, 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(0.85);
  const paint = doc
    .createMaterial('ShieldPaint')
    .setBaseColorFactor([0.08, 0.14, 0.3, 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(0.7);

  let triangles = 0;
  const addMesh = (mesh, name, geo, material) => {
    const bad = countInvertedTriangles(geo);
    if (bad > 0 && !name.startsWith('shield-') && name !== 'sword-guard') {
      throw new Error(`${name}: ${bad} triangles are wound inside-out`);
    }
    const buffer = doc.getRoot().listBuffers()[0];
    const prim = doc
      .createPrimitive()
      .setMaterial(material)
      .setAttribute(
        'POSITION',
        doc
          .createAccessor()
          .setType('VEC3')
          .setArray(new Float32Array(geo.positions))
          .setBuffer(buffer),
      )
      .setAttribute(
        'NORMAL',
        doc
          .createAccessor()
          .setType('VEC3')
          .setArray(new Float32Array(geo.normals))
          .setBuffer(buffer),
      )
      .setIndices(
        doc
          .createAccessor()
          .setType('SCALAR')
          .setArray(new Uint32Array(geo.indices))
          .setBuffer(buffer),
      );
    mesh.addPrimitive(prim);
    triangles += geo.indices.length / 3;
  };

  const sw = buildSwordGeometry();
  const swordMesh = doc.createMesh('Sword');
  addMesh(swordMesh, 'sword-blade', sw.blade, steel);
  addMesh(swordMesh, 'sword-guard', sw.guard, darkSteel);
  addMesh(swordMesh, 'sword-grip', sw.grip, leather);
  addMesh(swordMesh, 'sword-pommel', sw.pommel, darkSteel);
  const swordNode = doc.createNode('Sword').setMesh(swordMesh);

  const sh = buildShieldGeometry();
  const shieldMesh = doc.createMesh('Shield');
  addMesh(shieldMesh, 'shield-face', sh.face, paint);
  addMesh(shieldMesh, 'shield-rim', sh.rim, steel);
  addMesh(shieldMesh, 'shield-boss', sh.boss, steel);
  addMesh(shieldMesh, 'shield-handle', sh.handle, leather);
  const shieldNode = doc.createNode('Shield').setMesh(shieldMesh);

  scene.addChild(swordNode).addChild(shieldNode);
  return { document: doc, triangles };
}

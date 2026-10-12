import { describe, expect, it } from 'vitest';
import { Group, Mesh } from 'three/webgpu';
import { TELEGRAPH, isWeaponObject } from './weaponTelegraph';

function meshUnder(...names: string[]): Mesh {
  const root = new Group();
  let parent: Group = root;
  for (const name of names) {
    const g = new Group();
    g.name = name;
    parent.add(g);
    parent = g;
  }
  const mesh = new Mesh();
  parent.add(mesh);
  return mesh;
}

describe('isWeaponObject', () => {
  it('武器の取り付けノード配下だけを武器とみなす', () => {
    expect(isWeaponObject(meshUnder('hand_r', 'attach:sword'))).toBe(true);
    expect(isWeaponObject(meshUnder('hand_r', 'equip:Sword_Rusty', 'Sword_Rusty'))).toBe(true);
    expect(isWeaponObject(meshUnder('hand_r', 'equip:Axe_Rusty'))).toBe(true);
    expect(isWeaponObject(meshUnder('hand_r', 'equip:GreatAxe'))).toBe(true);
  });

  it('盾・防具・体は武器ではない', () => {
    expect(isWeaponObject(meshUnder('lowerarm_l', 'equip:GreatShield'))).toBe(false);
    expect(isWeaponObject(meshUnder('spine', 'equip:Cuirass'))).toBe(false);
    expect(isWeaponObject(meshUnder('hand_l', 'attach:shield'))).toBe(false);
    expect(isWeaponObject(meshUnder())).toBe(false);
  });
});

describe('TELEGRAPH', () => {
  it('縁の発光は面の発光より強い', () => {
    expect(TELEGRAPH.gain).toBeGreaterThan(TELEGRAPH.fill);
  });
});

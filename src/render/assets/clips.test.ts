import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLIP_NAMES, isLoopingClip } from './clips';

const assetPath = (name: string): string =>
  new URL(`../../../public/assets/${name}`, import.meta.url).pathname;

interface Manifest {
  characters: Record<
    string,
    { bytes: number; triangles: { output: number }; joints: number; textureMemoryBytes: number }
  >;
  animations: { bytes: number; clips: { name: string }[] };
  props: { bytes: number };
  totalBytes: number;
}

const manifest = JSON.parse(readFileSync(assetPath('manifest.json'), 'utf8')) as Manifest;

/** GLB の JSON チャンクだけを取り出す（バイナリ部分は meshopt 圧縮されていても読めない部分は無視）。 */
function readGlbJson(file: string): {
  animations?: { name: string }[];
  nodes?: { name?: string }[];
} {
  const buf = readFileSync(assetPath(file));
  expect(buf.toString('utf8', 0, 4)).toBe('glTF');
  const jsonLength = buf.readUInt32LE(12);
  expect(buf.toString('utf8', 16, 20)).toBe('JSON');
  return JSON.parse(buf.toString('utf8', 20, 20 + jsonLength)) as {
    animations?: { name: string }[];
    nodes?: { name?: string }[];
  };
}

describe('animation clips', () => {
  it('animations.glb contains exactly the clips declared in CLIP_NAMES', () => {
    const names = (readGlbJson('animations.glb').animations ?? []).map((a) => a.name).sort();
    expect(names).toEqual([...CLIP_NAMES].sort());
  });

  it('manifest lists the same clips', () => {
    expect(manifest.animations.clips.map((c) => c.name).sort()).toEqual([...CLIP_NAMES].sort());
  });

  it('includes the clips the combat prototype needs', () => {
    for (const name of [
      'Idle_Loop',
      'Walk_Loop',
      'Jog_Fwd_Loop',
      'Sprint_Loop',
      'Roll',
      'Sword_Regular_A',
      'Sword_Regular_B',
      'Sword_Regular_C',
      'Sword_Heavy_Combo',
      'Sword_Block',
      'Idle_Shield_Loop',
      'Hit_Chest',
      'Death01',
    ] as const) {
      expect(CLIP_NAMES).toContain(name);
    }
  });

  it('loops only locomotion/idle style clips', () => {
    expect(isLoopingClip('Idle_Loop')).toBe(true);
    expect(isLoopingClip('Sword_Idle')).toBe(true);
    expect(isLoopingClip('Roll')).toBe(false);
    expect(isLoopingClip('Sword_Regular_A')).toBe(false);
    expect(isLoopingClip('Death01')).toBe(false);
  });
});

describe('asset budget (docs/assets.md)', () => {
  const knight = manifest.characters['knight'];

  it('exposes the bones used as sockets', () => {
    const nodeNames = new Set(readGlbJson('characters/knight.glb').nodes?.map((n) => n.name));
    expect(nodeNames).toContain('hand_r');
    expect(nodeNames).toContain('lowerarm_l');
    const props = new Set(readGlbJson('props.glb').nodes?.map((n) => n.name));
    expect(props).toContain('Sword');
    expect(props).toContain('Shield');
  });

  it('keeps one character within the triangle, texture-memory and download budget', () => {
    expect(knight).toBeDefined();
    expect(knight?.triangles.output).toBeLessThanOrEqual(25_000);
    expect(knight?.textureMemoryBytes).toBeLessThanOrEqual(24 * 1024 * 1024);
    expect(knight?.bytes).toBeLessThanOrEqual(800 * 1024);
  });

  it('keeps the whole asset set small enough to commit', () => {
    expect(manifest.totalBytes).toBeLessThanOrEqual(3 * 1024 * 1024);
  });
});

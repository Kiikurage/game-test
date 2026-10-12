import { describe, expect, it } from 'vitest';
import { assetHashMap, hashedName, isHashedName } from '../../scripts/assets/hashedAssets.mjs';
import { assetUrl, resolveAssetPath } from './assetUrl';

describe('assetUrl', () => {
  it('returns the path as-is without a hash map (dev server / unit tests)', () => {
    expect(assetUrl('assets/player.glb', '/game-test/')).toBe('/game-test/assets/player.glb');
  });

  it('resolves through the hash map and falls back to the original path', () => {
    const map = { 'assets/player.glb': 'assets/player.0123456789.glb' };
    expect(resolveAssetPath(map, 'assets/player.glb')).toBe('assets/player.0123456789.glb');
    expect(resolveAssetPath(map, 'assets/other.glb')).toBe('assets/other.glb');
  });
});

describe('hashedName', () => {
  const enc = new TextEncoder();

  it('inserts a content hash before the extension and changes it with the content', () => {
    const a = hashedName('assets/water/ripple.ktx2', enc.encode('a'));
    const b = hashedName('assets/water/ripple.ktx2', enc.encode('b'));
    expect(a).toMatch(/^assets\/water\/ripple\.[0-9a-f]{10}\.ktx2$/);
    expect(a).not.toBe(b);
    expect(hashedName('assets/water/ripple.ktx2', enc.encode('a'))).toBe(a);
    expect(isHashedName(a)).toBe(true);
    expect(isHashedName('assets/water/ripple.ktx2')).toBe(false);
  });

  it('maps only renamed files', () => {
    expect(
      assetHashMap([
        { source: 'assets/a.glb', output: 'assets/a.0123456789.glb' },
        { source: 'favicon.ico', output: 'favicon.ico' },
      ]),
    ).toEqual({ 'assets/a.glb': 'assets/a.0123456789.glb' });
  });
});

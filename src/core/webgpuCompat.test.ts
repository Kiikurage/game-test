import { describe, expect, it } from 'vitest';
import { installWebGPUCompat, stripIdentitySwizzle } from './webgpuCompat';

describe('stripIdentitySwizzle', () => {
  it('removes only the identity swizzle', () => {
    expect(stripIdentitySwizzle({ format: 'rgba8unorm', swizzle: 'rgba' })).toEqual({
      format: 'rgba8unorm',
    });
    const bgra = { swizzle: 'bgra' };
    expect(stripIdentitySwizzle(bgra)).toBe(bgra);
    expect(stripIdentitySwizzle(undefined)).toBeUndefined();
  });
});

describe('installWebGPUCompat', () => {
  it('wraps createView once', () => {
    const received: unknown[] = [];
    class Tex {
      createView(d?: Record<string, unknown>): unknown {
        received.push(d);
        return 'view';
      }
    }
    installWebGPUCompat({ GPUTexture: Tex });
    installWebGPUCompat({ GPUTexture: Tex });
    expect(new Tex().createView({ swizzle: 'rgba', dimension: '2d' })).toBe('view');
    expect(received).toEqual([{ dimension: '2d' }]);
  });
  it('does nothing without WebGPU', () => {
    expect(() => {
      installWebGPUCompat({});
    }).not.toThrow();
  });
});

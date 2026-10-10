/**
 * WebGPU 互換シム。three r186 は `GPUTextureViewDescriptor` に恒等 swizzle（`swizzle: 'rgba'`）を
 * 常に渡すが、一部の Chrome（この member をまだ知らない版）は型不一致で `createView` が TypeError になる。
 * 恒等 swizzle は指定しなくても等価なので、`createView` から取り除く。新しい Chrome では何も変わらない。
 * three より先（レンダラー生成前）に一度だけ呼ぶこと。
 */
interface TextureLike {
  prototype: { createView: (this: unknown, descriptor?: Record<string, unknown>) => unknown };
}

const INSTALLED = Symbol.for('game-test.webgpuCompat');

/** 恒等 swizzle を除いた descriptor を返す（該当しなければ同じ参照）。 */
export function stripIdentitySwizzle(
  descriptor: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!descriptor || descriptor.swizzle !== 'rgba') return descriptor;
  const rest = { ...descriptor };
  delete rest.swizzle;
  return rest;
}

export function installWebGPUCompat(target: { GPUTexture?: TextureLike } = globalThis): void {
  const texture = target.GPUTexture;
  if (!texture) return;
  const proto = texture.prototype as typeof texture.prototype & { [INSTALLED]?: true };
  if (proto[INSTALLED]) return;
  proto[INSTALLED] = true;
  const original = proto.createView;
  proto.createView = function createView(this: unknown, descriptor) {
    return original.call(this, stripIdentitySwizzle(descriptor));
  };
}

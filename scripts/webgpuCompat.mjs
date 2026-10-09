// 古い Chromium（ローカルの /opt/pw-browsers は Chrome 141）向けの互換シム。
// three r186 は GPUTextureViewDescriptor に swizzle: 'rgba' を常に渡すが、古い Chrome は
// この member の型が合わず createView が TypeError になる。恒等 swizzle なので落としても等価。
// ブラウザ内で実行される関数（page.addInitScript に渡す）。外部変数を参照しないこと。
export function webgpuCompatInit() {
  if (typeof GPUTexture === 'undefined') return;
  const original = GPUTexture.prototype.createView;
  GPUTexture.prototype.createView = function createView(descriptor) {
    if (descriptor && descriptor.swizzle === 'rgba') {
      const rest = { ...descriptor };
      delete rest.swizzle;
      return original.call(this, rest);
    }
    return original.call(this, descriptor);
  };
}

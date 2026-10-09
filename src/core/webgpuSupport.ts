/** WebGPU が使えるか確認する。使えない場合は理由付きの結果を返す。 */
export type WebGPUSupport = { ok: true } | { ok: false; reason: string };

interface GPULike {
  requestAdapter(): Promise<unknown>;
}

export async function checkWebGPUSupport(): Promise<WebGPUSupport> {
  const gpu = (navigator as { gpu?: GPULike }).gpu;
  if (!gpu) return { ok: false, reason: 'navigator.gpu is not available' };
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { ok: false, reason: 'No suitable GPU adapter was found' };
  } catch (e) {
    return { ok: false, reason: `requestAdapter() failed: ${String(e)}` };
  }
  return { ok: true };
}

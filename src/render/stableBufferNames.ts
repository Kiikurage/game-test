import { WGSLNodeBuilder } from 'three/webgpu';

/**
 * three r186 の WGSL ビルダーは、名前の無いバッファ（スキニングのボーン行列・インスタンス行列など）を
 * `NodeBuffer_<ノード id>` と名付ける。ノード id はメッシュごとに違うので、同じマテリアル・同じ骨格でも
 * シェーダコードが一致せず、メッシュの数だけパイプラインができる（#326）。
 * ビルダー内の出現順の連番で名付け直し、同じ構成のメッシュでシェーダコードが一致するようにする。
 * 名前はシェーダ内の識別子にしか使われない（バインドはノード側で引く）ので、連番で十分一意。
 */
type GetUniformFromNode = (
  this: BuilderLike,
  node: unknown,
  type: string,
  shaderStage: string,
  name?: string | null,
) => unknown;

interface BuilderLike {
  globalCache: unknown;
  getDataFromNode(node: unknown, shaderStage: string, cache: unknown): { uniformGPU?: unknown };
  [SEQ]?: number;
}

const SEQ = Symbol('stableBufferSeq');
const INSTALLED = Symbol.for('game-test.stableBufferNames');
const BUFFER_TYPES = new Set(['buffer', 'storageBuffer', 'indirectStorageBuffer']);

export function installStableBufferNames(): void {
  const proto = WGSLNodeBuilder.prototype as unknown as {
    getUniformFromNode: GetUniformFromNode;
    [INSTALLED]?: true;
  };
  if (proto[INSTALLED]) return;
  proto[INSTALLED] = true;
  const original = proto.getUniformFromNode;
  proto.getUniformFromNode = function (node, type, shaderStage, name = null) {
    if (!name && BUFFER_TYPES.has(type)) {
      const data = this.getDataFromNode(node, shaderStage, this.globalCache);
      if (data.uniformGPU === undefined) {
        const seq = (this[SEQ] ?? 0) + 1;
        this[SEQ] = seq;
        name = `NodeBuffer_s${String(seq)}`;
      }
    }
    return original.call(this, node, type, shaderStage, name);
  };
}

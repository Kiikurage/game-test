// three r186 の TAAUNode に、履歴の Catmull-Rom 補間を足したもの（#318）。
//
// 標準の TAAUNode は再投影した履歴を双線形で読む。カメラが少しでも動くと毎フレーム半画素ずれた位置で読み直すことになり、
// 双線形のぼけが溜まって像全体が数画素ぼける（撮影で確認。静止した岩・石畳までぼけた）。
// Catmull-Rom（5 回の双線形サンプルで 4x4 を近似）にすると、再サンプルを繰り返しても鋭さが保たれる。
//
// 継承して setup の後で resolve マテリアルの colorNode / outputNode だけを差し替える。resolve の本体は r186 の
// TAAUNode.setup の resolve を移したもので、違いは履歴の読み方（historyNode.sample → catmullRom）だけ。
// three を更新したら、TAAUNode.setup の resolve と見比べて追従すること（ジッタ・履歴・深度の更新は親のまま）。
import {
  type Camera,
  type Node,
  type NodeBuilder,
  type NodeMaterial,
  type RenderTarget,
  type TextureNode,
  type UniformNode,
  type Matrix4,
  type Vector2,
} from 'three/webgpu';
import {
  Fn,
  exp,
  float,
  floor,
  int,
  ivec2,
  luminance,
  max,
  mix,
  outputStruct,
  property,
  texture,
  uv,
  vec2,
  vec4,
} from 'three/tsl';
import TAAUNode from 'three/addons/tsl/display/TAAUNode.js';
import {
  clipAABB,
  flickerReduction,
  sampleCurrentDepth,
  samplePreviousDepth,
} from 'three/addons/tsl/utils/TAAUtils.js';

/** テクスチャを Catmull-Rom で読む（Jimenez の 5 タップ近似。負の重みで出る負値は 0 に丸める）。 */
export function catmullRom(tex: TextureNode, p: Node<'vec2'>): Node<'vec4'> {
  const size = vec2(tex.size(int(0)) as Node<'ivec2'>);
  const pos = p.mul(size);
  const tc1 = floor(pos.sub(0.5)).add(0.5);
  const f = pos.sub(tc1);
  const w0 = f.mul(float(-0.5).add(f.mul(float(1).sub(f.mul(0.5)))));
  const w1 = float(1).add(f.mul(f).mul(float(-2.5).add(f.mul(1.5))));
  const w2 = f.mul(float(0.5).add(f.mul(float(2).sub(f.mul(1.5)))));
  const w3 = f.mul(f).mul(float(-0.5).add(f.mul(0.5)));
  const w12 = w1.add(w2);
  const tc0 = tc1.sub(1).div(size);
  const tc3 = tc1.add(2).div(size);
  const tc12 = tc1.add(w2.div(w12)).div(size);
  const at = (x: Node<'float'>, y: Node<'float'>): Node<'vec4'> => tex.sample(vec2(x, y));
  const wa = w12.x.mul(w0.y);
  const wb = w0.x.mul(w12.y);
  const wc = w12.x.mul(w12.y);
  const wd = w3.x.mul(w12.y);
  const we = w12.x.mul(w3.y);
  const sum = at(tc12.x, tc0.y)
    .mul(wa)
    .add(at(tc0.x, tc12.y).mul(wb))
    .add(at(tc12.x, tc12.y).mul(wc))
    .add(at(tc3.x, tc12.y).mul(wd))
    .add(at(tc12.x, tc3.y).mul(we));
  return max(sum.div(wa.add(wb).add(wc).add(wd).add(we)), vec4(0));
}

/** 親（TAAUNode）の内部フィールド。resolve を組み直すためだけに読む。 */
interface TaauInternals {
  _historyRenderTarget: RenderTarget;
  _resolveMaterial: NodeMaterial;
  _jitterOffset: UniformNode<'vec2', Vector2>;
  _cameraNearFar: UniformNode<'vec2', Vector2>;
  _cameraWorldMatrixInverse: UniformNode<'mat4', Matrix4>;
  _previousCameraWorldMatrix: UniformNode<'mat4', Matrix4>;
  _previousCameraProjectionMatrixInverse: UniformNode<'mat4', Matrix4>;
  _previousDepthNode: TextureNode;
}

const OFFSETS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [0, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

class SharpHistoryTAAUNode extends TAAUNode {
  override setup(builder: NodeBuilder): Node | null | undefined {
    const result = super.setup(builder);
    const self = this as unknown as TaauInternals;
    const history = self._historyRenderTarget.textures;
    const historyNode = texture(history[0]);
    const lockNode = texture(history[1]);
    const beauty = this.beautyNode;
    const colorOutput = property('vec4');
    const lockOutput = property('vec4');

    // ここから r186 TAAUNode.setup の resolve と同じ（履歴の読み方だけ違う）
    const resolve = Fn(() => {
      const uvNode = uv();
      const inputSizeF = vec2(beauty.size(int(0)) as Node<'ivec2'>);
      const pIn = uvNode.mul(inputSizeF);
      const closestTapF = pIn.sub(vec2(0.5).add(self._jitterOffset)).round();
      const closestTap = ivec2(closestTapF);

      const currentDepth = sampleCurrentDepth(this.depthNode, closestTapF, self._cameraNearFar);
      const closestDepth = currentDepth.get('closestDepth');
      const closestPositionTexel = currentDepth.get('closestPositionTexel');
      const farthestDepth = currentDepth.get('farthestDepth');

      const offsetUV = this.velocityNode.load(closestPositionTexel).xy.mul(vec2(0.5, -0.5));
      const historyUV = uvNode.sub(offsetUV);
      const previousDepth = samplePreviousDepth(
        self._previousDepthNode,
        historyUV,
        self._previousCameraProjectionMatrixInverse,
        self._previousCameraWorldMatrix,
        self._cameraWorldMatrixInverse,
        self._cameraNearFar,
        this.camera,
      );

      const isValidUV = historyUV.greaterThanEqual(0).all().and(historyUV.lessThanEqual(1).all());
      const isEdge = farthestDepth.sub(closestDepth).greaterThan(this.edgeDepthDiff);
      const isDisocclusion = closestDepth.sub(previousDepth).greaterThan(this.depthThreshold);
      const hasValidHistory = isValidUV.and(isEdge.or(isDisocclusion.not()));

      const sumColor = vec4(0).toVar();
      const sumWeight = float(0).toVar();
      const moment1 = vec4(0).toVar();
      const moment2 = vec4(0).toVar();
      for (const [x, y] of OFFSETS) {
        const tap = closestTap.add(ivec2(x, y));
        const tapCenter = vec2(tap).add(vec2(0.5).add(self._jitterOffset));
        const delta = pIn.sub(tapCenter);
        const w = exp(delta.dot(delta).mul(-2.29));
        const c = beauty.load(tap).max(0);
        sumColor.addAssign(c.mul(w));
        sumWeight.addAssign(w);
        moment1.addAssign(c);
        moment2.addAssign(c.pow2());
      }
      const currentColor = sumColor.div(sumWeight.max(1e-5));

      const n = float(OFFSETS.length);
      const mean = moment1.div(n);
      const motionFactor = uvNode
        .sub(historyUV)
        .mul(inputSizeF)
        .length()
        .div(this.maxVelocityLength)
        .saturate();
      const varianceGamma = mix(0.5, 1, motionFactor.oneMinus().pow2());
      const variance = moment2.div(n).sub(mean.pow2()).max(0).sqrt().mul(varianceGamma);
      const minColor = mean.sub(variance);
      const maxColor = mean.add(variance);

      const historyColor = catmullRom(historyNode, historyUV);
      const clippedHistoryColor = clipAABB(
        mean.clamp(minColor, maxColor),
        historyColor,
        minColor,
        maxColor,
      );

      const currentLuma = luminance(currentColor.rgb);
      const meanLuma = luminance(mean.rgb).toConst();
      const thinFeature = currentLuma.sub(meanLuma).abs().div(meanLuma).smoothstep(0, 0.2);
      const isDepthChanged = closestDepth.sub(previousDepth).abs().greaterThan(this.depthThreshold);
      const canLock = isValidUV.and(isDepthChanged.not());
      const gatedThinFeature = canLock.select(thinFeature, float(0));
      const decay = isDisocclusion.select(0, 0.5);
      const lock = max(gatedThinFeature, lockNode.r.mul(decay)).saturate();
      const lockedHistoryColor = mix(clippedHistoryColor, historyColor, lock);

      const currentWeight = float(this.currentFrameWeight).toVar();
      currentWeight.assign(hasValidHistory.select(currentWeight.add(motionFactor).saturate(), 1));
      colorOutput.assign(flickerReduction(currentColor, lockedHistoryColor, currentWeight));
      lockOutput.assign(lock);
      return vec4(0);
    });

    const material = self._resolveMaterial;
    // contextNode は親の setup が設定したものをそのまま使う
    material.colorNode = resolve();
    material.outputNode = outputStruct(colorOutput, lockOutput);
    material.needsUpdate = true;
    return result;
  }
}

export function sharpTaau(
  beauty: TextureNode,
  depth: TextureNode,
  velocity: TextureNode,
  camera: Camera,
): TAAUNode {
  return new SharpHistoryTAAUNode(beauty, depth, velocity, camera);
}

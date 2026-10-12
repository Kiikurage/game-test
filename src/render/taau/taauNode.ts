// three r186 の TAAUNode に、履歴の Catmull-Rom 補間を足したもの（#318）。
//
// 標準の TAAUNode は再投影した履歴を双線形で読む。カメラが少しでも動くと毎フレーム半画素ずれた位置で読み直すことになり、
// 双線形のぼけが溜まって像全体が数画素ぼける（撮影で確認。静止した岩・石畳までぼけた）。
// Catmull-Rom（5 回の双線形サンプルで 4x4 を近似）にすると、再サンプルを繰り返しても鋭さが保たれる。
//
// TAAUNode は履歴の TextureNode を内部で作るため、TextureNode.sample を包み、
// 履歴テクスチャ（_historyRenderTarget.textures[0]）の sample だけを Catmull-Rom に置き換える（他のテクスチャには影響しない）。
import { TextureNode, type Camera, type Node, type RenderTarget, type Texture } from 'three/webgpu';
import { float, floor, int, max, vec2, vec4 } from 'three/tsl';
import TAAUNode from 'three/addons/tsl/display/TAAUNode.js';

type SampleFn = (this: TextureNode, uv: Node) => TextureNode;

/** 履歴テクスチャを Catmull-Rom で読む（Jimenez の 5 タップ近似。負の重みで出る負値は 0 に丸める）。 */
function catmullRom(tex: TextureNode, uv: Node<'vec2'>, sample: SampleFn): Node<'vec4'> {
  const size = vec2(tex.size(int(0)) as Node<'ivec2'>);
  const pos = uv.mul(size);
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
  const at = (x: Node<'float'>, y: Node<'float'>): Node<'vec4'> => sample.call(tex, vec2(x, y));
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

interface TaauInternals {
  _historyRenderTarget: RenderTarget;
}

/** Catmull-Rom で読む履歴テクスチャ。 */
const sharpHistories = new WeakSet<Texture>();

// 履歴の sample は TAAUNode の resolve（遅延評価の Fn）の中で、マテリアルのビルド時に呼ばれるので、setup の間だけ差し替えても
// 届かない。TextureNode.sample を 1 度だけ包み、登録した履歴テクスチャのときだけ Catmull-Rom にする（他は元の処理そのまま）。
let patched = false;
function patchTextureSample(): void {
  if (patched) return;
  patched = true;
  const proto = TextureNode.prototype as unknown as { sample: SampleFn };
  const original = proto.sample;
  proto.sample = function (this: TextureNode, uv: Node): TextureNode {
    const value = this.value as Texture | null;
    if (value === null || !sharpHistories.has(value)) return original.call(this, uv);
    return catmullRom(this, uv as Node<'vec2'>, original) as unknown as TextureNode;
  };
}

export function sharpTaau(
  beauty: TextureNode,
  depth: TextureNode,
  velocity: TextureNode,
  camera: Camera,
): TAAUNode {
  patchTextureSample();
  const node = new TAAUNode(beauty, depth, velocity, camera);
  const history = (node as unknown as TaauInternals)._historyRenderTarget.textures[0];
  if (history) sharpHistories.add(history);
  return node;
}

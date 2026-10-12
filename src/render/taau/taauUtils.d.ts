// three r186 の TAAUtils（@types/three に型が無い）。taauNode.ts が使う分だけ宣言する。
declare module 'three/addons/tsl/utils/TAAUtils.js' {
  import type { Camera, Node } from 'three/webgpu';

  interface CurrentDepth {
    get(name: 'closestDepth' | 'farthestDepth'): Node<'float'>;
    get(name: 'closestPositionTexel'): Node<'ivec2'>;
  }
  export function clipAABB(
    current: Node<'vec4'>,
    history: Node<'vec4'>,
    min: Node<'vec4'>,
    max: Node<'vec4'>,
  ): Node<'vec4'>;
  export function flickerReduction(
    current: Node<'vec4'>,
    history: Node<'vec4'>,
    weight: Node<'float'>,
  ): Node<'vec4'>;
  export function sampleCurrentDepth(
    depth: Node,
    texel: Node<'vec2'>,
    nearFar: Node<'vec2'>,
  ): CurrentDepth;
  export function samplePreviousDepth(
    previousDepth: Node,
    uv: Node<'vec2'>,
    previousProjectionInverse: Node<'mat4'>,
    previousWorld: Node<'mat4'>,
    worldInverse: Node<'mat4'>,
    nearFar: Node<'vec2'>,
    camera: Camera,
  ): Node<'float'>;
}

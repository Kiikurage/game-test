import { AnimationClip, type Object3D } from 'three/webgpu';

/**
 * 上半身 / 下半身のレイヤ分けに使うボーンの振り分け。
 * three.js のミキサーにはボーンマスクがないので、クリップのトラックをボーンごとに振り分けた
 * 「上半身だけ」「下半身だけ」のクリップを作り、別々のウェイトで合成する（`LayeredAnimation`）。
 */

/** `spine_01`（背骨の根元）とその子孫のボーン名 = 上半身（腕・頭・手に持つ物を含む）。ボーンがなければ空。 */
export function upperBodyBoneNames(root: Object3D, spineRoot = 'spine_01'): Set<string> {
  const names = new Set<string>();
  const start = root.getObjectByName(spineRoot);
  start?.traverse((o) => {
    if (o.name) names.add(o.name);
  });
  return names;
}

/** トラック名（`bone.quaternion` など）が指すノード名。 */
export function trackNodeName(trackName: string): string {
  const dot = trackName.lastIndexOf('.');
  return dot < 0 ? trackName : trackName.slice(0, dot);
}

/** `keep(ノード名)` が true のトラックだけを持つクリップを作る（元のクリップは変更しない）。 */
export function maskClip(
  clip: AnimationClip,
  keep: (nodeName: string) => boolean,
  suffix: string,
): AnimationClip {
  const tracks = clip.tracks.filter((t) => keep(trackNodeName(t.name))).map((t) => t.clone());
  return new AnimationClip(`${clip.name}:${suffix}`, clip.duration, tracks);
}

import type { Object3D } from 'three/webgpu';

/** `markStatic` の追加指定。 */
export interface StaticOptions {
  /** 静的にしない部分木（開閉する扉・蓋など、後で位置・回転を変える物）。その子孫も触らない。 */
  readonly except?: readonly Object3D[];
}

/**
 * 組み立てが終わった静的な部分木を「ロード時に 1 回だけ行列を確定する」状態にする（#385）。
 * 行列を 1 回確定（`updateWorldMatrix`）してから、全ノードの `matrixAutoUpdate` / `matrixWorldAutoUpdate` を止める。
 * 以降は位置・回転・拡大を変えても反映されない。動く物（キャラクター・パーティクル・扉・揺れる旗など）には呼ばない。
 * `visible` の切り替えは行列と無関係なので、静的な部分木でも使える。
 */
export function markStatic(root: Object3D, options: StaticOptions = {}): void {
  const skip = new Set<Object3D>(options.except ?? []);
  // 先に行列を確定させる（`matrixWorldAutoUpdate` を止めると world 行列が計算されなくなるため）
  root.updateWorldMatrix(true, true);
  const walk = (o: Object3D): void => {
    if (skip.has(o)) return;
    o.matrixAutoUpdate = false;
    o.matrixWorldAutoUpdate = false;
    for (const c of o.children) walk(c);
  };
  walk(root);
}

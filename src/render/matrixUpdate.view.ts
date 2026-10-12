import type { Object3D } from 'three/webgpu';
import { registerViewPlugin } from './viewPlugins';

// 行列更新の削減（#262）。
// three の `renderer.render(scene, camera)` は呼ばれるたびに `scene.updateMatrixWorld()` を辿る。
// 1 フレームに本描画と影（`ShadowNode` が影のカメラで `renderer.render` を呼ぶ）の複数回描くので、
// 全オブジェクト（骨を含め千個以上）の行列計算が描画回数ぶん繰り返されていた。
//  - シーンの自動更新を止め、描画の直前に 1 回だけ `scene.updateMatrixWorld()` する。
//  - 動かない入れ物（シーン・レベルのルート）と静的な環境メッシュ（結合済みの環境・地面）の
//    `matrixAutoUpdate` を止める。親が自動更新だと `updateMatrix` → 子孫すべてを強制再計算になるため、
//    入れ物を止めるだけで静的な枝の行列計算が毎フレーム起きなくなる（動く子は自分の自動更新で従来どおり）。

/** 行列を確定させてから自動更新を止める（以降は位置を変えても反映されない）。 */
function freeze(object: Object3D): void {
  object.updateMatrix();
  object.matrixAutoUpdate = false;
  object.matrixWorldNeedsUpdate = true;
}

registerViewPlugin('matrixUpdate', ({ view }) => {
  const { scene } = view;
  scene.matrixWorldAutoUpdate = false;
  freeze(scene);
  const levelRoot = view.levelView?.root;
  if (levelRoot) {
    freeze(levelRoot);
    const ground = levelRoot.getObjectByName('ground');
    if (ground) freeze(ground);
  }

  // `?nodraw` では描画を呼ばないので行列も更新しない（従来どおり。描画が行列を更新していた）
  const post = view.pipeline as { render: () => void };
  const render = post.render.bind(post);
  post.render = () => {
    scene.updateMatrixWorld();
    render();
  };

  let environmentFrozen = false;
  return {
    update: () => {
      // 結合済みの環境メッシュ（`LevelView.attachEnvironment`。読み込み後に足される）は丸ごと静的
      if (!environmentFrozen && levelRoot) {
        const env = levelRoot.getObjectByName('environment');
        if (env) {
          env.traverse(freeze);
          environmentFrozen = true;
        }
      }
    },
  };
});

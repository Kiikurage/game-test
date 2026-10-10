import { bonfiresOf } from '../../game/bonfire/bonfire';
import { registerViewPlugin } from '../viewPlugins';

// 篝火の炎と灯りを、点火状態（game の `bonfiresOf(game)`）に合わせる。
// 炎・火の粉・光源はパーティクル（`levelView.bonfire`。環境メッシュを置いたあとに作られる）で、
// 消えている篝火は炎なし、点火で約 0.6 秒かけて灯る。
registerViewPlugin('bonfire', ({ game, view }) => {
  const bonfires = bonfiresOf(game);
  return {
    update: () => {
      const emitter = view.levelView?.bonfire;
      const id = bonfires.ids[0];
      if (!emitter || id === undefined) return;
      const lit = bonfires.isLit(id);
      if (emitter.isLit !== lit) emitter.setLit(lit);
    },
  };
});

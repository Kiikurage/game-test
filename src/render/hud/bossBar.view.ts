// ボス HP バー（DOM）を描画ループにつなぐビュープラグイン。見た目は `src/ui/hud/bossBar.ts`、状態は `src/presentation/hud/bossBarModel.ts`。
// HUD 全体のフェード（死亡演出・篝火の休憩）に合わせるため、不透明度は HUD の値との積を渡す。
import { mountBossBar, type BossBarView } from '../../ui/hud/bossBar';
import { registerViewPlugin } from '../viewPlugins';
import { hudPresentation } from '../../presentation/hud/hudPresentation';

registerViewPlugin('bossBar', ({ game }) => {
  const { bossBar: model, hud } = hudPresentation(game);
  const view: BossBarView = {
    get name() {
      return model.name;
    },
    get boundaries() {
      return model.boundaries;
    },
    get hpRatio() {
      return model.hpRatio;
    },
    get ghostRatio() {
      return model.ghostRatio;
    },
    get glow() {
      return model.glow;
    },
    get opacity() {
      return model.opacity * hud.opacity;
    },
  };
  const bar = mountBossBar(view);
  return {
    update: () => {
      bar.update();
    },
  };
});

import { HUD_FADE_FRAMES } from '../../game/hud/hudModel';
import { DEATH } from '../../game/data/death';
import { deathOf } from '../../game/death/death.system';
import { registerViewPlugin } from '../viewPlugins';

// 死亡演出の描画（8.1 節）: 画面の脱色・減光・周辺減光・黒へのフェード（ポストエフェクトの `setScreenEffect`）と、
// 「倒れた」テキスト。値は game の `deathOf(game).visual`（タイムラインから決定的に計算）を読むだけ。
// テキストの見た目は暫定（セリフ体 64px・`#8b1a1a`・字間広め・1.05 倍へ拡大）。本実装は E6-3b。
registerViewPlugin('death', ({ game, view }) => {
  const death = deathOf(game);
  const text = document.createElement('div');
  text.textContent = '倒れた';
  text.setAttribute('data-testid', 'death-text');
  text.setAttribute('aria-hidden', 'true');
  Object.assign(text.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif',
    fontSize: '64px',
    letterSpacing: '0.4em',
    paddingLeft: '0.4em',
    color: '#8b1a1a',
    opacity: '0',
    zIndex: '5',
  });
  (document.getElementById('app') ?? document.body).appendChild(text);

  // 死亡中はタッチ操作 UI も HUD と同じ速さ（30F）でフェードアウトし、再開で戻す。
  // opacity だけ変える（ポインタは受け付けたままなので、F90 以降のスキップ入力はそのまま効く）。
  let touch: HTMLElement | null = null;
  let touchOpacity = 1;
  const fadePerSecond = 60 / HUD_FADE_FRAMES;

  let last = '';
  return {
    update: (dt) => {
      {
        touch ??= document.querySelector<HTMLElement>('[data-testid=touch-controls]');
        const target = death.active ? 0 : 1;
        touchOpacity =
          target < touchOpacity
            ? Math.max(target, touchOpacity - fadePerSecond * dt)
            : Math.min(target, touchOpacity + fadePerSecond * dt);
        if (touch) touch.style.opacity = touchOpacity >= 1 ? '' : String(touchOpacity);
      }
      const v = death.visual;
      const key = `${v.grade}|${v.fade}|${v.textAlpha}|${v.textScale}`;
      if (key === last) return;
      last = key;
      view.postProcess.setScreenEffect({
        desaturate: v.grade,
        dim: DEATH.dimMax * v.grade,
        vignette: v.grade,
        fade: v.fade,
      });
      text.style.opacity = String(v.textAlpha);
      text.style.transform = `scale(${v.textScale})`;
    },
  };
});

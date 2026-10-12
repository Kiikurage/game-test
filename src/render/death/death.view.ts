import { HUD_FADE_FRAMES } from '../../game/hud/hudModel';
import { DEATH } from '../../game/data/death';
import { registerViewPlugin } from '../viewPlugins';
import { deathSystem } from '../../game/death/death.system';

// 死亡演出の描画（8.1 節）: 画面の脱色・減光・周辺減光・黒へのフェード（ポストエフェクトの `setScreenEffect`）と、
// 「YOU DIED」テキスト。値は game の `game.systems.get(deathSystem).visual`（タイムラインから決定的に計算）を読むだけ。
// テキストは英字セリフ体・暗い赤・字間広めで、暗い帯の上に出す（1.05 倍へゆっくり拡大）。
registerViewPlugin('death', ({ game, view }) => {
  const death = game.systems.get(deathSystem);
  // 画面中央を横切る暗い帯の上に、英字のセリフ体で「YOU DIED」
  const text = document.createElement('div');
  text.setAttribute('data-testid', 'death-text');
  text.setAttribute('aria-hidden', 'true');
  Object.assign(text.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    opacity: '0',
    zIndex: '5',
  });
  const band = document.createElement('div');
  Object.assign(band.style, {
    width: '100%',
    padding: '0.35em 0',
    display: 'flex',
    justifyContent: 'center',
    fontSize: 'clamp(44px, 8vw, 96px)',
    background:
      'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 28%, rgba(0,0,0,0.62) 72%, rgba(0,0,0,0) 100%)',
  });
  const label = document.createElement('span');
  label.textContent = 'YOU DIED';
  Object.assign(label.style, {
    fontFamily: '"Cinzel", "Trajan Pro", "Optima", "Times New Roman", serif',
    fontWeight: '400',
    letterSpacing: '0.16em',
    paddingLeft: '0.16em',
    color: '#9b1c1c',
    textShadow: '0 0 0.35em rgba(120, 10, 10, 0.45)',
    whiteSpace: 'nowrap',
  });
  band.appendChild(label);
  text.appendChild(band);
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
      view.pipeline.setScreenEffect({
        desaturate: v.grade,
        dim: DEATH.dimMax * v.grade,
        vignette: v.grade,
        fade: v.fade,
      });
      text.style.opacity = String(v.textAlpha);
      label.style.transform = `scale(${v.textScale})`;
    },
  };
});

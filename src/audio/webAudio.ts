import { AudioEngine } from './audioEngine';

/** ブラウザの AudioContext から AudioEngine を作る。使えない環境では undefined。 */
export function createBrowserAudioEngine(): AudioEngine<AudioContext> | undefined {
  try {
    const Ctor: typeof AudioContext | undefined =
      (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return undefined;
    // 低遅延。サンプルレートは端末既定（素材が 44.1kHz でも自動でリサンプルされる）。
    return new AudioEngine(new Ctor({ latencyHint: 'interactive' }));
  } catch (e) {
    console.warn('AudioContext unavailable', e);
    return undefined;
  }
}

/**
 * 自動再生制限の解除。ユーザー操作のイベントで `engine.resume()` を呼ぶ。
 * iOS Safari は pointerdown / touchstart では解除されず touchend（または click）が必要なため、
 * pointerup / touchend / click / keydown を購読する。running になるまで操作のたびに再試行し、
 * iOS の中断（interrupted）からの復帰でも再度効く。
 * 戻り値は購読解除。
 */
export function installAudioUnlock(
  engine: Pick<AudioEngine, 'state' | 'resume'>,
  target: EventTarget,
): () => void {
  const events = ['pointerup', 'touchend', 'click', 'keydown'] as const;
  const handler = (): void => {
    if (engine.state !== 'running') void engine.resume();
  };
  for (const e of events) target.addEventListener(e, handler, { capture: true, passive: true });
  return () => {
    for (const e of events) target.removeEventListener(e, handler, { capture: true });
  };
}

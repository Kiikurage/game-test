import { describe, expect, it } from 'vitest';
import { enterImmersive, shouldPause } from './immersive';

describe('enterImmersive', () => {
  it('requests fullscreen before locking orientation', async () => {
    const calls: string[] = [];
    const result = await enterImmersive({
      fullscreenSupported: true,
      requestFullscreen: () => {
        calls.push('fullscreen');
        return Promise.resolve();
      },
      lockLandscape: () => {
        calls.push('lock');
        return Promise.resolve();
      },
    });
    expect(calls).toEqual(['fullscreen', 'lock']);
    expect(result).toEqual({ fullscreen: true, orientationLocked: true });
  });

  it('swallows failures and still reports what succeeded', async () => {
    const result = await enterImmersive({
      fullscreenSupported: true,
      requestFullscreen: () => Promise.reject(new Error('denied')),
      lockLandscape: () => Promise.reject(new Error('NotSupportedError')),
    });
    expect(result).toEqual({ fullscreen: false, orientationLocked: false });
  });

  it('handles synchronous throws and unsupported fullscreen', async () => {
    let requested = false;
    const result = await enterImmersive({
      fullscreenSupported: false,
      requestFullscreen: () => {
        requested = true;
        return Promise.resolve();
      },
      lockLandscape: () => {
        throw new Error('no orientation api');
      },
    });
    expect(requested).toBe(false);
    expect(result).toEqual({ fullscreen: false, orientationLocked: false });
  });
});

describe('shouldPause', () => {
  const base = { touch: true, portrait: false, fullscreenEntered: true, isFullscreen: true };
  it('keeps running in landscape fullscreen', () => {
    expect(shouldPause(base)).toBe(false);
  });
  it('pauses when fullscreen is left or the device is rotated to portrait', () => {
    expect(shouldPause({ ...base, isFullscreen: false })).toBe(true);
    expect(shouldPause({ ...base, portrait: true })).toBe(true);
  });
  it('does not require fullscreen where it was never available', () => {
    expect(shouldPause({ ...base, fullscreenEntered: false, isFullscreen: false })).toBe(false);
    expect(shouldPause({ ...base, fullscreenEntered: false, portrait: true })).toBe(true);
  });
  it('never pauses on non-touch devices', () => {
    expect(shouldPause({ ...base, touch: false, portrait: true, isFullscreen: false })).toBe(false);
  });
});

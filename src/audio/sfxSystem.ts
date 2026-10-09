import type { GameEventBus } from '../core/gameEvents';
import type { AudioEngine } from './audioEngine';
import { listenerPoseFromMatrix, type WorldMatrixSource } from './listener';
import { SfxPlayer } from './sfxPlayer';
import { bindSfxEvents } from './sfxEvents';
import { PRELOAD_GROUPS, SoundLibrary, detectOggOpusSupport } from './soundLibrary';
import { maxVoicesFor } from './voiceLimiter';

export interface SfxSystemOptions {
  /** `import.meta.env.BASE_URL`。 */
  readonly baseUrl: string;
  readonly isMobile: boolean;
}

export interface SfxSystem {
  readonly library: SoundLibrary;
  readonly player: SfxPlayer;
  /** マニフェストの読み込み完了（失敗しても reject しない。無音で続行する）。 */
  readonly ready: Promise<void>;
  /** 毎フレーム（カメラ行列の更新後）に呼ぶ。 */
  syncListener(camera: WorldMatrixSource): void;
  /** グループ単位のプリロード（`title`: BGM・UI・環境音 / `field`: 敵・ボス SE）。 */
  preloadGroup(group: keyof typeof PRELOAD_GROUPS): Promise<void>;
  dispose(): void;
}

/** ブラウザ向けの組み立て。`events` は game 層が発行するイベントバス。 */
export function createSfxSystem(
  engine: AudioEngine<AudioContext>,
  events: GameEventBus,
  opts: SfxSystemOptions,
): SfxSystem {
  const ctx = engine.context;
  const audioBase = `${opts.baseUrl}assets/audio/`;
  const library = new SoundLibrary({
    decode: (data) => ctx.decodeAudioData(data),
    baseUrl: audioBase,
    opusSupported: detectOggOpusSupport(),
  });
  const player = new SfxPlayer(ctx, engine, library, { maxVoices: maxVoicesFor(opts.isMobile) });
  const unbind = bindSfxEvents(events, player);
  const ready = library.loadManifest(`${audioBase}manifest.json`).catch((e: unknown) => {
    console.warn('audio: manifest unavailable, running silent', e);
  });
  return {
    library,
    player,
    ready,
    syncListener(camera) {
      const pose = listenerPoseFromMatrix(camera.matrixWorld.elements);
      player.setListener(pose.position, pose.forward, pose.up);
    },
    async preloadGroup(group) {
      await ready;
      await library.preload(PRELOAD_GROUPS[group]);
    },
    dispose() {
      unbind();
      player.stopAll();
    },
  };
}

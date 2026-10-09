import { PersistentStore, type LoadStatus, type StoreSchema } from './store';
import type { KeyValueStorage } from './storage';
import { asBoolean, asNumber, asOneOf, clampNumber, isRecord } from './validate';

export const SETTINGS_KEY = 'gametest.settings.v1';
export const SETTINGS_VERSION = 1;

export const CAMERA_SHAKE_LEVELS = [0, 50, 100] as const;
export const QUALITY_PRESETS = ['low', 'medium', 'high', 'auto'] as const;
export const FRAME_RATE_CAPS = [30, 60] as const;
export const INPUT_ASSISTS = ['off', 'standard', 'strong'] as const;
export const BUTTON_LAYOUTS = ['standard', 'mirrored', 'large'] as const;

/** 設定（仕様書 9.3 節）。`resolutionScale` の 'auto' は動的スケーリング。 */
export interface Settings {
  readonly cameraSensitivityX: number; // 0.5〜2.0
  readonly cameraSensitivityY: number;
  readonly invertY: boolean;
  readonly cameraShake: (typeof CAMERA_SHAKE_LEVELS)[number];
  readonly volumeMaster: number; // 0〜100
  readonly volumeBgm: number;
  readonly volumeSfx: number;
  readonly quality: (typeof QUALITY_PRESETS)[number];
  readonly resolutionScale: 'auto' | number; // 50〜100（5 刻み）
  readonly frameRateCap: (typeof FRAME_RATE_CAPS)[number];
  readonly inputAssist: (typeof INPUT_ASSISTS)[number];
  readonly haptics: boolean;
  readonly buttonLayout: (typeof BUTTON_LAYOUTS)[number];
  readonly buttonOpacity: number; // 30〜100
}

export interface SettingsEnv {
  /** モバイルならフレームレート上限の既定が 30、そうでなければ 60。 */
  readonly mobile: boolean;
}

const DESKTOP: SettingsEnv = { mobile: false };

export function createDefaultSettings(env: SettingsEnv = DESKTOP): Settings {
  return {
    cameraSensitivityX: 1,
    cameraSensitivityY: 1,
    invertY: false,
    cameraShake: 100,
    volumeMaster: 80,
    volumeBgm: 60,
    volumeSfx: 80,
    quality: 'auto',
    resolutionScale: 'auto',
    frameRateCap: env.mobile ? 30 : 60,
    inputAssist: 'standard',
    haptics: true,
    buttonLayout: 'standard',
    buttonOpacity: 60,
  };
}

/** 欠けた・不正な項目は既定値で補い、範囲外は丸める。未知のキーは捨てる。 */
export function sanitizeSettings(raw: unknown, env: SettingsEnv = DESKTOP): Settings {
  const d = createDefaultSettings(env);
  const r = isRecord(raw) ? raw : {};
  const rs = r['resolutionScale'];
  return {
    cameraSensitivityX: asNumber(r['cameraSensitivityX'], d.cameraSensitivityX, 0.5, 2),
    cameraSensitivityY: asNumber(r['cameraSensitivityY'], d.cameraSensitivityY, 0.5, 2),
    invertY: asBoolean(r['invertY'], d.invertY),
    cameraShake: asOneOf(r['cameraShake'], CAMERA_SHAKE_LEVELS, d.cameraShake),
    volumeMaster: asNumber(r['volumeMaster'], d.volumeMaster, 0, 100),
    volumeBgm: asNumber(r['volumeBgm'], d.volumeBgm, 0, 100),
    volumeSfx: asNumber(r['volumeSfx'], d.volumeSfx, 0, 100),
    quality: asOneOf(r['quality'], QUALITY_PRESETS, d.quality),
    resolutionScale: clampNumber(rs, 50, 100, 5) ?? 'auto',
    frameRateCap: asOneOf(r['frameRateCap'], FRAME_RATE_CAPS, d.frameRateCap),
    inputAssist: asOneOf(r['inputAssist'], INPUT_ASSISTS, d.inputAssist),
    haptics: asBoolean(r['haptics'], d.haptics),
    buttonLayout: asOneOf(r['buttonLayout'], BUTTON_LAYOUTS, d.buttonLayout),
    buttonOpacity: asNumber(r['buttonOpacity'], d.buttonOpacity, 30, 100),
  };
}

export function settingsSchema(env: SettingsEnv = DESKTOP): StoreSchema<Settings> {
  return {
    key: SETTINGS_KEY,
    version: SETTINGS_VERSION,
    createDefaults: () => createDefaultSettings(env),
    sanitize: (raw) => sanitizeSettings(raw, env),
    migrations: {},
  };
}

export class SettingsStore {
  private readonly store: PersistentStore<Settings>;

  constructor(storage: KeyValueStorage | null, env: SettingsEnv = DESKTOP) {
    this.store = new PersistentStore(settingsSchema(env), storage);
  }

  get loadStatus(): LoadStatus {
    return this.store.loadStatus;
  }
  get isPersistent(): boolean {
    return this.store.isPersistent;
  }

  get(): Settings {
    return this.store.get();
  }
  /** 一部の項目だけ更新する（不正値は sanitize で補正される）。 */
  patch(partial: Partial<Settings>): void {
    this.store.update((s) => ({ ...s, ...partial }));
  }
  /** 既定値に戻す（保存データも削除）。 */
  reset(): void {
    this.store.clear();
  }
  subscribe(listener: (s: Settings) => void): () => void {
    return this.store.subscribe(listener);
  }
}

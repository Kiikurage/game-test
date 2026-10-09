/** 音声マニフェストの型（パイプライン #31 の出力。ランタイムのローダは E7-1b）。 */
/** バス名（`volume.ts`（#30）の `ChildBusName` と同じ。ファイル間の依存を避けて再宣言している）。 */
export type SoundBus = 'bgm' | 'sfx' | 'ambient' | 'ui';

/** 種別。SE は位置を持つ効果音（モノラル）、UI はモノラル、BGM・環境音はステレオ。 */
export type SoundKind = 'se' | 'bgm' | 'ambient' | 'ui';

/** 元データ側の設定（`assets-src/audio/audio.json`）の 1 件。 */
export interface SoundSourceEntry {
  readonly id: string;
  /** `assets-src/audio/` からの相対パス。 */
  readonly source: string;
  readonly kind: SoundKind;
  /** 省略時は種別の既定バス。指定する場合は一致している必要がある。 */
  readonly bus?: SoundBus;
  readonly loop?: boolean;
  /** ループ点（秒）。`loop: true` のときだけ指定可。 */
  readonly loopStart?: number;
  readonly loopEnd?: number;
  /** 同時発音数の上限を超えたときの優先度（0〜100、大きいほど優先）。 */
  readonly priority: number;
  /** 音量補正（dB、-40〜12）。出力の `gain` へ線形値で入る。 */
  readonly gainDb?: number;
  readonly bitrateKbps?: number;
  /** `docs/audio-assets.md` のライセンス表のキー。 */
  readonly license: string;
}

export interface SoundSourceConfig {
  readonly version: 1;
  readonly sounds: readonly SoundSourceEntry[];
}

/** 出力マニフェストの 1 件（ランタイムが読む）。 */
export interface SoundManifestEntry {
  readonly id: string;
  /** `public/assets/audio/` からの相対パス（Ogg Opus）。 */
  readonly file: string;
  /** iOS 向けの AAC（`--m4a` でビルドしたときだけ）。 */
  readonly fallbackFile?: string;
  readonly bus: SoundBus;
  readonly kind: SoundKind;
  readonly loop: boolean;
  readonly loopStart?: number;
  readonly loopEnd?: number;
  readonly priority: number;
  /** 素材ごとの線形ゲイン補正（バス音量とは別）。 */
  readonly gain: number;
  readonly channels: 1 | 2;
  readonly bytes: number;
  /** 秒。 */
  readonly duration: number;
}

export interface AudioManifest {
  readonly version: 1;
  readonly format: 'ogg-opus';
  readonly totalBytes: number;
  readonly budgetBytes: number;
  readonly sounds: readonly SoundManifestEntry[];
}

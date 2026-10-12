/**
 * 品質設定の公開口（#316）。品質段階のプリセット（機能フラグ・予算）、端末判定と URL トグル、
 * 動的解像度、描画負荷の計測をここから import する。各機能はプリセットの値を読むだけにし、`level` で分岐しない。
 */
export * from './presets';
export * from './dynamicResolution';
export * from './renderProfile';

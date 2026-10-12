// 配信アセットの URL（tech-direction §4.4: HTTP キャッシュが効く内容ハッシュ名で配る。#331）。
//
// 本番ビルドでは vite.config.ts が `public/assets/` の各ファイルを `<名前>.<内容ハッシュ>.<拡張子>` で dist に書き出し、
// 元の相対パス → ハッシュ付きパスの対応を `__ASSET_HASHES__` として埋め込む。開発サーバ・ユニットテストでは対応表が無く、
// パスをそのまま返す（public/ がそのまま配信される）。

/** `public/` からの相対パス → ハッシュ付きの相対パス。build 時だけ vite の define で埋め込まれる。 */
declare const __ASSET_HASHES__: Readonly<Record<string, string>> | undefined;

const hashes: Readonly<Record<string, string>> =
  typeof __ASSET_HASHES__ === 'undefined' ? {} : __ASSET_HASHES__;

/** 対応表で `public/` からの相対パスを引く（無ければそのまま）。 */
export function resolveAssetPath(map: Readonly<Record<string, string>>, path: string): string {
  return map[path] ?? path;
}

/**
 * `public/` からの相対パス（例: `assets/player.glb`）を配信 URL にする。
 * `base` は配信の起点（既定は Vite の `BASE_URL`）。
 */
export function assetUrl(path: string, base: string = import.meta.env.BASE_URL): string {
  return base + resolveAssetPath(hashes, path);
}

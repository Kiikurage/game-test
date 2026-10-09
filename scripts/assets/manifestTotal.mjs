// manifest.json の totalBytes（コミットする全アセットの合計）。各ビルドスクリプトが追記後に更新する。
export function totalBytesOf(manifest) {
  return (
    Object.values(manifest.characters).reduce((s, c) => s + c.bytes, 0) +
    manifest.animations.bytes +
    manifest.props.bytes +
    (manifest.equipment?.bytes ?? 0) +
    (manifest.exploration?.bytes ?? 0) +
    (manifest.player?.bytes ?? 0)
  );
}

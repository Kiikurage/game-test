# game-test

ブラウザで動作する 3D アクションゲーム（エルデンリングライクな TPS）の開発リポジトリ。

- 必須要件: WebGPU 対応 / スマートフォン対応
- 方針: ボリュームより、作り込みの完成度を優先する

## ディレクトリ構成

| パス | 内容 |
| --- | --- |
| `docs/` | 企画・設計・方針などの文書 |
| `site/` | GitHub Pages で公開する静的ファイル（現在はダミーページ） |
| `.github/workflows/` | GitHub Actions（Pages へのデプロイ） |

## デプロイ

`main` ブランチへの push（または Actions タブからの手動実行）で GitHub Pages にデプロイされる。
初回のみ、リポジトリの Settings → Pages → Build and deployment の Source を **GitHub Actions** に設定する必要がある。

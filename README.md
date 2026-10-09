# game-test

ブラウザで動作する 3D アクションゲーム（エルデンリングライクな TPS）の開発リポジトリ。

- 必須要件: WebGPU 専用（非対応環境はサポートしない） / スマートフォン対応（基準機: Xperia 1 V）
- 方針: ボリュームより、作り込みの完成度を優先する

## ディレクトリ構成

| パス | 内容 |
| --- | --- |
| `AGENTS.md` | エージェント運用ルール（チケット・ブランチ・PR・レビュー） |
| `docs/` | 企画・設計・方針などの文書 |
| `src/` | ゲーム本体（TypeScript）。構成は AGENTS.md 9 章 |
| `e2e/` | Playwright E2E テスト |
| `scripts/` | スクリーンショット・ヘッドレス WebGPU 起動設定 |
| `.github/workflows/` | GitHub Actions（CI、Pages へのデプロイ） |

## デプロイ

`main` ブランチへの push（または Actions タブからの手動実行）で `npm run build` の出力（`dist/`）が GitHub Pages にデプロイされる。
開発コマンドは AGENTS.md 8 章を参照。
初回のみ、リポジトリの Settings → Pages → Build and deployment の Source を **GitHub Actions** に設定する必要がある。

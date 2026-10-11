# Mac のセルフホストランナー（実 GPU での撮影・計測）

エージェントの環境には GPU がなく、SwiftShader（CPU）で描画するため撮影 1 枚に数分かかる。
オーナーの Mac（Apple GPU）を GitHub Actions のセルフホストランナーとして登録すると、
エージェントが push したブランチを実 GPU（Metal の WebGPU）で撮影・計測し、結果を `verify-results` ブランチに返せる（#289）。

- ワークフロー: [`.github/workflows/mac-verify.yml`](../.github/workflows/mac-verify.yml)
- 起動: `workflow_dispatch`（手動・エージェントから）と、PR への `verify:mac` ラベル付与のみ。
  ランナーが未登録・オフラインのときは、その run が待ち状態になるだけで main の CI（`ci.yml`）には影響しない
  （待ちは最大 24 時間で GitHub が自動キャンセルする）。

## 1. セキュリティ上の注意（先に読む）

- ランナーは **push されたブランチのコードをオーナーの Mac 上でそのまま実行する**（`npm ci` の依存パッケージのスクリプトも含む）。
- フォークからの PR では実行しない（ワークフローの `if` で、PR の head がこのリポジトリのときだけ動く）。
  `workflow_dispatch` は書き込み権限を持つアカウントしか起動できない。
- このリポジトリが公開リポジトリの場合、Settings → Actions → General → 「Fork pull request workflows from outside collaborators」を
  「Require approval for all outside collaborators」にしておく（念のため）。
- ランナーは **専用の macOS ユーザー**（例: `gh-runner`）で動かすことを強く推奨する。普段使いのユーザーの鍵・ブラウザのプロファイル・
  ファイルにアクセスさせない。管理者権限は与えない。
- 他のリポジトリにはこのランナーを登録しない（リポジトリ単位で登録する）。

## 2. 準備

専用ユーザーでログインして作業する（システム設定 → ユーザとグループ → ユーザを追加。種類は「通常」）。

1. **Node.js 22**: ワークフローの `actions/setup-node` が自動で取得する（専用ユーザーのホームのツールキャッシュに入る）。
   手動で入れる場合は `brew install node@22` など。`git` は Xcode Command Line Tools（`xcode-select --install`）で入る。
2. **Google Chrome**: `/Applications/Google Chrome.app` に通常の Chrome を入れる。Playwright の `channel: 'chrome'` がこれを使う。
   別の場所の Chrome / Chromium を使うときは、ランナーのディレクトリの `.env` に `CHROMIUM_PATH=/path/to/Google Chrome` を書く（下記）。
   Playwright 同梱の `chromium-headless-shell` は GPU を使えないので使わない。
3. **スリープの抑止**: 待ち受け中にスリープするとジョブが拾われない。
   - システム設定 → ディスプレイ（またはバッテリー → オプション）で「ディスプレイがオフのときに自動でスリープさせない」を有効にする。
   - または、ランナーを動かしている間 `caffeinate -dimsu` を実行しておく（ターミナルを閉じると解除される）。
     常時なら `sudo pmset -a sleep 0 disablesleep 1`（ノートは電源接続時のみ推奨: `sudo pmset -c sleep 0`）。
   - ノート型はフタを閉じるとスリープするので、開けたまま電源に接続しておく。
4. **ログインしたままにする**: GPU（WindowServer 経由の Metal）と headful 起動には、専用ユーザーの GUI セッションが要る。
   専用ユーザーを自動ログインにするか、ファストユーザスイッチで専用ユーザーをログインしたまま普段のユーザーに切り替える。
   画面ロックはかかっていてよい。

## 3. ランナーの登録

1. GitHub のリポジトリ → **Settings → Actions → Runners → New self-hosted runner** を開き、OS に **macOS**、
   アーキテクチャ（Apple シリコンなら ARM64）を選ぶ。
2. 表示される「Download」「Configure」のコマンドを専用ユーザーのターミナルでそのまま実行する（例: `~/actions-runner` に展開）。
   `./config.sh` の途中で聞かれたら:
   - runner group: 既定（Enter）
   - runner name: 任意（例: `owner-mac`）
   - **additional labels: `gpu`**（`self-hosted` と `macOS` は自動で付く。ワークフローは `[self-hosted, macOS, gpu]` で選ぶ）
   - work folder: 既定（Enter）
3. （任意）`~/actions-runner/.env` に環境変数を書くと、全ジョブに渡る:

   ```sh
   # 通常の Chrome 以外を使うとき
   CHROMIUM_PATH=/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary
   ```

4. **サービス化**（ログイン時に自動起動）:

   ```sh
   cd ~/actions-runner
   ./svc.sh install   # ~/Library/LaunchAgents に登録（専用ユーザーの GUI セッションで動く）
   ./svc.sh start
   ./svc.sh status
   ```

   止めるときは `./svc.sh stop`、外すときは `./svc.sh uninstall`。登録自体を消すときは
   Settings → Actions → Runners から削除し、`./config.sh remove --token <表示されるトークン>`。
5. Settings → Actions → Runners でランナーが **Idle**（緑）になっていることを確認する。

## 4. 動作確認

1. リポジトリの **Actions → Mac verify (real GPU) → Run workflow** を開き、branch は空（main）、task は `bench` のまま実行する。
2. ログの「Check WebGPU adapter」に `[gpu] mode=hardware adapter: vendor=apple architecture=metal-3 ... -> hardware` のような行が出ること。
   `SOFTWARE` や `swiftshader` と出たら失敗する（下記トラブルシュート）。
3. 完了後、`verify-results` ブランチの `main/<run_id>/` に `bench/bench.json`・`bench/bench.txt`・`gpu.json`・`summary.md` が
   commit されていること。Actions の run の artifact にも同じものがある。
4. 次に task を `heroshots` にして実行し、`main/<run_id>/hero/` に PNG と `contact-sheet.png` が入ることを確認する。

### トラブルシュート

- **アダプタが SwiftShader / 取れない**: ヘッドレスの Chrome が GPU を使えていない。Run workflow で `headful` にチェックを入れて
  再実行する（Chrome のウィンドウが一瞬出る）。ラベル起動も headful にするには、Settings → Secrets and variables → Actions →
  Variables にリポジトリ変数 `MAC_VERIFY_HEADFUL` = `1` を追加する。専用ユーザーが GUI ログインしているかも確認する。
- **`channel "chrome"` が見つからない**: Google Chrome を `/Applications` に入れるか、`.env` の `CHROMIUM_PATH` を設定する。
- **run が Queued のまま**: ランナーがオフライン（スリープ・ログアウト・サービス停止）。`./svc.sh status` を確認する。
- **`verify-results` が大きくなった**: 古い結果は消してよい（このブランチは orphan で main と履歴を共有しない）。
  エージェントは `--depth=1` で取得するので、普段は気にしなくてよい。

## 5. 使い方（エージェント・オーナー共通）

| task | 内容 | 主な出力（`verify-results:<ブランチ>/<run_id>/`） |
| --- | --- | --- |
| `heroshots` | `npm run heroshots`（PC 1280x720・high が既定）。`options` に `--mobile` / `--only a,b` / `medium` | `hero/*.png`、`hero/contact-sheet.png`。`compare` で `hero-main/` と `hero/compare-sheet.png`（左 main / 右 ブランチ） |
| `bench` | `?bench`（docs/performance.md §0）を完走。`query` は `?bench` に足すクエリ（例: `quality=medium&nomsaa`）、`options` に `mobile` | `bench/bench.json`（区間ごとの値・アダプタ情報）、`bench/bench.txt`、`bench/bench.png` |
| `shot` | `npm run shot`。`query` は `SHOT_QUERY`（例: `?quality=high`）、`options` に `pc` / `mobile` | `shot/shot-pc.png`、`shot/shot-mobile.png` |
| `e2e:<spec>` | `npx playwright test e2e/<spec>`（例: `e2e:bench.spec.ts`） | `log.txt`、失敗時は `e2e/`（トレース・スクリーンショット） |

どの task でも `gpu.json`（アダプタ情報）、`log.txt`、`summary.md`（条件・結果・ファイル一覧・ログの末尾）が入る。
対象ブランチに PR があれば、その PR に結果のパスをコメントする。

- **起動（エージェント）**: GitHub MCP の `actions_run_trigger`（method `run_workflow`、workflow_id `mac-verify.yml`、ref `main`、
  inputs `{ "branch": "<自分のブランチ>", "task": "heroshots", "compare": "true" }`）。PR に `verify:mac` ラベルを付けても
  heroshots（main との比較つき）が走る。
- **結果の取得**: `git fetch origin verify-results --depth=1` → `git show FETCH_HEAD:<ブランチ>/<run_id>/summary.md`、
  画像は `git archive FETCH_HEAD <ブランチ>/<run_id> | tar -x -C /tmp/verify` などで取り出して Read する。
  run_id は `actions_list`（`list_workflow_runs`、`mac-verify.yml`）か PR のコメントで分かる。
- 同時に実行するのは 1 本だけ（`concurrency: mac-verify`）。実行中に複数の run を投げると、待ちは最新の 1 本だけが残り、
  それ以前の待ちは `cancelled` になる。cancelled になったら投げ直す。
- 計測用スクリプト（`scripts/chromium.mjs` / `gpuCheck.mjs` / `bench.mjs`）は、対象ブランチではなく**ワークフローを起動した ref
  （通常 main）の版**で上書きして使う（古いブランチでも動かすため）。これらを変更するブランチでは、そのブランチを ref にして起動する。

### ローカル（Mac）で直接動かす

```sh
GPU_MODE=hardware npm run gpu-check            # アダプタの確認（SwiftShader なら終了コード 1）
GPU_MODE=hardware npm run bench -- shots/bench  # ?bench を完走して JSON を保存
GPU_MODE=hardware npm run heroshots -- shots/hero
GPU_MODE=hardware GPU_HEADFUL=1 npm run shot -- shots/foo   # ウィンドウを出して起動
```

`GPU_MODE=hardware` のときは SwiftShader のフラグを付けず、ブラウザは `CHROMIUM_PATH` → `PW_CHANNEL` → `channel: 'chrome'`
の順に選ぶ（`scripts/chromium.mjs`）。Chrome の新ヘッドレス（Chrome 132 以降の `--headless`）は headful と同じ GPU プロセスを使うので、
通常はヘッドレスのままハードウェアの WebGPU が取れる。

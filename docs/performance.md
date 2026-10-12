# 描画負荷の予算と削減策（#180）

基準機 Xperia 1 V で 30fps を出すための、1 フレームの描画負荷の予算と、その守り方。
数値は `renderer.info`（ドローコール・三角形。**シャドウパスを含む**）。

## 予算

| 品質 | ドローコール | 三角形 |
| --- | --- | --- |
| `low` / `medium`（モバイル） | 150 以下 | 250k 以下 |
| `high`（PC） | 200 以下 | 350k 以下 |

- 値は `src/render/quality/presets.ts`（各プリセットの `budget`）。E2E `e2e/perf.spec.ts` が下記の 4 視点で `low` と `medium` を検査する（超えたら CI が落ちる）。
- 計測視点は `scripts/perfViewpoints.mjs`: 篝火（0, 3.5）/ 墓地（14, 6）/ 礼拝堂の門（34, 17）/ 礼拝堂内部（50, 22）。敵は通常どおり配置したまま（巡回で多少ゆらぐので、上限には余裕を持たせる）。
- 視点や敵を足してドローコールが予算に迫ったら、予算を上げずに下の削減策（LOD 距離・結合・影の対象）で下げる。

## 計測の方法

| 手段 | 内容 |
| --- | --- |
| `?debug` | HUD に draws / tris に加えてカテゴリ別（terrain / environment / grass / graybox / character / particles / telegraph / other）のメイン・シャドウ別の draws/tris を表示する |
| `npm run perf -- [low\|medium\|high] [追加クエリ]` | 上の 4 視点を順に測って表にする（ビルド → ヘッドレス WebGPU）。`PERF_SKIP_BUILD=1` でビルドを省略。`PERF_PC=1` で PC（1280x720・`scale=1`）にし、GPU 時間・フレーム間隔・描画 CPU・起動時間も出す（`npm run profile` も `PERF_PC=1` で PC の画面で測る） |
| `window.__game.dev.renderInfo()` / `renderProfile()` | 直近フレームの `drawCalls` / `triangles`（実測）と、カテゴリ別の見積り（視錐台・レイヤー・`castShadow` は three のレンダラと同じ判定）。E2E 用（`src/render/perf.dev.ts`） |
| `?lod=0` | キャラクターの LOD を使わない（詳細メッシュだけ描き、詳細メッシュが影を落とす）。変更前との負荷・見た目の比較用 |

## 結果（medium、ヘッドレス SwiftShader で計測。カウントは GPU に依存しない）

変更前（#179 マージ前の `origin/main`。キャラクターは 10 体: プレイヤー + 敵 9 体）→ 変更後（#179 のアートパスを取り込み済み。環境メッシュが増えた分（約 +15k tris ×2 パス）を含む）:

| 視点 | draws before | tris before | draws after | tris after |
| --- | --- | --- | --- | --- |
| 篝火 | 336 | 486k | 89 | 134k |
| 墓地 | 513 | 517k | 125 | 195k |
| 礼拝堂の門 | 510 | 511k | 125 | 191k |
| 礼拝堂内部 | 500 | 507k | 133 | 196k |

支配要因は**キャラクター**だった（墓地の視点、変更前）:

| カテゴリ | メイン draws / tris | シャドウ draws / tris |
| --- | --- | --- |
| terrain | 1 / 44k | 0 |
| environment | 14 / 26k | 14 / 28k |
| grass | 3 / 4k | 0 |
| **character** | **172 / 204k** | **166 / 203k** |
| グレーボックス等（門・壁・柱） | 86 / 3k | 42 / 1k |
| particles | 8 / 0 | 0 |

- UBC 1 体は約 21k 三角形・パーツ 11 + 装備 約 10 メッシュ。スキンメッシュは `frustumCulled = false` なので、画面外・遠方の敵も毎フレーム**メインと影の 2 回**描いていた。
- 影を落とすメッシュが多く（キャラクター全パーツ、グレーボックスの壁・柱 1 本ずつ）、影パスだけでメインと同じ量のドローコール・三角形を使っていた。

## 削減策

1. **キャラクターの簡略メッシュ（`src/render/assets/characterLod.ts`）**
   - 体・衣装のスキンメッシュのパーツを meshoptimizer で間引き（約 21k → 約 1.7k 三角形）、**1 つの `SkinnedMesh`（1 ドローコール）**へ結合する。頂点・スケルトンは元と同じなのでアニメーションはそのまま効く。
   - **影**: 詳細メッシュは影を落とさず、簡略メッシュだけが影のレイヤー（`SHADOW_PROXY_LAYER`、`src/render/layers.ts`）で影を落とす。メインカメラはこのレイヤーを見ず、太陽のシャドウカメラだけが有効にしている。影のドローコールが 1 体 約 17 → 1、三角形が約 21k → 約 1.7k になる。プレイヤーも同様。
   - **遠景**: 敵が `characterLod.nearDistance`（品質プリセット。low 8m / medium 12m / high 14m。ボスは体格に比例して延長。ヒステリシス 1.5m）より遠いときは、詳細メッシュを隠して簡略メッシュをメインパスにも出す（頂点色に亡者マテリアルの色を CPU で近似して焼く。斑・リム・眼の発光は省略）。倒れて消え始めた敵は距離に関わらず詳細メッシュ（ディゾルブを見せるため）。
   - 画面外の敵は描かない（視錐台の球判定。長い影が入りうる分だけ広げた球で影の要否を判定）。画面にも影にも出ない敵はアニメーション更新も省く。ディゾルブが完了した敵は描かない。
   - スキンメッシュのパーツは、glTF の量子化のためパーツごとに `boneInverses` が違う。結合時に基準（先頭パーツ）へ頂点を移す（`CharacterLodBuilder.create`、単体テストで元メッシュの頂点位置との一致を検証）。
2. **グレーボックスの結合（`LevelView.batchGraybox`）**: 環境メッシュに置き換わらなかった壁・床・階段・柱を、頂点色 + 共通マテリアル × 空間セル（32m）ごとに 1 メッシュへ結合（鉄と水は別マテリアル）。鉄門の格子は 1 メッシュに。約 130 → 約 20 ドローコール。
3. **環境メッシュの空間バケットを 24m → 32m**（`environmentLayout.ts`）: ドローコールを減らし、三角形は予算内に収まる範囲で増やす。#179 で環境メッシュの三角形が増えた（メイン約 30〜40k + 影 約 42k）ので、環境が今後さらに増えるときは下の候補（環境の影の対象を絞る・距離 LOD）が次の手になる。
4. **品質プリセット**: `QualityPreset.characterLod.nearDistance`（上記）。草の密度（`grassCount`）・影の半径・影マップの大きさは既存どおり。

## 見た目への影響

簡略メッシュは遠景（medium で 6m 以上）の敵と、すべてのキャラクターの影にだけ使う。影はソフトな PCF なので輪郭の差はほぼ見えない。遠景の敵は詳細メッシュより少し暗く単調になる（リム・眼の発光なし）。近景（操作する・戦う距離）は変わらない。

## 調べる対象の目印と仮の遺体（#248）

- 目印（発光する菱形 + 光の粒）は全対象を 1 つの InstancedMesh（1 ドローコール）にまとめた MeshBasic（半透明・実ライトなし）。`LootMarks`（`render/item/lootMark.ts`）。
- 仮の遺体は既存の騎士を倒れた姿勢で焼き込んだ静的メッシュ（スケルトン・ミキサーなし。`CorpseFactory`）。1 体 約 4〜5k 三角形・3〜7 ドローコール。
  影を落とさず、プレイヤーから 9m より遠くは描かない（`CORPSE_FAR`）。遺体を足すときは、墓地の視点（予算 250k に対し残りわずか）で確認する。
- 初回の更新は全部を描く（ウォームアップでパイプラインを作り、初めて見えた瞬間のカクつきを防ぐ）。

## 今後の候補（予算に余裕がなくなったら）

- 地形（約 44k 三角形、1 ドローコール）のタイル分割による視錐台カリング。
- プレイヤーの装備（約 34 ドローコール）の結合（同一ボーンに付く剛体を 1 メッシュに）。
- 環境メッシュの距離 LOD、草の距離フェード（`grassCount` は既に品質別）。
- 敵が増えたときの GPU インスタンシング（スキニングのインスタンス化は three では未対応）。

## 刷新前の基準値（#305。Mac の実 GPU・PC high）

エピック #294（アーキテクチャ刷新）の前後を比べる基準。判定基準は PC high 120fps（1 フレーム 8.3ms）。

### 計測条件

- 対象: `origin/main` の `daa4862`（#342 マージ後）。オーナーの Mac（macOS、Apple GPU。アダプタ `apple metal-3`、`timestamp-query` あり）、
  Playwright の Chromium（ヘッドレス）を `GPU_MODE=hardware`（実 GPU）で起動。
- 描画: `PERF_PC=1`（1280x720・DPR1・内部解像度 `scale=1` 固定）、`quality=high`。
- コマンド（各 1 回。描画負荷の表は 2 回実行し、両方を載せた）:
  - `PERF_PC=1 GPU_MODE=hardware npm run perf -- high`（描画負荷・GPU 時間・フレーム間隔・描画 CPU・起動時間）
  - `PERF_PC=1 GPU_MODE=hardware npm run profile -- high 240`（JS の CPU 時間。墓地・戦闘中・ロックステップ）
  - `npm run build`（配信サイズ）
- `PERF_PC=1` は #305 で `scripts/perf.mjs` / `scripts/profile.mjs` に足した（`scripts/lib/session.mjs` の `measureTarget`）。
  perf は `?perf` を付けて開き、視点ごとに 60 フレーム `dev.renderInfo()` を取って中央値を出す。指定しなければ従来どおり 915x412・`scale=0.25`。

### 描画負荷と時間（視点別。`npm run perf`）

| 視点 | draws | tris | gpu ms 1 回目 | gpu ms 2 回目 | frame ms（2 回目） | 描画 CPU ms（2 回目） |
| --- | --- | --- | --- | --- | --- | --- |
| bonfire | 96 | 150k | 21.4 | 29.0 | 22.9 | 1.9 |
| graveyard | 144 | 249k | 36.3 | 20.2 | 16.7 | 2.2 |
| chapel-gate | 146 | 244k | 20.0 | 27.4 | 16.7 | 2.1 |
| chapel-interior | 142 | 226k | 24.0 | 29.5 | 16.7 | 2.2 |
| crypt-entrance | 124 | 193k | 17.3 | 24.4 | 16.7 | 1.7 |
| crypt-bend | 149 | 206k | 16.8 | 25.9 | 16.7 | 2.2 |
| courtyard-entrance | 160 | 225k | 42.9 | 23.8 | 16.7 | 2.5 |
| courtyard-gate | 127 | 190k | 31.3 | 25.9 | 16.7 | 2.6 |
| arena | 124 | 176k | 51.6 | 28.9 | 16.7 | 2.7 |

- **frame**: rAF 間隔（`RenderStats.frameMs`、指数移動平均）。ヘッドレスでも 60Hz に揃っており（16.7ms）、**vsync で頭打ちのため 120fps の判定には使えない**。
- **描画 CPU**: `perfProbe.frameCpuMs`（beginFrame〜endFrame の JS。GPU 待ちは含まない）。
- **gpu**: `?perf` 時に three の `renderer.resolveTimestampsAsync('render')` が返す値。three r186 の
  `WebGPUTimestampQueryPool` を読むと、各レンダーパスの開始・終了のタイムスタンプの差（GPU 上での実行時間）を、
  同じフレームのパスについて合計したもの。パス間の隙間・コンピュートパス・提示（present）は含まない。
  **ただし値は frame（16.7ms で 60fps を保っている）を大きく超え、同じ条件の 2 回で視点ごとの値が 2 倍近く入れ替わる**。
  1 フレームの GPU 完了までの時間として読める値かどうかは**未確認**（複数フレーム分の合算、またはタイムスタンプの解決のずれの可能性がある）。
  刷新前後の比較には、この値をそのまま使わないこと（原因と置き換え後の値は下の「GPU 時間と vsync を外したフレーム時間」）。

### GPU 時間と vsync を外したフレーム時間（#317。パス別計測に置き換えた後）

#317 でパス別 GPU 時間（`src/render/pipeline/gpuTimer.ts`）を入れ、上表の gpu 欄が読めなかった原因が分かった。
Apple GPU（タイル型）では連続するレンダーパスが重なって実行され、three 標準の「各パスの開始〜終了の合計」はブルームの小さなパス群を
何重にも数える（下表の raw-sum。60Hz では GPU のクロックも下がり、さらに膨らんで揺れる）。
新しい値は、開始順に並べて「直前のパスの終了〜自分の終了」を各パスの持ち分にした合計（busy）と、最初の開始〜最後の終了（span）。

- 条件: 上と同じ（Mac・PC high・1280x720・scale=1）。描画内容は刷新前と同じ（#317 は見た目を変えない。ヒーローショットで確認）。
- コマンド: `GPU_NOVSYNC=1 PERF_PC=1 GPU_MODE=hardware npm run perf -- high`（`GPU_NOVSYNC=1` で `--disable-gpu-vsync --disable-frame-rate-limit`）。
- 2 回実行。busy の差は最大 0.11ms。

| 視点 | gpu busy ms 1 回目 | 2 回目 | gpu span ms（2 回目） | raw-sum ms（2 回目。旧来の値） | frame ms（vsync 無し、2 回目） | 描画 CPU ms（2 回目） |
| --- | --- | --- | --- | --- | --- | --- |
| bonfire | 1.28 | 1.26 | 1.49 | 8.56 | 1.61 | 1.20 |
| graveyard | 1.57 | 1.57 | 1.88 | 12.17 | 2.31 | 2.00 |
| chapel-gate | 1.32 | 1.32 | 1.69 | 8.73 | 2.16 | 1.80 |
| chapel-interior | 1.42 | 1.42 | 1.74 | 10.24 | 2.21 | 1.90 |
| crypt-entrance | 1.10 | 1.11 | 1.42 | 6.66 | 1.91 | 1.50 |
| crypt-bend | 1.19 | 1.19 | 1.69 | 7.41 | 2.24 | 1.80 |
| courtyard-entrance | 1.58 | 1.69 | 2.16 | 13.93 | 2.52 | 2.00 |
| courtyard-gate | 1.61 | 1.61 | 2.10 | 12.81 | 2.27 | 1.80 |
| arena | 1.87 | 1.88 | 1.90 | 17.59 | 2.06 | 1.70 |

パス別（2 回目、ms）: shadow 0.23〜0.29 / scene 0.65〜1.39 / bloom 0.15〜0.16 / output 0.07。
vsync 無しの frame は 1.6〜2.5ms（400fps 以上）で、PC high の 120fps（8.3ms）に対して現状は余裕がある。frame ≒ 描画 CPU なので CPU 律速。

### JS の CPU 時間（`npm run profile`。墓地・戦闘中・敵 9 体・242 フレーム）

| mode | JS ms/frame（CDP） | GC ms/frame | sim ms/frame | render ms/frame | worst frame ms |
| --- | --- | --- | --- | --- | --- |
| draw | 2.87 | 0.01 | 0.53 | 2.27 | 5.5 |
| nodraw | 0.71 | 0.00 | 0.44 | 0.23 | 2.3 |

- 描画のコスト（draw − nodraw）2.16ms/フレーム。シーンのオブジェクト 1261（うち `matrixAutoUpdate` 1193）、メッシュ 369。
- 自己時間の上位（draw）: `_renderObjectDirect` 0.22 / `_projectObject` 0.19 / `updateMatrixWorld` 0.16 / `writeBuffer` 0.15 ms。

### 起動時間（`npm run perf` の 2 回目。ローカルの vite preview から配信、ネットワーク遅延なし）

| 区切り | navigation からの ms |
| --- | --- |
| DOMContentLoaded / load | 19 / 19 |
| 開始画面（`#app[data-state=ready]`。アセット読み込み・ウォームアップのシェーダコンパイル込み） | 2242 |
| running（`dev.start()` 後） | 2282 |

### ロード時間の内訳（#388）

`PERF_PC=1 GPU_MODE=hardware GPU_NOVSYNC=1 npm run perf -- high`（`PERF_SKIP_BUILD=1` でビルドを省ける）の startup 行のあとに、次の 2 つの表が出る。

- **load span**: `performance.measure('load:<名前>')`（`src/core/loadTiming.ts`。本番にも残る）を開始時刻順に並べたもの。単位は navigation からの ms。
  `code` `renderer` `physics` `scene` `assets` が `LOAD_STAGES` の段階、`<段階>/<内訳>` がその中の主な待ち
  （`renderer/init` `renderer/noise` `scene/create` `scene/environment` `assets/player-view` `assets/enemy-views` `assets/plugins`（プラグイン別 `assets/plugins/<id>`。並列に走るので重なる）`assets/warm-up`（`/compile` `/first-frame` `/gpu-wait`））。
  ready（開始画面）の時刻は `assets` の end に近い。
- **warm-up pipelines**: `GameView.warmUp` の `compileAsync` が 1 つ進捗を返すごとに、前回からの時間とその間に作られたパイプライン（`perfProbe.pipelineLabels` と同じラベル）を記録し、長い順に上位 15 区間を出す
  （`window.__game.dev.perfProbe().pipelineTimings`）。区間はシェーダ生成・バインディング更新・パイプライン作成の完了待ちを含む。
  パイプラインを作らなかった区間（キャッシュ済み）は表に入らないので、区間の合計は `warm-up/compile` より短い。

**冷えた状態（シェーダキャッシュなし）の測り方**: Chrome の Metal キャッシュを一時的に別名へ退避して 1 回測り、終わったら必ず戻す。

```sh
d=$(getconf DARWIN_USER_CACHE_DIR)com.google.Chrome.helper
mv $d/com.apple.metal $d/com.apple.metal.bak
# （計測を 1 回。失敗しても次の行は実行する）
rm -rf $d/com.apple.metal && mv $d/com.apple.metal.bak $d/com.apple.metal
```

温まった状態は、キャッシュがある状態で 2 回続けて測った 2 回目。冷えた計測で作られたキャッシュは、退避したキャッシュを戻すときに捨てる。

### 配信サイズ（`npm run build` の `dist/`。非圧縮、JS は gzip も）

| 内訳 | ファイル数 | サイズ |
| --- | --- | --- |
| JS 合計 | 4 | 6.03 MB |
| ・`rapier-*.js`（WASM 埋め込み） | | 4.33 MB（gzip 1.67 MB） |
| ・`main-*.js`（three 含む） | | 1.64 MB（gzip 497 KB） |
| ・`meshopt_simplifier-*.js` / `index-*.js`（起動） | | 54 KB / 8.8 KB（gzip 19 / 3.8 KB） |
| 音声（ogg） | 90 | 6.02 MB |
| モデル（glb） | 8 | 2.31 MB |
| 画像（png） | 3 | 1.49 MB |
| その他（json・css・html） | 5 | 0.06 MB |
| **合計** | 110 | **15.9 MB** |

## CPU 時間の回帰ゲート（#306。CI の `perf` ジョブ）

CI の `perf` ジョブが `npm run profile -- high 240`（ubuntu-latest・SwiftShader）を回し、JS ms/frame（CDP）が
`PROFILE_MAX_DRAW_MS` / `PROFILE_MAX_NODRAW_MS` を超えたら終了コード 1 で落ちる。

### CI ランナーでのばらつき（同じコミットを 5 ジョブ並列で 1 回ずつ。PR #357）

| | 1 | 2 | 3 | 4 | 5 | 最小〜最大 |
| --- | --- | --- | --- | --- | --- | --- |
| draw JS ms/frame | 7.52 | 11.24 | 10.19 | 11.33 | 8.19 | 7.5〜11.3 |
| nodraw JS ms/frame | 0.68 | 1.11 | 0.96 | 1.15 | 1.09 | 0.68〜1.15 |

- ランナーの速さが 2 群に分かれ（ジョブ時間 2m13s と 3m30s 前後）、同じコードで 1.5〜1.7 倍ぶれる。
- **draw は SwiftShader の描画が JS 時間に混ざる**（render ms/frame が CI で 8〜12、Mac の SwiftShader で 2.8、実 GPU で 2.3）。
  §5 の CPU ≤ 4ms とは直接比べられず、描画パスが大きく増えたような粗い回帰だけを見る。
- **nodraw（入力 + `game.update` + 描画以外の JS）は実 GPU の値（0.71）と同じ桁**で、シミュレーションの回帰はこちらで見る。

### 閾値と根拠

| | 閾値 | 観測の最大 | 余裕 |
| --- | --- | --- | --- |
| `PROFILE_MAX_NODRAW_MS` | 2 | 1.15 | 1.7 倍 |
| `PROFILE_MAX_DRAW_MS` | 18 | 11.33 | 1.6 倍 |

- 観測した上下の比（1.5〜1.7 倍）を最大値の上にもう一度見込み、遅いランナーでも誤検知しない値にした。
  その分、検出できるのは「シミュレーションの JS が 2 倍近くになる」程度の回帰で、小さな悪化は検出しない。
  小さな差は従来どおりローカルの `npm run profile`（実 GPU は `PERF_PC=1 GPU_MODE=hardware`）で前後を比べる。
- ゲートが落ちることは `PROFILE_BURN_MS=4`（計測中の各 rAF コールバックに 4ms の busy-wait）で CI 上で確認した。
- GPU 時間は SwiftShader では意味が無いのでゲートにしない。Mac の実 GPU で `PERF_PC=1 GPU_MODE=hardware npm run perf -- high` を
  前後で取って比べる（上の「刷新前の基準値」の手順）。
- ヘッドレス Node（`createHeadlessGame`）でのシミュレーション計測は採らなかった。nodraw がすでにシミュレーション部分の JS を測っており、
  ばらつきの主因はランナーの CPU の速さで Node でも同じく受けるため。

## CPU フレーム時間のプロファイル（#262）

`npm run profile -- [low|medium|high] [frames]`（既定 `medium 240`）。ヘッドレス Chromium の CDP `Profiler` で、
墓地の視点・戦闘中（`noise` で周囲の敵を呼ぶ）のメインスレッドの JS を関数別の自己時間に集計する。

- **ロックステップ**（`src/render/cpuProfile.dev.ts` の `cpuProfileLockstep`）: 描画 1 フレームごとにちょうど 1 ステップ進めてから描く。
  SwiftShader の遅さで 1 フレームあたりのステップ数がぶれないようにし、「60fps 時の 1 フレーム分の JS」を測る。プレイヤーは無敵にする。
- 同じ計測を `?nodraw` でも行い、差（`draw cost`）を描画側のコストとする。`sim` は入力 + `game.update`、`render` は
  `perfProbe.frameCpuMs`（`?perf` / `?bench` の `cpu` と同じ beginFrame〜endFrame）の合計。`worst frame` は最も重い 1 フレーム（スパイクの目安）。
- 関数名を読めるよう、未圧縮 + ソースマップ付きで `node_modules/.profile-dist` にビルドする（`PROFILE_SKIP_BUILD=1` で省略）。
- `PROFILE_ALLOC=1` でヒープのサンプリングも行い、関数別の割り当て量（KB/フレーム。GC の原因探し）を出す。`PROFILE_TOP` で表の行数を変える。
- 絶対値は SwiftShader と CPU 負荷で大きく変わる（実機の数倍）。比べるときは同じ負荷のもとで前後を続けて測る。
- `scene` 行はシーンのオブジェクト数（敵 1 体が骨を含め約 90 オブジェクト）と、`matrixAutoUpdate` が有効な数。

**削減済み（#262）**

- `scene.updateMatrixWorld()` は `renderer.render` のたびに走り、本描画と影で 1 フレームに複数回、全オブジェクトの行列を再計算していた。
  `src/render/matrixUpdate.view.ts` でシーンの自動更新を止め、描画直前に 1 回だけ更新する。
  動かない入れ物（シーン・レベルのルート）と結合済みの環境メッシュ・地面は `matrixAutoUpdate=false`（親が自動更新だと子孫すべてが強制再計算になるため）。
  **新しく足す静的な物を `view.levelView.root` 直下に置く場合も、動かすなら自分で `matrixAutoUpdate` を有効のままにする**（既定のまま足せばよい）。
  レベルのルートやシーン自体を動かしてはいけない（反映されない）。
- `?perf` / `?bench` 用の CPU 時間の中央値（`perf.view.ts`）が毎フレーム配列を複製・ソートしていたのを、使い回しの型付き配列に変えた。

## 実機での計測と切り分け（#231）

ドローコール・三角形の予算（上記）だけでは、モバイル GPU の**フィルレート・フラグメント負荷**は分からない（ヘッドレス SwiftShader は GPU 時間の参考にならない）。実機（Xperia 1 V など）では次の手順で切り分ける。

### 0. ベンチマークモード `?bench`（#261。まずはこれ）

`<URL>/?bench` を開き、開始画面を 1 回タップ（クリック）するだけで、決められたシナリオを自動で再生して区間ごとに計測し、終了後に結果の表と「コピー」ボタンを出す。結果テキストをそのままチャットに貼ればよい（1〜2 分。途中は操作しない。スマホは横向き・全画面のまま）。
`?perf` の HUD も同時に出る。品質を変えて測るときは `?bench&quality=low` のように足す。

- **シナリオ**（各区間: ウォームアップ 1 秒 + 計測 4 秒。ウォームアップはパイプライン生成が止まるまで延びる）
  1. `bonfire` / `graveyard` / `chapel-gate` / `chapel-interior`: `scripts/perfViewpoints.mjs` と同じ計測視点にカメラを固定する。
  2. `graveyard:base` と `graveyard:<トグル>`: 墓地視点で 1 つずつ実行時に切り替える（`noshadow` `nobloom` `nograss` `noparticles` `nolights` `flatmat` `scale=0.5`）。
     `nobloom` はブルームのぼかしパスを止める（最後の合成 1 回は残る）。`nolights` は点光源（篝火・たいまつ）をすべて隠す。
     `nomsaa` は MSAA がレンダラー生成時にしか変えられないため省略（skipped）。`?bench&nomsaa` で全区間を測り直して比べる。
     プリセットで元から無いもの（low の草・ブルームなど）も skipped になる。
  3. `combat`: 礼拝堂の敵 3 体のそばで、敵を順に倒して死亡ディゾルブを出し、ヒットエフェクト（4 フレームごと）と火の粉を出し続ける（敵を倒すので最後）。
- 計測中は動的解像度を固定する（`scale=` 指定時はその値、なければ通常の開始スケール: モバイル 0.8 / PC 1）。敵は拘束（知覚・行動を止める）し、プレイヤーの HP は毎フレーム戻す。
- **結果の読み方**: 先頭に端末（`ua`）・GPU アダプタ・`timestamp-query` の有無・画面と DPR・品質。続いて 1 区間 1 行:
  `section | frame med | frame p99 | gpu med | cpu med | draws | tris | res`（時間は ms）。
  - `frame` は rAF 間隔（中央値と 99 パーセンタイル）。60fps 目標なら中央値 16.7 以下、p99 がカクつきの目安。
  - `gpu` は timestamp-query による GPU 時間（非対応端末は `n/a`）。`cpu` は描画側の JS 時間（beginFrame〜endFrame。シミュレーションは含まない）。
  - `frame` ≒ `gpu` で `cpu` が小さければ GPU 律速。`graveyard:<トグル>` の `gpu`（なければ `frame`）が `graveyard:base` よりどれだけ下がるかが、その要素の GPU コスト。
  - `res` は描画バッファの解像度と内部解像度スケール。`pipe+N` が付いた行は計測中にパイプライン生成（コンパイルのカクつき）が混ざっている。
- E2E（`e2e/bench.spec.ts`）は `?bench=quick`（時間の条件を外しフレーム数だけで進める）で完走を確認している。
- 実装は `src/render/bench/`（`bench.ts`: 区間の進行と集計、`bench.view.ts`: シナリオ、`benchPanel.ts`: 結果パネル）。

### 1. 計測 HUD `?perf`

`?perf` を付けると左上に軽量 HUD が出る（`?debug` と違い、操作パネルやカテゴリ別内訳は出さない）。

```
30.1 fps avg / 24.8 1% low (target 30)   直近 300 フレームの平均 fps と、最も遅い 1% のフレームの fps
frame 33.2 ms (worst1% 40.3)             フレーム時間（rAF 間隔）
cpu 6.1 ms / gpu 24.0 ms                 JS の描画 CPU 時間（中央値）/ GPU 時間（timestamp-query 対応時のみ。非対応は gpu n/a）
625x282 @0.68                            実際の描画バッファ解像度と倍率
dyn scale 0.80                           動的解像度の現在値（固定時は (fixed)）
quality medium (mobile) msaa off bloom on
draw 129 / tri 224627
pipelines 43                             起動からのレンダーパイプライン生成数（遊んでいる間に増え続けたらバグ）
toggles: noParticles flatMat             有効な切り分けトグル
```

- `gpu` が `frame` よりずっと小さいなら CPU（または vsync・ドライバ）が律速、`gpu` ≒ `frame` なら GPU が律速。
- `dyn scale` が下限（モバイル 0.4）に張り付いたまま fps が足りないなら、解像度以外（固定負荷）が原因。

### 2. 切り分けトグル

`?perf` に加えて、1 つずつ足して fps（`frame ms`・`gpu ms`）の変化を見る。URL 例（`<URL>` はゲームの URL）:

| クエリ | 効果 | 例 |
| --- | --- | --- |
| `?scale=<0.25..1>` | 動的解像度を切って内部解像度の倍率を固定 | `<URL>/?perf&scale=0.5` |
| `?quality=low\|medium\|high` | 品質プリセットを強制 | `<URL>/?perf&quality=low` |
| `?nomsaa` | MSAA を切る | `<URL>/?perf&nomsaa` |
| `?nobloom` | ブルームを省く | `<URL>/?perf&nobloom` |
| `?noshadow` | シャドウマップを描かない | `<URL>/?perf&noshadow` |
| `?nograss` | 草を置かない | `<URL>/?perf&nograss` |
| `?noparticles` | パーティクル（炎・灰・火の粉・ヒット）を描かない | `<URL>/?perf&noparticles` |
| `?nolights` | 篝火の点光源を置かない（点光源はすべてのマテリアルのフラグメントに掛かる） | `<URL>/?perf&nolights` |
| `?flatmat` | 不透明メッシュの TSL マテリアル（地形・石積み・闘技場・亡者など）を単色の MeshStandard に差し替える（見た目は壊れる） | `<URL>/?perf&flatmat` |
| `?flatmat=<グループ,...>` | 上をグループ単位にする。グループ: `terrain`（地形）/ `env`（環境メッシュの石・木・土・鉄）/ `masonry`（地下墓所・中庭の石積み）/ `cliff`（外周の崖の岩塊）/ `arena`（闘技場の床・壁・柱）/ `undead`（亡者・ボス）/ `other`（グレーボックス・小物）。どれも一部だけ差し替わる | `<URL>/?perf&flatmat=terrain,cliff` |

切り分けの進め方の例:

1. `?perf` だけで fps / gpu ms を記録（基準）。
2. `?perf&scale=0.5` → fps がほぼ線形に上がればフィルレート律速。ほとんど変わらなければ固定負荷（影・頂点・CPU）が支配的。
3. `?perf&scale=0.25&nomsaa&nobloom&noshadow&nograss&noparticles&nolights&flatmat`（全部入り）で、固定負荷の下限を確認。そこから 1 つずつ戻して、戻した瞬間に fps が落ちるものが原因。
4. `cpu` が大きいなら JS 側（`pipelines` が増え続けていないかも見る）。

トグルは `src/render/quality/presets.ts`（`parsePerfToggles` / `applyPerfToggles`。preset を落とすもの）と `src/render/perf.view.ts`（`?perf` HUD・`?noparticles`・`?flatmat`）、`src/render/renderer.ts`（`?noshadow`・GPU 時間）にある。

### 3. 動的解像度（`DynamicResolution`）の挙動

目標 fps（モバイル 30 / PC 60）を割ると内部解像度の倍率を下げる（モバイルは 0.8 から開始、下限 0.4。余裕があるときだけ 0.1 ずつ上げる）。#231 で次を直した（`src/render/quality/dynamicResolution.test.ts`）。

- **1fps 級の低速で何も下がらない**: 1 フレーム 1000ms 超を外れ値として捨てていたため、極端に遅い端末では全フレームが捨てられ、解像度が一切下がらなかった。単発の外れ値（タブ復帰・ロード）だけ捨て、連続するなら本当の低速として評価する。窓が埋まるのを待たず、蓄積 1 秒（最低 2 フレーム）で評価する。
- **起動直後・変更直後のカクつき**: 起動直後 6 フレームと、解像度変更直後 2 フレームは評価に入れない。1 フレームを目標の 6 倍までに丸め、単発のスパイク（シェーダコンパイル）で下げすぎない。
- **上げ下げの往復**: 上げた直後に目標を割ったら、次に上げるまでの待ちを 2 倍（最大 8 倍）にする。

### 4. モバイル既定値の見直し（medium）

| 項目 | 変更前 | 変更後 | 理由 |
| --- | --- | --- | --- |
| MSAA | on | off | 内部解像度が高く、エッジの差が小さい割に、MSAA はレンダーターゲットと帯域を 4 倍にする |
| maxPixels | 1.8M | 1.1M | フィルレート。見た目は少しやわらかくなる |
| 影マップ | 2048 | 1536 | 影パスの帯域。半径 24m で約 32px/m。PCF でぼかすので差は小さい |
| 動的解像度の開始 / 下限 | 1.0 / 0.5 | 0.8 / 0.4 | 起動直後に最大解像度で重いフレームを出さない。足りないときにもっと下げられる |

PC（`high`）と `low` の値は変えていない。ヘッドレスでは、ウォームアップ後にパイプラインが増え続けないこと（`e2e/perfProbe.spec.ts`）と、JS の描画 CPU がフレームあたり約 7ms であることを確認した。

## マテリアルのフラグメント負荷（#236）

実機（Xperia 1 V）の切り分けで、`flatmat` を外すだけで 30fps（20〜30ms）→ 9fps（80ms）になった（影・ブルーム・MSAA・草・パーティクル・ライトは単独では影響なし）。
主因は不透明メッシュの TSL マテリアルで、**フラグメントごとに `mx_noise_float`（3D パーリン）を 7〜15 回**呼んでいたこと。
パーリンは 1 回あたり格子 8 点の整数ハッシュ + 勾配 + 補間で約 200 命令。モバイル GPU（特に Adreno）は整数演算とレジスタ圧が厳しく、石積み・闘技場・地形・岩の面が画面を占めるとここで詰まる。
背景の空も全画面に雲の fractal ノイズ（4 オクターブ）を毎フレーム計算していた。

### 対策

1. **ノイズを焼いたテクスチャの参照に置き換え**（`src/render/bakedNoise.ts`）。ロード時に 1 回、タイル可能な 3D パーリン（64³、格子 8 セル周期）を CPU で焼き、RG 半精度の 2D アトラス（528²。R = スライス z、G = スライス z+1）に並べる。`bakedNoise(p)` は 1 回のテクスチャ参照 + z 方向の `mix`（約 25 命令）で `mx_noise_float` と同じ周波数・値域の値を返す。
   - three の `Data3DTexture` は使わない（three が 3D テクスチャにも RENDER_ATTACHMENT 用途を付け、一部の Chrome が検証エラーにするため）。
   - 半精度にしたのは、凹凸（`dFdx(height)`）の法線が 8bit の階段にならないようにするため。
2. **品質プリセットでノイズ層を減らす**（`getMaterialDetail()`: low 0 / medium 1 / high 2）。medium は細部の層（粒・孔・縁の欠け・ひびの歪み・崖の割れ目など）を省く。**high（PC）はすべての層を残す**（ノイズの種類が焼いた版に変わるだけで、見た目はほぼ同じ）。
3. 空の雲のオクターブを high 4 / medium 2 / low 1 に。

### ノイズ参照回数（フラグメントあたり。medium。生成された WGSL で数えた値）

`node scripts/wgslStats.mjs [low|medium|high] [追加クエリ] [WGSL 出力先]` で、各視点を巡って生成された WGSL のフラグメントシェーダの行数・ノイズ呼び出し・テクスチャ参照数を一覧にする（出力先はリポジトリ外に）。

| マテリアル | 変更前（パーリン） | 変更後 medium（焼き参照） | 変更後 high |
| --- | --- | --- | --- |
| 闘技場の床 | 15 | 7 | 15 |
| 闘技場の壁・柱 | 14 | 6 | 12（使っていなかった大きなひび 2 回を省略） |
| 地形（地面 + 崖の岩肌） | 10 | 6 | 10 |
| 石積み（地下墓所・中庭） | 7 | 5 | 8 |
| 崖の岩塊 | 4（+ 割れ目の微分） | 3 | 4 |
| 亡者・ボス | 3〜4 | 3〜4 | 3〜4 |
| 環境メッシュ（石・木・土） | 2 | 2 | 2 |
| 空（背景。全画面） | 4（fractal） | 2 | 4 |

（変更前は medium の値。high の「変更前」はノイズ層が増える分だけ多い）

見積り: パーリン 1 回 ≈ 200 命令、焼き参照 1 回 ≈ 25 命令 + テクスチャ 1 回として、ノイズ部分のコストは medium で変更前の約 5〜8%（闘技場の床: 3000 → 約 250 命令）。
ライティング（PBR）など `flatmat` でも残る部分を含めた、マテリアルの追加コスト（flatmat 比）は、地形・石積み・闘技場で変更前の数倍 → 約 2 割以下になる見込み。実機では `?perf&flatmat` と `?perf` の差で確認する。

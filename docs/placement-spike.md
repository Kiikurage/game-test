# 配置を変えやすい骨格の spike（#383）

エピック #294「方針の見直し」の骨格（状態の正本を SoA に置く・仕事を読み書きの宣言で表す・境界を同期点 1 か所にする）を、
パーティクルと物理（Rapier）で最小実装し、配置ごとに測った記録。本番の Game / GameView には入れていない。

## 骨格の形

`src/core/placement/`（DOM・three 非依存）

| ファイル | 内容 |
| --- | --- |
| `state.ts` | `defineState(name, { field: 'f32' \| 'u32' \| 'i32' }, capacity)`。全フィールドを 1 本の ArrayBuffer / SharedArrayBuffer に並べる（`allocState` / `viewState` / `copyState`）。 |
| `job.ts` | `defineJob({ id, state, reads, writes, rate: 'step' \| 'frame', init?, run, gpu? })`。`run(arrays, { dt, time }, ctx)` は配列だけを受け取る。`gpu` は TSL コンピュートの組み立て（任意）。 |
| `placement.ts` | 配置の設定 `DEFAULT_PLACEMENT`（job id → `main` / `gpu` / `worker-sab` / `worker-msg`）と `?place=` の解釈（例 `?place=particles:gpu,physics:worker-sab`）。 |
| `executors.ts` | `MainExecutor`（その場で run）、`WorkerExecutor`（SAB の 3 スロット + Atomics の seq、または 1 ステップごとの Transferable）、Worker 側の `serveJobs(port, registry)`。 |
| `syncPoint.ts` | `SyncPoint.frame(dt)`: 固定ステップの計算 → 全 executor の `sync`（Worker との交換・GPU の dispatch・main での実行）→ GPU へのアップロード。1 フレームに 1 回だけ。 |

`src/spike/`（three / Rapier を使う側）

- `runtime.ts`: 配置 → executor を作る `createExecutor`（実行場所の分岐はここだけ）、`GpuExecutor`、描画が読むフィールドを返す `gpuFieldsFor`
  （GPU で動く job ならそのストレージバッファを共有、CPU で動く job なら配列を中身にしたバッファを作り同期点で `reads` だけアップロード）。
- `particlesJob.ts`: 位置・速度・寿命の SoA（7 フィールド）。同じ job に JS 版 `run` と TSL 版 `gpu`。
- `physicsJob.ts`: Rapier の world を `init` で作り、`run` で 1 ステップ進めて剛体 800 個の位置・回転を SoA に書く。main でも Worker でも同じコード。
- `spike.worker.ts`: Worker で動かせる job の登録表（`serveJobs(self, { physics })`）。
- `spikeMain.ts`: `?spike=particles|physics` の場面。パーティクルは 1 本の instanced draw（`Sprite.count`、位置はストレージバッファを頂点で読む）、
  物理は InstancedMesh に previous / current を alpha で補間して書く。どちらも配置を読まない。
- `coi.ts` + `public/coi-sw.js`: COOP / COEP を付ける Service Worker（後述）。

job・描画のコードは配置を参照しない。配置の切り替えは `DEFAULT_PLACEMENT` か `?place=` の 1 か所だけで済む（完了条件 1）。

## 計測

- 条件: オーナーの Mac（Apple GPU）、`GPU_MODE=hardware`、`PERF_PC=1`（1280x720・DPR1）、quality high。
  パーティクル 100,000 粒、剛体 800 個（地面 12m 角に落とし、落ちた箱は上から落とし直す）。
- コマンド: `PERF_SPIKE=particles|physics PERF_PC=1 GPU_MODE=hardware npm run perf -- high`（vsync あり＝60Hz）と、
  同じものに `GPU_NOVSYNC=1`（vsync 無し）。`scripts/perf.mjs` に spike 用の分岐を足した（600 ステップ温めてから 240 ステップ以上を計測）。
- main JS は CDP Profiler のメインスレッドの JS 時間（Worker は含まない）。job ms は job 本体の時間（Worker なら Worker 側）。gpu は `gpuTimer` の busy。
- 各条件 2 回。他のエージェントが並行で動いている環境。

### vsync あり（60Hz）: メインスレッドの JS ms/frame

| 題材 | 配置 | main JS ms/frame 1 回目 / 2 回目 | 同期点〜描画の CPU ms（中央値） | 最悪フレームの同期点〜描画 ms | GPU busy ms 1 / 2 | job ms/step |
| --- | --- | --- | --- | --- | --- | --- |
| particles | main | 1.27 / 1.27 | 1.30 | 2.70 / 1.90 | 1.44 / 1.44 | 0.67（/frame） |
| particles | gpu | 0.10 / 0.09 | 0.10 | 0.70 / 0.70 | 0.88 / 1.09（compute 0.03） | — |
| physics | main | 3.70 / 3.68 | 3.90〜4.00 | 16.1 / 15.9 | 0.16 / 0.16 | 3.50 / 3.47 |
| physics | worker-sab | 0.18 / 0.18 | 0.16〜0.18 | 0.34 / 0.41 | 0.16 / 0.16 | 3.54 / 3.46（Worker） |
| physics | worker-msg | 0.20 / 0.19 | 0.20 | 0.40 / 0.30 | 0.16 / 0.16 | 3.49 / 3.48（Worker） |

### vsync 無し: フレーム時間

| 題材 | 配置 | frame ms（中央値）1 / 2 | 最悪フレームの同期点〜描画 ms 1 / 2 | GPU busy ms 1 / 2 |
| --- | --- | --- | --- | --- |
| particles | main | 1.32 / 1.32 | 1.80 / 1.80 | 0.81 / 0.82 |
| particles | gpu | 0.48 / 0.48 | 9.30 / 5.10 | 0.51 / 0.51 |
| physics | main | 0.24 / 0.24 | 15.8 / 15.8 | 0.10 / 0.06 |
| physics | worker-sab | 0.22 / 0.22 | 1.99 / 2.18 | 0.06 / 0.06 |
| physics | worker-msg | 0.22 / 0.22 | 2.30 / 0.70 | 0.06 / 0.06 |

読み方:

- パーティクルは GPU 版でメインスレッドの JS が 1.27 → 0.10ms/frame。コンピュート自体は 0.03ms。描画パスの GPU 時間は main 版と同程度（両版の乱数が違い、粒の分布が少し違う）。
- 物理は Worker に出すとメインスレッドの JS が 3.7 → 0.2ms/frame。ステップのあるフレームだけ重くなる山（最悪 16ms）も消える。
  vsync 無しの frame の中央値は、ステップの無いフレームが大半なので配置で差が出ない（物理の評価には最悪値と vsync ありの JS を使う）。
- SAB と postMessage（Transferable、1 ステップごと）の差は、この規模（800 × 7 float = 22KB）では測れる差が無い。
- 見た目は配置で変わらないことを、配置ごとの画面（`PERF_SPIKE_SHOT=<接頭辞>`）で目視した（パーティクル main/gpu、物理 main/worker-msg）。

### SharedArrayBuffer（GitHub Pages 相当）

`vite preview`（COOP/COEP ヘッダー無し）で `?spike=physics&place=physics:worker-sab` を開くと、`coi.ts` が `coi-sw.js` を登録して 1 回読み直し、
`crossOriginIsolated === true` になって SAB 方式が動いた（上表の crossOriginIsolated 列。perf のヘッドレス Chrome で確認）。
SW はナビゲーションでは `spike=` を含む URL にだけヘッダーを付けるので、本番のゲームには影響しない。実際の GitHub Pages での確認はしていない（エージェントから公開 URL に入れない）。

## うまくいかなかったこと・注意点

- **step の job を vsync 無しのフレーム平均で測ると何も分からない**。4000fps では 1 ステップ 4ms でもフレーム平均は 0.2ms になる。
  最初は温めをフレーム数で数えていて、物理がほとんど進まない（箱が落ちている途中）状態を測っていた。シミュレーションのステップ数で温めるように直した。
- **GPU 版の状態は CPU から読めない**。`GpuExecutor.current` は初期値のまま。ゲームロジックが読む状態は GPU に置けない（エピックの原則 3 のとおり）。
  executor の型の上では区別していないので、本番では「GPU 専有」の状態を型で分けるべき。
- **頂点シェーダは read_write のストレージを読めない**。描画側は同じ `StorageBufferAttribute` から `toReadOnly()` のノードを別に作る必要があった（`gpuFieldsFor` はバッファだけを返す）。
- **Worker の結果は 1 フレーム遅れる**（同期点で送ったステップの結果を次の同期点で受ける）。補間はその遅れた previous / current の間で行う。入力への反応が 1 フレーム遅れる。
- **SAB の 3 スロットは厳密ではない**。main が写している間に Worker が 2 回以上公開すると、読んでいるスロットを上書きしうる。本番では seq を写す前後で確かめるか、
  main が「読み中」を Atomics で示す形にする。
- Rapier の `translation()` / `rotation()` は呼ぶたびにオブジェクトを作る（SoA に書くための読み出しで割り当てが出る）。Worker に出すと main の GC には効かない。
- three のチャンク分割が変わり、three を含むチャンク名が `gpuTimer-*.js` になった（spike が gpuTimer を import するため。中身・初期バンドルは変わらない）。
- Worker のバンドルは Rapier（WASM 内蔵）込みで 4.3MB。main と同じ Rapier をもう 1 本配る形になる。

## 本番に入れるなら

1. **物理（Game の固定ステップ）を Worker に出すのが最初の候補**。計測で main の JS が 3.5ms/step 減り、律速（メインスレッドの JS）に直接効く。
   ただし本番のゲームロジック（プレイヤー・敵・戦闘）は物理の結果を同じステップで読むので、物理だけでなく **シミュレーション全体（`Game.update`）を Worker に移す** 形にする。
   main は入力スナップショットを送り、描画用の SoA（位置・回転・アニメーション状態・イベント）を受け取るだけにする。物理だけ出すと、ステップごとに往復が要り遅延が増える。
2. 受け渡しは **postMessage（Transferable）を既定** にし、SAB は Service Worker の都合（初回の読み直し・SW の更新管理）が許せる場合の選択肢にとどめる。この規模では差が無かった。
3. 描画だけが読む大量要素（パーティクル・草・水面など）は GPU コンピュートへ。既存の `src/render/particles` を、同じ SoA + `gpu` カーネルの形に置き換える。
4. 骨格の型を詰める: 状態に「所有者」（CPU 正本 / GPU 専有）を持たせ、GPU 専有の状態を CPU の job が `reads` に宣言したら組み立て時にエラーにする。
   `reads` / `writes` から、同期点で送る・アップロードするフィールドを自動で決める（今は描画側が `reads` を手で渡している）。
5. 同期点を本番のフレームパイプライン（`src/render/pipeline/framePipeline.ts`）の先頭の 1 段にし、`registerGameSystem` / `registerViewPlugin` の延長で job を登録できるようにする。
6. Worker 側の `serveJobs` の登録表は、Worker のエントリで静的に import する（関数は送れないため）。job を足すたびに登録表に足す形になるので、`*.job.ts` の自動読み込みにする。

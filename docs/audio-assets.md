# 音声素材パイプラインとライセンス記録（Issue #31）

仕様: [vertical-slice.md](vertical-slice.md) 10 章。ランタイム側（バス・音量・ダッキング）は #30 の `docs/audio.md`、素材のローダは E7-1b。
素材は #36〜#38 で合成した自作物（§6）。外部の CC0 素材は取り込んでいない（§1 の調査結果と §6 の理由を参照）。

## 1. 素材の取得可否と方針（調査日: 2026-10-09）

調査環境はエージェントのクラウドコンテナ（プロキシ経由の制限付きネットワーク）。

| 経路 | 到達 | 備考 |
| --- | --- | --- |
| `git clone` で GitHub のリポジトリ | 可 | `KenneyNL/Starter-Kit-*`（FPS / 3D Platformer / City Builder / Racing）を shallow clone して確認。各リポジトリの `sounds/`（`audio/`）に **CC0 の `.ogg`（Vorbis 44.1kHz ステレオ）** が入っている（README に「sound effects are CC0」。コードは MIT） |
| `raw.githubusercontent.com` | 可 | |
| `api.github.com` / `codeload.github.com`（zip） | 不可（403） | リポジトリ検索 API が使えないので、候補リポジトリは名前で当てる必要がある |
| kenney.nl / opengameart.org / freesound.org | 不可 | プロキシで遮断。公式パックの直接ダウンロードはできない（Freesound は API キーも要る） |
| npm レジストリ | 可 | `sfxmint`（CC0 効果音を役割名で取得する第三者パッケージ）等が存在するが、出典・ライセンスの確認コストが高く未評価。jsDelivr は不可 |
| PyPI | 可 | 素材源としては未調査 |
| ffmpeg（`libopus` / `aac`） | 可（apt） | 変換・合成に使う。ローカルは 6.1.1 |

方針（優先順）:

1. **自作・合成**: ffmpeg（`lavfi` の `sine` / `anoisesrc` 等）や Web Audio 合成で作る。ライセンスの問題が無く、再現可能。風・炎・低音のうなり・UI 音・衝撃音の下地に向く。オフライン合成物は元データ（WAV）として `assets-src/audio/` に置き、本パイプラインで Opus 化する。リアルタイム合成（Web Audio）にする場合はマニフェストに載せず、`AudioEngine` のバスへ直接つなぐ。
2. **Kenney の CC0 サウンド（GitHub のスターターキット経由）**: 到達できて CC0 が README で明示されている。ただしゲーム向けの汎用音（ブラスターや足音など）が中心で、ソウルライクの剣戟・咆哮には合わない。UI・足音・インパクトの一部は使える見込み。公式パック（Impact Sounds、Interface Sounds 等）は kenney.nl が遮断されていて取得できないので、オーナーが手元で取得して `assets-src/audio/` に置く運用になる。
3. **OpenGameArt / Freesound の CC0**: 到達不可。必要ならオーナーが手元で取得して配置する（ライセンスは各ページで CC0 であることを人間が確認する）。
4. BGM は CC0 の入手が最も難しい。自作（ffmpeg / Web Audio での環境音楽の合成）か、オーナー取得素材を前提にする。

結論: **エージェントだけで揃えられるのは UI・環境音・一部 SE まで**。剣戟・咆哮・BGM は合成での代替品を作るか、オーナー側で CC0 素材を調達する前提で、パイプラインはどちらからでも取り込める形にした。

## 2. 取り込み手順

```
assets-src/audio/audio.json   元データの設定（人が編集する）
assets-src/audio/**.wav 等    元データ（コミットする。変換前の WAV/FLAC/OGG/MP3）
        │  npm run assets:audio
        ▼
public/assets/audio/<id>.ogg  Ogg Opus（コミットする）
public/assets/audio/manifest.json  ランタイムが読むマニフェスト（コミットする）
```

| コマンド | 内容 |
| --- | --- |
| `npm run assets:audio` | 検証 → Opus 変換 → マニフェスト生成 → 容量集計（超過で失敗、80% 超で警告） |
| `npm run assets:audio -- --m4a` | iOS 向けの AAC（`.m4a`）も出力しマニフェストに `fallbackFile` を入れる |
| `npm run assets:audio:check` | ffmpeg 不要。設定・ライセンス表・出力マニフェスト・出力ファイルのサイズ・容量予算の整合を検査（`npm test` にも同等のテストあり） |
| `npm run assets:audio:synth` | 合成素材（`assets-src/audio/{se,ui,...}/*.wav`）の再生成と `audio.json` の更新（Python。§6） |

ffmpeg / ffprobe（libopus 付き）が必要。CI では `apt-get install ffmpeg` してから実行する。

### 変換仕様

- 出力: Ogg Opus。チャンネルは SE・UI がモノラル、BGM・環境音がステレオ。ビットレートは SE / UI 48kbps、BGM 96kbps、環境音 64kbps（VBR、`audio` アプリケーション）。エントリごとに `bitrateKbps` で上書きできる。
- サンプリングレート: 仕様は 44.1kHz だが、Opus は 8/12/16/24/48kHz のみ対応で内部 48kHz になる。入力が 44.1kHz でも libopus が 48kHz へリサンプルし、再生時は Web Audio が `AudioContext` のレートへ変換する。品質上の問題は無い。
- メタデータは除去（`-map_metadata -1`）。
- 元データは信頼できない外部データとして扱い、ffmpeg にファイルとして渡すだけ（`-protocol_whitelist file`、stdin 閉鎖）。`source` に `..` や絶対パスは書けない。

### 設定（`audio.json`）の項目

| 項目 | 必須 | 内容 |
| --- | --- | --- |
| `id` | ○ | 小文字英数と `. _ -`（例: `sfx.sword-light1`）。出力ファイル名にもなる |
| `source` | ○ | `assets-src/audio/` からの相対パス（`.wav .flac .ogg .mp3 .aif .aiff`） |
| `kind` | ○ | `se`（位置を持つ SE）/ `bgm` / `ambient` / `ui` |
| `bus` | | 省略時は種別の既定（se→`sfx`、他は同名）。指定するなら一致が必要 |
| `loop` / `loopStart` / `loopEnd` | | ループ有無とループ点（秒）。点は `loop: true` のときだけ。`loop: true` で省略時は 0〜末尾 |
| `priority` | ○ | 0〜100、大きいほど優先。目安: プレイヤー被弾・ガード 90 / ボス 70 / 敵 50 / 足音 30 / 環境 10（仕様書 10.2 節の順） |
| `gainDb` | | 音量補正（-40〜12dB）。出力の `gain`（線形）になり、ランタイムが素材ゲインとして掛ける。ピーク基準の目安は `PEAK_LEVEL`（#30） |
| `bitrateKbps` | | 既定ビットレートの上書き（16〜256） |
| `license` | ○ | 下のライセンス表のキー |

出力マニフェスト（`public/assets/audio/manifest.json`、型は `src/audio/manifest.ts`）の各エントリ: `id` / `file` / `fallbackFile?` / `bus` / `kind` / `loop` / `loopStart?` / `loopEnd?` / `priority` / `gain` / `channels` / `bytes` / `duration`。トップレベルに `totalBytes` と `budgetBytes`。

## 3. 容量予算

- 総容量 **8MB 以内**（`AUDIO_BUDGET_BYTES`、Ogg Opus の合計）。ビルド時に集計し、**超過でエラー終了、80% 超で警告**。
- 見積もり（仕様書 10.1 節）: BGM 5 曲（60〜90s × 96kbps ≒ 0.7〜1.1MB）で約 4.5MB、環境音 6 本（64kbps、ループ 20〜30s ≒ 0.2〜0.25MB）で約 1.4MB、SE 約 80 本（48kbps、平均 0.7s ≒ 4KB）で約 0.3MB。合計 約 6.2MB で予算内だが BGM が支配的。余裕が無ければ BGM のビットレートを 64〜80kbps に下げる。
- `--m4a` の AAC は予算の対象外（端末は片方しか取得しないため）。合計は別途表示する。

## 4. フォーマット互換（iOS / Android）

| 環境 | Ogg Opus | AAC `.m4a` |
| --- | --- | --- |
| Android Chrome | 可 | 可 |
| iOS Safari（WebKit） | 版により不確か。古い版は Ogg コンテナ非対応のため `decodeAudioData` が失敗する | 可（全版） |

- 基準機は Android（Xperia 1 V / Chrome）なので Ogg Opus を主にする。iOS は公式にサポート対象外（direction.md）だが、動かす場合に備えて `--m4a` で AAC フォールバックを出せるようにしてある。
- ローダ（E7-1b）は `fallbackFile` があり、かつ `new Audio().canPlayType('audio/ogg; codecs=opus')` が空文字なら `.m4a` を使う想定。実機（iOS）での確認は人間に依頼する必要がある（エージェント環境に実機が無い）。
- `.webm`（Opus）は Safari の対応がさらに限定的なため使わない。
- 自動再生制限は #30 の `docs/audio.md`（最初のタップで `resume()`）。

## 5. ライセンス記録

### ルール

- **CC0（Public Domain Dedication）のみ取り込む**。CC-BY、CC-BY-NC、Freesound の独自ライセンス、ゲームエンジン付属素材（EULA 付き）、Mixamo 相当の再配布制限付き素材は取り込まない。「自作」は CC0 として公開する前提の自作物に限る。
- 取り込むときは、**下の表に 1 行追加してから** `audio.json` の `license` にそのキーを書く。ビルド（`assets:audio` / `assets:audio:check`）と `npm test` は、キーが表に無い・ライセンス列が CC0（または自作）でない・取得日が `YYYY-MM-DD` でない・出典 URL か作者が空、のいずれかで失敗する。
- 1 行は 1 つの「取得単位」（同じ出典・作者・ライセンスのパック）に対応させる。キーは `assets-src/audio/audio.json` の `license` と一致させる。
- 再確認手順（取り込み時に必ず実施し、取得日を記録する）:
  1. 出典ページ（または配布物の README / LICENSE）で、その素材が **CC0 1.0** であることを自分の目で確認する。パック全体が CC0 でも、個別素材に別ライセンスの注記が無いか確認する（OpenGameArt・Freesound は素材ごとにライセンスが違う）。
  2. 再配布元が公式でない場合（GitHub のミラー等）は、公式ページの記載と一致することを確認し、取得元 URL とコミットを出典欄に書く。
  3. ライセンス文のコピー（README の該当箇所や LICENSE）を `assets-src/LICENSES/` に保存する。
  4. 表に 1 行追加する。後日 CC0 でないと判明した場合は、その素材を削除し、表の行を取り消し線にして理由を残す。

### 表の形式

列: `キー` / 用途 / 出典 URL / 作者 / ライセンス / 取得日（YYYY-MM-DD）/ 元ファイル・備考。ライセンス列は `CC0 1.0` か `自作（CC0 として公開）` のみ有効。

### 取り込み済み

| キー | 用途 | 出典 URL | 作者 | ライセンス | 取得日 | 元ファイル・備考 |
| --- | --- | --- | --- | --- | --- | --- |
| `synth-game-test` | SE・UI・環境音・BGM のすべて（合成） | `scripts/audio/synth/`（本リポジトリ） | 本リポジトリ（Python + numpy/scipy による合成。外部素材・サンプルは一切使わない） | 自作（CC0 として公開） | 2026-10-09 | 元データ `assets-src/audio/{se,ui,...}/<id>.wav`（コミット済み）。再生成は `npm run assets:audio:synth` |

## 6. 合成素材（#36 以降）

オーナーへの素材調達依頼はしない方針のため、CC0 の外部素材は使わず、すべて `scripts/audio/synth/` の Python（numpy / scipy）で合成した。
Kenney のスターターキット（`Starter-Kit-FPS` の `sounds/*.ogg`、CC0）は取得できたが、内容が SF 風のブラスター・ジャンプ音などでソウルライクの剣戟・足音・咆哮に合わないため採用していない。

### 再生成

```
pip install -r scripts/audio/synth/requirements.txt
npm run assets:audio:synth                        # WAV 再生成 + audio.json 更新（出力は決定的）
npm run assets:audio:synth -- --report /tmp/rep   # 加えてスペクトログラム画像（グループごとの一覧）
npm run assets:audio                              # Opus 化・マニフェスト・容量集計
```

CI は WAV をコミット済みとして `assets:audio` だけを実行する（Python は不要）。乱数シードは素材 ID から決まるので、再実行しても同じ波形になる。

### 合成の考え方（`dsp.py`）

| 対象 | モデル |
| --- | --- |
| 剣身・盾・鎧の金属音 | 自由-自由棒の非調和モード（比 1 / 2.76 / 5.40 / 8.93 / 13.3 / 18.6）の減衰正弦。高い部分音ほど速く減衰、接触の短い高域ノイズ |
| 鐘 | 教会鐘の部分音比（hum / prime / tierce / quint / nominal ...）、低い部分音ほど長く鳴る + コンボリューション・リバーブ |
| 肉・鎧の打撃 | 周波数が落ちる低域の正弦 + 低域通過ノイズの塊 + 金属のにぶい共鳴 |
| 風切り | 白色ノイズを中心周波数が掃引するバンドパス（状態変数フィルタ）に通し、山形の振幅 |
| 布（ロール） | ピンクノイズの帯域 + 低周波ゆらぎ（不規則なこすれ） |
| うめき | のこぎり波の声帯音源（ジッター付き）+ 並列フォルマント + 軽い歪み + 息ノイズ |
| 灰・焚き火 | ポアソン的なインパルス列を指数減衰カーネルで整形したパチパチ |

### 品質検査（`build.py`）

- 正規化: 種別ごとのピーク上限（SE 0.8 / UI 0.7、環境音 0.4、BGM 0.6。仕様書 10.2 節）と基準ラウドネス（SE の最大モメンタリー -16 LUFS、UI -18、BGM・環境音は統合ラウドネス）の**小さい方**に合わせる。K 重み付けは ITU-R BS.1770 の係数を自前実装（ゲーティングなし）。短い打撃音はピーク制限が先に効くため、ラウドネスは種別内で ±3 LU 程度の幅が残る。素材ごとの強弱は `lufs_offset` で付ける（強攻撃 +1.5〜2、足音 -4 など）。
- 先頭・末尾 1ms のフェード、DC 除去、クリップ検出、端が 0 でないことの検査、内部の不連続（隣接サンプル差が局所 RMS の 14 倍超）の検出。1 件でも失敗するとビルドが失敗する。意図した鋭い立ち上がりを含む素材だけ `clicks_ok=True`。
- 生成時に見つけて直した不具合: 打ち切られたノイズ・正弦の末尾クリック、リバーブに入れる前の波形の打ち切り。

### SE・UI 素材（#36）

出典はすべて `synth-game-test`（合成）。一覧と容量は `public/assets/audio/manifest.json`。

素材 ID は `docs/audio.md` の cue 規約（末尾の連番を除いたものがバリエーショングループ）に合わせる。主な対応:
`sfx.hit-light1〜4`（肉 2 + 鎧 2）/ `sfx.hit-heavy1〜4` → `hit` イベントの light / heavy、`sfx.guard1〜3` / `sfx.guard-break` → guard / guardBreak、
`sfx.guard-just`・`sfx.shield-deflect1〜2`・`sfx.sword-light1〜3`・`sfx.sword-heavy1〜2`・`sfx.roll1〜2`・`sfx.hurt1〜2`・`sfx.heal-drink`・`sfx.heal-glow`・`sfx.breathless`・`sfx.defeat-collapse`・`sfx.defeat-ash` は `sound` イベントで cue を直接渡す。
敵は `sfx.enemy.*`（プリロードの `field` グループ対象）、UI は `ui.*`（`title` グループ）。

### 足音・環境音・ボス SE（#37）

- 足音 16: `sfx.footstep-{grass,stone,wood,crypt}{1..4}`（`docs/audio.md` の `footstep` イベントの cue）（モノラル、短い単発）。歩き / 走り / ロールは再生側で音量を変える。地下は石の足音を 1.7s の残響に通す。
  地下墓所（D）の「残響設定の切替」は、この素材（`crypt`、残響を焼き込み済み）へ素材を切り替えることで行う（ランタイムのリバーブ送りは使わない）。足音 16 本は `title` グループで先読みする（接続は E7-3a、配線は `docs/audio.md` の「足音の接続」）。
- 環境音 6（ステレオ）: `ambient.wind` / `ash-leaves` / `fire` / `fog-gate` / `crypt` はループ、`ambient.bell-distant` は単発（遠い鐘。再生間隔は呼び出し側）。
- ボス SE 16: 足音 4（66 / 58 / 52 / 46 Hz 帯の低音）、咆哮 1（ピーク 0.99）、斧の風切り 3、叩きつけ 2、灰の波 3（地割れ・突風・降灰）、入場 1、撃破 1、盾打ち 1。
- **ループ素材の継ぎ目**: ループ区間そのものを継ぎ目なしに作る（ノイズは末尾 2s を先頭へ等パワー・クロスフェード、`fog-gate` は全周波数・LFO を 1/20Hz の格子 = ループ長で整数周期、`crypt` の水滴残響は 3 連結してリバーブをかけ中央を切り出す）。
  さらに Opus の立ち上がり・終端の誤差がループ点に乗らないよう、書き出す WAV は **前に 1s（ループ末尾のコピー）、後ろに 0.5s（先頭のコピー）** を付け、`loopStart = 1.0`、`loopEnd = 1.0 + 長さ` とする（`audio.json` / マニフェストの値）。
  ランタイムは `AudioBufferSourceNode` の `loop` / `loopStart` / `loopEnd` をそのまま使えばよい。
- 継ぎ目の検査（`build.py`）: ループ区間を 2 回つなぎ、継ぎ目付近の隣接サンプル差が通常の差の何倍かを見る（6 倍超で失敗）。Opus 化後にデコードした波形でも確認済み（継ぎ目の段差は通常の隣接差と同程度。tonal な `fog-gate` だけ 1 倍強、ピークの 2%）。

### BGM（#38）

合成（`scripts/audio/synth/music.py`）。鋸歯波の弦アンサンブル（微小デチューン + ビブラート）、フォルマントによる合唱風パッド（/a/ /o/）、撥弦・鐘・フルートの簡易モデル、太鼓・軍鼓・金管スタブ、畳み込みリバーブ（2 連結で尾を先頭へ折り返す）。調は D ドリアン / ニ短調、和声は Dm・B♭・Gm・F・C・A（属和音）。

| ID | 長さ | テンポ・拍子 | 構成 | ループ（マニフェスト値） |
| --- | --- | --- | --- | --- |
| `bgm.title` | 60s | 48 BPM・4/4・12 小節 | 低いドローン + 弦パッド + 合唱 + 鐘とハープの旋律 | あり（1.0〜61.0） |
| `bgm.boss` | 90s | 80 BPM・4/4・30 小節 | 太鼓、低音のオスティナート（8 分）、弦、控えめな合唱、4 小節ごとの金属音 | あり（1.0〜91.0） |
| `bgm.boss-layer` | 90s | 同上（80 BPM・30 小節） | フェーズ 2 用の上乗せ: 16 分の軍鼓、弦スタッカートのアルペジオ、金管、1 オクターブ上の合唱、ライザー | あり（1.0〜91.0） |
| `bgm.victory` | 20s | 自由 | 弦と合唱がゆっくり広がり、低い鐘の余韻。末尾 4s でフェード | なし |
| `bgm.ending` | 60s | 60 BPM・4/4・15 小節 | ハープのアルペジオ + 弦 + フルートの旋律。末尾 6s でフェード | なし |

- **ボスの同期**: `bgm.boss` と `bgm.boss-layer` は同じテンポ・同じ小節構成（30 小節 = 90.000s、1 小節 = 3.000s）で、サンプル数も同じ（4,320,000）。パディングも同じ（前 1s）ため、**両者を同じ時刻に `start` して同じ loopStart / loopEnd でループさせれば小節頭が揃う**。フェーズ 2 移行では、レイヤーを `bgm.boss` と同じ再生位置（`(now - startTime) % 90`）から重ねる（`start(when, offset)`）。レイヤーは単独のラウドネスを -3 LU 下げてある（重ねた合計が過大にならないように）。
- ループ継ぎ目は環境音と同じ検査（ループ区間の前 1s / 後 0.5s のパディング込み）。曲頭が拍頭の打撃で始まるため、継ぎ目の段差は曲中の他の打撃の立ち上がり以下であることを検査している。
- ビットレートは 80kbps（BGM の既定 96kbps から下げた）。BGM 5 曲の合計は約 3.2MB。

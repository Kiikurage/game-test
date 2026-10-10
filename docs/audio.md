# オーディオエンジン（Issue #30）

仕様: [vertical-slice.md](vertical-slice.md) 10.2 節。実装は `src/audio/`（依存先は無し。`main` からのみ組み立てる）。
素材パイプライン・ライセンス記録は別チケット（#31）で `docs/audio-assets.md` に追加される。

## バス構成

```
sfx ─────────┐
ambient ─────┤
ui ──────────┼→ master → destination
bgm → duck → lowpass ┘
```

- 設定音量（0〜100）→ `gain = (v/100)^2`（`volumeToGain`）。既定: master 80 / bgm 60 / sfx 80（ambient / ui は 80。設定画面にスライダが無いので E9-1a で SE 連動にしてもよい）。
- `PEAK_LEVEL`（BGM 0.6 / 環境音 0.4 / SE 0.8 / UI 0.7 / ボス咆哮 1.0）は素材のピーク基準の目安で、バス音量とは別。ローダ（E7-1b）が素材ごとのゲイン決定に使う。

## API 要約

| API | 内容 |
| --- | --- |
| `createBrowserAudioEngine()` | `AudioContext`（無ければ `webkitAudioContext`）から `AudioEngine` を生成。非対応なら `undefined` |
| `installAudioUnlock(engine, window)` | `pointerup` / `touchend` / `click` / `keydown` で running になるまで `resume()` を試行 |
| `engine.resume()` | ユーザー操作内で呼ぶ。失敗しても reject せず最終状態を返す。「タップして始める」ボタンのハンドラからも直接呼べる |
| `engine.state` / `onStateChange(cb)` | `suspended` / `running` / `interrupted` / `closed` |
| `engine.input(bus)` | 素材の再生ノードを繋ぐ先（`master` / `bgm` / `sfx` / `ambient` / `ui`） |
| `engine.setVolume(bus, 0..100)` | バス音量を直接設定（設定ストア連携は E9-1a） |
| `engine.duckBgm({ db, fadeSeconds, holdSeconds?, releaseSeconds? })` | BGM ダッキング。`holdSeconds` なしなら `releaseDuck(id)` まで保持。重なったら最小ゲインを採用 |
| `engine.setPaused(bool)` | ポーズ時 BGM の低域カット（ローパス 800Hz、0.25 秒で遷移） |
| `framesToSeconds(f)` | 60Hz 固定ステップのフレーム数を秒へ |

仕様のダッキング値: 死亡 `{db:-12, fadeSeconds: framesToSeconds(60)}`、咆哮・フェーズ移行 `{db:-6, fadeSeconds: framesToSeconds(30), holdSeconds: ...}`。

## 設計メモ

- 純粋ロジック（`volume.ts`、`ducking.ts`）は DOM / Web Audio 非依存。`AudioEngine` は最小インターフェース `AudioContextLike`（`types.ts`）越しに `AudioContext` を受け取り、ユニットテストではモックを注入する。
- ダッキング包絡は「フェード → 保持 → 戻し」の折れ線（ゲイン領域で線形）。変更のたびに `DuckingEnvelope.knotsAfter()` の節を `linearRampToValueAtTime` で再スケジュールする。dB 領域ではなくゲイン領域で補間するのは AudioParam の線形ランプと一致させるため。
- `resume()` はジェスチャ内で同期的に `AudioContext.resume()` を起動する（await を挟まない）。並行呼び出しは 1 つの Promise に集約。

## モバイルの自動再生制限

- `AudioContext` は生成直後 `suspended`。最初のユーザー操作で `resume()`。
- iOS Safari は `touchstart` / `pointerdown` ではアンロックされず `touchend`（`click`）が必要。そのため `installAudioUnlock` は `pointerup` / `touchend` / `click` / `keydown` を購読する。
- iOS は電話着信・バックグラウンド化で `interrupted` になる。running でない限り以降の操作でも再試行する。
- ヘッドレス Chromium は `--autoplay-policy` を指定しても制限が効かない（確認済み）ため、E2E ではシム（ユーザー操作があるまで suspend 維持）で制限を再現し、resume 前 `suspended` → クリック後 `running` を検証する。

## フォーマット互換（素材パイプライン #31 向けメモ）

- Android Chrome: Opus（`.ogg` / `.webm`）可。
- iOS Safari: Ogg Opus の `decodeAudioData` 対応は版により不確か（古い版は Ogg コンテナ非対応）。`.m4a`（AAC）は全版で可。実機確認は人間に依頼する。パイプラインは Opus を主とし、`--m4a` で AAC フォールバックを出せる（詳細は #31 の `docs/audio-assets.md`）。

## SE 再生層（Issue #35）

`src/audio/` の `SoundLibrary`（ロード）+ `SfxPlayer`（再生）+ `sfxEvents`（game イベントの購読）。`createSfxSystem(engine, game.events, { baseUrl, isMobile })` が組み立てる（`main` から呼ぶ）。

### game 層との境界

`game` は音を鳴らさず `game.events`（`core/gameEvents.ts` の型付き `EventBus<GameEventMap>`）へ発行するだけ。audio 層が購読する。

| イベント | ペイロード | cue（素材 ID またはグループ名） | 優先度 |
| --- | --- | --- | --- |
| `footstep` | `surface`（grass/stone/wood/crypt）, `gait`（walk/run/roll）, `source`, `position?` | `sfx.footstep-<surface>`（音量は gait で 0.55/0.85/0.7 倍） | マニフェスト（足音 30） |
| `hit` | `kind`（light/heavy/guard/guardBreak）, `source`, `position?` | `sfx.hit-light` / `sfx.hit-heavy` / `sfx.guard` / `sfx.guard-break` | 発生源: player 90 > boss 70 > enemy 50 |
| `sound` | `cue`, `source?`, `position?`, `volume?` | 指定した cue そのまま | `source` 指定時のみ上書き |

- 追加の SE は `sound` で cue を直接渡せる。専用イベントを増やしたい場合は `GameEventMap` と `sfxEvents.toPlayRequest` に足す。
- ヒット SE はヒットストップ開始と同じ tick で `hit` を発行する。`SfxPlayer.play` はデコード済みなら同期的に `start()` するので 0F 遅延で鳴る。
- 位置（`position`）はプレイヤー以外の発生源だけ定位に使う（プレイヤー自身の音はカメラ近傍のため非定位）。

### 足音の接続（E7-3a）

- 発火: アニメーションの `footstep` マーカー（プレイヤー）と敵のマーカーが、`Game` から `footstep` イベントになる。素材は `Game.footstepSurface(x, z)` が足元から引く。
- 素材の判定: `render/footstep/footstep.view.ts` が `Game.footstepSurface` を `createFootstepSurfaceResolver(level)`（`game/world/footstepSurface.ts`）へ差し替える。レベルのエリア定義（`Level.surfaceAt`。エリア外は草）の `SurfaceKind` を `FootstepSurface` へ写す（`underground` → `crypt`）。切替は足音単位（クロスフェードなし）。
- 再生要求: `audio/footstep.ts` の `footstepPlayRequest`（`sfxEvents.toPlayRequest` が呼ぶ）。cue は発生源ごとの `FOOTSTEP_PROFILES[source]`（`cue(surface)` / `volume` / `rate` / `priority`）で決まり、音量は `GAIT_VOLUME[gait]` に `profile.volume` を掛ける。
- 敵・ボスの足音を専用素材に変えるときは、`FOOTSTEP_PROFILES.enemy` / `.boss` を差し替えるだけでよい（例: `{ cue: () => 'sfx.boss.step', volume: 1.2, rate: 0.7, priority: 70 }`）。位置つき要求は定位される。
- 地下墓所（D）の反響は、残響を焼き込んだ `crypt` 素材へ切り替えることで出す（ランタイムのリバーブ送りは使わない）。
- 足音 16 本は `title` グループで先読みする。E2E は `window.__game.dev.footstepLog()`（`footstep.dev.ts`）で再生要求の cue を確認する。

### cue とバリエーション

- cue は素材 ID、またはバリエーショングループ名。グループ名は ID 末尾の連番を除いたもの（`sfx.footstep-stone1`〜`4` → `sfx.footstep-stone`）。素材を足すだけでバリエーションが増える。
- 直前と同じ素材は選ばない（ロード済みの中から選ぶ）。ワンショットはピッチ ±4%（`playbackRate`）、音量 ±1dB を毎回ランダム化。ループは揺らがせない。

### 同時発音数

PC 24 / モバイル 16（`maxVoicesFor(isMobile)`）。超過時は優先度が最も低い（同値なら最古の）ボイスを新しい要求以下の優先度のときだけ止めて譲る。それより低優先の要求は破棄。優先度は素材の `priority`（`audio.json`）、または `PlayRequest.priority` で上書き。

### 空間化

位置つき要求は `PannerNode`（`equalpower`、`inverse`、ref 1m、max 30m、rolloff 1.2）経由でバスへ。リスナーは毎フレーム `sfx.syncListener(camera)`（カメラの `matrixWorld`）で追従。`distanceGain()` は Web Audio の inverse モデルと同じ式（テスト用の参照実装）。

### ロード

- `loadManifest` が `manifest.json` を取得。素材は `preload` でロード（グループ: `title` = BGM・UI・環境音、`field` = `sfx.enemy*` / `sfx.boss*` の SE）。デコード済みバッファはキャッシュし、同時要求は 1 回に集約。失敗した素材は警告を 1 回出して以後無視（再試行しない）。
- 未ロードの素材への `play` は取りこぼして裏でロードを始める（次回から鳴る）。`AudioContext` が `running` でないときのワンショットは破棄（再開時にまとめて鳴らないように）。ループは要求を保持し、ロード完了後に開始する。
- 形式: `canPlayType('audio/ogg; codecs=opus')` が空文字なら `fallbackFile`（m4a）を使う。判定が外れて Opus のデコードが失敗した場合も m4a で再試行する。

### ループ（環境音）

`startLoop(cue, { fadeInSeconds, position?, volume? })` → `{ stop(fadeSeconds) }`、`stopLoop(cue, fade)`。同じ cue は 1 本だけ。

### 後続チケット向け

- BGM（レイヤー・クロスフェード）は別チケット。`SfxPlayer` はワンショットと単純ループのみ。
- `PlayRequest` / ループは現状バスをマニフェストの `bus` で決める。

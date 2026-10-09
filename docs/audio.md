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
- iOS Safari: 18.4 以降は Ogg Opus の `decodeAudioData` に対応。それ以前は `.webm` Opus も不可で、`.m4a`（AAC）または CAF 内 Opus が必要。サポート端末の下限が決まるまで、パイプラインは Opus を主とし、AAC `.m4a` のフォールバック出力を持てる設計にする（詳細は #31 の `docs/audio-assets.md`）。

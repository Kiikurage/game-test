# アニメーションイベントマーカー表

仕様書 [0.3 節](vertical-slice.md)「フレーム数・窓はゲーム側が正。クリップは再生範囲と速度を合わせて使う」を実現するデータ形式。
実装: `src/game/anim/eventMarkers.ts`（型・検証・変換）、データ: `src/game/anim/data/*.json`（例: `playerClips.json`）。

## JSON 形式

```json
{
  "version": 1,
  "entries": [
    {
      "id": "player.light1",
      "clip": "Sword_Regular_A",
      "clipFps": 30,
      "clipRange": { "startFrame": 0, "endFrame": 24 },
      "clipHitFrame": 7,
      "spec": { "startup": 12, "active": 4, "recovery": 20 },
      "markers": [
        { "type": "hitStart", "frame": 13 },
        { "type": "hitEnd", "frame": 16 },
        { "type": "cancelOpen", "frame": 20 }
      ]
    }
  ]
}
```

| フィールド | 意味 |
| --- | --- |
| `id` | 動作 ID（表内で一意） |
| `clip` | クリップ名（`ClipName`。`game` 層は three 非依存のため文字列） |
| `clipFps` / `clipRange` | クリップ自身のフレームレートと、使う再生範囲（クリップのフレーム番号、0 起点） |
| `clipHitFrame` | クリップ内で当たる（振り抜く）フレーム。範囲内で開始より後 |
| `spec` | 仕様書 2.3 節の発生 / 持続 / 硬直（全体 = 合計） |
| `markers` | シミュレーションフレーム基準のマーカー（F1 起点、1〜全体の整数、昇順） |

マーカー種別: `hitStart` / `hitEnd`（当たり窓）、`cancelOpen`（キャンセル窓の開始）、`invulnStart` / `invulnEnd`（無敵窓）、`footstep`、`healApply`。
種別は `MARKER_TYPES` に追加するだけで拡張できる。窓は両端を含む（`F13–F16`、仕様書 0.2 節）。

## 検証（`parseClipEventTable`）

不正なら `AnimDataError`（`path` に `$.entries[0].markers[2].frame` のような位置）。

- マーカーはフレーム昇順、1〜全体フレームの整数
- `hitStart`/`hitEnd`、`invulnStart`/`invulnEnd` は開始 → 終了の交互（多段ヒット可）
- 最初の `hitStart` = 発生 + 1、最後の `hitEnd` = 発生 + 持続（仕様と食い違うとエラー）
- `clipRange` は start < end、`clipHitFrame` は範囲内、`id` は一意

## 再生速度と時間変換

- `playbackRate = (clipHitFrame − startFrame) / clipFps ÷ (startup / 60)`。クリップが 60fps なら「クリップ内の当たりフレーム ÷ 仕様の発生フレーム」と一致する。
- `simFrameToClipTime(entry, frame)`: シミュレーションフレーム `frame`（F1 起点）の開始時点のクリップ時間（秒）= `startFrame/clipFps + (frame − 1)/60 × playbackRate`。再生範囲外は端に丸める。逆変換は `clipTimeToSimFrame`。
- `hitStart`（F = 発生 + 1）は常にクリップの当たりフレームの時刻になる。

サンプルの値（`clipHitFrame` 等）は仮置きで、実クリップに合わせた調整はアニメーションコントローラ側のチケットで行う。

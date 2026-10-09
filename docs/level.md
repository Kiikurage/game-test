# レベルデータ・地形（灰の礎）

Issue #24 の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 7 章（エリア構成）と 14 章（脇道）。

## 構成

```
src/game/world/level.ts            型（LevelData ほか）、ローダ createLevel、検証 validateLevel、levelGameOptions
src/game/world/ashenFoundation.ts  レベル「灰の礎」のデータ（単一の定義）
src/render/levelView.ts            Level から地形・静的物・篝火・マーカーを描く
```

座標は篝火が原点、+x 東、+z 北（m）。`createLevel(data)` が次を作り、物理（`Game.create(levelGameOptions(level))` + `game.addStaticCylinders(level.cylinders)`）と描画（`new GameView(game, renderer, level)`）が同じ `Level` を共有する。

- `heightAt(x, z)` / `terrain`（描画と衝突で同じ頂点・インデックス。1m 格子）
- `boxes` / `cylinders`（壁・墓石・階段・柱など）、`boundaryBoxes`（外周の透明壁）
- `surfaceAt(x, z)`（足音用: grass / stone / wood / underground）、`pathWeight`（道の見た目）

地形の高さは「北東へ緩く上る傾向 + 起伏」を、メインルート（`route`、中心線 + 半幅 + 高さ）と各エリアの平らな床（`areas[].floor`）で上書きして合成する。外周は登れない低い崖と透明壁。傾斜は崖以外で 38° 以下（ユニットテストで検証）。

## 後続チケット向け

- 敵の配置は `enemies`、アイテムは `items`、インタラクト対象は `interactables`（いずれもエリア内の座標。`validateLevel` がエリア内か検査）。現状は描画側が目印のカプセルを置くだけ。実体は各チケットで `level.data.enemies` から生成する。
- 壁や階段は `props` に足す（`block` / `stairs` / `cylinder`）。階段の 1 段は 0.35m 以下。
- 脇道（14 章）: 霊廟（屋根 2.2m）と裏手の石段 7 段は `side_roof` 用に置いてある。ほかは未作成。
- `?scene=test` で従来のテストシーン。`window.__game.dev.freeCam([x,y,z], [tx,ty,tz])` で俯瞰撮影（`null` で戻す）。`dev.teleport` は地形の高さに合わせて置く。

## 環境メッシュ（#34）

A〜C と塔の見た目は `environment.glb`（`docs/assets.md` 7.11 節）。`LevelView.attachEnvironment(assets, particles)` が、置き換えたコライダのグレーボックスを消して環境メッシュ・枯れ草・篝火のパーティクルを出す（`main.ts` が読み込み後に呼ぶ）。コライダの寸法・位置は変えていない（石碑 `stele-a-stone` だけ篝火の方を向く `yawDeg` を追加）。ランタンの位置は `environmentLayout.ts` の `LANTERNS`。


## エリア D〜F・門（#33）

- D 地下墓所: 通路幅 2.5m の L 字（入口 (62,36) → 北へ → 角 (62,48.5) → 東へ → 出口 (78.6,48.5)）。岩盤の塊 `d-*` で囲み、角の奥に石棺の窪み（`d-sarcophagus`）。床は C（3.4m）から E（7.4m）へ通路が緩く上る。
- E 中庭: 外壁に西の入口（z 48..54）と南の崩れ口（x 92..96）の 2 か所。中央に崩れた噴水（円柱 `fountain`、障害物）、壁の欠片・折れた柱。北東の角に霧の門。
- F 闘技場: 内径 32m の外周壁（`f-wall-*`）、柱 4 本（高さ 4m・半径 0.7m、r=12m に 90° ごと）、中央の台座（`pedestal`）。霧の門 (104,68) から幅 約 4.3m の通路（`f-pass-*`）で入る。
- 門は `LevelData.gates`（`GateDef`）。`Level.gates[].box` が塞ぐコライダで、`levelGameOptions().boxes` に入る。`Game.setBoxEnabled(門の id, bool)` で開閉できる（鉄門 `G1` は有効で開始、霧の門 `fog-gate` は無効で開始）。開閉の演出・レバー操作は別チケット。`interactables` の `G1` / `lever-g1`（80,36）/ `fog-gate` は座標のみ（`area: null` はエリア外の通路）。
- ショートカット: `extraRoutes[0]`。中庭の西の入口 → 北の道 → G1 (78,32) → (68,8) → (34,-4.5) → A。G1 から A まで約 90m。G1 の南北の両側に壁（`lane-*`）。
- 既知の制約: 道の外側は開けた地形で、A〜C を含め全域は封鎖していない（D の迂回や G1 の迂回は物理的には可能）。封鎖（崖）は別チケット。

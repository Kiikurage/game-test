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
- 壁や階段は `props` に足す（`block` / `stairs` / `cylinder`）。階段の 1 段は 0.35m 以下。D〜F は範囲と床の高さだけ定義済みで、内部は未作成。
- 脇道（14 章）: 霊廟（屋根 2.2m）と裏手の石段 7 段は `side_roof` 用に置いてある。ほかは未作成。
- `?scene=test` で従来のテストシーン。`window.__game.dev.freeCam([x,y,z], [tx,ty,tz])` で俯瞰撮影（`null` で戻す）。`dev.teleport` は地形の高さに合わせて置く。

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

- 敵の配置は `enemies`、アイテムは `items`、インタラクト対象は `interactables`（いずれもエリア内の座標。`validateLevel` がエリア内か検査）。敵は `Game` が `level.data.enemies` から生成する（[enemy-ai.md](enemy-ai.md)）。アイテムは現状、描画側が目印を置くだけ。
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

## 外周の封鎖（#176）

道の外側は岩壁（崖）で閉じてあり、D・G1・霧の門は迂回できない。実装は地形データだけ（描画・物理・敵のナビ格子が同じ高さ場を使うので、プレイヤーも敵も同じ崖で止まる。透明壁は使わない）。

- `LevelData.perimeter`（`PerimeterParams`）: 通行領域 = メインルートと `extraRoutes`（半幅 + `routeMargin`）、エリア（形状 + `areaMargin`。エリアごとに `perimeterMargin` で上書き）、脇道の `openPaths` の和。その外側は `rise`（7m、岩肌のむらで 0.75〜1.25 倍）まで `width`（3m）で立ち上がる。足元が急で頂で緩む形（`1 - (1 - t)^3`）なので、通行領域の間の細い尾根も登れない。通行領域の内側の地形は変わらない。
- `Level.openDistance(x, z)`: 通行領域までの距離（内側は 0）。テストと、後続の配置（敵・装飾が崖の上に出ないこと）の検査に使う。
- D は岩盤の塊が外壁なので `perimeterMargin: 0`（C 側から D の外壁沿いに回り込ませない）。
- 脇道（14 章）: `ashenFoundation.ts` の `SIDE_PATHS`（`side_roof` / `side_ledge` / `side_wall`）を通行領域として開けてある。`side_waterway` は地下で入口が C の内側なので不要。脇道の本実装では、地形・壁をこの領域内に置くこと。領域を広げる場合は `SIDE_PATHS` を編集する（D の迂回・G1 の迂回を作らないこと）。
- 検証: `levelPerimeter.test.ts`（0.5m 格子の到達可能性。D を塞いだ状態で E・G1 の北・闘技場へ行けない、G1 を閉じたまま北へ行けない、霧の門を閉じたまま闘技場へ行けない、敵のナビ格子が通行領域内に収まる、脇道の要所が開いている）と、`levelWalk.test.ts` の物理テスト（外側へ向かって歩き続けても迂回できない）。
- 新しいエリアや道を足したら、`perimeter` の対象に自動で入る（ルート・エリア）。意図しない迂回路ができた場合は上のテストが落ちる。

## 外周の崖の岩肌化（#190）

- 岩マテリアル（`src/render/cliff/rockSurface.ts`、TSL）: ワールド座標ベースの地層（うねる層・層ごとの色味と張り出し）、層ごとにずれる節理（目地・ブロックの丸み）、縦の割れ目・雨だれ・粒。凹凸は高さ関数の画面空間微分から法線を作る（`bumpedNormal`）。地形マテリアル（`createGroundMaterial`）が斜面角（`normalWorld.y` 0.93..0.74）でブレンドし、岩塊メッシュも同じ関数を使う。層の境・ブロックの境で値が不連続になると微分が跳ねてギザギザが出るので、境でフェード・中間値へ寄せている。
- 岩塊・枯れ草（`src/render/cliff/cliff.view.ts`、`cliffLayout.ts`、`cliffGeometry.ts`）: `Level.openDistance` の帯に InstancedMesh で配置。崖の足元（d = 0.3..0.9m。足元は垂直に近いので壁に半分埋まる）に岩塊の山、上端（d = 2.5..4.4m）に岩と枯れ草のシルエット。斜面の途中には置かない（浮いて見える）。通行領域の内側・脇道（`perimeter.openPaths` の半幅 + 2.6m）・壁や柱の近くには置かない（#110 の岩棚・霊廟裏の石段はこれで空く）。当たり判定・ナビは変更なし。
- 負荷: 空間バケット（48m）ごとに岩 1 + 枯れ草 1 ドローコール。視錐台カリングに加え、岩 30m・枯れ草 26m より遠いバケットは描かない。影は落とさない。密度は `QualityPreset.cliffDetail`（low 0.4 / medium 0.75 / high 1。位置ごとのハッシュで間引くので上位集合）。`?cliff=0` で出さない（比較用）。

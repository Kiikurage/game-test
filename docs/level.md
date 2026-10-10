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
- 脇道（14 章）: 高所の足場（霊廟の屋根・北崖の岩棚・北壁の上）は #110 で作成済み（下の「脇道の足場」）。`side_waterway`（地下水路）は #111 で作成済み（下の「地下水路」）。`side_wall` は未作成。
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

## 脇道の足場（#110: `side_roof` / `side_ledge`）

仕様 14.1.1 / 14.1.2。座標・寸法は初期値（グレーボックス）。すべてレベルデータ（`ashenFoundation.ts`）にあり、見た目（`levelView`）と当たり（`Game`）が同じデータを読む。

- **屋根**: 霊廟 (27..31, 14..18) の上面は足元の石段の足元 + 2.2m（`ROOF_BASE`）。裏手の石段は 1 段 0.275m × 8 段（幅 1.2m）。プレイヤーの実効の自動乗り越えは 0.28m 程度（0.3m の段で止まることを実測）なので、仕様の 0.3m × 7 段から変えた。南縁 (29, 13.8) は B の巡回路の真上。
- **岩棚**: 幅 1.2m。0.5m ごとの小さな段（`ledge-<区間>-<番号>`、style `stairs`）を積んで、地形（約 3.4m）から北壁の上（6.2m）まで一定勾配（約 10°、最大 20° 以内）で上る。中心線は `LEDGE_POINTS`: (35,19) → (33,22) → (33,25) → (35.5,27.5) → (38,29.8) → (39.6,32)。仕様の (44,26) は礼拝堂の内側なので、折れ曲がりを礼拝堂の西の外壁沿いへ取り直した。B の北の柵の欠け（32..34）を通る。
- **壁上の回廊**: `wall-top`（x 40..54、z 31.5..33、幅 1.5m、床 6.2m = 礼拝堂の床 + 2.8m）。x 46..54 が仕様の回廊で、x 40..46 は岩棚の終端。鐘 (50,32)・護符 (52,32.5) は `sidePaths` の `spots`（置き場所の確保のみ）。落下ポイントは (47, 50, 53) の 3 か所で、着地点 (x, 30.8) は `spots` の `drop-w/m/e`。
- **透明壁**（`LevelData.guards` → `Level.guardBoxes`。描画しない。`levelGameOptions` が `boxes` に含める）: 岩棚の両脇（曲がりの外側は 0.8m 延長）、回廊の北側全長、南側は落下ポイント 3 か所（幅 1.5m）以外、東端。落下ダメージはない（高さ ≦ 3m）。
- **敵のナビ格子**: 足場の箱・石段に `navSolid: true`（`BlockProp` / `StairsProp`）を付けると、`NavGrid` は低くても固体として扱い、敵は屋根・岩棚・壁上・石段に入らない。壁上から礼拝堂内へ落ちた先（落下ポイントの着地点付近）は、通常の礼拝堂内のナビ格子とつながっている。
- **足場の範囲（装飾の除外領域）**: `LevelData.sidePaths`（`SidePathDef`: `id` / 中心線 `points` + `halfWidth`（透明壁の外面まで）/ 矩形 `rects` / `spots`）。`Level.sidePathDistance(x, z, ids?)`（または `sidePathDistance(data, x, z, ids?)`）が範囲までの距離を返す（範囲内は 0）。外周の崖の岩塊（#190）など、足場を塞いではいけない配置は、この距離が 0 より十分大きい所にだけ置くこと。外周封鎖の通行領域（`SIDE_PATHS` の `side_ledge`）も同じ `LEDGE_POINTS` から作る。
- 検証: `levelSidePath.test.ts`（寸法・勾配・段差・範囲、ナビ格子に含まれないこと、屋根・岩棚・壁上の走破・3 か所の落下・往復・縁から落ちないこと）と `e2e/sidePath.spec.ts`（入力注入で B → 屋根 → 岩棚 → 壁上 → 3 か所の落下）。
- 撮影した俯瞰: `docs/images/side-path/`（`roof-south` / `roof-top` / `ledge` / `wall-top` / `overview`）。

## 地下水路（#111: `side_waterway`）

仕様 14.1.3。座標・寸法は初期値（グレーボックス）。組み立ては `src/game/world/waterway.ts`（区画 → 壁・床・天井・段）、データは `ashenFoundation.ts` の `WATERWAY`。

- **経路**（内寸 幅 2.0m・天井 2.2m・水深 0.15m・全長 約 47m）: 腐った床板の真下 (43..45, 27..29) → 礼拝堂の床下を東へ（x = 60 の東の崩れ口の下）→ x = 66 を北へ → (66, 40) 雫（水底）→ 上り階段（6 段 + 角の踊り場 + 12 段、1 段 0.272m × 奥行 0.45m）→ 鉄格子 (72, 45) → 出口 (72, 47.25)（D の通路の側面）。墓室（5m × 4m, x 60..65 z 33..37）は x = 66 の通路から西へ分岐。
  - 仕様の斜めの線 (44,28)→(58,36)→(66,40)→(72,45) は、礼拝堂の北壁（z = 32。地面の 1.2m 下まで埋まっている）の下を通れないので、東の崩れ口の下を通る直角の経路に取り直した。
  - 水路の床は C の床（3.4m）− 落下 2.4m = 1.0m。出口の床は D の通路の床 5.9m。階段の 1 段は自動乗り越えの範囲（≦ 0.28m）で、奥行きはプレイヤーのカプセル（半径 0.35m）+ 自動乗り越えの最小幅（0.1m）以上が必要（0.4m では上れなかった）。段の前後は自動乗り越えの頭上の余裕のため天井を 2.6m にしてある（`WaterwayRect.ceiling`）。
- **地形の下に作る方法**: 地形メッシュは 1 枚の面なので、区画ごとに床・天井・壁を `BlockProp`（style `waterway`、`embed` で板を地形に埋めず宙に置く）で作る。腐った床板の穴と、上り階段の上（地形が頭の高さまで来る所）は `LevelData.terrainHoles`（1m 格子に合わせた矩形）で地形メッシュ（描画・衝突の両方）の三角形を抜く。地下墓所の岩盤 `d-mass-s` は水路の通る所を `carveMass` でくり抜き、天井の上を埋め直す（元の id `d-mass-s` は西の端の帯として残る）。
- **腐った床板** `floor-hatch`（style `hatch`、(44, 28) 2m × 2m）: 床と同じ高さで穴を塞ぐコライダ（`navSolid`）。`waterway.system.ts` が、プレイヤーが床板の上に立つと割る（`Game.setBoxEnabled(id, false)`）。落下 2.4m でダメージなし。割れた後は穴が開いたまま（保存は E11）。水路 → C へは 2.4m の段差で戻れない。
- **鉄格子** `iron-grate`（style `grate`、(72, 45)）: 開通前はコライダ。E11 の状況ボタン「押す」は `waterwayOf(game).openGrate()` を呼ぶ。開通後は D 側から水路へ逆行できる。dev フック: `dev.waterway()` / `dev.breakHatch()` / `dev.openGrate()`。
- **足音**: `SurfaceKind` に `water` を追加。`Level.surfaceAt(x, z, y?)` に足元の高さ `y` を渡すと、水路の水のある区画（床 − 0.3m〜天井）の中は `water`（C の床と区別するため。`Game.footstepSurface` が y を渡す）。足音の cue はまだ水専用が無いので `crypt` を鳴らす（E7）。
- **暗所・反響ゾーン**: `LevelData.zones`（`ZoneDef`: `dark` / `echo`、矩形 + 任意の高さ範囲）。地下墓所（エリア D）と水路の全区画。`Level.zoneAt(x, z, y?)` / `visionMultiplierAt`（暗所 `DARK_VISION_MULTIPLIER` = 0.7）/ `hearingMultiplierAt`（反響 `ECHO_HEARING_MULTIPLIER` = 1.3）。たいまつから 4m 超の条件は灯りの配置（E11）後に AI（E3-6）が判定する。音は E7-5b が参照する。
- **敵のナビ格子**: style `waterway` は `NavGrid` が無視する（地下なので C・D の床のセルを塞がない）。床板は `navSolid`、鉄格子の奥は岩盤の埋め草で固体になり、敵は水路へ入らない。
- 検証: `levelWaterway.test.ts`（寸法・地形の頭上の余裕・ゾーン・足音・ナビ・物理で床板 → 水路 → 鉄格子 → D の走破と逆行・戻れないこと）と `e2e/waterway.spec.ts`。

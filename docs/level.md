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
- 脇道（14 章）: 高所の足場（霊廟の屋根・北崖の岩棚・北壁の上）は #110 で作成済み（下の「脇道の足場」）。`side_waterway`・`side_wall` は未作成。
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

## 闘技場の見た目（#45）

F 闘技場の描画は `src/render/arena/`。外部アセットは使わず、すべて手続き（頂点生成 + TSL）で作っている（出典・ライセンスの記録は不要）。

```
src/game/world/arena.ts             arenaOf(level): 寸法・柱・台座・bonfireSlot・入口 / arenaMoodWeight / isArenaProp
src/render/arena/arenaGeometry.ts   柱（フルート + 礎盤・柱頭）・台座（皿つき）・外周壁（崩れた天端）・床の円盤
src/render/arena/arenaMaterials.ts  石の TSL マテリアル（床: 同心円の敷石、壁・柱・台座: 石積み）
src/render/arena/arenaTorches.ts    壁のたいまつ 8 本（燭台 + 炎 + 石の emissive に足す解析的な光）
src/render/arena/arena.view.ts      描画プラグイン + ライティングの切り替え + 柱の破片の口 + arenaViewOf(game)
src/render/arena/arena.dev.ts       dev フック（arenaInfo / arenaPillarHit / arenaEnter、`?arena` `?arena=boss`）
```

- **寸法**: 内径 32m（壁の内面は当たり判定の 24 角形より内に出ない 16.12m）、柱 4 本（r = 12m、高さ 4m、軸の半径 0.7m）、台座（r 1.6m・高さ 0.9m）。コライダは `ashenFoundation.ts` のまま。`LevelView` は `isArenaProp` の静的物のグレーボックスを作らない。
- **後続（撃破演出 #86 など）**: `arenaOf(level).bonfireSlot`（台座の上面の中央。ワールド座標）に篝火を置く。ボス戦の開始は `arenaOf(level).circle`（= `BossSpawnOptions.arena`）と `.pillars`（= `BossSpawnOptions.pillars`。添字は `bossPillarHit.pillar` と一致）をそのまま `spawn` へ渡す。
- **柱の破片の口**: `arenaViewOf(game)?.onPillarHit((hit) => ...)`。`bossPillarHit` から `PillarHit`（柱の添字・表面の位置・飛び散る向き・技 ID）を作って呼ぶ。購読者がいなくても既定で `particles.hit`（砂煙・火花）が出る。破片の演出本体は E5-8b がここへ購読する。デバッグ: `__game.dev.arenaPillarHit(i)`。
- **ライティング**: `Environment.setMood(mood, t)`（`environment.ts`）が `DUSK_MOOD` から `ARENA_MOOD` へ補間する（太陽・半球光・補助光・空・フォグ・遠景の色を uniform / ライトの値の書き換えだけで変える。シェーダの再コンパイルなし）。重み `t` は `arenaMoodWeight`（霧の門の通路を進む約 20m で smootherstep）を指数でなじませる（約 0.5 秒。リスポーンの瞬間移動でも急に切り替わらない）。仕様書 7.2 節の「太陽強度 0.5」は仕様の黄昏（2.0）に対する比（1/4）で、実装の黄昏（3.4）に対しては 0.85。
- **石の質感**: 目地・ひびの線は `fwidth` による解析的 AA、遠景では粒・孔を消す。石ごとの明暗・色味、欠けた縁、染み、苔、床に近い汚れ、壁際・柱の根元の接触 AO、石をまたぐ大きなひび（床のみ）、焦げ跡、台座を囲む彫り込みの輪。凹凸は高さ → 法線の摂動（追加テクスチャ・パスなし）。
- **負荷**: 床 1 + 壁 1 + 柱 4 本結合 1 + 台座 1 + 燭台 1 + 炎 1 = 6 ドローコール（影パスは壁・柱・台座・燭台の 4）。`dev.arenaInfo()` に三角形数が出る。計測視点 `arena`（闘技場の入口）を `scripts/perfViewpoints.mjs` に追加し、`e2e/perf.spec.ts` の予算検査に含めた。

## 外周の崖の岩肌化（#190）

- 岩マテリアル（`src/render/cliff/rockSurface.ts`、TSL）: ワールド座標ベースの地層（うねる層・層ごとの色味と張り出し）、層ごとにずれる節理（目地・ブロックの丸み）、縦の割れ目・雨だれ・粒。凹凸は高さ関数の画面空間微分から法線を作る（`bumpedNormal`）。地形マテリアル（`createGroundMaterial`）が斜面角（`normalWorld.y` 0.93..0.74）でブレンドし、岩塊メッシュも同じ関数を使う。層の境・ブロックの境で値が不連続になると微分が跳ねてギザギザが出るので、境でフェード・中間値へ寄せている。
- 岩塊・枯れ草（`src/render/cliff/cliff.view.ts`、`cliffLayout.ts`、`cliffGeometry.ts`）: `Level.openDistance` の帯に InstancedMesh で配置。崖の足元（d = 0.3..0.9m。足元は垂直に近いので壁に半分埋まる）に岩塊の山、上端（d = 2.5..4.4m）に岩と枯れ草のシルエット。斜面の途中には置かない（浮いて見える）。通行領域の内側・脇道の足場（`Level.sidePathDistance` が 岩の半径 + 1.2m 未満。#110 の岩棚・霊廟裏の石段）・壁や柱の近くには置かない。当たり判定・ナビは変更なし。
- 負荷: 空間バケット（48m）ごとに岩 1 + 枯れ草 1 ドローコール。視錐台カリングに加え、岩 24m・枯れ草 22m より遠いバケットは描かない。影は落とさない。密度は `QualityPreset.cliffDetail`（low 0.3 / medium 0.5 / high 1。位置ごとのハッシュで間引くので上位集合）。`?cliff=0` で出さない（比較用）。

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

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

# 敵 AI 基盤（共通ステートマシン・知覚）

Issue #42 の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 5.1 節（共通 AI）と 14.3.1 節（索敵）。

## 構成

```
src/game/data/enemyAi.ts        パラメータ（視覚・聴覚・ゲージ・AI の数値・種別ごとの HP/身長/旋回）
src/game/enemy/enemyStates.ts   状態グラフ（CharacterFsm のグラフ）
src/game/enemy/perception.ts    知覚の純粋関数と音の受け口（NoiseField）
src/game/enemy/navigation.ts    経路問い合わせ Navigator（インタフェースと直線の directNavigator）
src/game/enemy/navGrid.ts       ナビゲーション用の格子（レベルから生成。通行可否・門の開閉）
src/game/enemy/gridNavigator.ts 格子上の A* による Navigator（平滑化・キャッシュ・分散探索・分離・スタック復帰）
src/game/enemy/enemyBody.ts     体（Rapier キャラクターコントローラ / テスト用の平面）
src/game/enemy/enemy.ts         Enemy 本体（LockOnTarget）。AI の状態遷移
src/game/enemy/enemyManager.ts  生成・更新・味方への Alert 伝播・音の受け口
src/render/enemyView.ts         亡者マテリアル + equipLoadout の描画、EnemyAnimator
src/render/enemyDebugView.ts    ?debug の視野コーン・状態ラベル
src/render/navDebugView.ts      ?debug の歩ける範囲の縁（青緑）・敵の経路（黄）
```

`Game.enemies`（`EnemyManager`）が、`GameOptions.enemies`（レベルデータの `enemies`。`levelGameOptions` が渡す）から敵を作り、`game.lockOnTargets` にも登録する。1 ステップの順序は プレイヤー → 敵 → 物理。

## 状態

`Idle → Suspicious → Alert(24F) → Chase → Approach → Attack → Recover`、`Return`、全状態から `Staggered` / `Dead`。

- Idle: `wait` / `idle_back` はその場、`patrol` は向いている方向へ `patrolRadius` だけ往復（端で 90F 待つ）。
- Suspicious: ゲージ 50 以上。感知源へ 1.8 m/s で最大 6m 歩き、着いたら 180F 見回す。調べている間はゲージを下げない。ゲージが 50 未満に戻ると Idle（持ち場へ歩いて戻る）。
- Alert: ゲージ 100。24F 動かず対象を見据える。同時に 8m 以内の味方（Idle / Suspicious）を Alert にする（連鎖する）。
- Chase: 3.5 m/s。感知（視認または聴取）を失ってから 360F（6s）で Return。出発地点から 25m 超でも Return。5m 以内で視認していれば Approach。
- Approach: 2.5 m/s で 3m まで詰め、止まって旋回し（30〜90F）、`attackBehavior.tryStart` を呼ぶ。
- Return: 3.0 m/s で出発地点へ。HP を毎秒 20% 回復。**Return 中は何にも気付かない**（リーシュ境界での往復を防ぐ。仕様書に記述なし、本実装の判断）。
- 戦闘中（Alert 以降）の視認は FOV を問わず（距離 14m と視線の遮蔽のみ。`ENEMY_VISION.combatFovDeg`）。背後へ回られても見失わない（本実装の判断）。

## 知覚

- 視覚: 距離 14m・FOV 140°・視線（Rapier のレイキャスト。地形・静的物が遮蔽）。ゲージの増加量は 距離帯 × 角度 × 動作 × 環境（`visualGainPerSecond`）。
- 聴覚: 3D 距離が半径以内なら +120/秒、壁越し可。視覚と聴覚は大きい方を採る（加算しない）。
- プレイヤーの足音は `Game` が毎ステップ `NoiseField` に出す（歩き 2m / 走り 5m / ダッシュ・ロール 8m）。落下着地（2m 以上）6m、`hit` イベント（命中音）8m も自動で出る。
- 他の音源（鐘・壁の崩壊・回復瓶）は `game.emitNoise(position, kind)`。半径は `NOISE_RADIUS`（data/enemyAi.ts）。
- 暗所の ×0.7 は `EnemyManager` のオプション `darkness(x, z)` で差し込む口だけ用意（未使用）。

## 後続チケット向け

- 攻撃（#54）: `enemy.attackBehavior = { tryStart(enemy, ctx), update(enemy, dt, ctx) }` を差し替える。`tryStart` が true なら Attack、`update` が true を返すと Recover（クールダウン 30〜90F、HP 25% 以下は 30〜60F）。攻撃トークン（同時 2 体）と旋回の固定は未実装。
- ナビゲーション（#43）: 下の「ナビゲーション」節。`Navigator` を差し替えるなら `GameOptions.enemyNavigator` へ。
- 被弾（#40 / #50）: `enemy.hp`、`stagger(frames)`、`kill()`、`provoke(x, z)`（被弾で Alert）、`fsm.freeze(frames)`（ヒットストップ）。
- アニメーション: `src/render/assets/enemyAnimator.ts`。Action 系の状態は `states` にクリップを足す（攻撃は #54 でマーカー表）。
- デバッグ: `?debug` で視野の扇（Idle 系）/ 視認範囲の円（戦闘中）と、状態・ゲージ・見失い時間のラベル。`window.__game.sim.enemies` に状態一覧、`dev.pause(true)` + `dev.advance(steps)` でシミュレーションを任意ステップ進められる。`?enemies=0` で敵を置かない（地形の E2E 用）。

## ナビゲーション（#43）

レベルでは `levelGameOptions(level)` が `enemyNavigator`（`createLevelNavigator`）を渡すので、敵は自動で経路を使う。テストシーンなど渡さない場合は直線（`directNavigator`）。

**格子（`NavGrid.build(level)`）**: 0.25m 格子。表面の高さは地形メッシュ（衝突と同じ三角形）と、乗れる低い箱・階段の上面。通行可否の規則は次のとおり。

- 固体: 地形から 0.35m を超えて立つ箱（階段を除く）、円柱、外周の外。薄い柵も塗れるよう壁は半セル広げて塗る。
- 通れない縁: 隣のセルとの高さの差が 40° の勾配（`MOVEMENT.maxSlopeDeg`）を超える（崖・高い段差）。0.35m の段・階段・40° 以下の坂は通れる。
- 余裕: 固体・通れない縁から 3 セル（壁面から 0.5〜0.75m）以内は歩行不可。敵のカプセル（半径 0.35〜0.38m）が壁・崖縁に触れず、幅 2.5m の通路でも歩ける幅（約 1.0〜1.5m）が残る。
- 門: `Level.gates` の板の周囲を、閉じている間だけ塞ぐ。`Game.setBoxEnabled(門の id, bool)` が `Navigator.setGateClosed` も呼ぶので、開閉で経路が変わる（`grid.version` が進み、経路のキャッシュと各敵の経路が無効になる）。

**経路（`GridNavigator`）**:

- 直線（30m 以内）で歩けるなら経路は引かず目的地へ直進する（追跡の大半）。
- そうでなければ A*（8 近傍、斜めは角を切らない、ヒューリスティック重み 1.25）。壁際・崖縁に近いほどコストを上げて通路の中央を通す。結果は直線で結べる所まで間引く（線の両側 0.15m も歩けるときだけ結ぶ）。
- 探索は 1 ステップあたり 3000 ノード展開までに区切って複数ステップに分散する（`EnemyManager.update` が `navigator.update()` を呼ぶ）。探索待ちの敵は古い経路で進み、なければその場で待つ。同じ（始点セル, 終点セル, 門の状態）はキャッシュ（48 件）、同じ探索は敵どうしで相乗りする。
- 目的地が 2m 動くか、経路の終わりに着いても目的地へ歩けないと引き直す（最短 20F 間隔）。リーシュ（Return の帰還）・巡回・調査もすべて `steerTo` 経由なので同じ経路を使う。
- 敵同士の分離: 1.1m 以内の味方から離れる向きへ進行方向を寄せ、正面の味方は右へかわす（倒れた敵は対象外）。
- スタック検出: 90F の間ほぼ前進しようとしているのに 0.3m も動けないと、経路を引き直して 30F 横へよける。4 回続くと 2 秒間 `null`（到達不能）を返す。
- 到達不能（`null`）のとき `steerTo` は動かない。追跡は聴覚・視覚が続く限り止まって待つ（見失えば通常どおり Return）。

**コスト（灰の礎、デスクトップの Node）**: 格子の生成 約 100〜200ms（モバイルは数倍を見込む。ロード時に 1 回、`levelGameOptions` がレベルごとにキャッシュ）、メモリ 約 6.5MB（格子 2MB + A* の作業領域 4.5MB）、バンドル +約 14KB（gzip 約 5KB）。A* は 1 回 4,000〜80,000 展開（約 5〜90ms 相当を 1〜27 ステップに分散）。

`?debug` では歩ける範囲の縁（青緑。閉じた門も縁になる）と、各敵の残りの経路（黄）を地面に描く。`window.__game.dev.noise(x, y, z, 'bell')` で任意の地点に音を鳴らせる（壁越しに敵を呼ぶ E2E 用）。

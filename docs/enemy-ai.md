# 敵 AI 基盤（共通ステートマシン・知覚）

Issue #42 の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 5.1 節（共通 AI）と 14.3.1 節（索敵）。

## 構成

```
src/game/data/enemyAi.ts        パラメータ（視覚・聴覚・ゲージ・AI の数値・種別ごとの HP/身長/旋回）
src/game/enemy/enemyStates.ts   状態グラフ（CharacterFsm のグラフ）
src/game/enemy/perception.ts    知覚の純粋関数と音の受け口（NoiseField）
src/game/enemy/navigation.ts    経路問い合わせ Navigator（暫定は直線）
src/game/enemy/enemyBody.ts     体（Rapier キャラクターコントローラ / テスト用の平面）
src/game/enemy/enemy.ts         Enemy 本体（LockOnTarget）。AI の状態遷移
src/game/enemy/enemyManager.ts  生成・更新・味方への Alert 伝播・音の受け口
src/render/enemyView.ts         亡者マテリアル + equipLoadout の描画、EnemyAnimator
src/render/enemyDebugView.ts    ?debug の視野コーン・状態ラベル
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
- ナビゲーション（#43）: `GameOptions.enemyNavigator` に `Navigator`（`nextPoint(from, to, out)`）を渡す。経路なしは null。
- 被弾（#40 / #50）: `enemy.hp`、`stagger(frames)`、`kill()`、`provoke(x, z)`（被弾で Alert）、`fsm.freeze(frames)`（ヒットストップ）。
- アニメーション: `src/render/assets/enemyAnimator.ts`。Action 系の状態は `states` にクリップを足す（攻撃は #54 でマーカー表）。
- デバッグ: `?debug` で視野の扇（Idle 系）/ 視認範囲の円（戦闘中）と、状態・ゲージ・見失い時間のラベル。`window.__game.sim.enemies` に状態一覧、`dev.pause(true)` + `dev.advance(steps)` でシミュレーションを任意ステップ進められる。`?enemies=0` で敵を置かない（地形の E2E 用）。

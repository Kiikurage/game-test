# 敵の攻撃実行・攻撃トークン

Issue #54 の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 5.1 節（テレグラフ・攻撃トークン・旋回）と 5.2 節（亡者兵 A1〜A3）。
敵 AI の状態機械は [enemy-ai.md](enemy-ai.md)、被弾側は [hit-reaction.md](hit-reaction.md) / [hit-stop.md](hit-stop.md)。

## 構成

```
src/game/data/enemyAttack.ts        テレグラフ基準（ENEMY_ATTACK_RULES）・検証（checkEnemyAttack）・亡者兵の攻撃表（UNDEAD_SOLDIER_ATTACKS）・選択ルールの数値
src/game/data/enemyAi.ts            攻撃トークン / 周回待機の数値（maxAttackers, orbitRadius, orbitSpeed）
src/game/anim/data/undeadClips.json 亡者兵の攻撃のマーカー表（hitStart / hitEnd・クリップ範囲・再生速度）
src/game/anim/enemyClips.ts         ↑ の読み込み（`findEnemyClipEvents('enemy.undead.a1')`）
src/game/enemy/attackRunner.ts      AttackRunner（攻撃の実行）/ AttackTokens（トークン）/ pickWeighted（重み付き乱択）/ AttackPlanner
src/game/enemy/undeadAttack.ts      亡者兵の攻撃選択（UNDEAD_PLANNER）と createUndeadAttack
```

`Game` が `EnemyManager` の `createAttack` で、亡者兵 1 体ごとに `AttackRunner` を作って `enemy.attackBehavior` に入れる。`AttackTokens` は `game.attackTokens`（全敵で 1 つ）。盾持ちの攻撃（S1〜S3）は未実装で、それまでは攻撃しない（`NO_ATTACK`）。

## 攻撃の実行（AttackRunner）

Approach で間を取り終えると `tryStart` が攻撃を選び（`AttackPlanner.choose`）、トークンが取れれば Attack 状態へ入る。Attack の中は `update` が毎ステップ（ヒットストップ中を除く）呼ばれる。
`F` は Attack に入ってからのフレーム（`enemy.fsm.stateFrame`、F1 起点）。

| 区間 | 内容 |
| --- | --- |
| F1〜F(発生) 予備動作 | **F1〜F⌊発生×0.6⌋ だけ** 120°/s で対象へ向きを追尾し、以降は向き固定（ロールで躱せる）。強靭度 +30（`poise.grant`） |
| F(発生+1)〜F(発生+持続) 判定 | マーカー表の `hitStart`〜`hitEnd` の間、前方の扇形（`arcDeg` / `range`）を毎ステップ `combat.resolve`。突進（`moveDistance`）は持続の間に均等に進む。持続が終わると強靭度の加算を戻す |
| 〜F(全体) 硬直 | 全体 = 発生 + 持続 + 硬直 が終わると、連続攻撃がなければ Recover へ（クールダウン 30〜90F。HP 25% 以下は 30〜60F。`Enemy` が決める） |

- 判定の窓は **マーカー表が正**。`data/enemyAttack.test.ts` が表と攻撃定義（発生・持続・硬直・`hitStart = 発生+1`・`hitEnd = 発生+持続`）の一致を検証する。
- 動作 ID は `enemy.undead.<攻撃 ID>`。`Enemy.fsm.actionId` に入り、`EnemyAnimator` がマーカー表からクリップ（範囲・再生速度・戻りクリップ）を引く（同じ Attack 状態の中で A1 / A2 / A3 を出し分けるため、`CharacterFsm` に `transition(to, { actionId })` / `restart(actionId)` を足した）。
- 連続攻撃（A1 → A1b）は Attack 状態のまま `fsm.restart(動作 ID)` で状態フレームを 0 に戻して続ける（`AttackPlanner.followUp`）。
- 打ち切り: 崩し（`enemy.stagger`）・撃破（`enemy.kill`）・`reset` で `attackBehavior.cancel` が呼ばれ、判定の終了・強靭度の加算の解除・トークンの返却をする。

### 亡者兵の攻撃表（`UNDEAD_SOLDIER_ATTACKS`）

| 攻撃 | 発生 | 持続 | 硬直 | ダメージ | 強靭度削り | ガード時スタミナ | 判定 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| a1 横斬り | 24 | 5 | 28 | 45 | 25 | 22 | 前方 100°・射程 1.8m |
| a1b A1 の連続 | 20 | 5 | 28 | 45 | 25 | 22 | 同上（`followUp`） |
| a2 縦斬り（大振り） | 34 | 6 | 36 | 70 | 50 | 35 | 前方 60°・射程 2.0m（`heavy`） |
| a3 突進突き | 28 | 8 | 34 | 55 | 30 | 28 | 前方 30°・射程 1.8m・突進 2.5m（持続の間） |

A3 の射程は仕様書に数値がないため、剣の長さに合わせて 1.8m とした。

### 攻撃選択（`UNDEAD_PLANNER`）

- 距離 ≤ 2.2m: A1 60 / A2 40。A2 は「A1 の使用後ではない」ときだけ（直前が A1 なら A1 のみ）。
- 距離 2.5〜5.0m: A3 70（残り 30% は選ばず待つ）。2.2〜2.5m と 5m 超は選ばない。
- A1 の後 40% で A1b を連続（最大 2 発）。
- ロール中・ロール終了から 20F 以内に近距離（≤ 2.2m）にいるときは、待ち（30〜90F）を飛ばし、A1 : A2 を 70 : 30 にする。`Game` が `AiTarget.recentRoll` を毎ステップ渡す。
- 同じ攻撃を 3 回連続で選ばない（`pickWeighted` の `maxConsecutive`）。A1 が 2 回続いて A1 も A2 も選べなくなる場合は、立ち尽くさないよう A2 を許す（本実装の判断）。
- `pickWeighted(choices, random, { history, maxConsecutive, idleWeight })` は他の敵・ボスも使える汎用部品。乱数と制約は注入できる。敵ごとの乱数は ID から決まる決定的な乱数（`seededRandom`）。

## 攻撃トークン（AttackTokens）

- 同時に Attack 状態に入れる敵は **最大 2 体**（`ENEMY_AI.maxAttackers`）。`tryStart` が攻撃を選んだうえでトークンを取る。取れなければ待機する。
- 待機中（`isWaiting()` が true）の敵は Approach で **半径 4m の円周上を最大 1.5 m/s で対象の周りに回る**（向きは対象へ向けたまま横歩き。近すぎれば円周まで下がる）。トークンの再試行は 12F ごと。
- 返却: 硬直が終わって Recover へ移るとき、または打ち切り（崩し・撃破）のとき。

## テレグラフ品質の検証

`checkEnemyAttack(def)`（違反の説明を配列で返す）を、攻撃定義ごとにテストする（`data/enemyAttack.test.ts`）。

- 発生: 通常 24F 以上・強い攻撃（`heavy`）34F 以上・連続の 2 発目（`followUp`）20F 以上
- 持続: 4F 以上
- 反応から回避完了までの猶予: 予備動作の開始から判定が消えるまで（**発生 + 持続**）が 26F 以上（連続の 2 発目を除く）。ロール（無敵 F4–F15）が判定の持続と重なる余裕を意味する、という本実装の解釈（仕様書は数式を定めていない）
- 追尾終了が発生の 60% を超えない

新しい敵・ボスの攻撃を足すときは、同じ形の攻撃表を `data/` に作り、`checkEnemyAttack` を全件に当てるテストを書く。

## 被弾側との接続（#49 / #50 の申し送りの回収）

- `Game.registerEnemy` が `game.registerFreezable(enemy.id, enemy.fsm)` を呼ぶ。命中すると攻撃側・被弾側の敵が同時に凍結する（敵の攻撃がプレイヤーに当たると攻撃側の敵も 6F 凍結）。
- 被弾の押し戻し（`reactor.consumeSlide`）は `enemy.pushBy(dx, dz)` で敵の次の移動に足される（`Enemy` の移動と同じ `moveBy` に合算）。壁・地形には体が従う。攻撃の突進・周回待機も同じ口。
- プレイヤーの被弾側（ハートボックス・無敵）は、敵の更新の**前**に同期する（そのステップのロールの無敵・位置を、敵の判定が見る）。

## プレイヤーの HP と死亡（最小）

`Game.playerTarget.health`（HP 300）に敵の攻撃が当たり、0 になると `Player.die()` が呼ばれて `dead` 状態になる（入力を受け付けず倒れたまま・`Death01`。無敵扱いで追撃を受けない）。`game.player.dead` / `debugState.combat.playerDead`。`game.respawn()` が HP を戻して操作可能に戻す。HUD・死亡演出・ペナルティは別チケット。

## 戦闘デバッグシーン（#61）

`?scene=combat`（テストシーンの広場 + 亡者兵 1 体。`src/game/world/combatDebug.ts`）。プレイヤーは (0, 3.5) 北向き、亡者兵は (0, -3.5) で南向きに待つ。`?debug` で判定の扇形と状態ラベルが出る。撮影は `SHOT_QUERY='?scene=combat&debug'` と `dev.pause` / `dev.advance` / `dev.view(yawOffset, distance, pitch)` を使う `SHOT_SCRIPT`（攻撃開始から F4 / F12 / F22 / F26 / F32 の画を撮る）。

テスト（`enemy/undeadSoldier.test.ts`）: 選択ルールのシード固定の分布（60/40・A3 70%・ロール直後 A1 70%・A1 連続 40%）・距離境界 2.2 / 2.5 / 5.0m・3 連続禁止、A1 が回避しない相手に F25 で当たる、ロールが A1 / A2 / A3 を躱せる（発生の 3F 前、予備動作開始 +10F の両方）、軽攻撃 3 発で HP 120 を倒し Dead へ遷移。

## 確認用

- `window.__game.sim.enemies[].attackId`: 攻撃中の動作 ID（`enemy.undead.a1` など）。
- `window.__game.dev.advance(steps)`: 入力も 1 ステップずつ確定して進める（`dev.pause(true)` と併用。キーボード入力が `advance` で反映される）。
- `?debug`: 判定中の扇形（`combatDebugView`）が出る。

## 未対応

- 予備動作の武器の発光（リムライト 0.5 → 1.0 を 8F。通常 = 白、強攻撃 = 赤橙。5.1 節）
- 盾持ち（S1〜S3・ガード挙動）、ガード判定（#53）、ナビメッシュ（#43）、プレイヤーの死亡演出・HUD

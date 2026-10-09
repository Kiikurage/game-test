# プレイヤーコントローラ・三人称カメラ・ロックオン

Issue #8 の実装メモと、後続チケット（#24 レベルデータ / #32 アニメーション状態機械 / #40 戦闘判定）向けの API 要約。
仕様の正は [vertical-slice.md](vertical-slice.md) の 2.2（移動）・2.3（ロール）・3 章（カメラ・ロックオン）。数値は `src/game/data/` に型付きで置き、調整値は `src/game/tuning.ts` に集約している。

## 構成

```
src/game/
  game.ts                      Game: 1 ステップの進行・物理・視線/カメラ衝突の問い合わせ
  tuning.ts                    調整値（ミュータブル。?debug の調整パネルから実行中に変更可）
  data/camera.ts               仕様 3 章の数値（カメラ距離・ロックオン条件など）
  player/player.ts             Player: キャラクターコントローラ（Rapier）+ 行動状態
  player/movement.ts           移動の純粋関数（カメラ相対・速度・旋回・ロックオン移動・ロールの距離テーブル）
  player/stamina.ts            スタミナ（2.1 節）
  camera/thirdPersonCamera.ts  三人称カメラ（スプリングアーム・衝突・ロックオン構図・揺れ）
  lockOn/                      ロックオンの対象選択（select.ts）・状態管理（lockOnController.ts）・対象の型（targets.ts）
  world/groups.ts              衝突グループ（地形 / ターゲット / プレイヤー / カメラ）
  world/playground.ts          テストシーンの足場・ダミー・スポーン位置（物理と描画が同じデータを読む）
  testing/fakeInput.ts         テスト用の InputReader
src/render/
  playerView.ts                騎士モデルの描画（player.transform を補間）
  anim/characterAnimator.ts    アニメーションコントローラ（クロスフェード・上半身/下半身レイヤ・マーカー駆動。#32）
  playground.ts                足場・ダミー・ロックオンマーカーの描画
src/ui/tuningPanel.ts          ?debug の調整パネル
```

依存方向は AGENTS.md のとおり。game 層は render / input / ui を import しない（入力は `core/input.ts` の `InputReader` だけを知る）。

## 1 ステップの順序（`Game.update(dt)`）

1. ロックオン更新（取得・維持・解除・切替。前ステップのカメラ姿勢で判定）
2. `camera.updateAim`: このステップの回転入力をヨー・ピッチへ反映（移動の基準方向 `camera.yaw` を先に確定し、入力から反映までの遅れを作らない）
3. `player.update`: 状態遷移 → 速度 → 向き → キャラクターコントローラで移動
4. `physics.step`
5. `camera.updatePlacement`: 注視点の平滑化 → アーム長（球の shape cast）→ 最終的な位置と向き

描画は `player.transform` / `camera.transform`（`InterpolatedTransform`）を `alpha` で補間して読む。

## Player

```ts
player.state          // 'idle' | 'move' | 'dash' | 'roll' | 'backstep' | 'fall' | 'land'
player.stateFrame     // 現在の状態に入ってからのフレーム数（F1 起点。仕様書の F 表記と一致）
player.feet           // 足元のワールド座標（Vector3）
player.yaw            // 向き。前方 = (sin yaw, cos yaw)
player.speed          // 指令された水平速度 m/s
player.invulnerable   // ロール F4–F15 / バックステップ F1–F8（被ダメージ判定を持たない）
player.stamina        // Stamina: canStart(cost) / consume(n) / drain(perSecond, dt) / update(dt, { guarding, sprinting }) / onEmpty(fn) / current / max / ratio
player.events         // そのステップの通知（rollStart / backstepStart / land / staminaEmpty）
player.animation      // PlayerAnimationState（#32 が読む。state, stateFrame, speed(実移動速度), localVelocity, lockedOn, yaw）
player.rigidBody      // 物理ボディ（カメラ衝突の除外用）
player.teleport(pos, yaw)
```

- **移動**: 入力はカメラ基準（`cameraRelativeMove`）。目標速度は入力の強さで連続的に変わる（歩き 1.8 → 走り 4.5。`speedForMagnitude`）。ダッシュ（回避長押し = `snapshot.sprint`）は 6.5 m/s・毎秒 10 スタミナ、スタミナ 0 で走りへ戻り、ボタンを離すまで再開しない。加速 8F・停止 6F。旋回は最高 720°/s（指数追従と最高角速度の上限。入力方向へすぐ向き始める）。
- **ロックオン中**: 対象を向いたままストレイフ（前後左右 3.8 m/s、後退 2.6 m/s、ダッシュ 5.5 m/s）。
- **ロール / バックステップ**: `PLAYER_ACTIONS.roll` / `.backstep` のフレームデータどおり（全体 32F / 22F、距離 3.2m / 2.0m、無敵 F4–F15 / F1–F8）。入力（回避確定 = `buttons.dodge.pressed`）と同じステップで F1 が始まる。先行入力は `InputReader.consumeBuffered('dodge')` で消費。スタミナ 0 では開始できない。移動入力があればロール、なければバックステップ。ロール F26 から移動へキャンセル可。終了時にボタンが押されていればダッシュへ。
- **落下 / 着地**: 接地が 4F 切れたら `fall`。1.2m 以上落ちると `land`（10F、3m 以上で 22F、速度 35%）。
- **地形**: 40° まで登れ、それ以上は滑る。0.35m までの段差は自動で乗り越える（Rapier のオートステップ。接地中に下向きの移動量を与えるとオートステップが働かないので、接地中の鉛直速度は 0 とし、吸着は snap-to-ground に任せている）。見た目の跳ね上がりは `transform` だけ平滑化している。

### スタミナ（#41）

`player/stamina.ts`。仕様書 2.1〜2.3 節。すべて 60Hz の固定ステップ（フレーム単位）。

- `canStart(cost)`: `cost <= 0`（回復など）または残量 > 0 なら true。**消費後に 0 になる動作は開始できる**が、0 のときは新規に開始できない。`canStartAction` は `canStart()` と同じ。
- `consume(n)`: 動作**開始時**の一括消費（0 でクランプ）。回復待ちが 45F（0 になれば 60F）で再スタート。ガード被弾（E2-6）は `HitEvent.guardStaminaCost` をこれで消費する。
- `drain(perSecond, dt)`: 継続消費（ダッシュ毎秒 10）。0 に達したら true。ダッシュはスタミナ 0 で走りに戻り、ボタンを離すまで再開しない（`Player.dashLocked`）。
- `update(dt, { guarding, sprinting })`: 毎ステップ 1 回。最後の消費から 45F 後に毎秒 40（0.667/F）、ガード中は毎秒 20、走り・ダッシュ中は回復しない（待ち時間は進む）。
- `onEmpty(fn)`: 0 に達した瞬間（開始消費・継続消費・ガード被弾のどれでも）。`Player` は `events` に `staminaEmpty` を積む（HUD 点滅・SE・息切れ用）。

### アニメーション（#32）

`player.animation` を `render/anim/characterAnimator.ts` が読み、ロコモーション（Idle / Walk / Run / ロックオン時のストレイフ）をクロスフェードで再生する。アクション中は `game/anim/` のマーカー表（`player.<状態 ID>`）のクリップ範囲と再生速度を仕様フレームに合わせ、マーカー（`hitStart` / `cancelOpen` / `invulnStart` / `footstep` など）を `game/anim/markerDispatcher.ts` がイベントバスの `animMarker`（足音は `footstep` にも）へ流す。状態機械は `game/anim/characterFsm.ts`（敵・ボスと共用）。ヒットストップは `freeze(frames)` で状態フレームとアニメーションを同時に止める。表の `clipRange` / `clipHitFrame` は `scripts/assets/clipMeasure.mjs`（animations.glb を実測）で検証される。

### 後続の戦闘（#40 など）が状態を足すとき

`PlayerStateId` に状態を足し、`Player.updateState` の `switch` と `enterState` に分岐を書く。キャンセルは `PLAYER_ACTIONS.<id>.cancels`（`inWindow(frame, window)`）を使う。ロール中の例は `updateRoll`（F26 の移動キャンセル）。行動不能の判定は `player.isActionable`。被ダメージ判定は `player.invulnerable` を見る。入力は `frame.input.consumeBuffered('lightAttack')` などで行動可能になったステップに消費する。

## カメラ

```ts
game.camera.transform   // 補間用の位置・向き（render が読む）
game.camera.fovDeg      // 縦 FOV（touch 50° / それ以外 55°）
game.camera.yaw / pitch // 向き（pitch は下向きが正）
game.camera.forward     // 実際の前方ベクトル
game.camera.armLength   // 注視点からの現在の距離（壁があると縮む）
game.camera.addShake(amplitudeDeg, frames)   // 被弾・叩きつけの揺れ（3.3 節。強度の設定は呼び出し側で掛ける）
game.camera.reset(feet, yaw, pitchDeg?)      // リスポーン等で即座に背後へ置く
```

- フリー: 注視点（足元 +1.5m）の背後 4.2m、回転は入力に即時、位置は 0.12s の指数平滑（垂直は少し遅く 0.16s で、段差・坂の上下を抑える）。ピッチ −30〜+60°。走り中に左右入力を 20F 以上続けると 0.3°/F で進行方向へ寄る（`tuning.camera.autoFollow`）。
- 衝突: 注視点から半径 0.25m の球を shape cast。壁には**即座に**押し込み（壁抜けを絶対に起こさないため 3F の猶予は設けていない）、解消後は 24F かけて元の距離へ戻す。平滑化した注視点が壁の向こうへ入り込まないよう、肩の実位置からも同じ判定をしている。
- ロックオン: プレイヤー → 対象方向へヨーを 0.12s で追従（水平 ±40° を超えたら即時に追いつく）。注視点はプレイヤー 0.65 : 対象 0.35 の混合点、カメラ距離は `4.2 + max(0, 身長 − 1.8) × 1.2`（最大 7.0）、敵が高いほど見上げる。手動ピッチ入力は ±10° のみ。水平の回転入力は無視（切替入力として扱う）。

## ロックオン

```ts
game.lockOn.target                // LockOnTarget | null
game.lockOn.release('external')   // プレイヤー死亡などで解除
game.lockOnTo(id)                 // 条件を無視して直接ロック（ボス戦開始の演出・デバッグ）
game.lockOnTargets                // 対象の登録先（敵はここへ push する）

interface LockOnTarget {
  readonly id: string;
  readonly position: Vector3;   // 足元（ワールド）
  readonly height: number;      // 身長（胸元 = 身長 × 0.65、カメラ距離にも使う）
  readonly alive: boolean;      // false → 0.5s 後に 10m 以内の次の対象へ、なければ解除
}
```

取得は距離 15m 以内・画面内（水平 ±35° / 垂直 ±25°）・カメラから胸元への視線が通ること、スコア = 角度 × 0.6 + 距離 × 0.4 の最小。維持は 20m（ヒステリシス）・視線遮断 120F。切替後 20F は再切替不可。入力は `buttons.lockOn.pressed`（トグル）と `targetSwitch`（左右）。ロックオン中のマウスの急な横移動（1 ステップで 0.1rad 超）も切替扱い。

## 調整値（`?debug`）

`?debug` で画面右上に「tuning」パネルが出る。速度・旋回・カメラ・ロックオンの値を実行中に変更でき、変更は即座に反映される（reset all で初期値へ）。コードからは `import { tuning } from 'game/tuning'`。

## E2E / デバッグ用

`window.__game.sim`（プレイヤー・カメラ・ロックオン・イベント累計）、`window.__game.dev`（`teleport(x, z, yaw)` / `pause(bool)` / `lock(id)` / `view(yawOffset, distance, pitchDeg)` / `pose(layer, time)`）、`window.__game.playerView`（再生中のクリップ）。`npm run shot` は `SHOT_SCRIPT=<module>` で撮影前に入力を注入できる（default export の `async (page, { name, index }) => {}`）。

## 判定・ダメージ解決（#40）

`src/game/combat/`（three 非依存）。仕様は vertical-slice.md の 2.3 / 4.2 節。

```ts
game.combat                          // HitResolver
game.combat.addTarget(target)        // 被弾側（HitTarget）。UprightTarget が直立キャラの標準実装
const atk = game.combat.startAttack(attackerId, 'player' | 'enemy', profile)   // 動作開始時（1 スイング = 1 インスタンス）
game.combat.prime(atk, shape)        // 判定開始直前の姿勢（初回からスイープにする）
game.combat.resolve(atk, shape)      // hitActive 中の毎ステップ。HitEvent[] を返す（ヒットストップ中は呼ばない）
game.combat.endAttack(atk)
game.combat.onHit((e: HitEvent) => …) // ヒットストップ・被弾リアクション・SE・パーティクルが購読
```

- **形状**（`shapes.ts`）: `capsuleShape`（武器: 半径 0.25m・長さ 1.1m。`WeaponPoseSource` がボーン姿勢を渡す）/ `sectorShape`（水平の扇形。`arcDeg >= 360` が全周、`circleShape`）。突進は原点が動く扇形で、前フレーム → 現在をスイープする。武器カプセルは端点を 0.1m 刻みで補間して判定するのでトンネリングしない。
- **ハートボックス**: `UprightTarget(id, team, maxHp, HeartboxSpec[])`。敵・ボスは複数カプセル可（頭部判定なしなど）。`place(x, y, z, yaw)` で毎ステップ追従させ、`invulnerable`（無敵 F・被弾後無敵）・`staggered`（崩し中 ×1.5）・`guard`（E2-6）を持ち主が更新する。プレイヤーは `game.playerTarget`（`player.invulnerable` を毎ステップ反映）。
- **ダメージ**: `AttackProfile.damage`（整数）。崩し中 ×1.5（四捨五入）、ガード成功は `guardChipDamage`（10%、切り捨て）、ジャストは 0。ガード側が失うスタミナは `HitEvent.guardStaminaCost`（ジャストは 50%）で返し、消費は E2-6 が `stamina.consume` で行う。強靭度削りは `HitEvent.poiseDamage`（ガード時 0）。HP が 0 になった命中は `killed: true`。
- **遮蔽**: `isBlocked`（Rapier のレイキャスト、地形・静的物のみ）で壁越しには当たらない。
- **?debug**: `render/combatDebugView.ts` がハートボックス（プレイヤー緑・敵水色・無敵中は灰紫）とヒットボックス（赤、命中で黄）をワイヤ表示する。`window.__game.dev.swing()` で仮の横斬り（軽攻撃 1 の 12F + 4F）を出せる（実際の攻撃動作は #46）。

## 回復瓶（#48）

仕様は vertical-slice.md の 2.1（瓶の数）・2.3 節（回復）・2.4 節（先行入力 6F）。数値は `PLAYER_ACTIONS.heal` / `healEmpty`、クリップとマーカーは `player.heal`（`Consume` 全体を 54F に合わせる。`healApply` F26・`cancelOpen` F30）/ `player.healEmpty`（前半 14F を 20F に）。

```ts
player.flask             // Flask: count / max / available / use() / refill() / increaseMax() / restore() / onChange()
player.health            // Health（Game は playerTarget の Health を渡す）。回復は health.heal(120)（最大 HP でクランプ）
player.state             // 'heal'（54F）| 'healEmpty'（20F）。kind: 'action'（isActionable は false）
player.events            // healStart（F1・瓶消費）/ healApply { amount }（F26）/ healEmpty
game.events 'heal'       // { amount, hp, position }: HUD の HP ゲージ・光のパーティクル用。SE は 'sound'（sfx.heal-drink / sfx.heal-glow）
game.respawn()           // 瓶を最大数まで補充（篝火・死亡）。礼拝堂のアイテムは flask.increaseMax()
```

- **入力**: `item`（PC は `R`）。先行入力は 6F（`INPUT_BUFFER_FRAMES`。入力層のバッファはアクション別: 攻撃 10F・ロール 8F・回復 6F。`input/config.ts`）。地上と、ロール F26–F32 のキャンセルで開始できる。
- **開始条件**: HP が満タンなら入力だけ消費して何も起きない（瓶は減らない）。残数 1 以上なら回復、0 なら空振り（20F・回復なし・SE なし）。スタミナは不要。
- **消費と加算**: 瓶は F1 で消費、HP 加算は `healApply` マーカー（F26）。F26 より前に仰け反り・転倒で状態を離れると加算は起きず、瓶だけ失われる。
- **キャンセル**: F1–F25 はロール・攻撃・ガードへ不可。F30 からロール（先行入力あり）。攻撃・ガードは F36 から（`PLAYER_ACTIONS.heal.cancels` に窓があり、各チケットが状態グラフに遷移を足して `updateDrinking` で `canCancelTo` を見るだけで繋げられる）。
- **移動**: 回復中・空振り中は入力方向へ 1.0 m/s（`MOVEMENT.heal`）。アニメーションは全身が Consume（足は動かさない）。
- **デバッグ**: `window.__game.dev.damage(n)` で HP を減らせる。`sim.combat.flask` が残数。

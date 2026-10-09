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
  assets/playerAnimator.ts     暫定の速度ブレンド（#32 が置き換える）
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
player.stamina        // Stamina: consume(n) / drain(perSecond, dt) / canStartAction / current
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

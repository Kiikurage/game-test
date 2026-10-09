# 操作割当と入力 API

3 種のデバイス（キーボード/マウス・ゲームパッド・タッチ）は同じ入力状態（`InputSnapshot`）に集約される。
調整値（感度・バッファ時間・デッドゾーン等）は `src/input/config.ts` に集約している。

## アクション一覧

| アクション | キーボード/マウス | ゲームパッド（標準マッピング） | タッチ |
| --- | --- | --- | --- |
| 移動 | W / A / S / D | 左スティック | 左半分: フローティング仮想スティック |
| カメラ | マウス移動（Pointer Lock 中） | 右スティック | 右半分をドラッグ |
| 軽攻撃 | 左クリック | RB | 「弱」ボタン |
| 強攻撃 | 右クリック | RT（アナログ、50% 以上で押下） | 「強」ボタン |
| ガード | Shift（左右どちらも） | LB | 「防御」ボタン |
| 回避（短押し） / ダッシュ（長押し） | Space | B | 「回避」ボタン |
| ロックオン（トグル） | Q または 中クリック | R3（右スティック押し込み） | 「固定」ボタン |
| ターゲット切替 | マウスホイール または ← / → | 十字キー 左 / 右 | 右半分を素早く横にフリック |
| アイテム使用 | R | X | 「道具」ボタン |
| インタラクト | E | A | 「調査」ボタン |

- PC: キャンバスをクリックすると Pointer Lock が始まりカメラを動かせる（このクリックは攻撃にならない）。Esc で解除。
- 回避ボタンはエルデンリング準拠: 0.25 秒（`DODGE_HOLD_SECONDS`、実時間で計測）未満で離すと回避（**離した時点**で確定）、それ以上押し続けるとダッシュ（押している間 `sprint`、離しても回避は出ない）。
- ゲームパッドは `mapping: standard` 相当（軸 4 本・ボタン 12 個以上）の最初のパッドを使う。デッドゾーンはラジアル + スケーリング（移動 0.18 / カメラ 0.12）、カメラスティックは応答カーブ（指数 1.6）で中央付近を繊細にしている。
- タッチ UI は最後に操作したデバイスがタッチのときだけ表示される（`<html data-input-device="touch|kbm|gamepad">`）。起動時は `(pointer: coarse)` の端末ならタッチ。
  `touch-action: none`・コンテキストメニュー/選択/ズーム/スクロールを抑止し、`env(safe-area-inset-*)` を考慮する。マルチタッチ対応（スティック・カメラ・各ボタンが独立）。
  縦持ちでは既存の「横画面にしてください」表示が全面に出る。
- フリックは 260ms 以内・56px 以上・横が縦の 1.8 倍以上（`TOUCH.flick`）。

## ゲームロジックからの使い方（#8 以降向け）

型は `src/core/input.ts`（game 層はここだけを import する）、実装は `src/input/index.ts` の `InputSystem`。
`main.ts` が毎シミュレーションステップ、`Game.update` の直前に `input.step(dt)` を呼ぶ。game には `InputReader` を渡す想定。

```ts
const s = input.snapshot;           // 最新ステップのスナップショット
s.move;                             // {x: 右+, y: 前+}、長さ 0..1（デッドゾーン処理済み）
s.look;                             // 前ステップからのカメラ回転量[rad]。x: 右+, y: 上+。そのまま角度に加算する
s.sprint;                           // 回避ボタン長押し中
s.targetSwitch;                     // -1 | 0 | 1（ターゲット切替要求。1 ステップだけ立つ）
s.buttons.lightAttack.pressed;      // pressed / held / released（押して即離しても pressed は取りこぼさない）
s.buttons.dodge.pressed;            // 回避が確定した（短押しして離した）。held/released は物理ボタン
s.device;                           // 'kbm' | 'gamepad' | 'touch'（UI 表示の出し分け用）

// 先行入力（INPUT_BUFFER_SECONDS = 0.15 秒）。行動可能になったステップで消費する。
if (canAct && input.consumeBuffered('lightAttack')) startLightAttack();
input.hasBuffered('dodge');         // 消費せず確認
input.clearBuffer();                // 行動不能になったら破棄（引数でアクション指定も可）
```

- バッファ対象: 軽攻撃・強攻撃・回避・アイテム・インタラクト（ガード・ロックオンは状態系なので対象外）。
- 回避のバッファは「回避が確定した時点」（離した時点）から数える。
- 複数ステップ/フレームで入力がずれても、`look` はステップ間隔に依存しない回転量なので、毎ステップ加算してよい。
  1 フレームに複数ステップ走る場合、カメラ回転量は最初のステップに全量が入る。
- E2E / デバッグ: `window.__game.input` で `device` / `move` / `sprint` / `held` / `pressCounts` / `lookTotal` / `targetSwitches` を読める。

# ヒットストップ・スローモーション

仕様書 4.1 節の実装（#49）。命中すると、**攻撃側と被弾側のキャラクターだけ**の状態フレーム・アニメーション・移動・
イベントマーカー・窓（キャンセル・無敵）のカウントを凍結する。シミュレーション全体は止めないので、他のキャラクター・
パーティクル・カメラは動き続ける。

## 構成

| 部品 | 役割 |
| --- | --- |
| `decideHitStop`（`combat/hitStop.ts`） | `HitEvent` から凍結フレーム数・撃破スロー・画面振動・閃光を決める純粋関数。数値は `tuning.hitStop` |
| `Freezable`（`freeze(frames)`） | 凍結できるもの。`CharacterFsm` はそのまま満たす（重ね掛けは長い方）。`FreezeCounter` は状態機械を持たない被弾側用の残りカウンタ |
| `TimeScale`（`game/timeScale.ts`） | グローバルのタイムスケール。`game.timeScale.start(scale, frames, delay)` |
| `Game.applyHitStop` | 命中の `onHit` で、攻撃側・被弾側の `Freezable` を同時に凍結し、スロー・画面振動を始め、`hitStop` イベントを発行する |

## フレーム数（`HIT_STOP`、`?debug` の tuning パネル → `hitStop` で変更可）

プレイヤー軽 4F / 強（溜めなし）8F / 強（フル溜め）12F + 画面振動 0.4° / 敵の攻撃がプレイヤーに命中 6F（攻撃側の敵も凍結）+ 赤フラッシュ 4F /
ボスの攻撃がプレイヤーに命中 8F / ガード成功 4F / ジャストガード 8F + 白い閃光 2F / 撃破 12F + スロー（0.3 倍速で 30F、ボス 60F）/ ロール成功は無し。

- 攻撃 ID で軽・強を決める: `light1..3` → 軽、`heavyCharged` → フル溜め、それ以外（`heavy`・走り攻撃・ガードカウンター・背後攻撃・落下攻撃）→ 強（溜めなし）。
- 撃破は `max(通常のフレーム数, 12)`。プレイヤー自身が倒れたときは自動ではスローにしない（死亡演出が `TimeScale` を直接使う）。
- 重ね掛けは長い方（足し算しない）。`tuning.hitStop.enabled = false` で全部オフ（比較用）。

## 使い方

- プレイヤー: `Game` が登録済み。凍結中は `Player.update` が早期 return する（状態フレーム・スタミナ回復・マーカー・窓を含む）。
  攻撃動作（#46）は、凍結中（`player.fsm.isFrozenStep`）は判定の `resolve` を呼ばず、動作のフレームも進めない（仮の攻撃 `DebugSwing` は対応済み）。
- 敵・ボス: 自分の `CharacterFsm`（または `FreezeCounter`）を `game.registerFreezable(id, fsm)` で登録する。毎ステップ先頭で
  `if (fsm.consumeFreeze()) return;`（`FreezeCounter` なら `consume()`）として、そのステップの更新を丸ごと飛ばす。被弾リアクタ（#50）の
  `step()` / `consumeSlide` も凍結中は呼ばない。ボスは `game.bossIds.add(id)`（ボスの攻撃・撃破の長さが変わる）。
- 付随演出: `game.events.on('hitStop', …)`。`frames` / `kind` / `position` / `normal`（飛び散る向き）/ `killed` / `fromPlayer` / `toPlayer` /
  `flash`（`'red'` | `'white'`）/ `flashFrames` / `slowMotion`。パーティクルは `GameView` が購読済み。SE は同じステップの `hit` イベント（0F 遅延）。
- 死亡確定: `HitEvent.killed` は凍結より前（同じ `onHit`）に届くので、死亡処理はヒットストップ中でも始められる。

## スローモーション

シミュレーションは常に 60Hz・フレーム単位で決定的。スローは「実時間の経過に掛けるスケール」で固定ステップの進み方を絞って表現する
（`MainLoop` の `timeScale` オプション）。長さはシミュレーションのステップ数で数えるので、0.3 倍速 30F は実時間では約 100 ステップ分かかるが、
ゲーム内のフレーム数・順序は変わらない。`start(scale, frames, delay)` の `delay` はヒットストップが明けるまでの待ち。重ね掛けは強い方
（小さいスケール・長い残り）にまとまる。ボス撃破（8.4 節）・プレイヤー死亡の演出からも同じ API を使う。

## 確認用フック

- `window.__game.dev.hitStop(frames)` / `dev.slowMotion(scale, frames)`
- `window.__game.sim.combat`: `hitStops`（累計）/ `lastHitStopFrames` / `playerFreeze`（残り）/ `timeScale`

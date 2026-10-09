# 被弾リアクション（強靭度・ノックバック・被弾後無敵）

仕様書 4.3 / 4.4 節の実装（#50）。プレイヤー・雑魚・ボスが共通の `HitReactor`（`src/game/combat/hitReactor.ts`）を使う。

## 部品

| 部品 | 役割 |
| --- | --- |
| `Poise`（`poise.ts`） | 強靭度メーター。`hit(削り, 崩しの硬直)` で `P` を引き、`P ≤ 0`（0 ちょうど含む）で崩し。崩しと同時に `P` は最大値へ戻る。崩し中は削りを受けない。最後の被弾から `step()` 300 回で最大値へ戻る。一時加算 `grant(n)` / `clearBonus()`（敵の攻撃中 +30、スーパーアーマー +40）。`breakEnabled=false` で崩れなくなる（ボスのフェーズ内 1 回制限は E5 が制御） |
| `HitReactor`（`hitReactor.ts`） | `Poise` + 被弾後無敵（18F）+ 押し戻し（`Slide`）+ 敵の加算仰け反り（12F）。`react(HitEvent, awayX, awayZ)` が `HitReaction` を返す |
| `ReactorProfile` | 種別ごとの数値。`PLAYER_REACTOR`（40）/ `HOLLOW_SOLDIER_REACTOR`（50）/ `SHIELDBEARER_REACTOR`（80）/ `BOSS_REACTOR`（400, 崩し 120F） |

## 使い方（敵・ボス向け）

1. `const reactor = new HitReactor(HOLLOW_SOLDIER_REACTOR)` を作り、`game.addReactor(id, reactor, uprightTarget)` で登録する。`Game` が毎ステップ `reactor.step()` し、崩し中の被ダメージ 1.5 倍（`UprightTarget.staggered`）を反映する。
2. 命中すると `Game` が `reactor.react(...)` を呼び、結果を `events.on('hitReaction', …)` で配信する。敵は `HitReaction.kind` を見て自分の状態機械を動かす。
   - `stagger`: 強靭度崩し。行動不能 `frames`（亡者兵・盾持ち 54F / ボス 120F）。
   - `flinch`: 崩れない被弾。`blocksAction=false` なので加算アニメーション（12F）だけ重ね、行動は継続。進み具合は `reactor.flinchProgress`。
   - `none`: 崩し中の追撃・死亡。
3. 押し戻しは敵自身が `reactor.consumeSlide(out)` で受け取った水平変位（m）を移動に足す（`Game` はダミーの分だけ捨てる）。
4. 敵の攻撃の発生〜持続中は `reactor.poise.grant(POISE.enemyAttackingBonus)`、終了時に `clearBonus()`。
5. ヒットストップ中（#49）は強靭度の回復・崩しの残り・被弾後無敵・押し戻しも止まる。`game.addReactor` した `HitReactor` は `Freezable` として自動登録され、`Game` がそのステップの `step()` を飛ばす（敵が自分で `step` / `consumeSlide` を呼ぶ場合は、凍結中の更新を丸ごと飛ばすこと。`docs/hit-stop.md`）。

## プレイヤー

- `Player.receiveHit(event, awayX, awayZ)`（`Game` が命中直後に呼ぶ）が `HitReactor` の結果を状態へ反映する。
  - 未ガード被弾（軽）: `flinch` 24F（`Hit_Chest`）、0.5m 後退。重（強靭度削り ≥ 50）: `knockdown` 48F（`Hit_Knockback`）、1.5m 後退。
  - 仰け反り・転倒中は行動不能（`kind: 'stagger'`）。回復・溜めは失われる（`hitReaction.interruptsAction` を E2-7 が購読する）。
  - スーパーアーマー（`poise.grant(40)`）中は、崩れない限り仰け反らない（ダメージとガード外の押し戻しなし）。
  - 被弾後無敵: 未ガード被弾の次のステップから 18F。ガード成功では付かない。
  - 転倒の起き上がり無敵: `knockdown` の F1〜F36。F37〜F48 は被弾できる（転倒を中断はしない）。
- ガード成功（E2-6 が `HitTarget.guard` で `'guard'` を返す）の押し戻しは軽 0.6m / 重 1.2m（`guardPush`）。ジャストガードは反応なし。
- プレイヤーの `UprightTarget.staggered` は常に false（崩し中 1.5 倍は敵の弱点追撃の仕様。4.2 節）。

## 調整値（`?debug` の tuning パネル → `reaction`）

仕様書の距離をそのまま保ち、何ステップで滑らせるか（押し戻しの手触り）だけ調整できる: `lightSlideFrames`(8) / `heavySlideFrames`(14) / `guardSlideFrames`(8)。

# ボスの技 4・5（盾打ち → 斬り下ろし・跳躍叩きつけ）

Issue #76（E5-4）の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 6.3 / 6.6 / 3.3 節。基盤は [boss-ai.md](boss-ai.md)、技 1〜3 は [boss-moves-basic.md](boss-moves-basic.md)。

## 構成

```
src/game/boss/moves/shieldBash.move.ts  技 4 盾打ち → 斬り下ろし（P1 のみ）
src/game/boss/moves/leap.move.ts        技 5 跳躍叩きつけ。leapStateOf(boss) が描画向けの状態（着地点・滞空・高さ）
src/game/boss/bossImpact.system.ts      叩きつけの画面振動（slamAt）・`bossSlam` イベント・SE（`sfx.boss.slam` / `sfx.boss.shield-bash`）
src/render/boss/bossLeap.view.ts        着地予告の円（E5-0 GroundTelegraphs）・影の円・着地のパーティクル
src/game/anim/data/bossClips.json       マーカー表（boss.shieldBash.1/2.p1、boss.leap.1.p1/p2）
```

共有コードへの最小の追加: `AttackProfile.knockback` / `HitEvent.knockback`（未ガード・重い被弾のプレイヤーの後退距離の上書き。`BossStageDef.knockback` から渡る）、
`BossMoveHooks.impactCircle`（`shape` を持つ技が柱への接触を円で出す）、`GameEventMap.bossSlam`、`boss.view.ts` の滞空の高さ・技のアニメーション再生（マーカー表に動作 ID がある技だけ）。

## 技 4 盾打ち → 斬り下ろし

数値は仕様書の表どおり。仕様にない点の判断:

- 盾打ちの射程 3.0m（接近の停止距離 2.6m から届く値）。テレグラフは盾打ち `normal`・追撃 `heavy`。
- 3m 吹き飛ばしは `knockback: 3`（重い被弾の転倒 1.5m の既定を上書き）。
- 追撃は 36F の予備動作の頭（F1〜F18）に、相手との距離が 3.2m になるまで**向きの方向へ**踏み込む（最大 3.0m）。転倒して 3m 離れた相手にも届かせるため。
  向きは F12 まで・0.5 倍でしか追わないので、側面へ避けた相手には当たらない。後ろへのバックステップは踏み込みで追撃が届く（罰される）。
- 側面ロールの入力窓（dodgeSim）: 左右とも F1〜F24（F25 以降は盾打ちが当たる）。

## 技 5 跳躍叩きつけ

- 発生 72 = 跳び上がり 42 + 滞空 30（滞空 F = 段 F − 42）。着地の判定 F73〜F78。P2 は硬直 46・ダメージ 130。
- 着地点は滞空 F20（段 F62）まで対象に追従し、以降は固定（仕様書の「跳び上がり開始時に固定」と「追尾は滞空 F20 まで」が食い違うので、完了条件の F20 を採った）。
  跳べる距離は 18m まで（それ以上は届く範囲に切り詰める）。ボスは着地点へ水平に等速で飛び、F72 で着地点に着く。放物線の高さは見た目だけ（最高 5m）。
- 予告の円は発生 F18 から（`leapTelegraphVisible`）。滞空に入ると影の円（progress 0 → 1）を重ねる。着地で消える。
- 判定は着地点中心・半径 3.5m の全周。ハートボックス（半径 0.35m）に触れたら当たるので、中心距離 3.85m まで。
- 回避（dodgeSim）: ロールの入力 F64〜F70（滞空 F22〜F28）で回避できる。F63 以前・F71 以降は当たる。ロールの移動 3.2m は円を出られないので、無敵だけで避ける。
  バックステップは F71〜F73 の入力で避けられる（無敵 F1〜F8 が着地を覆う）。
- 着地: `slamAt`（1.2°・24F、距離で減衰）、`bossSlam`（パーティクル）、SE。円に触れた柱は `bossPillarHit`（#78 のイベント。破片は購読側）。
- 「近距離で後退された時」に跳ぶ条件: `PlayerTracker.retreated`（直近 60F に近距離 3.5m 未満にいて、そこから 1.5m 以上離れた）のとき、技選択で跳躍の重みを 40 以上にする（`BOSS_CORRECTION.retreatLeapWeight`。重み表が 0 の近距離でも選べる。遠距離帯は表のまま）。値は仮置き。

## テスト

`moves/bossMoves45.test.ts`: フレームデータ（P1/P2）、着地点の固定（F62 / F63）、予告開始（F17 / F18）、円の判定境界、柱、dodgeSim の入力窓、
盾打ち後の追撃が側面ロールで空振り、Game 結合（3m 吹き飛ばし → 追撃、カメラ振動・イベント）。

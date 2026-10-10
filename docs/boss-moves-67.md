# ボスの技 6・7（回転斬り・灰の波、フェーズ 2 のみ）

Issue #77（E5-5）の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 6.3 / 6.4 節。基盤は [boss-ai.md](boss-ai.md)、技 1〜5 は [boss-moves-basic.md](boss-moves-basic.md) / [boss-moves-45.md](boss-moves-45.md)。

## 構成

```
src/game/boss/moves/spin.move.ts      技 6 回転斬り。spinStateOf(boss) = 描画向けの状態（回転角・判定中・回転数）
src/game/boss/moves/ashWave.move.ts   技 7 灰の波。ashWaveStateOf(boss)、ashShape（F ごとの線分カプセル）
src/game/boss/bossMoves67.system.ts   演出の発火（画面振動・bossSlam・SE）
src/render/boss/bossSpin.view.ts      斧の軌跡（TSL の平たい輪）・火花
src/render/boss/bossAshWave.view.ts   予告線 3 本・灰の棘（InstancedMesh 1 ドローコール）・灰
src/game/anim/data/bossClips.json     マーカー表（boss.spin.1/2.p2、boss.ashWave.1.p2）
```

共有コードへの最小の追加: `BossStageDef.chained`（直前の段から途切れず続く段。連続攻撃の発生下限 16F を免除）、
`BossMoveHooks.discontinuous`（判定形状が前フレームから飛ぶ F。`Boss` がスイープせず `prime` し直す）、`boss.view.ts` のヨーへの回転角の加算（1 行）。

## 技 6 回転斬り

- 2 回転 = 2 段（2 段目 `followUp` + `chained`）。1 段目: 発生 36・持続 10・硬直 0、2 段目: 発生 12・持続 10・硬直 60。
  1 回転目の判定の終わり（通し F46）から 2 回転目の判定の始まり（F59）の前までがちょうど 12F の隙。
- 判定は全周円（半径 4.8m、高さ −0.3〜2.5m）。スーパーアーマーは各段の予備動作〜持続。
- 回避（dodgeSim、2.5m・後ろへロール）: 入力 F32〜F34（無敵が 1 回転目 F37〜F46 を覆い、隙の間に円の外へ出る）。F35 以降は 1 回転目が当たる。
  入力 F1〜F20 は円の外へ先に出られる。ガードなどで 1 回目を受けても、入力 F55〜F56 のロールで 2 回転目だけ躱せる。前（ボス方向）へのロールは円の中に残るので当たる。
- 仕様書の「1 回転目の終了直前にロール」は、無敵 12F が持続 10F を覆う窓（F32〜F34）として実装した。1 回の攻撃は 1 度しか当たらないため、F35 以降の入力は 1 回目で当たる。
- 見た目: ボスのモデルを `spinStateOf(boss).angle`（予備動作は逆向きに捻り、持続で 1 回転）で回す。斧の軌跡は輪の TSL、判定中は 2F ごとに火花。

## 技 7 灰の波

- 発生 50・持続 36（F51〜F86）・硬直 54。棘は 1 m/F（12m / 0.2s）で走り、3 本（0° / +25° / −25°）が F51 / F63 / F75 から。
- 判定は線分上の時間差判定: F ごとに「先端の前フレームの位置 → 現在の位置」の 1m を芯にした半径 0.75m のカプセル。本が変わる F はスイープしない。命中は 1 回まで。
- 隙間: 縁と縁の間は距離 5.8m で約 1.0m。ハートボックス（半径 0.35m）が通れるのは距離 約 5.1m 以降。真横へ走れば線の外。向きの追尾は F38 まで（正面に居続けると 3 本の中央が当たる）。
- 回避（dodgeSim）: 正面 7m で前（ボス方向）ロールは入力 F44〜F53 付近で 1 本を無敵で通過できる。2.5m からの左右ロールは入力 F33〜F49 で線の外へ出る。
- 予告: 発生 F18 から地面予告線 3 本。各本は走り終えたら消える。
- 演出: 斧が地面へ入る F51 に画面振動（`slamAt`）・`bossSlam`・SE。各本の開始に SE（`sfx.boss.ash-wave`）。棘は先端が通ると 3F で突き出し、保持 12F・沈み 14F。
  4m ごとに灰（`deathAsh`）と火花。

## テスト

`moves/bossMoves67.test.ts`: フレームデータ、回転間の隙 12F、棘の伝播（12m / 12F）・3 本の間隔 12F・判定の線分、隙間の境界（距離 5.8m / 5.1m / 4.4m）、真横、
無敵での通過、dodgeSim の入力窓、マーカー表。

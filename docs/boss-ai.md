# ボス AI 基盤（技の選択・ビート・技フレームワーク）

Issue #63（E5-2）の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 6.2 / 6.3 / 6.4 節。
個々の技は E5-3〜E5-5、フェーズ移行・入場・撃破の演出は E5-6、戦闘ルール（崩し・フェーズ・イベント・壁際）は E5-7（#78。下の「ボス戦ルール」）、モデルは E5-1（#57）。

## 構成

```
src/game/boss/bossData.ts       数値（ステータス・距離帯・ビート・補正・重み表 BOSS_WEIGHTS・ボス戦ルール BOSS_BATTLE / BOSS_WALL）と技 ID
src/game/boss/bossBattle.ts     壁際・柱の幾何（pinnedAgainstWall / sectorTouchesCircle。純粋関数）
src/game/boss/bossMove.ts       技の定義（BossMoveDef / BossStageDef）・検証 checkBossMove・レジストリ BOSS_MOVES
src/game/boss/bossPlanner.ts    距離帯・重みの計算 computeWeights・選択 chooseBossMove・プレイヤー状態の追跡 PlayerTracker
src/game/boss/boss.ts           Boss 本体（ビート → 選択 → 接近 → 技の実行）。LockOnTarget
src/game/boss/boss.system.ts    ゲームシステム（被弾側・強靭度・ヒットストップ・ロックオンへの登録、毎ステップの更新）
src/game/boss/boss.dev.ts       dev フック（bossSpawn / bossDebug / bossPhase / bossRemove）と `?boss`
src/game/boss/stubMoves.ts      スタブ技（ダメージ 0 の仮技。未登録の技だけを埋める）
src/game/boss/moves/*.move.ts   技ごとのモジュール（自動で読み込まれる）
src/render/boss/boss.view.ts    仮の見た目（カプセル + 正面の箱）と `?debug` の表示
```

E3-1c（[enemy-attack.md](enemy-attack.md)）の枠組みの上に載せている。攻撃 1 段は `EnemyAttackDef`（発生・持続・硬直・判定・
`trackEndFrame` / `trackDegPerSecond` / `poiseBonus`）、判定は `HitResolver`（`startAttack` / `prime` / `resolve` / `endAttack`）、
検証は `checkEnemyAttack`、選択は `pickWeighted`。`AttackRunner` は `Enemy` の状態機械と知覚に密結合なので、ボスは `Boss` 自身が同じ
手順（予備動作の前半だけ追尾 → 発生の最終フレームで `prime` → 持続の間 `resolve` → 硬直）を実行する。

## AI の流れ

`dormant`（`engage()` まで）→ `beat` → 選択 → [`approach`] → `attack`（段ごと）→ `beat` …。崩し `stagger(frames)` は技を打ち切り、`staggered` →
`beat`。選べる技がなければ `reposition`（30F 対象へ歩み寄る）→ `beat`。

- **ビート**: 技の最後の硬直が終わったら必ず 30〜60F（P2 は 20〜40F）。この間は対象へ向き直るだけ。
- **距離帯**: 近 < 3.5m / 中 3.5〜8m / 遠 > 8m（ちょうど 3.5m・8m は中）。ボスと対象の足元の水平距離。
- **重み**（`computeWeights`）: 重み表（フェーズ × 距離帯、未登録の技・フェーズ外・表が 0 の技は除外）→ 直前と同じ技は ×0.5・同じ技が 2 回続いたら 3 回目は除外
  → 背後に 90F 以上いれば薙ぎ払い（P2 は回転斬りも）×2 → ロール 3 連続かつ近距離なら三連撃の確率を +20 ポイント。
  内訳（`base` / `repeatFactor` / `behindFactor` / `weight` / `probability` / `excluded`）は `Boss.debugInfo.weights` に残る。
- **回復中の補正**: 回復動作中かつ近距離のあいだ、予備動作の追尾（旋回）速度を ×1.2。
- **ロール連打の補正で三連撃が選ばれたとき**は、1 段目の発生が 30F 未満なら 30F に延ばす。補正は「次の近距離技」で使い切る。
- **背後 / ロール連打の追跡**（`PlayerTracker`）は本実装の解釈: 背後 = ボスの真後ろから ±60°（距離は問わない）。ロール連打 = 前のロールが終わってから 60F 以内に
  次のロールを始めることを 3 回。
- **中断しない**: 通常攻撃では技は止まらない。止まるのは `Poise` が崩れたとき（`boss.system.ts` の `onHit` が `reaction.kind === 'stagger'` で `stagger`）と撃破のみ。
  崩しの「フェーズに 1 回」の制約・フェーズ移行は次節。

## 技の追加（E5-3〜E5-5 向け）

1. `src/game/boss/moves/<名前>.move.ts` を作り、`registerBossMove` を呼ぶ（`moves/*.move.ts` は自動で読み込まれる。他のファイルは編集しない）。
2. 技 ID は `BOSS_MOVE_IDS`（`overhead` / `sweep` / `combo3` / `shieldBash` / `leap` / `spin` / `ashWave`）。重み表は `bossData.ts` に入っているので、技を登録するだけで選ばれるようになる
   （登録するとその技のスタブは使われない）。

```ts
registerBossMove({
  id: 'overhead',
  name: '大上段斬り',
  phases: [1, 2],
  stages: [
    {
      id: 'overhead.1', startup: 48, active: 8, recovery: 52,
      damage: 110, poiseDamage: 70, guardStaminaCost: 60,
      moveDistance: 0, arcDeg: 60, range: 4.5, heavy: true,
      trackEndFrame: 30,            // 追尾終了フレーム（以降は向き固定）
      trackRate: 1,                 // 追尾率（旋回速度の倍率。基準は P1 90°/s・P2 120°/s、または trackDegPerSecond）
      superArmor: { start: 1, end: 56 }, // スーパーアーマー区間（段の F）
    },
  ],
  phase2Stages: [/* P2 で数値が変わる技。省略すると stages と同じ */],
  approach: { speed: 'walk', stopRange: 3 }, // 予備動作の前の接近。省略するとその場から予備動作
  hooks: { onStart, onStageStart, onStep, shape, onEnd }, // 跳躍・突進・灰の波などの特殊動作・判定形状
});
```

- 複数段は `stages` に並べる（2 段目以降は `followUp: true`）。`recovery` が次の段との間（三連撃の各段間 8F）・最終段が技の最終硬直。
- 判定は既定で前方の扇形（`arcDeg` / `range`）。円（跳躍の着地）などは `hooks.shape` で `HitShape` を返す。毎ステップの動き（跳躍・突進）は `hooks.onStep`（`ctx.boss.moveBy` / `turnToward`、`ctx.stageIndex` / `ctx.frame`）。
- 地面の予告（円・線）は `hooks` の中で `render/telegraph` へつなぐ（描画側のイベント経由。game から render を import しない）。
- 検証: `checkBossMove(def)` を技ごとにテストする（`checkEnemyAttack` を各段に当てる + 2 段目以降の `followUp`・スーパーアーマー区間・追尾終了）。
  追尾終了はボス用に「判定の 12F 前まで」（`BOSS_MIN_LOCKED_FRAMES`。雑魚の「発生の 60%」はボスの技表と合わない）。
  連続攻撃（`followUp`）の発生の下限はボス用に 16F（`BOSS_MIN_FOLLOW_UP_STARTUP`。雑魚の 20F は仕様の三連撃 P2 の 2 段目 16F と合わないため、E5-3 で仕様を優先して調整した）。

## ボス戦ルール（E5-7 / #78）

仕様は vertical-slice.md の 6.2 / 6.5 / 6.6 / 9.1 節。実装は `Boss`（状態・ルール）と `BossSystem`（被弾側・イベント・リセットの配線）。

### 崩し（強靭度 400）

- 崩しは**フェーズごとに 1 回**。崩れたら（`Boss.stagger(120)`）`Poise.damageDisabled = true` にして、そのフェーズの残りは強靭度ダメージを無効にする
  （`hit` は `ignored`。仰け反りも出ない）。2 回目の `stagger` は何もしない。フェーズが変わる（`setPhase`）・`reset()` で解除され、強靭度は最大へ戻る。
- 崩し中は 120F 行動不能で、被ダメージ 1.5 倍（既存の `UprightTarget.staggered` → `STAGGERED_DAMAGE_MULTIPLIER`。強攻撃 92 → 138）。
- `Boss.canBreak` / `debugInfo.breakUsed` で状態を読める。

### フェーズ移行（HP 2400 → 1200 以下）

1. HP が `BOSS_BATTLE.phase2Hp`（1200）以下になると移行を**予約**する（`debugInfo.transitionPending`）。技の最中でも、その技は最後まで出す。
   複数段の技は**いまの段が終わったところで打ち切る**（2 発目以降の追撃は出さない）。崩し中なら崩しが明けるまで待つ。ビート・接近・歩み寄り・1 歩下がりの間ならすぐ始める。
2. 移行が始まると `bossPhaseBoundary` を発行し、`transition` 状態になる。**120F（`BOSS_BATTLE.transitionFrames`）の間は無敵（`UprightTarget.invulnerable`）で行動しない**。
   咆哮・盾投げ・BGM 切替・バーの発光などの**演出は購読側（E5-6 / #84）**。ボスは演出の完了を待たず、固定の 120F で進む（6.5 節の F120）。
3. 120F 後に `setPhase(2)`（強靭度を戻し、崩しを 1 回使えるようにする）→ ビート → 最初の 1 回だけ距離に関わらず遠距離帯の重み（P2 は跳躍・灰の波のみ）で技を選ぶ。
   該当する技が未登録なら通常の選択。
- 撃破（HP 0）で直接倒した場合は移行しない。

### イベント API（HP バー E6-3a / #88・フェーズ演出 E5-6 / #84 向け）

`game.events`（`GameEventMap`）に型付きで発行する。ペイロードの型は `src/core/gameEvents.ts` の `BossBattleEvents`。UI・描画は `game` を import せずに購読できる（`events.on('bossHpChanged', ...)`）。

| イベント | いつ | ペイロード |
| --- | --- | --- |
| `bossEngaged` | 交戦開始（`Boss.engage()`。リセット後の再交戦でも毎回） | `{ id, hp, maxHp, phase, boundaries }`（`boundaries` = フェーズ境界の HP `[1200]`。バーの目盛り位置） |
| `bossHpChanged` | HP が変わった（被弾のたび） | `{ id, hp, maxHp, damage, phase }`（`damage` = 減少量。白い残像の長さに使う） |
| `bossPhaseBoundary` | フェーズ移行が始まった（技が終わった瞬間） | `{ id, from, to, hp, transitionFrames }` |
| `bossDefeated` | 撃破（`bossHpChanged` の後） | `{ id, position }` |
| `bossReset` | 交戦中のボスが戻る / 取り除かれた（バーを消す） | `{ id, cause: 'death' \| 'rest' \| 'removed', hp, maxHp }` |
| `bossPillarHit` | 技の判定が柱に触れた（破片の演出のフック） | `{ id, pillar, position, moveId }` |

- 発行元は `Boss`（`BossDeps.events` に `game.events` を渡す。`BossSystem.spawn` が渡す）。`Boss.setHp(hp)` が HP の写しと `bossHpChanged` を担う。
- 状態のポーリングが必要な UI は `bossSystemOf(game).boss?.debugInfo`（`hp` / `phase` / `state` / `breakUsed`）を読める。

### リセット

- `Boss.reset(cause)`: HP 満タン・フェーズ 1・待機位置と向きへ戻り、`dormant`（`engage()` まで動かない）。強靭度・崩し・履歴・プレイヤー追跡も初期化。交戦中だった場合のみ `bossReset` を発行する。
- `BossSystem.reset(cause)` が被弾側（HP・強靭度・無敵・崩し）も戻す。`BossSystem` は **`death` イベント（`phase: 'start'`、死亡演出の開始）** と **`rest` イベント**（篝火の休憩・リスポーン）を購読して自動で呼ぶ
  （死亡演出中にボスがプレイヤーを攻撃し続けない / 回復して見えるのは演出の裏）。**撃破済み（`dead`）のボスは戻さない**。
- E5-8a は再入場で `boss.engage()` を呼べばよい。ボスの撃破済みセーブの記録は E5-8a 側。
- `BossSystem.remove()` は `Boss.dispose()`（撃破イベントなし）。交戦中だったら `bossReset { cause: 'removed' }`。

### 壁際の位置取り（6.6 節）

`BossDeps.arena`（円）があるとき、**近距離帯（3.5m 未満）の技を選んだ直後**に、プレイヤーが壁に追い詰められていれば `stepBack` 状態で 2.0m・18F 後ろへ下がってから技を始める
（`BOSS_WALL`、接近は飛ばす）。追い詰められている = プレイヤーが壁から 2.0m 以内で、かつボスがプレイヤーより中央側にいる（`pinnedAgainstWall`）。
下がる向きは対象から離れる向き（アリーナの縁でクランプ）。技の発生・追尾の数値は変えない。

### 柱（6.6 節）

攻撃判定は地形で遮られない（`HitResolver` は壁・柱の遮蔽を見ない）ので、柱を挟んでも当たる。`BossDeps.pillars`（円の配列）があるとき、扇形の判定が始まる F に柱へ触れていれば
`bossPillarHit` を発行する（破片は E4-2c の演出がこれを購読する）。`hooks.shape` を持つ技（円・線）は対象外。アリーナ・柱の実座標を渡すのは E5-6 のアリーナ生成。

## 確認用

- `?scene=test&boss`（`?debug` 併用で距離帯の円と状態・距離帯・直前の技・選択重みの表示）。プレイヤーの北 7m にボスが出て、スタブ技を繰り返す。
- `window.__game.dev.bossSpawn({ x, z, yaw, seed, engage })` / `bossDebug()`（状態・重み・履歴）/ `bossPhase(1 | 2)` / `bossRemove()`。
- テスト: `bossPlanner.test.ts`（距離帯・重み表・連続制限・補正・シード固定の収束）、`bossMove.test.ts`（技定義の検証）、`boss.test.ts`（ビート長・
  スタブ技での重み分布の収束・接近・複数段・スーパーアーマー・追尾）、`bossGame.test.ts`（Game 結合: 被弾側の登録・通常攻撃で中断しない・崩しで中断）、
  `bossRules.test.ts`（フェーズ移行・崩し 1 回・イベント・リセット・壁際・柱）、`bossRulesGame.test.ts`（Game 結合: 120F・1.5 倍・移行中の無敵・イベント・死亡 / 休憩でのリセット）、`bossBattle.test.ts`（幾何）。

## 未対応

- 技 4〜7（盾打ち・跳躍・回転斬り・灰の波）、モデル（#57）、入場演出・開始前無敵（E5-6）、フェーズ移行・撃破の**演出**（E5-6）、アリーナ（円形・柱）の生成と `arena` / `pillars` の受け渡し（E5-6）。
- 移行直後の「遠距離帯の技で再開」は、距離帯の重みを 'far' に固定するだけ（ボスを遠くへ動かさない）。跳躍・灰の波の実装後に見直す。
- 描画の補間（view プラグインは `alpha` を受け取らないので、仮の見た目は最新のステップ位置を描く）。

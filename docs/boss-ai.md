# ボス AI 基盤（技の選択・ビート・技フレームワーク）

Issue #63（E5-2）の実装メモ。仕様の正は [vertical-slice.md](vertical-slice.md) の 6.2 / 6.3 / 6.4 節。
個々の技は E5-3〜E5-5、フェーズ移行・入場・撃破演出は E5-6 / E5-7、モデルは E5-1（#57）。

## 構成

```
src/game/boss/bossData.ts       数値（ステータス・距離帯・ビート・補正・重み表 BOSS_WEIGHTS）と技 ID
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
  崩しの「フェーズに 1 回」の制約・フェーズ移行は E5-7（`Boss.setPhase(phase)` と `Poise.breakEnabled` を使う）。

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
  注意: 仕様の三連撃 P2 の 2 段目は発生 16F で、`ENEMY_ATTACK_RULES.minFollowUpStartup`（20F）を下回る。E5-3 で仕様か基準のどちらかを調整すること。

## 確認用

- `?scene=test&boss`（`?debug` 併用で距離帯の円と状態・距離帯・直前の技・選択重みの表示）。プレイヤーの北 7m にボスが出て、スタブ技を繰り返す。
- `window.__game.dev.bossSpawn({ x, z, yaw, seed, engage })` / `bossDebug()`（状態・重み・履歴）/ `bossPhase(1 | 2)` / `bossRemove()`。
- テスト: `bossPlanner.test.ts`（距離帯・重み表・連続制限・補正・シード固定の収束）、`bossMove.test.ts`（技定義の検証）、`boss.test.ts`（ビート長・
  スタブ技での重み分布の収束・接近・複数段・スーパーアーマー・追尾）、`bossGame.test.ts`（Game 結合: 被弾側の登録・通常攻撃で中断しない・崩しで中断）。

## 未対応

- 技の本体（E5-3〜E5-5）、モデル（#57）、入場演出・開始前無敵（E5-6）、フェーズ移行・崩しのフェーズ制約・撃破（E5-7）、アリーナ（円形・柱）との衝突。
- 壁際で近距離技の前に 1 歩下がる位置取り（6.6 節）。`hooks.onStart` / `approach` で技ごとに足せる。
- 描画の補間（view プラグインは `alpha` を受け取らないので、仮の見た目は最新のステップ位置を描く）。

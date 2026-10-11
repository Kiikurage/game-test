# オーケストレーター台帳（毎ターン先頭で確認・更新する）
確認手順: scratchpad/agents.sh <id...> で生存確認（interrupted=1 or age>1800s → 再開）。open PR と status:in-progress の Issue を突き合わせる。

## 稼働中（Issue / agentId / worktree）
- #281 撃破が分かる演出（オーナー待ち・最優先） ad9590c584e520578
- #266 空中の破片 aa492817ea37e64ba
- #268 heroshots a778367005d9110f1
- #270 水路の水 a03c51d58079421db
- #255 フィールド BGM ac3acc9bd5326cafa agent-a4d6764b3faa7ba8f
- #262 CPU フレーム時間 aa8c4837fb9f6d00b agent-a9a8d3e870ddb5f8c

## 再開待ち
（なし）

## 未着手キュー（順番）
0a. #282 崖のモザイク・急斜面の陰影（起票済み、次に割り振る）
0. e2e/sidePath.spec.ts:91 の flaky（霊廟の石段の歩行ループ、CI 負荷で経由点手前で時間切れ）チケット化
1. #273 dbg デーモン  2. #274 CI 短縮  3. #275 入力記録・再生
4. #269 段階1 子チケット起票（pipeline+TAAU / CSM 静的キャッシュ / GTAO / froxel fog+godrays / bloom・AgX・LUT（#258 後）/ uber material+KTX2 / baked GI / GPU scatter / clustered lights）
5. PR プレビュー配信チケット（オーナーに Pages 設定変更依頼）  6. ゲーム内デバッグメニューのチケット
7. 段階2 黄金エリア（篝火〜墓地）

## オーナー依頼待ち
- #279 マージ済み: 撃破の手応え → オーナー「サクサクになった」確認済み
- ?bench（#276 マージ済み）: 実機で開き結果を貼ってもらう ← 依頼済み
- #258 マージ後: 実機でディゾルブの重さ確認

## 凍結（tech-direction §8: 段階0〜2はゲームプレイ新機能凍結）
- status:ready のまま: #168 #118 #117 #114 #112、その他 blocked 多数（M3〜M5）

## 完了（このセッション）
- #267(#280) #277(#279) #258(#278) #261(#276) #256(#263) #93(#259) #264(#265) #271(#272) YOU DIED・SE 音量: オーナー確認済み

## オーナー方針・実測（2026-10-11）
- 当面は PC のみ最適化（モバイルは後回し）。
- PC bench（Mac Chrome / Apple metal-3 / 1920x929 / high）: 全区間 frame 8.3ms・p99 ≈ 9.8ms（120fps 張り付き）、cpu 2ms。Apple の gpu timestamp は重なりで非加算（相対のみ）。相対ではブルーム最大、次いで材質・影・パーティクル。
- 撃破時の重さは定常では出ない → 初回だけのカクつき（パイプライン生成など）の疑い。#258 に転送済み。→ 判明: 毎回・トドメのモーションから遅い = 仕様の撃破スロー（12F 停止 + 約 1.7 秒の 0.3 倍速）。#277 で廃止。#258 はクランプだけで小さく閉じる。

## 運用ルール追加（15:40 ボトルネック調査）
- 原因: 4コアに6エージェント、SwiftShader 撮影/E2E が同時3本。#270(撮影55回)・#266 が2時間超。
- 同時エージェント上限 4。新規投入は空き次第。1チケット 90 分でタイムボックス→到達点で PR。
- #273 dbg daemon（ビルド・ブラウザ起動の使い回し）と #274 CI 高速化をキュー先頭へ繰り上げ。
- 15:45 #284(#266 飛ぶ破片=草揺れがワールド高さ比例) マージ。後続候補: ?nograss が地面の草に効かない。稼働5本→上限4のため新規投入なし。
- 15:50 #283(#255 フィールドBGM) マージ。オーナー聴感確認待ち。稼働4本(281/268/270/262)=上限。
- 15:55 オーナー: #256 ロックオン横移動の回転『まだ発生』→ #256 再オープン、impl-256b (a158a4c988aaa88a8) 投入。稼働5本（一時超過、#268 は早期まとめ指示）。音量バランス OK 確認済み。
- 16:00 #285(#268 heroshots) マージ。flaky 候補追加: levelWalk（負荷でタイムアウト）+ sidePath:91 → まとめて flaky チケットに。稼働4本(281/270/262/256b)=上限。
- 16:05 #286(#262 CPU -28%、npm run profile) マージ。impl-273 (a57cd136f55b40053) 投入。稼働4本(281/270/256b/273)。
- 実測(SwiftShader, load14/4core): high 1280x720 読込96s・5.3s/frame、low scale0.25 読込47s・0.76s/frame。
- 16:10 #287(#281 撃破演出) 静止画OK(F0閃光/F10ひび/F40崩落)。CI待ち→green でマージ（PR購読済み）。稼働3本(270/256b/273)。
- 16:15 #289 Mac セルフホストランナー（実GPU検証）起票。オーナー了承待ち → 了承後に impl-289 投入（#273 より効果大の可能性）。
- 16:18 オーナー了承 → impl-289 (ac49f774122f0139f) 投入。稼働4本(270/256b/273/289)。
- 16:20 #287(#281 撃破演出) マージ。オーナー実プレイ確認待ち。
- 16:25 #256b agent done -> PR #291 (cause: three PropertyMixer skips writing unchanged poses, so applyTwist piles up each frame; fix: restoreTwist before mixer update; real-frame E2E). CI e2e running, subscribed. #290 e2e running, subscribed. Running: #270 (PR #288), #273.
- 16:27 OWNER STOP: Mac runner (#290) rejected as too dangerous. Do not merge. Unsubscribed. Removed Mac section from worker-guide.
- 16:27 Closed PR #290 (unmerged) and #289 (not_planned) per owner.
- 16:28 OWNER: no local E2E; CI only. worker-guide updated, #270/#273 agents told.
- 16:29 OWNER: agents must not block on CI; report 'waiting' and end. I subscribe to their PRs and resume them on red. Waiting agents don't count toward 4-cap.
- 16:29 OWNER: switching to local dev. Told #270/#273 agents to push WIP and stop. #292 paused (nothing committed). No new dispatches.
- 16:30 Agents #270/#273 were already stopped by owner. Pushed #273 WIP fbbfa76 to chore/273-dbg-daemon. #270 fully pushed (1006273, PR #288). #256 PR #291 pushed. Nothing else unpushed.
- 16:33 OWNER: no local heavy runs at all (shots/builds too). Merge #291/#288 on CI green only; nothing local.
- 16:34 OWNER: retract CI-only E2E policy (owner develops locally on Mac). worker-guide E2E lines reverted; #292 closed.
- 16:35 MERGED #291 (60fe321) -> #256. Remaining: #288 CI.
- 16:37 MERGED #288 (6f2a7be) -> #270. Follow-up issue created for waterway reflection/lighting. All PR'd work merged; agents stopped. Owner moves to local Mac dev.

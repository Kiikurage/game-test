# アセット調達・制作方法の調査（Issue #5）

調査日: 2026-10-09 / 調査環境: エージェントのクラウドコンテナ（プロキシ経由の制限付きネットワーク）

結論を先に書く。

- **プレイヤー・雑魚敵・武器盾・環境・アニメーションの大部分は、KayKit（Kay Lousberg）の公式 GitHub リポジトリ（CC0）だけで揃う。** 作業環境から `git clone` で実際に取得でき、内容も検査済み。
- KayKit キャラクターには**ソウルライクに必要なアニメーション（待機/歩き/走り/攻撃複数/ガード/被弾/死亡）が最初から 76〜95 クリップ埋め込まれている**。欠けているのは「ローリング」だけで、Quaternius の Universal Animation Library（UAL）の `Roll` を流用するか、手続き的に作る。
- 大型ボスは KayKit のスケルトンを拡大して作るのが最短。専用の大型モデルが欲しければ Quaternius Ultimate Monsters（CC0）を、オーナーが手元でダウンロードして使う（このコンテナからは quaternius.com に届かない）。
- Blender CLI は `apt` で導入でき、ヘッドレスで glTF 書き出しまで動作確認できた。

## 1. ソース別のアクセス可否

実際に `curl` / `git clone` で確認した結果。

| ソース | 到達性 | 備考 |
| --- | --- | --- |
| GitHub（`git clone` / smart HTTP） | **可** | 公開リポジトリは `git clone`（`--depth 1`、`--filter=blob:none` も可）で取得できる |
| `raw.githubusercontent.com` | **可** | 単体ファイルの取得に使える |
| github.com の通常ページ・releases・zip（`codeload`）、`api.github.com` | 不可（403/400） | アーカイブ zip や Release 添付は取れない。clone で代替する |
| npm レジストリ（`registry.npmjs.org`） | **可** | tarball も取得可。`three` の npm パッケージには `.glb` 等のモデルは含まれない（0 件） |
| PyPI（`pypi.org`） | **可** | `bpy` の wheel あり（5.1.x / 5.2.x）。今回は apt の Blender を使用 |
| Ubuntu apt（`archive.ubuntu.com`） | **可** | `blender 4.0.2` を導入できた |
| quaternius.com / quaternius.itch.io | **不可** | プロキシが CONNECT を拒否 |
| kenney.nl | **不可** | 同上 |
| polyhaven.com / `api.polyhaven.com` / `dl.polyhaven.org` | **不可** | 同上 |
| ambientcg.com（API 含む） | **不可** | 同上 |
| mixamo.com | **不可** | 同上（Adobe アカウント必須でもある） |
| itch.io（kaylousberg.itch.io 含む） | **不可** | 同上 |
| OpenGameArt / Poly Pizza / Sketchfab / Fab | **不可** | 同上 |
| threejs.org、unpkg、cdnjs、jsdelivr（モデル配布）、download.blender.org | **不可** | three.js のサンプルモデルは `raw.githubusercontent.com/mrdoob/three.js` から取得できる |

含意: アセットの取得経路は「GitHub 上の公開リポジトリ」と「オーナーが手元のブラウザで公式サイトからダウンロード」の 2 本になる。Quaternius・Kenney・Poly Haven・ambientCG・Mixamo は後者（オーナー作業）が必要。

## 2. 候補の評価

### 2.1 KayKit（Kay Lousberg）— 公式 GitHub、CC0

組織 `KayKit-Game-Assets` の公式リポジトリを clone して検査した。ライセンスは各リポジトリの `LICENSE.txt` に「Creative Commons Zero, CC0 / 個人・教育・商用プロジェクトで自由に使用可」と明記されている。

| リポジトリ（取得時の commit） | 内容 | 検査結果 |
| --- | --- | --- |
| `KayKit-Character-Pack-Adventures-1.0`（`672074b73ba2`） | Knight / Barbarian / Mage / Rogue / Rogue_Hooded の 5 体、武器・盾 約 25 種（`sword_1handed`、`sword_2handed`、`shield_round`、`shield_square`、`shield_spikes`、`shield_badge` など） | 後述 2.1.1 |
| `KayKit-Character-Pack-Skeletons-1.0`（`15b62b9bad12`） | Skeleton_Warrior / Rogue / Mage / Minion の 4 体と骨の武器・盾 | 後述 2.1.2 |
| `KayKit-Dungeon-Remastered-1.0`（`b0ca9bd96a80`） | 壁・床・柱・階段・たいまつ・旗・宝箱・瓦礫など 約 200 点（glb） | 柱 44 tris、壁 494 tris、瓦礫 788 tris、階段 358 tris、宝箱 728 tris |
| `KayKit-Halloween-Bits-1.0`（`6dc69bf6b2fa`） | 枯れ木（大/中/小）、墓、墓標、地下墓所（crypt）、アーチ門、ランタン、祭壇（shrine）、柵、骨など 約 120 点（gltf） | 枯れ木大 256 tris、crypt 952 tris、墓石 271 tris、アーチ門 868 tris、ランタン 264 tris |

その他、同組織には `KayKit-Medieval-Hexagon-Pack-1.0` と `KayKit-Prototype-Bits-1.0` が公開されていることを確認した（中身は未検査）。KayKit の `Character-Animations`（Rig_Medium 系の共有アニメーションライブラリ）と Forest/Nature 系は公式 GitHub には見つからなかった（itch.io のみ、到達不可）。

共通の特徴:

- 全モデルが **1024x1024 の単一パレット/グラデーションテクスチャ 1 枚（約 15KB）**。マテリアル 1、ドローコールが少なく、モバイル向き。
- フラットシェード寄りのローポリで、統一感は非常に高い。ライティングとポストエフェクトで雰囲気を作る方針（direction.md 5 章）と相性が良い。
- 見た目はデフォルメ寄り（頭が大きく、手足が太い）。「エルデンリングの重厚さ」ではなく「小さな箱庭のダークファンタジー」になる。スタイライズド寄りという方針の範囲内。

#### 2.1.1 Adventurers の Knight（プレイヤー候補）

`Characters/gltf/Knight.glb`（3.5MB、sha256 `60428e3a…5168`）を `@gltf-transform/core` で検査した。

| 項目 | 値 |
| --- | --- |
| 三角形数 | 6,952（メッシュ 15 パーツ。剣・盾などが別メッシュとして同梱され、表示切替で出し入れする） |
| ボーン数 | 41（変形用は約 22、残りは IK 用コントロールボーン `kneeIK` `handIK` `IK-foot` など） |
| テクスチャ | PNG 1024x1024 が 1 枚 |
| 拡張 | なし（素の glTF 2.0） |
| 武器・盾の取り付け | `handslot.l` / `handslot.r` ボーンあり。`1H_Sword`、`2H_Sword`、`Round_Shield`、`Rectangle_Shield`、`Spike_Shield`、`Badge_Shield` ノードが同梱 |
| アニメーション | **76 クリップ** |

ソウルライクで必要な動きとの対応（クリップ名はそのまま）:

| 必要な動き | 使えるクリップ | 判定 |
| --- | --- | --- |
| 待機 | `Idle`（1.07s）、`2H_Melee_Idle`、`Unarmed_Idle` | あり |
| 歩き | `Walking_A` / `Walking_B` / `Walking_C`、`Walking_Backwards` | あり |
| 走り | `Running_A` / `Running_B`、`Running_Strafe_Left` / `Running_Strafe_Right` | あり |
| ローリング | `Dodge_Forward` / `Backward` / `Left` / `Right`（各 0.40s のステップ回避） | **代替のみ**（本格的な前転ロールは無い） |
| 攻撃（複数） | `1H_Melee_Attack_Chop`、`Slice_Diagonal`、`Slice_Horizontal`、`Stab`（各 1.0〜1.6s）、`2H_Melee_Attack_Chop` / `Slice` / `Spin` / `Spinning` / `Stab`（強攻撃向き）、`Dualwield_*`、`Unarmed_*`（キック/パンチ） | あり |
| ガード | `Block`、`Blocking`（保持）、`Block_Hit`（ガード被弾）、`Block_Attack`（盾攻撃） | あり |
| 被弾 | `Hit_A`（0.67s）、`Hit_B`（0.87s） | あり |
| 死亡 | `Death_A`（0.80s）、`Death_B`（2.63s）と終端ポーズ `Death_A_Pose` / `Death_B_Pose` | あり |
| 篝火休憩・回復アイテム | `Sit_Floor_Down` / `Sit_Floor_Idle` / `Sit_Floor_StandUp`、`Use_Item`、`Interact`、`PickUp`、`Lie_*` | あり |
| ジャンプ | `Jump_Start` / `Jump_Idle` / `Jump_Land` | あり |

注意点: 攻撃クリップは 1 秒以上あり、振り下ろし前の溜めと戻りを含む。アニメーションキャンセルやヒットストップの実装時に、クリップの再生範囲を切って使う調整が要る（direction.md 6 章の作り込み対象）。ルートモーション有無は未確認（インプレース前提で設計するのが安全）。

#### 2.1.2 Skeletons（雑魚敵・ボス候補）

| モデル | 三角形数 | ボーン | アニメーション |
| --- | --- | --- | --- |
| `Skeleton_Warrior.glb` | 5,934 | 41（同一リグ） | **95 クリップ**（上記 Knight 相当 + `Idle_Combat`、`1H_Melee_Attack_Jump_Chop`、`Taunt`、`Taunt_Longer`、`Spawn_Ground`、`Skeletons_Awaken_Standing`、`Spellcast_Summon`、`Death_C_Skeletons` など） |
| `Skeleton_Minion.glb` | 5,288 | 41（同一リグ） | 同上 95 クリップ |

Rogue / Mage も同系統。**KayKit はキャラクター間でリグとクリップ名が共通**なので、プレイヤーと敵で同じアニメーションコントローラを使い回せる。ボスの登場演出（`Spawn_*`、`Taunt`、`Spellcast_Summon`）も揃っている。

### 2.2 Quaternius（Tomas Laulhe）— CC0（多くのパック）

公式サイト・itch.io には到達できないため、**第三者が GitHub に再配布しているコピー**で内容を確認した。出典の確実性はコピー元のため一段落ちる。実運用ではオーナーが公式サイトから入手するのが望ましい。

| パック | 確認方法 | 結果 |
| --- | --- | --- |
| Universal Animation Library（UAL、Standard 版・ルートモーション無し） | `OpenAgentsInc/openagents`（`edcba345b617`）の `assets/verse/characters/quaternius/gaits.glb` を取得・検査 | **43 クリップ**: `Idle_Loop`、`Walk_Loop`、`Jog_Fwd_Loop`、`Sprint_Loop`、**`Roll`（1.47s）**、`Hit_Chest`、`Hit_Head`、**`Death01`（2.40s）**、`Sword_Attack`、`Sword_Idle`、`Punch_*`、`Jump_*`、`Crouch_*`、`Spell_Simple_*` など。リグは 65 ボーン（`pelvis` / `spine_01..03` / 指あり） |
| Universal Animation Library 2（Standard 版） | 同リポジトリの `animations.glb`（`animations.json` 付き）を取得・検査 | **43 クリップ**: `Sword_Block`、`Sword_Dash`、`Sword_Regular_A` / `B` / `C`（各に `_Rec` 戻りモーション）、`Sword_Regular_Combo`、`Sword_Heavy_Combo`、`Idle_Shield_Loop`、`Idle_Shield_Break`、`Shield_Dash`、`Shield_OneShot`、`Hit_Knockback`、`Melee_Hook`、`Slide_*`、`ClimbUp_1m` など |
| Universal Base Characters（Standard、Superhero 男女）+ Modular Character Outfits Fantasy（Ranger / Peasant） | 同リポジトリの gltf を検査 | Superhero 14,318 tris、Ranger 衣装込み 26,982 tris、**テクスチャ 4096x4096 が複数枚（合計 30MB 超の PNG）**。写実寄りで重く、スタイライズド寄りの統一感にも合わない。スマホ向きではない（ダウンスケールが必須） |
| Ultimate Monsters（Orc / Blue Demon / Dragon などを含む） | `c-house/Chases-House`（Three.js タワーディフェンス）が再配布する加工済み glb を取得・検査 | Orc 7,344 tris / Blue Demon 5,800 tris / Dragon 4,562 tris、いずれも 43 ボーン以下でテクスチャなし（マテリアル色のみ、マテリアル 4〜10）。ただし**再配布版は Walk / Run / Death の 3 クリップに削られている**（原本のクリップ数は未確認） |
| Stylized Nature MegaKit / Ultimate Modular Ruins / Modular Dungeons / Medieval Village MegaKit / Fantasy Props MegaKit | 他リポジトリのカタログ記述のみ（実ファイル未取得） | CC0（Standard 版）と記載。**未検証**。環境の補完候補 |

**ライセンス上の注意（要オーナー判断）**: 第三者カタログの記述によれば、Quaternius は 2026-08-28 付で独自の「Quaternius Asset License v1.0（QAL）」を公開し、**今後のリリースに適用**するとしている。QAL は「ゲーム/動画への組み込みは可、アセット単体の再配布は制限」という内容と報告されている（一次情報は quaternius.com/license.html で、この環境からは未確認）。過去の CC0 パック（UAL、Ultimate Monsters、Modular Dungeons 等）は遡って変更されないとされる。新しいパックを採用する場合は、取得時点のライセンスを必ず確認し、`docs/` に控えを残すこと。リポジトリが公開の場合、アセットファイルをそのままコミットすること自体が「再配布」にあたりうる点にも注意。

### 2.3 その他

| ソース | 状況 |
| --- | --- |
| KhronosGroup/glTF-Sample-Assets | 到達可。ただしサンプルであり、ゲーム用途の品質ではない。`Fox`（576 tris、24 ボーン、Survey/Walk/Run、CC0 + リグは CC-BY 4.0）、`CesiumMan`（4,672 tris、歩きのみ）。リグ・読み込み確認用のテスト素材としてのみ有用 |
| three.js examples の models（`raw.githubusercontent.com/mrdoob/three.js`） | 到達可。`RobotExpressive.glb`（3,237 tris、14 クリップ、CC0・Quaternius 由来）、`Soldier.glb`（11,376 tris、Idle/Walk/Run のみ。Mixamo 由来）、`Michelle.glb`（28,106 tris、Mixamo 由来）。**ソウルライクには不足**。ローダ動作確認用 |
| Kenney（kenney.nl） | 到達不可。GitHub には `KenneyNL/Starter-Kit-*`（3D Platformer / FPS / City Builder）が公開されているが、いずれも小規模なスターターキット（中身は未検査）。主にローポリ環境・UI・SFX 向きで、本作での優先度は低い |
| Poly Haven / ambientCG（地形・岩のテクスチャ、HDRI） | 到達不可。いずれも CC0（公式の表記）で、オーナーがブラウザからダウンロードすれば使える。スタイライズド方針ならパレット/頂点カラー + TSL によるプロシージャル地形シェーダで足りる可能性が高く、優先度は低い |
| Mixamo | 到達不可（かつアカウント必須）。ライセンスは「プロジェクトに組み込む利用は無料、アニメーション単体の再配布は不可」。direction.md 5 章は Mixamo を許容しているが、**公開リポジトリへの FBX/GLB のコミットは再配布にあたる恐れがある**。使う場合は変換後のクリップのみをゲームに組み込み、元の配布形態を避ける等の整理が要る |
| npm 上のアセットパッケージ | 到達可。`@pmndrs/assets@1.7.0`（CC0-1.0、展開後約 18MB）は HDRI・テクスチャ・一部モデルを含む汎用パッケージ。キャラクター用途には向かない。`three` の npm にはモデル同梱なし |

## 3. 自作・加工ツールの検証

### 3.1 Blender CLI（導入可）

- `apt-get install blender`（Ubuntu noble の 4.0.2）+ `python3-numpy`（glTF エクスポータが要求）で導入でき、`blender -b --python script.py` でヘッドレス動作した。
- 検証: Python スクリプトで立方体 + アーマチュア + 3 キーフレームのアクションを生成し、`export_scene.gltf` で GLB 出力 → `@gltf-transform/core` で再読込し、スキン 1・アニメーション 1（`Wave`、24 キー）を確認した（4KB）。
- PyPI の `bpy` wheel（5.1.x / 5.2.x）も取得可能だが、今回は未導入（Python のバージョン制約が強いため apt 版を採用）。
- 用途: ①アセット加工（FBX → glb 変換、不要クリップの削除、テクスチャ縮小、ボーン名の統一、LOD 作成）、②Python からのキーフレーム生成（ローリングなど単純な動き）、③自作モデル/リグの書き出し。GUI でのアニメーション制作（ポーズ打ち）は CLI だけでは非現実的。
- CI やビルドに組み込む必要は薄い。アセットは一度加工してコミットする運用で十分。

### 3.2 glTF の検査・加工（Node）

- `@gltf-transform/core` / `extensions` / `functions` は npm から導入でき、三角形数・ボーン数・テクスチャ・クリップの検査はすべてこれで行った。
- 実装時は `@gltf-transform/cli`（4.5.1）で、クリップ削除（`prune`）、テクスチャ圧縮（`uastc` / `etc1s` の KTX2、WebP）、メッシュ最適化（`meshopt` / `draco`）を行える。KayKit の glb は各キャラが 76〜95 クリップを持ち 3.5〜4.7MB あるため、使うクリップだけに絞るとかなり縮む。

### 3.3 アニメーションを自作する場合の現実性

| 手段 | 現実性 | 用途 |
| --- | --- | --- |
| 既存クリップの再利用（KayKit 内蔵 / UAL） | 高 | 大半の動き。まずこれを使う |
| Three.js での手続き的な加算アニメーション（`AnimationMixer` のレイヤー、ボーンへの直接回転加算） | 高 | 被弾の仰け反り、ロックオン時の上半身・頭の向き、傾き、ヒットストップ時の揺れ、前転ロールの全身回転（ルートを回転させる）など |
| `CCDIKSolver`（`three/examples/jsm/animation/CCDIKSolver.js`）による IK | 中 | 足の接地補正、頭部・手の注視。KayKit の `IK-foot` 等の補助ボーンはそのまま使える可能性がある（未検証） |
| コードでのキーフレーム定義（`AnimationClip` / `KeyframeTrack`）または Blender の Python で数ポーズから生成 | 中 | ロール、短い回避、被弾の小クリップ。1 本あたり数ポーズなら現実的 |
| 他リグのクリップをリターゲット（`SkeletonUtils.retargetClip` + ボーン名マップ。例: UAL の 65 ボーン → KayKit の 41 ボーン） | 中〜低 | UAL の `Roll` / `Death01` を KayKit に移す場合。ボーン名が違い、基準姿勢（T/A ポーズ）の差でねじれやすい。リターゲット後の目視調整が必要 |
| 専用のブラウザ上キーフレームエディタを作る | 低 | 工数が大きく、垂直スライスの範囲を超える。Blender GUI か既存クリップで済ませる |

結論: ゼロからソウルライクの全モーションを手付けするのは非現実的だが、**既存クリップ + 手続き的な加算/ルート操作 + 少数の自作ポーズ**で十分に足りる。

## 4. 推奨案

### プレイヤー

**KayKit Adventurers の `Knight.glb`（必要なら `Barbarian`）を採用する。**

- 三角形数 約 7k、1024 テクスチャ 1 枚で、Xperia 1 V の 30fps 目標に対して余裕が大きい。
- 剣（`sword_1handed` 300 tris）・盾（`shield_round` 284 tris 等）を `handslot.r` / `handslot.l` に取り付ける構造が最初から用意されている。
- 76 クリップで待機/歩き/走り/攻撃/ガード/被弾/死亡/休憩/回復がそのまま使える。
- 不足分はローリング（後述）。
- 代替: Quaternius Universal Base Characters + UAL。アニメーションは理想的（UAL2 に `Sword_Regular_*` コンボ、`Idle_Shield_Loop`、`Sword_Block`、UAL1 に `Roll` / `Death01`）だが、キャラクターが写実寄りで重い（27k tris、4K テクスチャ複数枚）。統一感とモバイル性能の両面で第一候補にしない。

### 雑魚敵

**KayKit Skeletons の `Skeleton_Warrior` / `Skeleton_Minion`（+ `Skeleton_Rogue` / `Mage`）。**

- プレイヤーと同一リグ・同一クリップ名なので、アニメーションコントローラとステートマシンを共有できる。`Idle_Combat`、各種攻撃、`Hit_*`、`Death_*`、`Death_C_Skeletons`（崩れ落ち）、`Skeletons_Awaken_*`（起き上がり）がある。
- 武器・盾も同梱（`Skeleton_Blade`、`Skeleton_Axe`、`Skeleton_Shield_Large_A` など）。
- 「獣型」の敵が欲しければ Quaternius Ultimate Monsters（CC0、公式サイトはオーナーが取得）。リグが別なので、アニメーションはそのパックのものを使う。1 種に絞るのが現実的。

### ボス

**KayKit `Skeleton_Warrior` を 2〜3 倍に拡大し、装備（大型の斧・盾）と色味を変えて使う。**

- 登場演出（`Spawn_Ground`、`Taunt_Longer`、`Spellcast_Summon`）と攻撃（`2H_Melee_Attack_Spin`、`1H_Melee_Attack_Jump_Chop`）が揃っており、垂直スライスのボスには足りる。
- 拡大は当たり判定・足音・カメラ距離の調整が必要。手足が太く短いので、拡大すると迫力は出るが「巨大」ではなく「大柄」な印象になる。
- 上位案: Quaternius Ultimate Monsters の大型個体（Orc / Blue Demon 等、5〜7k tris）。オーナーが公式から取得し、原本のクリップ内容を確認してから採否を決める。

### 環境

**KayKit Dungeon Remastered（遺構・内部）+ KayKit Halloween Bits（枯れ木・墓・地下墓所・ランタン・柵・アーチ門）。**

- いずれも CC0、数十〜数百 tris、1024 テクスチャ 1 枚。同じ作者・同じパレットでプレイヤーと敵に合う。
- 屋外の地形は、頂点カラー/プロシージャルな TSL シェーダで自作する（地形メッシュは数行のコードで生成可能）。岩・木のバリエーションが足りなければ、オーナーが Quaternius の Stylized Nature MegaKit / Ultimate Modular Ruins（CC0）を取得して補う。
- 地面テクスチャが必要なら Poly Haven / ambientCG（CC0）をオーナーがダウンロードする。

### アニメーション

1. **KayKit 内蔵クリップを基本とする**（プレイヤー・敵・ボスで共通）。
2. **ローリングだけ補う**。方針の優先順:
   1. `Dodge_Forward`（0.4s）にルートの前転（ピッチ回転）と移動を重ねる手続き的なロール。実装コストが小さい。
   2. UAL1 の `Roll`（1.47s）を `SkeletonUtils.retargetClip` で KayKit リグに移す。品質は良いが、リターゲットの調整が要る。
   3. Blender の Python で数ポーズから `Roll` クリップを生成して glb に焼く。
3. 被弾の強弱、ロックオン時の上半身の向き、ヒットストップは Three.js 上の手続き的な加算で実装する。
4. 余裕があれば IK（足の接地、注視）を後から追加する。

## 5. 実際に取得できることの確認（完了条件）

| 推奨アセット | 取得方法（実行確認済み） | ライセンス | 取得時点 |
| --- | --- | --- | --- |
| KayKit Adventurers 1.0 | `git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0.git`（142MB） | CC0（リポジトリの `LICENSE.txt`） | `672074b73ba2`（2023-09-16） |
| KayKit Skeletons 1.0 | `git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0.git`（131MB） | CC0 | `15b62b9bad12`（2024-02-02） |
| KayKit Dungeon Remastered 1.0 | `git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0.git`（72MB） | CC0 | `b0ca9bd96a80`（2023-09-29） |
| KayKit Halloween Bits 1.0 | `git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Halloween-Bits-1.0.git`（17MB） | CC0 | `6dc69bf6b2fa`（2023-10-06） |
| Quaternius UAL / UAL2（補助、第三者コピー） | `git clone --depth 1 --filter=blob:none https://github.com/OpenAgentsInc/openagents.git` の `assets/verse/characters/quaternius/` | CC0（同ディレクトリの `*-license.txt`） | `edcba345b617` |

採用が決まったら、次の作業を行う。

- 必要なファイルだけを `site/` 配下（または `assets/` 配下。置き場は実装チケットで決める）にコピーし、`gltf-transform` で未使用クリップの削除・テクスチャ圧縮を行う。
- ライセンス全文（`LICENSE.txt`）と出典 URL・commit を `docs/` に記録する（direction.md 5 章）。CC0 なので表記義務はないが、クレジットを載せるのが礼儀。

## 6. オーナー判断が必要な点

1. **見た目の方向性**: KayKit はデフォルメ寄りのローポリで統一感・性能は最良だが、エルデンリングのような重厚で写実的な雰囲気にはならない。「スタイライズド寄り」の範囲として許容するか。写実寄りに寄せるなら Quaternius Universal Base Characters 系になるが、性能とのトレードオフが大きい。
2. **Quaternius 系を使う場合の入手**: 公式サイトに届かないため、オーナーがブラウザでダウンロードしてリポジトリに渡す必要がある。新しいパックは QAL（再配布制限あり）の可能性があるため、リポジトリが公開である点を踏まえてライセンスを確認する。
3. **Mixamo を使うか**: 到達不可で、再配布条件にも注意が要る。KayKit 内蔵クリップで足りるなら使わない方針でよいか。
4. **ローリングの方式**: 手続き的ロール（最小コスト）か、UAL の `Roll` のリターゲット（高品質、調整あり）か。
5. **アセットの置き場とサイズ**: KayKit 1 リポジトリは 100MB を超える（FBX/OBJ/Blend を含む）。コミット対象は glb/gltf と必要なテクスチャに絞り、リポジトリ肥大を避ける運用でよいか。

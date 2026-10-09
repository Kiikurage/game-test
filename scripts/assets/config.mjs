// アセットパイプラインの設定（取得元・変換対象・クリップ選定）。
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** 取得した元データ（gitignore 対象）。 */
export const SRC_DIR = join(ROOT, 'assets-src', 'quaternius');
/** 取得元・ライセンス・ハッシュの記録（コミット対象）。 */
export const LOCK_FILE = join(ROOT, 'assets-src', 'sources.json');
/** ライセンス控えの置き場（コミット対象）。 */
export const LICENSE_DIR = join(ROOT, 'assets-src', 'LICENSES');
/** 変換後のゲーム用アセット（コミット対象）。 */
export const OUT_DIR = join(ROOT, 'public', 'assets');

/**
 * 取得元。Quaternius の CC0 パック（Universal Base Characters / Modular Character Outfits -
 * Fantasy / Universal Animation Library）の Standard 版を、第三者がそのまま再配布している
 * リポジトリから取得する。公式サイトへはエージェント環境から届かないための措置。
 * 各ファイルの SHA-256 は sources.json に固定してあり、fetch 時に検証する。
 */
export const SOURCE = {
  repo: 'https://github.com/OpenAgentsInc/openagents.git',
  commit: 'e2247fd8101517d768c5937d7df720d35e89c77e',
  dir: 'assets/verse/characters/quaternius',
};

/** 取得するファイル（SOURCE.dir からの相対パス）。 */
export const SOURCE_FILES = [
  'outfits/Male_Ranger.gltf',
  'outfits/Male_Ranger.bin',
  // 頭部（レンジャー衣装にはフードしか含まれないため、Superhero 男性ボディから頭部を切り出す）
  'base/Superhero_Male_FullBody.gltf',
  'base/Superhero_Male_FullBody.bin',
  // glTF が参照するテクスチャ（読み込みに必要。実際に使うのは df680cbc… のベースカラーのみ）
  ...[
    '57fd0ad8c96a4d01b38769637e066cecaa285b456f6e48ce00863754a457affb',
    '9b25cf9200216eb754b79cf4c63b5380c419780788322f3c57cdd2b3e02679a6',
    '9ed61f7726a54fe346a78b9e5a18905d8e2b88f86235d97f53cd207a26f3f8c7',
    'bc7aa863bd22ab0a995cd838cceb4d3a5186ee54ee2fb0108fad85d20c057e6e',
    'c70dabf48574cda55644d556beae1ee7cf1bdcf68a50d259d20f2f2358f27991',
    'd08e3356a83211bc6ca21fe3a8e39f4b5c1a3b8f85457fc2c0fb57be09935025',
    'df680cbc1967a61e85998bfafb8f7bc0a36dd604bb3266486c4b06b1a184bb45',
  ].map((h) => `textures/${h}.png`),
  'gaits.glb',
  'animations.glb',
  'base-license.txt',
  'outfits-license.txt',
  'animations-license.txt',
  // Male_Ranger.gltf が参照するテクスチャ（コンテンツハッシュ名）
  ...[
    '086c2eb25bddfdb77d8e639ccbffb8df723ef4a1910d8e1b217e852f8668bfe5',
    '10cd71e2453e577fdd43e912b6016a99baf64964f0593e524bdd304855e15e2a',
    '846ef2170b04ee584ad83bb8a1e86dab57a9a43b1193204505912c274d949925',
    'aca03d2fba12508ef07d5968ca22267fb207ea26ae898b6b2def8a296bd44f1c',
    'b4dcc0f4139aab548d7c070c4655bd2080ef16caeaaabee6c4aeb693c524e802',
    'dd64da2af3180f0c8f0b721cfc5f0d2720c351b97da8285c6cf49e7717c84147',
  ].map((h) => `textures/${h}.png`),
];

/** ライセンス控え（取得元の *-license.txt → assets-src/LICENSES/）。内容が CC0 であることを検証する。 */
export const LICENSE_COPIES = [
  ['base-license.txt', 'quaternius-universal-base-characters-CC0.txt'],
  ['outfits-license.txt', 'quaternius-modular-character-outfits-fantasy-CC0.txt'],
  ['animations-license.txt', 'quaternius-universal-animation-library-CC0.txt'],
];

/**
 * 出力に含めるアニメーションクリップ（元ライブラリ別）。
 * ランタイム側の名前定義は src/game/assets/clips.ts にあり、テストで両者の一致を検証する。
 */
export const CLIPS = {
  // Universal Animation Library（Standard）: gaits.glb
  'gaits.glb': [
    'Idle_Loop',
    'Walk_Loop',
    'Jog_Fwd_Loop',
    'Sprint_Loop',
    'Roll',
    'Hit_Chest',
    'Hit_Head',
    'Death01',
    'Sword_Attack',
    'Sword_Idle',
    'Jump_Start',
    'Jump_Loop',
    'Jump_Land',
    'Interact',
    'Sitting_Enter',
    'Sitting_Idle_Loop',
    'Sitting_Exit',
  ],
  // Universal Animation Library 2（Standard）: animations.glb
  'animations.glb': [
    'Sword_Regular_A',
    'Sword_Regular_A_Rec',
    'Sword_Regular_B',
    'Sword_Regular_B_Rec',
    'Sword_Regular_C',
    'Sword_Regular_Combo',
    'Sword_Heavy_Combo',
    'Sword_Block',
    'Sword_Dash',
    'Idle_Shield_Loop',
    'Idle_Shield_Break',
    'Shield_Dash',
    'Shield_OneShot',
    'Hit_Knockback',
    'Melee_Hook',
    'Melee_Hook_Rec',
    'Consume',
  ],
};

/** テクスチャの最大辺（スロット別）。ベースカラーは 1024、法線・金属/粗さは 512（テクスチャメモリ予算のため）。 */
export const TEXTURE_MAX = { baseColor: 1024, normal: 512, metallicRoughness: 512 };
export const WEBP_QUALITY = { baseColor: 85, normal: 90, metallicRoughness: 80 };

/**
 * キャラクター定義。
 * simplify: メッシュ名（部分一致）→ 残す三角形の比率。
 * adjust: マテリアル名 → ベースカラーテクスチャの色調整（sharp の modulate: saturation / brightness / hue）。
 * tint: マテリアル名 → baseColorFactor 乗算。どちらも元の「レンジャー」の緑を騎士らしい鋼色に寄せるため。
 */
export const CHARACTERS = {
  knight: {
    source: 'outfits/Male_Ranger.gltf',
    simplify: [
      ['Feet_Boots', 0.3],
      ['Bracer', 0.5],
      ['Pauldron', 0.7],
      ['Belt', 0.6],
    ],
    adjust: { MI_Ranger: { saturation: 0.3, brightness: 0.95 } },
    tint: { MI_Ranger: [0.78, 0.85, 1, 1] },
    head: {
      source: 'base/Superhero_Male_FullBody.gltf',
      mesh: 'SuperHero_Male',
      // 頭部とみなすボーン（頂点の最大ウェイトがこれらのボーンの三角形だけ残す）
      joints: ['Head', 'neck_01'],
      textureSize: 512,
      // 顔のテクスチャが手の肌色より暗いので明るくする
      adjust: { brightness: 1.25, saturation: 0.9 },
    },
  },
};

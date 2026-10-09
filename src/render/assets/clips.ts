/**
 * public/assets/animations.glb に含まれるクリップ名（Quaternius Universal Animation Library 1/2, CC0）。
 * 変換パイプライン（scripts/assets/config.mjs の CLIPS）と一致していることは clips.test.ts で検証する。
 * いずれもルートモーション無し（その場で動く）版。
 */
export const CLIP_NAMES = [
  // --- UAL1 (gaits.glb)
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
  // --- UAL2 (animations.glb)
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
] as const;

export type ClipName = (typeof CLIP_NAMES)[number];

/** ループ再生するクリップ（名前が `_Loop` で終わるものと、剣の構え待機）。 */
export function isLoopingClip(name: ClipName): boolean {
  return name.endsWith('_Loop') || name === 'Sword_Idle';
}

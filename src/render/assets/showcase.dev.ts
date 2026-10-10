import { registerShowcaseParams } from '../../devHooks';

// キャラクター確認表示を起動する URL パラメータ。新しいプレビューは自分の `*.dev.ts` で registerShowcaseParams を呼ぶ。
registerShowcaseParams('clip', 'view', 'player', 'corpse', 'props', 'equip', 'undead', 'light');

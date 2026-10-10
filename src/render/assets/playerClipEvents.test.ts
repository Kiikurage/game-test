import { describe, expect, it } from 'vitest';
import { playerClipEvents } from '../../game/anim/playerClips';
import { CLIP_NAMES, DERIVED_CLIP_NAMES } from './clips';

describe('プレイヤーのイベントマーカー表', () => {
  it('参照するクリップ名がすべて animations.glb のクリップ（ClipName）に存在する（派生クリップは読み込み時に作る）', () => {
    for (const e of playerClipEvents.entries) {
      expect([...CLIP_NAMES, ...DERIVED_CLIP_NAMES] as readonly string[], e.id).toContain(e.clip);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { playerClipEvents } from '../../game/anim/playerClips';
import { CLIP_NAMES } from './clips';

describe('プレイヤーのイベントマーカー表', () => {
  it('参照するクリップ名がすべて animations.glb のクリップ（ClipName）に存在する', () => {
    for (const e of playerClipEvents.entries) {
      expect(CLIP_NAMES as readonly string[], e.id).toContain(e.clip);
    }
  });
});

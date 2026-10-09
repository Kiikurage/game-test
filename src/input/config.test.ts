import { describe, expect, it } from 'vitest';
import { INPUT_BUFFER_FRAMES as GAME_FRAMES } from '../game/data';
import { INPUT_BUFFER_FRAMES, INPUT_BUFFER_SECONDS_BY_ACTION } from './config';

describe('先行入力のフレーム数（仕様書 2.4 節）', () => {
  it('入力層の設定が game/data の仕様値と一致する（攻撃 10F・ロール 8F・回復 6F）', () => {
    expect(INPUT_BUFFER_FRAMES.lightAttack).toBe(GAME_FRAMES.attack);
    expect(INPUT_BUFFER_FRAMES.heavyAttack).toBe(GAME_FRAMES.attack);
    expect(INPUT_BUFFER_FRAMES.dodge).toBe(GAME_FRAMES.roll);
    expect(INPUT_BUFFER_FRAMES.item).toBe(GAME_FRAMES.heal);
  });

  it('秒への換算は「押したステップを含めて N ステップ」になる（60Hz で N−1 ステップ後まで有効）', () => {
    for (const [action, frames] of Object.entries(INPUT_BUFFER_FRAMES)) {
      const seconds = INPUT_BUFFER_SECONDS_BY_ACTION[action] ?? 0;
      expect(Math.floor(seconds * 60), action).toBe(frames - 1);
    }
  });
});

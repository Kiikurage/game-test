import { describe, expect, it } from 'vitest';
import { validateStateGraph } from '../anim/characterFsm';
import { BOSS_STATE_GRAPH } from './bossStates';

describe('BOSS_STATE_GRAPH', () => {
  it('is a consistent state graph', () => {
    expect(validateStateGraph(BOSS_STATE_GRAPH)).toEqual([]);
  });

  it('cannot leave dead without a reset', () => {
    expect(BOSS_STATE_GRAPH.dead.to).toEqual([]);
  });
});

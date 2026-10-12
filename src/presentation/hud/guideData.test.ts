import { describe, expect, it } from 'vitest';
import { loadData } from '../../game/data/loadData';
import guideJson from './guide.json';
import { GUIDE, GuideDataSchema, HINTS, NOTICE } from './guideData';

describe('guide data', () => {
  it('JSON 化前と同じ値を公開する', () => {
    expect(NOTICE).toEqual({
      seconds: 3,
      gapSeconds: 0.3,
      maxQueue: 4,
      shortcutOpened: '近道が開いた',
    });
    expect(GUIDE).toEqual({ enemyNearM: 22, openingDelaySeconds: 1 });
    expect(HINTS.map((h) => h.id)).toEqual(['move', 'camera', 'roll', 'lockOn', 'lightAttack']);
    expect(HINTS[0]?.goal).toEqual({ type: 'move', seconds: 0.4, threshold: 0.3 });
  });

  it('スキーマ違反を拒否する', () => {
    const badAction = structuredClone(guideJson) as { hints: { goal: Record<string, unknown> }[] };
    (badAction.hints[2]?.goal ?? {}).action = 'jump';
    expect(() => loadData(GuideDataSchema, badAction, 'bad.json')).toThrow(/goal\.action/);
  });
});

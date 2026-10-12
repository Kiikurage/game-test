import { describe, expect, it } from 'vitest';
import { GUIDE, GuideDataSchema, HINTS, NOTICE } from './guide';
import guideJson from './guide.json';
import { ITEM, ITEM_DEFS, ItemsDataSchema } from './items';
import itemsJson from './items.json';
import { loadData } from './loadData';
import { INTERACT_VERBS, lookupText, TextsDataSchema } from './texts';
import textsJson from './texts.json';

describe('items / texts / guide data', () => {
  it('JSON 化前と同じ値を公開する', () => {
    expect(ITEM).toEqual({ noticeSeconds: 3, radiusM: 1.4 });
    expect(Object.keys(ITEM_DEFS)).toEqual([
      'flask_up',
      'talisman_ash',
      'drop_clear',
      'sword_gravekeeper',
      'oil_jar',
      'relic_flask',
      'relic_letter',
      'relic_ring',
      'relic_medal',
    ]);
    expect(ITEM_DEFS.flask_up).toEqual({
      id: 'flask_up',
      kind: 'consumable',
      nameId: 'item.flask_up.name',
      descId: 'item.flask_up.desc',
      noticeId: 'item.flask_up.notice',
      effect: { type: 'flaskMax', amount: 1 },
    });
    expect(ITEM_DEFS.oil_jar?.maxCount).toBe(3);
    expect(ITEM_DEFS.sword_gravekeeper?.weaponId).toBe('sword_gravekeeper');
    expect(INTERACT_VERBS.fog).toBe('霧へ入る');
    expect(lookupText('item.flask_up.notice')).toBe('回復瓶を手に入れた');
    expect(NOTICE).toEqual({
      seconds: 3,
      gapSeconds: 0.3,
      maxQueue: 4,
      shortcutOpened: '近道が開いた',
    });
    expect(GUIDE).toEqual({ enemyNearM: 22, openingDelaySeconds: 1 });
    expect(HINTS.map((h) => h.id)).toEqual(['move', 'camera', 'roll', 'lockOn', 'lightAttack']);
    expect(HINTS[0]?.goal).toEqual({ type: 'move', seconds: 0.4, threshold: 0.3 });
    expect(Object.isFrozen(ITEM_DEFS.flask_up)).toBe(true);
  });

  it('スキーマ違反を拒否する', () => {
    const dupItems = structuredClone(itemsJson);
    dupItems.items.push({ id: 'flask_up', kind: 'relic' });
    expect(() => loadData(ItemsDataSchema, dupItems, 'bad.json')).toThrow(/duplicate item id/);

    const badKind = structuredClone(itemsJson) as { items: { kind: string }[] };
    (badKind.items[0] ?? { kind: '' }).kind = 'armor';
    expect(() => loadData(ItemsDataSchema, badKind, 'bad.json')).toThrow(/\$\.items\[0\]\.kind/);

    const badText = structuredClone(textsJson) as { texts: Record<string, unknown> };
    badText.texts.foo = 1;
    expect(() => loadData(TextsDataSchema, badText, 'bad.json')).toThrow(/\$\.texts\.foo/);

    const badAction = structuredClone(guideJson) as { hints: { goal: Record<string, unknown> }[] };
    (badAction.hints[2]?.goal ?? {}).action = 'jump';
    expect(() => loadData(GuideDataSchema, badAction, 'bad.json')).toThrow(/goal\.action/);
  });
});

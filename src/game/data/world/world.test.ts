import { describe, expect, it } from 'vitest';
import { NavGrid } from '../../enemy/navGrid';
import { ASHEN_FOUNDATION } from '../../world/ashenFoundation';
import { createLevel } from '../../world/level';
import { ITEM_DEFS } from '../items';
import { INTERACT_VERBS, lookupText, TEXTS } from '../texts';
import { IMPLEMENTED_KINDS, WORLD_INTERACTABLES } from './interactables';
import type { Effect } from './types';

const level = createLevel(ASHEN_FOUNDATION);
const DEFAULT_RADIUS = 1.5;
/** 状況ボタンが出る距離の内側に立てる余裕（m）。 */
const STAND_MARGIN = 0.3;

function* allEffects(effects: readonly Effect[]): Generator<Effect> {
  for (const e of effects) {
    yield e;
    if (e.type === 'dialogue' && e.onEnd) yield* allEffects(e.onEnd);
  }
}

describe('world interactable data (spec 14.5 / 14.6 / 14.8)', () => {
  it('has the 27 placements (26 + the floor hatch) with unique ids', () => {
    expect(WORLD_INTERACTABLES).toHaveLength(27);
    const ids = WORLD_INTERACTABLES.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references only existing texts, items and verbs', () => {
    for (const def of WORLD_INTERACTABLES) {
      if (def.prompt !== null) expect(INTERACT_VERBS, def.id).toHaveProperty(def.prompt);
      for (const e of allEffects(def.effects)) {
        if (e.type === 'showText')
          expect(lookupText(e.textId), `${def.id}: ${e.textId}`).toBeDefined();
        if (e.type === 'giveItem')
          expect(ITEM_DEFS, `${def.id}: ${e.itemId}`).toHaveProperty(e.itemId);
        if (e.type === 'dialogue') {
          for (const line of e.lines) expect(lookupText(line), `${def.id}: ${line}`).toBeDefined();
        }
      }
    }
  });

  it('every item has its name, description and notice text', () => {
    expect(Object.keys(ITEM_DEFS).sort()).toEqual(
      [
        'drop_clear',
        'flask_up',
        'oil_jar',
        'relic_flask',
        'relic_letter',
        'relic_medal',
        'relic_ring',
        'sword_gravekeeper',
        'talisman_ash',
      ].sort(),
    );
    for (const def of Object.values(ITEM_DEFS)) {
      for (const id of [def.nameId, def.descId, def.noticeId]) {
        expect(lookupText(id), `${def.id}: ${id}`).toBeDefined();
      }
    }
  });

  it('has every read text and no proper nouns of the boss in plain texts', () => {
    for (const def of WORLD_INTERACTABLES.filter((i) => i.kind === 'read')) {
      expect(typeof TEXTS[def.id], def.id).toBe('string');
    }
    for (const [id, t] of Object.entries(TEXTS)) {
      const lines = typeof t === 'string' ? [t] : t;
      for (const l of lines) expect(l, id).not.toMatch(/オルグ/);
    }
  });

  it('keeps everything inside the level bounds', () => {
    const { bounds } = ASHEN_FOUNDATION;
    for (const i of WORLD_INTERACTABLES) {
      expect(i.x, i.id).toBeGreaterThanOrEqual(bounds.minX);
      expect(i.x, i.id).toBeLessThanOrEqual(bounds.maxX);
      expect(i.z, i.id).toBeGreaterThanOrEqual(bounds.minZ);
      expect(i.z, i.id).toBeLessThanOrEqual(bounds.maxZ);
    }
  });
});

describe('placement in the level', () => {
  const placed = new Set(ASHEN_FOUNDATION.interactables.map((i) => i.id));

  it('places only implemented kinds, and only where the terrain exists', () => {
    const sidePathIds = new Set((ASHEN_FOUNDATION.sidePaths ?? []).map((p) => p.id));
    for (const def of WORLD_INTERACTABLES) {
      const expected =
        IMPLEMENTED_KINDS.has(def.kind) &&
        (def.site === 'main' || def.site === 'side_waterway' || sidePathIds.has(def.site));
      expect(placed.has(def.id), def.id).toBe(expected);
    }
    // 蔵（side_wall）は未実装の地形なので置かない
    expect(placed.has('tablet_store')).toBe(false);
    expect(placed.has('pickup_oil')).toBe(false);
    expect(placed.has('stone_hearth')).toBe(true);
  });

  it('every placed target can be reached: the player can stand within its radius', () => {
    const nav = NavGrid.build(level);
    for (const def of WORLD_INTERACTABLES) {
      if (!placed.has(def.id)) continue;
      const reach = (def.radiusM ?? DEFAULT_RADIUS) - STAND_MARGIN;
      if (def.site === 'main') {
        const i = nav.nearestWalkable(def.x, def.z, 12);
        expect(i, def.id).toBeGreaterThanOrEqual(0);
        const d = Math.hypot(
          nav.centerX(i % nav.cols) - def.x,
          nav.centerZ(Math.floor(i / nav.cols)) - def.z,
        );
        expect(d, `${def.id} nearest walkable ${d.toFixed(2)}m`).toBeLessThanOrEqual(reach);
      } else if (def.site === 'side_waterway') {
        const inside = (ASHEN_FOUNDATION.waterways ?? []).some((w) =>
          w.rects.some(
            (r) =>
              def.x >= r.minX - reach &&
              def.x <= r.maxX + reach &&
              def.z >= r.minZ - reach &&
              def.z <= r.maxZ + reach,
          ),
        );
        expect(inside, def.id).toBe(true);
      } else {
        // 脇道の足場の範囲（透明壁の外面まで）の中、または反応半径の内側から届く
        expect(level.sidePathDistance(def.x, def.z, [def.site]), def.id).toBeLessThanOrEqual(reach);
      }
    }
  });

  it('does not overlap the reaction range of the other prompts (fog gate, bonfire, lever, items; the hatch and grate have no prompt yet)', () => {
    const others = ASHEN_FOUNDATION.interactables.filter(
      (i) =>
        i.kind !== 'hatch' && i.kind !== 'grate' && !WORLD_INTERACTABLES.some((w) => w.id === i.id),
    );
    for (const def of WORLD_INTERACTABLES) {
      if (!placed.has(def.id)) continue;
      for (const o of others) {
        const d = Math.hypot(def.x - o.x, def.z - o.z);
        expect(d, `${def.id} vs ${o.id}`).toBeGreaterThan(
          (o.id === 'fog-gate' ? 2.4 : DEFAULT_RADIUS) + (def.radiusM ?? DEFAULT_RADIUS),
        );
      }
    }
  });
});

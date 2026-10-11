// インタラクト対象の配置データ（仕様書 14.5 節の配置一覧 26 件）。座標は初期値（グレーボックスで調整する）。
// 実動作があるのは read / loot だけ（`game/interactable`）。他の種別（pray / bell / talk / push / breakable）は
// 後続（#123）が実動作を入れるので、ここではデータだけを置く（`IMPLEMENTED_KINDS` に入っていない種別は登録されない）。
// どれが実際に置かれるかは、レベルの地形（脇道の足場など）が存在するかで決まる（`ashenFoundation.ts`、`site`）。
import type { Interactable, InteractableKind } from './types';

/** 実動作がある種別。 */
export const IMPLEMENTED_KINDS: ReadonlySet<InteractableKind> = new Set(['read', 'loot']);

const read = (
  id: string,
  x: number,
  z: number,
  site: Interactable['site'] = 'main',
  extra: Partial<Interactable> = {},
): Interactable => ({
  id,
  kind: 'read',
  x,
  z,
  site,
  prompt: 'read',
  effects: [{ type: 'showText', textId: id }],
  ...extra,
});

/** 遺品を持つ遺体（調べる）。取得の通知は `itemPicked`、短い文は `showText`。 */
const corpse = (
  id: string,
  x: number,
  z: number,
  site: Interactable['site'],
  itemId: string,
  extra: Partial<Interactable> = {},
): Interactable => ({
  id,
  kind: 'loot',
  x,
  z,
  site,
  prompt: 'loot',
  once: true,
  effects: [
    { type: 'giveItem', itemId },
    { type: 'showText', textId: id },
  ],
  ...extra,
});

export const WORLD_INTERACTABLES: readonly Interactable[] = [
  read('stone_hearth', -4.6, 3.4), // 篝火の脇の石碑（石碑のコライダの位置）
  read('grave_b1', 16, 3),
  corpse('corpse_b_flask', 24, 9, 'main', 'relic_flask', {
    corpse: { pose: 'prone', variant: 'traveler', yawDeg: 250 },
  }),
  read('grave_b2', 29, 13),
  read('grave_b3', 34, 18, 'side_ledge'),
  corpse('corpse_roof', 29, 16, 'side_roof', 'relic_letter', {
    corpse: { pose: 'prone', variant: 'pilgrim', yawDeg: 160 },
  }),
  // 仕様の (44, 26) は礼拝堂の内側。岩棚は礼拝堂の西の外壁沿いに取り直した（docs/level.md）ので、岩棚の `ring` の位置に置く
  corpse('corpse_ledge', 38, 29.8, 'side_ledge', 'relic_ring', {
    corpse: { pose: 'prone', variant: 'broad', yawDeg: 42 },
  }),
  read('tablet_c', 47, 26),
  read('corpse_c_altar', 50, 23), // 祈る姿勢の遺体 3 体の情景（調べる対象ではなく読む）
  {
    id: 'statue_c',
    kind: 'pray',
    x: 56,
    z: 20,
    site: 'main',
    prompt: 'pray',
    effects: [
      { type: 'playClip', clip: 'Pray', durationF: 120 },
      { type: 'ambientDuck', db: -6, frames: 180 },
      { type: 'showText', textId: 'pray_c' },
    ],
  },
  read('grave_c_floor', 45, 27),
  {
    id: 'bell_c',
    kind: 'bell',
    x: 50,
    z: 32,
    site: 'side_ledge',
    prompt: 'bell',
    cooldownF: 1800,
    effects: [
      { type: 'playClip', clip: 'Bell', durationF: 90 },
      { type: 'emitSound', radiusM: 15, kind: 'bell' },
      { type: 'showText', textId: 'bell_first' },
    ],
  },
  {
    id: 'pickup_talisman',
    kind: 'loot',
    x: 52,
    z: 32.5,
    site: 'side_ledge',
    prompt: 'loot',
    once: true,
    effects: [{ type: 'giveItem', itemId: 'talisman_ash' }],
  },
  read('coffin_d', 63, 38.5),
  {
    id: 'pickup_drop',
    kind: 'loot',
    x: 66,
    z: 40,
    site: 'side_waterway',
    prompt: 'loot',
    once: true,
    effects: [{ type: 'giveItem', itemId: 'drop_clear' }],
  },
  // 墓室は水路の (60..65, 33..37)（仕様の (58, 36) は壁の中なので、石棺のそばに取り直した）
  {
    id: 'npc_knight',
    kind: 'talk',
    x: 62.4,
    z: 35,
    site: 'side_waterway',
    prompt: 'talk',
    requires: { flagUnset: 'knight.dead' },
    effects: [
      {
        type: 'dialogue',
        lines: ['npc_knight.1', 'npc_knight.2', 'npc_knight.3', 'npc_knight.4'],
        onEnd: [
          { type: 'giveItem', itemId: 'sword_gravekeeper' },
          { type: 'setFlag', flag: 'knight.dead' },
        ],
      },
    ],
  },
  // 騎士の死後に調べる。遺品「門番隊の徽章」
  corpse('corpse_knight', 62.4, 35, 'side_waterway', 'relic_medal', {
    requires: { flagSet: 'knight.dead' },
    corpse: { pose: 'prone', variant: 'warrior', yawDeg: 300 },
  }),
  {
    id: 'grate_d',
    kind: 'push',
    x: 72,
    z: 45,
    site: 'main',
    prompt: 'push',
    once: true,
    effects: [
      { type: 'playClip', clip: 'Push', durationF: 90 },
      { type: 'setFlag', flag: 'world.grateDOpen' },
    ],
  },
  read('tablet_lane', 81, 40),
  {
    id: 'wall_g1',
    kind: 'breakable',
    x: 82,
    z: 41,
    site: 'main',
    prompt: null,
    hp: 150,
    effects: [
      { type: 'emitSound', radiusM: 12, kind: 'crash' },
      { type: 'setFlag', flag: 'world.wallG1Broken' },
    ],
  },
  read('tablet_store', 85, 41.5, 'side_wall'),
  {
    id: 'pickup_oil',
    kind: 'loot',
    x: 84.5,
    z: 41,
    site: 'side_wall',
    prompt: 'loot',
    once: true,
    effects: [{ type: 'giveItem', itemId: 'oil_jar', count: 3 }],
  },
  {
    id: 'statue_gate',
    kind: 'pray',
    x: 101,
    z: 64,
    site: 'main',
    prompt: 'pray',
    effects: [
      { type: 'playClip', clip: 'Pray', durationF: 120 },
      { type: 'ambientDuck', db: -6, frames: 180 },
      { type: 'setFlag', flag: 'pray.gate' },
      { type: 'showText', textId: 'pray_gate' },
    ],
  },
  // 霧の門 (104, 68) の反応半径（2.4m）に入らないよう、仕様の (103, 66) から手前の脇へずらした
  read('tablet_gate', 100.2, 65),
  read('swords_gate', 104, 64),
  // 闘技場の台座の篝火（中央）と重ならないよう、台座の南側 3.2m に置く
  read('tablet_arena', 122, 82.8, 'main', { requires: { flagSet: 'boss.boss' } }),
];

/**
 * 取得アイテムの定義（仕様書 2.1 / 14.4 / 14.8 節）。データ（ID・種類・効果）は `items.json`、ロジックは `game/item/` が読む。
 * 名前・説明文・取得通知の文面は `texts.json` の `item.<id>.name|desc|notice`。
 */
import { s, type Infer } from '../../core/schema';
import json from './items.json';
import { loadData } from './loadData';

const ItemEffectSchema = s.object({ type: s.literal('flaskMax'), amount: s.number({ min: 1 }) });
export type ItemEffect = Infer<typeof ItemEffectSchema>;

const ItemKindSchema = s.literal('passive', 'weapon', 'consumable', 'relic');
export type ItemKind = Infer<typeof ItemKindSchema>;

const StatModSchema = s.object({
  stat: s.literal(
    'staminaRegenDelayF',
    'staminaRegenPerSec',
    'guardRegenPerSec',
    'zeroStaminaDelayF',
    'healAmount',
  ),
  set: s.number(),
});

const ItemEntrySchema = s.object({
  /** セーブの `items` のキー。 */
  id: s.string(),
  kind: ItemKindSchema,
  /** 取得時（と起動時）に適用する効果。効果のないアイテム（遺品）や、効果の実装が E11-2 のものは省略。 */
  effect: s.optional(ItemEffectSchema),
  /** パッシブ: 有効にする数値（E11-2 が適用する）。 */
  mods: s.optional(s.array(StatModSchema)),
  /** 武器: `game/data/weapons` のキー（E11-2）。 */
  weaponId: s.optional(s.string()),
  /** 消耗品の最大所持数。 */
  maxCount: s.optional(s.number({ min: 1, integer: true })),
});

export const ItemsDataSchema = s.object({
  /** 取得通知の表示時間（秒）。表示は E6-2b。 */
  noticeSeconds: s.number({ min: 0 }),
  /** 反応半径（m）。 */
  radiusM: s.number({ min: 0 }),
  items: s.refine(s.array(ItemEntrySchema), (list) => {
    const ids = list.map((i) => i.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    return dup === undefined ? undefined : `duplicate item id "${dup}"`;
  }),
});

export type ItemDef = Infer<typeof ItemEntrySchema> & {
  /** 名前・説明文・取得通知（9.1 節。3 秒表示）の文面（`texts.json` のキー）。 */
  readonly nameId: string;
  readonly descId: string;
  readonly noticeId: string;
};

const data = loadData(ItemsDataSchema, json, 'items.json');

export const ITEM_DEFS: Readonly<Record<string, ItemDef>> = Object.freeze(
  Object.fromEntries(
    data.items.map((item): [string, ItemDef] => [
      item.id,
      Object.freeze({
        ...item,
        nameId: `item.${item.id}.name`,
        descId: `item.${item.id}.desc`,
        noticeId: `item.${item.id}.notice`,
      }),
    ]),
  ),
);

export const ITEM = { noticeSeconds: data.noticeSeconds, radiusM: data.radiusM } as const;

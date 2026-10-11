/** 取得アイテムの定義（仕様書 2.1 / 14.4 / 14.8 節）。データ（ID・名前・説明・効果）だけを持ち、ロジックは `game/item/` が読む。 */
import type { StatMod } from './world/types';

export type ItemEffect = { readonly type: 'flaskMax'; readonly amount: number };

export type ItemKind = 'passive' | 'weapon' | 'consumable' | 'relic';

export interface ItemDef {
  /** セーブの `items` のキー。 */
  readonly id: string;
  readonly kind: ItemKind;
  /** 名前・説明文・取得通知の文面（`texts.ja.ts` のキー）。 */
  readonly nameId: string;
  readonly descId: string;
  /** 取得通知の文言（9.1 節。3 秒表示）。 */
  readonly noticeId: string;
  /** 取得時（と起動時）に適用する効果。効果のないアイテム（遺品）や、効果の実装が E11-2 のものは省略。 */
  readonly effect?: ItemEffect;
  /** パッシブ: 有効にする数値（E11-2 が適用する）。 */
  readonly mods?: readonly StatMod[];
  /** 武器: `game/data/weapons` のキー（E11-2）。 */
  readonly weaponId?: string;
  /** 消耗品の最大所持数。 */
  readonly maxCount?: number;
}

const def = (id: string, kind: ItemKind, extra: Partial<ItemDef> = {}): [string, ItemDef] => [
  id,
  {
    id,
    kind,
    nameId: `item.${id}.name`,
    descId: `item.${id}.desc`,
    noticeId: `item.${id}.notice`,
    ...extra,
  },
];

export const ITEM_DEFS: Readonly<Record<string, ItemDef>> = Object.fromEntries([
  def('flask_up', 'consumable', { effect: { type: 'flaskMax', amount: 1 } }),
  // 効果（数値・武器の切替）は E11-2。ここでは取得・所持・文面だけ
  def('talisman_ash', 'passive'),
  def('drop_clear', 'passive'),
  def('sword_gravekeeper', 'weapon', { weaponId: 'sword_gravekeeper' }),
  def('oil_jar', 'consumable', { maxCount: 3 }),
  def('relic_flask', 'relic'),
  def('relic_letter', 'relic'),
  def('relic_ring', 'relic'),
  def('relic_medal', 'relic'),
]);

export const ITEM = {
  /** 取得通知の表示時間（秒）。表示は E6-2b。 */
  noticeSeconds: 3,
  /** 反応半径（m）。 */
  radiusM: 1.4,
} as const;

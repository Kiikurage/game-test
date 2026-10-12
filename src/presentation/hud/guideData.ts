/**
 * 操作ヒント・通知のデータ（E6-2b）。値と文言（デバイス別）は `guide.json`、通知の文言は `texts.json`。
 * 操作割当は docs/controls.md。
 */
import { ACTIONS } from '../../core/input';
import { s, type Infer } from '../../core/schema';
import json from './guide.json';
import { loadData } from '../../game/data/loadData';
import { NOTICE_TEXTS } from '../../game/data/texts';

const HintTextSchema = s.object({ kbm: s.string(), gamepad: s.string(), touch: s.string() });
export type HintText = Infer<typeof HintTextSchema>;

/** ヒントを達成とみなす条件。 */
const HintGoalSchema = s.union('type', {
  /** 移動入力（0..1 の大きさが `threshold` 以上）を合計 `seconds` 秒続けた。 */
  move: s.object({
    type: s.literal('move'),
    seconds: s.number({ min: 0 }),
    threshold: s.number({ min: 0, max: 1 }),
  }),
  /** カメラの回転量（rad）の合計が `radians` に達した。 */
  look: s.object({ type: s.literal('look'), radians: s.number({ min: 0 }) }),
  /** そのボタンが押された。 */
  press: s.object({ type: s.literal('press'), action: s.literal(...ACTIONS) }),
  /** ロックオンした（ボタンまたは対象が付いた）。 */
  lockOn: s.object({ type: s.literal('lockOn') }),
});
export type HintGoal = Infer<typeof HintGoalSchema>;

const HintDefSchema = s.object({
  id: s.string(),
  /** 'opening': 開始時、順番に。'combat': 敵が近いとき（opening より優先）、順番に。 */
  group: s.literal('opening', 'combat'),
  text: HintTextSchema,
  goal: HintGoalSchema,
});
export type HintDef = Infer<typeof HintDefSchema>;

export const GuideDataSchema = s.object({
  /** 「初めての敵」ヒントを出す、生きている敵との距離（m）。 */
  enemyNearM: s.number({ min: 0 }),
  /** 開始から最初のヒントを出すまでの猶予（秒）。 */
  openingDelaySeconds: s.number({ min: 0 }),
  notice: s.object({
    /** 通知の表示時間（秒）。アイテムは `itemPicked.noticeSeconds` を優先する。 */
    seconds: s.number({ min: 0 }),
    /** 続けて出す通知の間（秒）。 */
    gapSeconds: s.number({ min: 0 }),
    /** 待ち行列の上限（超えたら古い待ちから捨てる）。 */
    maxQueue: s.number({ min: 1, integer: true }),
  }),
  /** 配列の順が各グループ内の表示順（実行すると次へ）。 */
  hints: s.array(HintDefSchema),
});

const data = loadData(GuideDataSchema, json, 'guide.json');

export const HINTS: readonly HintDef[] = data.hints;

export const GUIDE = {
  enemyNearM: data.enemyNearM,
  openingDelaySeconds: data.openingDelaySeconds,
} as const;

export const NOTICE = { ...data.notice, shortcutOpened: NOTICE_TEXTS.shortcutOpened } as const;

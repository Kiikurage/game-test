import { UNDEAD_ATTACK_RULES, UNDEAD_SOLDIER_ATTACKS } from '../data';
import { findEnemyClipEvents } from '../anim/enemyClips';
import type { HitResolver, Poise } from '../combat';
import {
  AttackRunner,
  pickWeighted,
  type AttackPlanner,
  type AttackTokens,
  type WeightedChoice,
} from './attackRunner';

const R = UNDEAD_ATTACK_RULES;

type SoldierAttack = 'a1' | 'a2' | 'a3';

/**
 * 亡者兵の攻撃選択（仕様書 5.2 節）。
 *
 * - 近距離（≤ 2.2m）: A1 60 / A2 40。A2 は「A1 の使用後ではない」ときだけ。
 *   （A1 が続いて 3 回連続の禁止で A1 も選べないときは、立ち尽くさないよう A2 を許す。）
 * - 中距離（2.5〜5.0m）: A3 70（残りは選ばず接近を続ける）。
 * - ロール直後（過去 20F）に近距離にいるときは待ちを飛ばし、A1 の確率を 70% にする。
 * - 同じ攻撃を 3 回連続で選ばない。
 * - A1 の後 40% で A1 を連続（2 発目 = `a1b`。最大 2 回まで）。
 */
export const UNDEAD_PLANNER: AttackPlanner = {
  choose({ distance, recentRoll, history, random }) {
    const opts = { history: history as readonly SoldierAttack[], maxConsecutive: R.maxConsecutive };
    if (distance <= R.closeRange) {
      const a1 = recentRoll ? R.rollPunishA1Chance * 100 : R.closeWeights.a1;
      const a2 = recentRoll ? 100 - a1 : R.closeWeights.a2;
      const afterA1 = history[history.length - 1] === 'a1';
      const choices: WeightedChoice<SoldierAttack>[] = [
        { id: 'a1', weight: a1 },
        { id: 'a2', weight: afterA1 ? 0 : a2 },
      ];
      return (
        pickWeighted(choices, random, opts) ??
        // 立ち尽くさないよう、「A1 の後は A2 を選ばない」を緩めてもう一度
        pickWeighted(
          [
            { id: 'a1', weight: a1 },
            { id: 'a2', weight: a2 },
          ],
          random,
          opts,
        )
      );
    }
    if (distance >= R.midRange[0] && distance <= R.midRange[1]) {
      return pickWeighted<SoldierAttack>([{ id: 'a3', weight: R.midWeights.a3 }], random, {
        ...opts,
        idleWeight: 100 - R.midWeights.a3,
      });
    }
    return null;
  },
  followUp({ lastId, chain, random }) {
    // 連続は A1 の後に 1 回まで（A1 → A1b）
    if (lastId !== 'a1' || chain >= 1) return null;
    return random() < R.a1ChainChance ? 'a1b' : null;
  },
  skipHold({ distance, recentRoll }) {
    return recentRoll && distance <= R.closeRange;
  },
};

export interface UndeadAttackDeps {
  readonly combat: HitResolver;
  readonly tokens: AttackTokens;
  readonly random: () => number;
  readonly poiseOf?: (enemyId: string) => Poise | undefined;
}

/** 亡者兵 1 体分の攻撃実行を作る（`enemy.attackBehavior` に入れる）。 */
export function createUndeadAttack(deps: UndeadAttackDeps): AttackRunner {
  return new AttackRunner({
    ...deps,
    planner: UNDEAD_PLANNER,
    attacks: UNDEAD_SOLDIER_ATTACKS,
    actionPrefix: 'enemy.undead.',
    entryOf: findEnemyClipEvents,
  });
}

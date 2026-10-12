import { describe, expect, it } from 'vitest';
import * as enemyAi from './data/enemyAi';
import * as enemyAttack from './data/enemyAttack';
import * as bossData from './boss/bossData';
import * as bossMove from './boss/bossMove';
import { BOSS_MOVES, stagesOf } from './boss/bossMove';
import * as bossMoves67 from './boss/bossMoves67.system';
import './boss/moves';

/**
 * 敵・ボスの技と AI の数値の固定（#347 で JSON へ移したとき、移行前の値と一致することを確かめるために作った）。
 * スナップショットは移行前のコードから取った。数値を意図して変えたら `npx vitest -u` で更新する。
 */

const moveModules = import.meta.glob('./boss/moves/*.move.ts', { eager: true });

/** 定数（`UPPER_CASE`）の export。スキーマや関数は除く。 */
function values(mod: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mod)
      .filter(([k, v]) => /^[A-Z][A-Z0-9_]*$/.test(k) && typeof v !== 'function')
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

describe('敵・ボスのデータ', () => {
  it('雑魚敵の攻撃・AI の数値', () => {
    expect(values(enemyAttack)).toMatchSnapshot();
    expect(values(enemyAi)).toMatchSnapshot();
  });

  it('ボスの AI・重み表', () => {
    expect(values(bossData)).toMatchSnapshot();
    expect({ ...values(bossMove), ...values(bossMoves67) }).toMatchSnapshot();
  });

  it('ボスの技（段・接近・フェーズ）と技モジュールの定数', () => {
    const moves = Object.fromEntries(
      BOSS_MOVES.all().map((m) => [
        m.id,
        {
          name: m.name,
          phases: m.phases,
          approach: m.approach,
          p1: stagesOf(m, 1),
          p2: stagesOf(m, 2),
          hooks: Object.keys(m.hooks ?? {}).sort(),
        },
      ]),
    );
    expect(moves).toMatchSnapshot();
    const constants = Object.fromEntries(
      Object.entries(moveModules)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, mod]) => [path, values(mod as object)]),
    );
    expect(constants).toMatchSnapshot();
  });
});

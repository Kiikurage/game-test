import { describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, type CancelWindow } from '../data';
import { PLAYER_STATE_GRAPH, isScriptedState, type PlayerStateId } from '../player/playerStates';
import {
  CharacterFsm,
  IllegalTransitionError,
  cancelTargetMatches,
  validateStateGraph,
  type StateGraph,
} from './characterFsm';

type S = 'idle' | 'move' | 'swing' | 'hurt' | 'dead';

const graph: StateGraph<S> = {
  idle: { kind: 'idle', to: ['move', 'swing', 'hurt', 'dead'] },
  move: { kind: 'move', to: ['idle', 'swing', 'hurt', 'dead'] },
  swing: { kind: 'action', to: ['idle', 'move', 'hurt', 'dead'], actionId: 'enemy.swing' },
  hurt: { kind: 'stagger', to: ['idle', 'dead'] },
  dead: { kind: 'dead', to: [] },
};

const cancels = {
  'enemy.swing': [
    { to: 'dodge', start: 18, end: 36 },
    { to: 'attack', start: 20, end: 48 },
  ],
} as const;

function make(initial: S = 'idle') {
  return new CharacterFsm<S>(graph, initial, { cancelsOf: (id) => cancels[id as 'enemy.swing'] });
}

describe('CharacterFsm: 遷移', () => {
  it('宣言された遷移は通り、状態フレームは 0 から数え直す', () => {
    const fsm = make();
    fsm.advance();
    fsm.advance();
    expect(fsm.stateFrame).toBe(2);
    fsm.transition('swing');
    expect(fsm.state).toBe('swing');
    expect(fsm.stateFrame).toBe(0);
    expect(fsm.advance()).toBe(1);
  });

  it('宣言にない遷移は IllegalTransitionError で拒否され、状態は変わらない', () => {
    const fsm = make('hurt');
    expect(fsm.canTransition('swing')).toBe(false);
    expect(() => {
      fsm.transition('swing');
    }).toThrow(IllegalTransitionError);
    expect(fsm.state).toBe('hurt');
    // Dead は終端
    const dead = make('dead');
    expect(() => {
      dead.transition('idle');
    }).toThrow(/dead → idle/);
  });

  it('tryTransition は不正なら false を返して何もしない', () => {
    const fsm = make('hurt');
    expect(fsm.tryTransition('move')).toBe(false);
    expect(fsm.state).toBe('hurt');
    expect(fsm.tryTransition('idle')).toBe(true);
    expect(fsm.state).toBe('idle');
  });

  it('同じ状態への遷移は何もしない（状態フレームも保つ）', () => {
    const fsm = make();
    fsm.advance();
    fsm.transition('idle');
    expect(fsm.stateFrame).toBe(1);
  });

  it('transition の frame 指定で同一ステップ内の名前だけの切り替えができる', () => {
    const fsm = make();
    fsm.advance();
    fsm.transition('move', { frame: 1 });
    expect(fsm.stateFrame).toBe(1);
  });

  it('reset はグラフを無視して置く', () => {
    const fsm = make('dead');
    fsm.reset('idle');
    expect(fsm.state).toBe('idle');
    expect(fsm.stateFrame).toBe(0);
  });

  it('未定義の状態は拒否する', () => {
    expect(() => make('nope' as S)).toThrow(RangeError);
    expect(() => {
      make().transition('nope' as S);
    }).toThrow(RangeError);
  });

  it('分類（kind）・動作 ID・行動不能', () => {
    const fsm = make();
    expect(fsm.kind).toBe('idle');
    expect(fsm.actionId).toBeNull();
    expect(fsm.isBusy).toBe(false);
    fsm.transition('swing');
    expect(fsm.kind).toBe('action');
    expect(fsm.actionId).toBe('enemy.swing');
    expect(fsm.isBusy).toBe(true);
  });
});

describe('CharacterFsm: キャンセル窓', () => {
  it('窓は両端を含み、Action 以外では常に false', () => {
    const fsm = make();
    expect(fsm.canCancelTo('dodge', 20)).toBe(false);
    fsm.transition('swing');
    const at = (frame: number, to: Parameters<typeof fsm.canCancelTo>[0]) =>
      fsm.canCancelTo(to, frame);
    expect(at(17, 'dodge')).toBe(false);
    expect(at(18, 'dodge')).toBe(true);
    expect(at(36, 'dodge')).toBe(true);
    expect(at(37, 'dodge')).toBe(false);
    // 指定のない先へはキャンセルできない
    expect(at(30, 'guard')).toBe(false);
  });

  it('現在の状態フレームで判定する', () => {
    const fsm = make();
    fsm.transition('swing');
    for (let i = 0; i < 17; i++) fsm.advance();
    expect(fsm.canCancelTo('dodge')).toBe(false);
    fsm.advance();
    expect(fsm.canCancelTo('dodge')).toBe(true);
  });

  it('attack は軽・強どちらの問い合わせにも一致する', () => {
    expect(cancelTargetMatches('attack', 'lightAttack')).toBe(true);
    expect(cancelTargetMatches('attack', 'heavyAttack')).toBe(true);
    expect(cancelTargetMatches('lightAttack', 'attack')).toBe(true);
    expect(cancelTargetMatches('lightAttack', 'heavyAttack')).toBe(false);
    expect(cancelTargetMatches('dodge', 'guard')).toBe(false);
    const fsm = make();
    fsm.transition('swing');
    expect(fsm.canCancelTo('lightAttack', 25)).toBe(true);
    expect(fsm.canCancelTo('heavyAttack', 25)).toBe(true);
    expect(fsm.canCancelTo('lightAttack', 19)).toBe(false);
  });

  it('窓の終端が全体を超えるコンボ窓も判定できる', () => {
    const fsm = make();
    fsm.transition('swing');
    expect(fsm.canCancelTo('attack', 48)).toBe(true);
    expect(fsm.canCancelTo('attack', 49)).toBe(false);
  });
});

describe('CharacterFsm: ヒットストップの凍結', () => {
  it('freeze した回数だけ consumeFreeze が true を返し、その後は通常に戻る', () => {
    const fsm = make();
    fsm.freeze(3);
    expect(fsm.freezeRemaining).toBe(3);
    const results = [1, 2, 3, 4, 5].map(() => fsm.consumeFreeze());
    expect(results).toEqual([true, true, true, false, false]);
    expect(fsm.freezeRemaining).toBe(0);
  });

  it('isFrozenStep は直近のステップが凍結だったか', () => {
    const fsm = make();
    fsm.freeze(1);
    expect(fsm.isFrozenStep).toBe(false);
    fsm.consumeFreeze();
    expect(fsm.isFrozenStep).toBe(true);
    fsm.consumeFreeze();
    expect(fsm.isFrozenStep).toBe(false);
  });

  it('重ねがけは長い方を残し、不正な値は拒否する', () => {
    const fsm = make();
    fsm.freeze(4);
    fsm.freeze(2);
    expect(fsm.freezeRemaining).toBe(4);
    fsm.freeze(8);
    expect(fsm.freezeRemaining).toBe(8);
    expect(() => {
      fsm.freeze(-1);
    }).toThrow(RangeError);
    expect(() => {
      fsm.freeze(1.5);
    }).toThrow(RangeError);
  });
});

describe('グラフの検証', () => {
  it('正しいグラフは問題なし', () => {
    expect(validateStateGraph(graph)).toEqual([]);
  });

  it('未定義の遷移先・自己遷移・actionId の誤用を検出する', () => {
    const bad = {
      a: { kind: 'idle', to: ['b', 'a'], actionId: 'x' },
      b: { kind: 'move', to: ['zzz'] },
    } as unknown as StateGraph<'a' | 'b'>;
    const problems = validateStateGraph(bad);
    expect(problems.some((p) => p.includes('a → a'))).toBe(true);
    expect(problems.some((p) => p.includes('b → zzz'))).toBe(true);
    expect(problems.some((p) => p.includes('actionId'))).toBe(true);
  });
});

describe('プレイヤーの状態グラフ', () => {
  it('整合している', () => {
    expect(validateStateGraph(PLAYER_STATE_GRAPH)).toEqual([]);
  });

  it('Action 状態の動作 ID は PLAYER_ACTIONS のキーか、フレームデータを持たない着地・強攻撃の溜め・状況アクション', () => {
    for (const [id, spec] of Object.entries(PLAYER_STATE_GRAPH) as [
      PlayerStateId,
      (typeof PLAYER_STATE_GRAPH)[PlayerStateId],
    ][]) {
      if (spec.kind !== 'action') continue;
      expect(
        id in PLAYER_ACTIONS || id === 'land' || id === 'heavyCharge' || isScriptedState(id),
        id,
      ).toBe(true);
    }
  });

  it('ロールのキャンセル窓: F26 から移動・攻撃・ガード・回復へ', () => {
    const fsm = new CharacterFsm<PlayerStateId>(PLAYER_STATE_GRAPH, 'idle', {
      cancelsOf: (id) =>
        (PLAYER_ACTIONS as Readonly<Record<string, { cancels: readonly CancelWindow[] }>>)[id]
          ?.cancels,
    });
    fsm.transition('roll');
    expect(fsm.canCancelTo('move', 25)).toBe(false);
    expect(fsm.canCancelTo('move', 26)).toBe(true);
    expect(fsm.canCancelTo('lightAttack', 26)).toBe(true);
    expect(fsm.canCancelTo('guard', 32)).toBe(true);
    expect(fsm.canCancelTo('heal', 26)).toBe(true);
    expect(fsm.canCancelTo('move', 33)).toBe(false);
  });

  it('不正遷移（バックステップ中にロール、着地硬直から着地など）を拒否する', () => {
    const fsm = new CharacterFsm<PlayerStateId>(PLAYER_STATE_GRAPH, 'backstep');
    expect(fsm.canTransition('roll')).toBe(false);
    expect(() => {
      fsm.transition('roll');
    }).toThrow(IllegalTransitionError);
    expect(new CharacterFsm<PlayerStateId>(PLAYER_STATE_GRAPH, 'land').canTransition('land')).toBe(
      false,
    );
  });
});

import { describe, expect, it } from 'vitest';
import type { Action, InputDevice } from '../../core/input';
import { interactPromptText } from '../../core/controlHints';
import { HINTS, NOTICE } from '../data/guide';
import { HintModel, type HintSample } from './hintModel';
import { NoticeModel } from './noticeModel';

const DT = 1 / 60;

function sample(over: Partial<HintSample> = {}): HintSample {
  return {
    dt: DT,
    moveMagnitude: 0,
    lookMagnitude: 0,
    pressed: new Set<Action>(),
    lockedOn: false,
    enemyNear: false,
    suppressed: false,
    ...over,
  };
}

function run(m: HintModel, seconds: number, over: Partial<HintSample> = {}): void {
  for (let i = 0; i < Math.ceil(seconds / DT); i++) m.step(sample(over));
}

describe('HintModel', () => {
  it('shows move, then camera, then roll in order, each disappearing on completion', () => {
    const m = new HintModel(HINTS);
    m.step(sample());
    expect(m.current?.id).toBe('move');
    // 別の操作では進まない
    run(m, 1, { lookMagnitude: 0.1 });
    expect(m.current?.id).toBe('move');
    run(m, 0.5, { moveMagnitude: 1 });
    expect(m.isDone('move')).toBe(true);
    expect(m.current?.id).toBe('camera');
    m.step(sample({ lookMagnitude: 1 }));
    expect(m.current?.id).toBe('roll');
    m.step(sample({ pressed: new Set<Action>(['dodge']) }));
    m.step(sample());
    expect(m.current).toBeNull();
  });

  it('needs sustained movement above the threshold', () => {
    const m = new HintModel(HINTS);
    m.step(sample());
    run(m, 2, { moveMagnitude: 0.1 });
    expect(m.isDone('move')).toBe(false);
    m.step(sample({ moveMagnitude: 1 }));
    expect(m.isDone('move')).toBe(false);
  });

  it('waits for the opening delay', () => {
    const m = new HintModel(HINTS, 1);
    run(m, 0.5);
    expect(m.current).toBeNull();
    run(m, 0.6);
    expect(m.current?.id).toBe('move');
  });

  it('shows combat hints only near an enemy, ahead of the opening hints, in order', () => {
    const m = new HintModel(HINTS);
    m.step(sample());
    expect(m.current?.id).toBe('move');
    m.step(sample({ enemyNear: true }));
    expect(m.current?.id).toBe('lockOn');
    m.step(sample({ enemyNear: true, lockedOn: true }));
    expect(m.current?.id).toBe('lightAttack');
    // 敵から離れたら opening に戻る
    m.step(sample());
    expect(m.current?.id).toBe('move');
    m.step(sample({ enemyNear: true }));
    m.step(sample({ enemyNear: true, pressed: new Set<Action>(['lightAttack']) }));
    expect(m.isDone('lightAttack')).toBe(true);
    m.step(sample({ enemyNear: true }));
    expect(m.current?.id).toBe('move'); // combat は済み
  });

  it('does not advance hidden hints and hides while suppressed', () => {
    const m = new HintModel(HINTS);
    m.step(sample());
    m.step(sample({ suppressed: true }));
    expect(m.current).toBeNull();
    // 非表示中の入力ではロールのヒントは進まない
    m.step(sample({ suppressed: true, pressed: new Set<Action>(['dodge']) }));
    expect(m.isDone('roll')).toBe(false);
    m.step(sample());
    expect(m.current?.id).toBe('move');
  });

  it('has text for every device in every hint', () => {
    const devices: InputDevice[] = ['kbm', 'gamepad', 'touch'];
    for (const h of HINTS) for (const d of devices) expect(h.text[d].length).toBeGreaterThan(0);
    expect(HINTS.find((h) => h.id === 'roll')?.text.kbm).toContain('Space');
    expect(HINTS.find((h) => h.id === 'roll')?.text.touch).toContain('回避');
  });
});

describe('interactPromptText', () => {
  it('uses the right key per device', () => {
    expect(interactPromptText('kbm', '休む')).toBe('E 休む');
    expect(interactPromptText('gamepad', '押す')).toBe('A 押す');
    expect(interactPromptText('touch', '拾う')).toBe('タップ：拾う');
  });
});

describe('NoticeModel', () => {
  it('shows a notice for its duration, then clears', () => {
    const n = new NoticeModel();
    n.push('回復瓶を手に入れた');
    n.step(DT);
    expect(n.current?.text).toBe('回復瓶を手に入れた');
    for (let i = 0; i < NOTICE.seconds * 60 - 5; i++) n.step(DT);
    expect(n.current).not.toBeNull();
    for (let i = 0; i < 10; i++) n.step(DT);
    expect(n.current).toBeNull();
  });

  it('queues simultaneous notices and shows them one at a time in order', () => {
    const n = new NoticeModel();
    n.push('A', 1);
    n.push('B', 1);
    n.step(DT);
    expect(n.current?.text).toBe('A');
    expect(n.pending).toBe(1);
    const seen: string[] = ['A'];
    for (let i = 0; i < 300; i++) {
      n.step(DT);
      const t = n.current?.text;
      if (t && t !== seen[seen.length - 1]) seen.push(t);
    }
    expect(seen).toEqual(['A', 'B']);
    expect(n.current).toBeNull();
  });

  it('drops the oldest waiting notices past the queue limit', () => {
    const n = new NoticeModel();
    for (let i = 0; i < NOTICE.maxQueue + 3; i++) n.push(`n${i}`);
    expect(n.pending).toBe(NOTICE.maxQueue);
    n.step(DT);
    expect(n.current?.text).toBe('n3');
  });

  it('gives each notice a new id even with the same text', () => {
    const n = new NoticeModel();
    n.push('X', 0.1);
    n.push('X', 0.1);
    n.step(DT);
    const first = n.current?.id;
    for (let i = 0; i < 60; i++) n.step(DT);
    expect(n.current?.id).not.toBe(first);
  });
});

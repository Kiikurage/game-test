import { describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS, type FrameWindow } from '../data';
import {
  elapsedFramesToClipTime,
  parseClipEventTable,
  playbackRate,
  type ClipEventEntry,
} from './eventMarkers';
import { MarkerDispatcher, type AnimMarkerEvent } from './markerDispatcher';
import { getPlayerClipEvents } from './playerClips';

function entry(): ClipEventEntry {
  const table = parseClipEventTable({
    version: 1,
    entries: [
      {
        id: 'x.swing',
        clip: 'Sword_Regular_A',
        clipFps: 30,
        clipRange: { startFrame: 0, endFrame: 13 },
        clipHitFrame: 8,
        spec: { startup: 12, active: 4, recovery: 20 },
        markers: [
          { type: 'footstep', frame: 3 },
          { type: 'invulnStart', frame: 5 },
          { type: 'invulnEnd', frame: 10 },
          { type: 'hitStart', frame: 13 },
          { type: 'footstep', frame: 13 },
          { type: 'hitEnd', frame: 16 },
          { type: 'cancelOpen', frame: 20 },
        ],
      },
    ],
  });
  const e = table.entries[0];
  if (!e) throw new Error('no entry');
  return e;
}

/** F1 から `last` まで 1 フレームずつ進め、フレームごとの発火を返す。 */
function run(d: MarkerDispatcher, last: number) {
  const fired = new Map<number, AnimMarkerEvent[]>();
  const windows = new Map<number, { hit: boolean; invuln: boolean; cancel: boolean }>();
  for (let f = 1; f <= last; f++) {
    const out: AnimMarkerEvent[] = [];
    d.advance(f, out);
    if (out.length) fired.set(f, out);
    windows.set(f, { hit: d.hitActive, invuln: d.invulnerable, cancel: d.cancelOpen });
  }
  return { fired, windows };
}

describe('MarkerDispatcher: 発火フレームと順序', () => {
  it('各マーカーは表のフレームちょうどに 1 度だけ発火し、同一フレームは記述順', () => {
    const d = new MarkerDispatcher();
    d.begin(entry());
    const { fired } = run(d, 40);
    const flat = [...fired].flatMap(([f, es]) => es.map((e) => `${f}:${e.type}`));
    expect(flat).toEqual([
      '3:footstep',
      '5:invulnStart',
      '10:invulnEnd',
      '13:hitStart',
      '13:footstep',
      '16:hitEnd',
      '20:cancelOpen',
    ]);
    // 動作 ID とフレームが付く
    expect(fired.get(5)?.[0]).toMatchObject({ actionId: 'x.swing', frame: 5 });
  });

  it('フレームが飛んでも取りこぼさず、フレーム昇順で出る。同じフレームを再度進めても重複しない', () => {
    const d = new MarkerDispatcher();
    d.begin(entry());
    const out: AnimMarkerEvent[] = [];
    d.advance(14, out);
    expect(out.map((e) => e.frame)).toEqual([3, 5, 10, 13, 13]);
    out.length = 0;
    d.advance(14, out);
    d.advance(13, out);
    expect(out).toEqual([]);
    d.advance(30, out);
    expect(out.map((e) => e.type)).toEqual(['hitEnd', 'cancelOpen']);
  });

  it('begin し直すと最初から数える。表のない動作は何も発火しない', () => {
    const d = new MarkerDispatcher();
    d.begin(entry());
    run(d, 40);
    d.begin(entry());
    const out: AnimMarkerEvent[] = [];
    d.advance(3, out);
    expect(out.map((e) => e.type)).toEqual(['footstep']);
    d.begin(undefined);
    out.length = 0;
    d.advance(50, out);
    expect(out).toEqual([]);
    expect(d.actionId).toBeUndefined();
  });
});

describe('MarkerDispatcher: 窓の状態（両端を含む）', () => {
  it('当たり窓は F13–F16、無敵窓は F5–F10、キャンセルは F20 以降', () => {
    const d = new MarkerDispatcher();
    d.begin(entry());
    const { windows } = run(d, 40);
    const frames = (pick: 'hit' | 'invuln' | 'cancel') =>
      [...windows].filter(([, w]) => w[pick]).map(([f]) => f);
    expect(frames('hit')).toEqual([13, 14, 15, 16]);
    expect(frames('invuln')).toEqual([5, 6, 7, 8, 9, 10]);
    expect(frames('cancel')[0]).toBe(20);
    expect(frames('cancel').at(-1)).toBe(40);
  });

  it('多段ヒット（hitEnd の直後フレームに次の hitStart）でも窓が途切れず再開する', () => {
    const table = parseClipEventTable({
      version: 1,
      entries: [
        {
          id: 'multi',
          clip: 'Sword_Regular_A',
          clipFps: 30,
          clipRange: { startFrame: 0, endFrame: 13 },
          clipHitFrame: 8,
          spec: { startup: 2, active: 6, recovery: 2 },
          markers: [
            { type: 'hitStart', frame: 3 },
            { type: 'hitEnd', frame: 4 },
            { type: 'hitStart', frame: 5 },
            { type: 'hitEnd', frame: 8 },
          ],
        },
      ],
    });
    const d = new MarkerDispatcher();
    d.begin(table.entries[0]);
    const { windows } = run(d, 10);
    const active = [...windows].filter(([, w]) => w.hit).map(([f]) => f);
    expect(active).toEqual([3, 4, 5, 6, 7, 8]);
  });
});

describe('プレイヤーのマーカー表: 仕様書のフレームデータと一致', () => {
  it('ロール: 無敵 F4–F15、キャンセル F26（PLAYER_ACTIONS と同じ）', () => {
    const e = getPlayerClipEvents('player.roll');
    const d = new MarkerDispatcher();
    d.begin(e);
    const { windows } = run(d, 32);
    const invuln = [...windows].filter(([, w]) => w.invuln).map(([f]) => f);
    const w: FrameWindow = PLAYER_ACTIONS.roll.invuln;
    expect(invuln[0]).toBe(w.start);
    expect(invuln.at(-1)).toBe(w.end);
    expect(invuln).toHaveLength(w.end - w.start + 1);
    const cancel = [...windows].find(([, x]) => x.cancel)?.[0];
    expect(cancel).toBe(PLAYER_ACTIONS.roll.cancels.find((c) => c.to === 'move')?.start);
  });

  it('バックステップ: 無敵 F1–F8、F18 からキャンセル', () => {
    const d = new MarkerDispatcher();
    d.begin(getPlayerClipEvents('player.backstep'));
    const { windows } = run(d, 22);
    const invuln = [...windows].filter(([, w]) => w.invuln).map(([f]) => f);
    expect(invuln[0]).toBe(PLAYER_ACTIONS.backstep.invuln.start);
    expect(invuln.at(-1)).toBe(PLAYER_ACTIONS.backstep.invuln.end);
    expect([...windows].find(([, x]) => x.cancel)?.[0]).toBe(
      PLAYER_ACTIONS.backstep.cancels[0].start,
    );
  });

  it('軽攻撃 1: 当たりは F13–F16、cancelOpen は最初の軽攻撃キャンセル窓（F20）', () => {
    const e = getPlayerClipEvents('player.light1');
    const d = new MarkerDispatcher();
    d.begin(e);
    const { windows } = run(d, 36);
    const hit = [...windows].filter(([, w]) => w.hit).map(([f]) => f);
    expect(hit).toEqual([13, 14, 15, 16]);
    expect([...windows].find(([, x]) => x.cancel)?.[0]).toBe(
      PLAYER_ACTIONS.light1.cancels.find((c) => c.to === 'lightAttack')?.start,
    );
  });
});

describe('playbackRate 適用後のタイミング', () => {
  it('軽攻撃 1: hitStart（F13）の開始時刻がクリップの振り抜きフレームに一致する', () => {
    const e = getPlayerClipEvents('player.light1');
    // 12F（発生）経過した時点 = F13 の開始 = クリップ内 F8
    expect(elapsedFramesToClipTime(e, 12)).toBeCloseTo(8 / 30, 10);
    expect(playbackRate(e)).toBeCloseTo(8 / 30 / (12 / 60), 10);
  });

  it('ロール: 32F でクリップ 1.4s ちょうどを使い切る（再生範囲を全体フレームに合わせる）', () => {
    const e = getPlayerClipEvents('player.roll');
    expect(elapsedFramesToClipTime(e, 0)).toBe(0);
    expect(elapsedFramesToClipTime(e, 32)).toBeCloseTo(1.4, 10);
    expect(elapsedFramesToClipTime(e, 16)).toBeCloseTo(0.7, 10);
  });

  it('バックステップ: 逆再生で 22F かけて Sword_Dash の 0.4s を戻る', () => {
    const e = getPlayerClipEvents('player.backstep');
    expect(elapsedFramesToClipTime(e, 0)).toBeCloseTo(0.4, 10);
    expect(elapsedFramesToClipTime(e, 22)).toBeCloseTo(0, 10);
    expect(elapsedFramesToClipTime(e, 11)).toBeCloseTo(0.2, 10);
  });
});

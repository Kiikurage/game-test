import { describe, expect, it } from 'vitest';
import {
  AnimDataError,
  clipTimeToSimFrame,
  elapsedFramesToClipTime,
  indexClipEvents,
  markerClipTime,
  markersOfType,
  parseClipEventTable,
  playbackRate,
  simFrameToClipTime,
  totalFrames,
} from './eventMarkers';
import { getPlayerClipEvents, playerClipEvents } from './playerClips';

function entry(patch: Record<string, unknown> = {}) {
  return {
    id: 'a',
    clip: 'Sword_Regular_A',
    clipFps: 30,
    clipRange: { startFrame: 0, endFrame: 24 },
    clipHitFrame: 6,
    spec: { startup: 12, active: 4, recovery: 20 },
    markers: [
      { type: 'hitStart', frame: 13 },
      { type: 'hitEnd', frame: 16 },
      { type: 'cancelOpen', frame: 20 },
    ],
    ...patch,
  };
}
const table = (...entries: unknown[]) => ({ version: 1, entries });
const parse = (patch?: Record<string, unknown>) => parseClipEventTable(table(entry(patch)));
const first = (patch?: Record<string, unknown>) => {
  const e = parse(patch).entries[0];
  if (!e) throw new Error('no entry');
  return e;
};

describe('parseClipEventTable: 正常系', () => {
  it('エントリを読み込める', () => {
    const t = parse();
    expect(t.entries).toHaveLength(1);
    expect(t.entries[0]?.markers.map((m) => m.type)).toEqual(['hitStart', 'hitEnd', 'cancelOpen']);
  });

  it('全マーカー種別を受け付ける', () => {
    const markers = [
      { type: 'footstep', frame: 1 },
      { type: 'invulnStart', frame: 4 },
      { type: 'invulnEnd', frame: 15 },
      { type: 'healApply', frame: 26 },
    ];
    expect(() => parse({ markers, spec: { startup: 3, active: 0, recovery: 29 } })).not.toThrow();
  });

  it('多段ヒット（hitStart/hitEnd の複数組）を受け付ける', () => {
    const markers = [
      { type: 'hitStart', frame: 13 },
      { type: 'hitEnd', frame: 14 },
      { type: 'hitStart', frame: 15 },
      { type: 'hitEnd', frame: 16 },
    ];
    expect(() => parse({ markers })).not.toThrow();
  });

  it('マーカーなしも可', () => {
    expect(() => parse({ markers: [] })).not.toThrow();
  });
});

describe('parseClipEventTable: 異常系', () => {
  const bad = (patch: Record<string, unknown>, re: RegExp) => {
    expect(() => parse(patch)).toThrow(AnimDataError);
    expect(() => parse(patch)).toThrow(re);
  };

  it('ルート・バージョン', () => {
    expect(() => parseClipEventTable(null)).toThrow(AnimDataError);
    expect(() => parseClipEventTable({ version: 2, entries: [] })).toThrow(/バージョン/);
    expect(() => parseClipEventTable({ version: 1 })).toThrow(/配列/);
  });

  it('id 重複', () => {
    expect(() => parseClipEventTable(table(entry(), entry()))).toThrow(/重複/);
  });

  it('マーカー順序の矛盾: フレーム降順', () => {
    bad(
      {
        markers: [
          { type: 'cancelOpen', frame: 20 },
          { type: 'hitStart', frame: 13 },
          { type: 'hitEnd', frame: 16 },
        ],
      },
      /昇順/,
    );
  });

  it('マーカー順序の矛盾: 開始なし / 終了なし / 連続 / 終了が先', () => {
    bad({ markers: [{ type: 'hitEnd', frame: 16 }] }, /hitStart がありません/);
    bad({ markers: [{ type: 'hitStart', frame: 13 }] }, /hitEnd がありません/);
    bad(
      {
        markers: [
          { type: 'hitStart', frame: 13 },
          { type: 'hitStart', frame: 14 },
          { type: 'hitEnd', frame: 16 },
        ],
      },
      /連続/,
    );
    bad(
      {
        markers: [
          { type: 'invulnEnd', frame: 10 },
          { type: 'invulnStart', frame: 12 },
        ],
      },
      /invulnStart がありません/,
    );
  });

  it('当たり窓が仕様の発生・持続と食い違う', () => {
    bad(
      {
        markers: [
          { type: 'hitStart', frame: 12 },
          { type: 'hitEnd', frame: 16 },
        ],
      },
      /最初の hitStart は F13/,
    );
    bad(
      {
        markers: [
          { type: 'hitStart', frame: 13 },
          { type: 'hitEnd', frame: 17 },
        ],
      },
      /最後の hitEnd は F16/,
    );
  });

  it('範囲外フレーム（境界: 0 と 全体+1）', () => {
    bad({ markers: [{ type: 'footstep', frame: 0 }] }, /1 以上/);
    bad({ markers: [{ type: 'footstep', frame: 37 }] }, /36 を超えて/);
    expect(() => parse({ markers: [{ type: 'footstep', frame: 36 }] })).not.toThrow();
    expect(() => parse({ markers: [{ type: 'footstep', frame: 1 }] })).not.toThrow();
  });

  it('型・値の不正', () => {
    bad({ markers: [{ type: 'footstep', frame: 1.5 }] }, /整数/);
    bad({ markers: [{ type: 'bogus', frame: 1 }] }, /未知/);
    bad({ clipFps: 0 }, /より大きい/);
    bad({ clip: '' }, /文字列/);
    bad({ spec: { startup: 0, active: 4, recovery: 20 } }, /1 以上/);
    bad({ clipRange: { startFrame: 5, endFrame: 5 } }, /startFrame より大きい/);
    bad({ clipHitFrame: 0 }, /範囲/);
    bad({ clipHitFrame: 25 }, /範囲/);
  });

  it('エラーに位置が含まれる', () => {
    try {
      parse({ markers: [{ type: 'footstep', frame: 99 }] });
      expect.unreachable();
    } catch (e) {
      expect((e as AnimDataError).path).toBe('$.entries[0].markers[0].frame');
    }
  });
});

describe('playbackRate と時間変換', () => {
  // クリップ 30fps、当たりは 6 フレーム目 = 0.2s。仕様の発生 12F = 0.2s。 → 1.0 倍
  const e1 = first();

  it('playbackRate: クリップの当たり秒 ÷ 仕様の発生秒', () => {
    expect(totalFrames(e1)).toBe(36);
    expect(playbackRate(e1)).toBeCloseTo(1, 10);
    // 当たりが 9 フレーム目（0.3s）なら 1.5 倍
    expect(playbackRate(first({ clipHitFrame: 9 }))).toBeCloseTo(1.5, 10);
    // 発生 24F（0.4s）に対し当たり 0.2s → 0.5 倍
    const slow = first({
      spec: { startup: 24, active: 4, recovery: 20 },
      markers: [
        { type: 'hitStart', frame: 25 },
        { type: 'hitEnd', frame: 28 },
      ],
    });
    expect(playbackRate(slow)).toBeCloseTo(0.5, 10);
  });

  it('clipFps 60 では「クリップ内の当たりフレーム ÷ 仕様の発生フレーム」と一致する', () => {
    const e = first({
      clipFps: 60,
      clipRange: { startFrame: 0, endFrame: 60 },
      clipHitFrame: 18,
    });
    expect(playbackRate(e)).toBeCloseTo(18 / 12, 10);
  });

  it('F1 はクリップ範囲の先頭、hitStart は当たりフレームの時刻', () => {
    expect(simFrameToClipTime(e1, 1)).toBe(0);
    const hit = markersOfType(e1, 'hitStart')[0];
    if (!hit) throw new Error('no hitStart');
    expect(markerClipTime(e1, hit)).toBeCloseTo(6 / 30, 10);
    expect(elapsedFramesToClipTime(e1, 12)).toBeCloseTo(6 / 30, 10);
  });

  it('範囲開始が 0 でない場合はオフセットされ、範囲外は端に丸める', () => {
    const e = first({ clipRange: { startFrame: 10, endFrame: 34 }, clipHitFrame: 16 });
    expect(simFrameToClipTime(e, 1)).toBeCloseTo(10 / 30, 10);
    expect(simFrameToClipTime(e, 13)).toBeCloseTo(16 / 30, 10);
    expect(simFrameToClipTime(e, 1000)).toBeCloseTo(34 / 30, 10);
    expect(simFrameToClipTime(e, -5)).toBeCloseTo(10 / 30, 10);
  });

  it('フレーム ⇔ 秒が往復で一致する', () => {
    const e = first({ clipHitFrame: 9 });
    // 1.5 倍で再生範囲（24 フレーム = 0.8s）を使い切るのは F28 まで。以降は端に丸まる。
    for (const f of [1, 2, 13, 20, 28]) {
      expect(clipTimeToSimFrame(e, simFrameToClipTime(e, f))).toBeCloseTo(f, 8);
    }
  });
});

describe('当たりのない動作と逆再生', () => {
  const roll = () =>
    first({
      id: 'r',
      clip: 'Roll',
      clipRange: { startFrame: 0, endFrame: 42 },
      clipHitFrame: undefined,
      spec: { startup: 3, active: 0, recovery: 29 },
      markers: [
        { type: 'invulnStart', frame: 4 },
        { type: 'invulnEnd', frame: 15 },
      ],
    });

  it('clipHitFrame がなければ再生範囲の全体を全体フレームに合わせる（ロール 1.4s → 32F = 2.625 倍）', () => {
    const e = roll();
    expect(e.clipHitFrame).toBeUndefined();
    expect(playbackRate(e)).toBeCloseTo(2.625, 10);
    // 最終フレーム F32 の終わり（= F33 の開始）でクリップ範囲の終端
    expect(simFrameToClipTime(e, 33)).toBeCloseTo(1.4, 10);
  });

  it('reverse: 終端から先頭へ進み、往復変換も一致する', () => {
    const e = first({
      clipRange: { startFrame: 0, endFrame: 12 },
      clipHitFrame: undefined,
      reverse: true,
      spec: { startup: 2, active: 0, recovery: 20 },
      markers: [],
    });
    expect(simFrameToClipTime(e, 1)).toBeCloseTo(0.4, 10);
    expect(simFrameToClipTime(e, 23)).toBeCloseTo(0, 10);
    for (const f of [1, 5, 12, 22]) {
      expect(clipTimeToSimFrame(e, simFrameToClipTime(e, f))).toBeCloseTo(f, 8);
    }
  });

  it('reverse は真偽値のみ', () => {
    expect(() => parse({ reverse: 1 })).toThrow(/真偽値/);
  });
});

describe('サンプルデータ（軽攻撃 1）', () => {
  const e = getPlayerClipEvents('player.light1');

  it('ローダで読み込め、仕様書 2.3 節と一致する', () => {
    expect(playerClipEvents.entries.map((x) => x.id)).toEqual([
      'player.light1',
      'player.roll',
      'player.backstep',
    ]);
    expect(e.spec).toEqual({ startup: 12, active: 4, recovery: 20 });
    expect(totalFrames(e)).toBe(36);
    expect(e.markers).toEqual([
      { type: 'hitStart', frame: 13 },
      { type: 'hitEnd', frame: 16 },
      { type: 'cancelOpen', frame: 20 },
    ]);
    // 実クリップ（Sword_Regular_A）の振り抜き = クリップ内 F8（clipMeasure.mjs の実測）
    expect(e.clipHitFrame).toBe(8);
    expect(playbackRate(e)).toBeCloseTo(8 / 30 / 0.2, 10);
  });

  it('indexClipEvents: 未知の id は例外', () => {
    expect(() => indexClipEvents(playerClipEvents)('nope')).toThrow();
  });
});

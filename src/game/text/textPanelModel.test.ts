import { describe, expect, it } from 'vitest';
import { TEXT_PANEL } from '../data/textPanel';
import { formatText, TextPanelModel } from './textPanelModel';

const DT = 1 / 60;

describe('formatText', () => {
  it('turns （改行） into a newline', () => {
    expect(formatText('一行目（改行）二行目')).toBe('一行目\n二行目');
    expect(formatText('（改行）a（改行）（改行）b')).toBe('\na\n\nb');
    expect(formatText('そのまま')).toBe('そのまま');
  });
});

describe('TextPanelModel: read', () => {
  it('closes after the 6 second limit (boundary)', () => {
    const m = new TextPanelModel();
    m.show(['碑文'], 'read', 0, 0);
    // 0.5 秒刻み（浮動小数の誤差を避ける）。5.5 秒まではまだ表示、6 秒ちょうどで閉じる
    for (let i = 0; i < 11; i++) m.step(0.5, 0, 0);
    expect(m.active).toBe(true);
    m.step(0.5, 0, 0);
    expect(m.active).toBe(false);
  });

  it('closes when the player moves 2m away, not before', () => {
    const m = new TextPanelModel();
    m.show(['碑文'], 'read', 1, 1);
    m.step(DT, 1 + 1.99, 1);
    expect(m.active).toBe(true);
    m.step(DT, 1 + 2, 1);
    expect(m.active).toBe(false);
  });

  it('measures the distance in the horizontal plane from where it opened', () => {
    const m = new TextPanelModel();
    m.show(['碑文'], 'read', 0, 0);
    m.step(DT, 1.5, 1.5); // 2.12m
    expect(m.active).toBe(false);
  });

  it('joins multiple lines with line breaks and handles （改行）', () => {
    const m = new TextPanelModel();
    m.show(['a（改行）b', 'c'], 'read', 0, 0);
    expect(m.current?.text).toBe('a\nb\nc');
    expect(m.current?.total).toBe(1);
  });

  it('showing again restarts the timer and gives a new page id', () => {
    const m = new TextPanelModel();
    m.show(['x'], 'read', 0, 0);
    const first = m.current?.id;
    for (let i = 0; i < 300; i++) m.step(DT, 0, 0);
    m.show(['x'], 'read', 0, 0);
    expect(m.current?.id).not.toBe(first);
    for (let i = 0; i < 300; i++) m.step(DT, 0, 0);
    expect(m.active).toBe(true);
  });

  it('advance does nothing for read', () => {
    const m = new TextPanelModel();
    m.show(['x'], 'read', 0, 0);
    m.advance();
    expect(m.active).toBe(true);
  });

  it('ignores an empty text', () => {
    const m = new TextPanelModel();
    m.show([], 'read', 0, 0);
    expect(m.active).toBe(false);
  });
});

describe('TextPanelModel: conversation', () => {
  const lines = ['一', '二', '三', '四'];

  it('advances one line at a time and closes after the last line', () => {
    const m = new TextPanelModel();
    m.show(lines, 'conversation', 0, 0);
    expect(m.current).toMatchObject({ text: '一', index: 0, total: 4 });
    m.advance();
    expect(m.current?.text).toBe('二');
    m.advance();
    m.advance();
    expect(m.current).toMatchObject({ text: '四', index: 3 });
    m.advance();
    expect(m.active).toBe(false);
  });

  it('has no time limit', () => {
    const m = new TextPanelModel();
    m.show(lines, 'conversation', 0, 0);
    for (let i = 0; i < 60 * 60; i++) m.step(DT, 0, 0);
    expect(m.active).toBe(true);
  });

  it('closes when the player moves, and starts from the first line next time', () => {
    const m = new TextPanelModel();
    m.show(lines, 'conversation', 0, 0);
    m.advance();
    m.advance();
    m.step(DT, TEXT_PANEL.closeDistanceM, 0);
    expect(m.active).toBe(false);
    m.show(lines, 'conversation', 0, 0);
    expect(m.current).toMatchObject({ text: '一', index: 0 });
  });

  it('handles （改行） inside a line', () => {
    const m = new TextPanelModel();
    m.show(['a（改行）b', 'c'], 'conversation', 0, 0);
    expect(m.current?.text).toBe('a\nb');
  });
});

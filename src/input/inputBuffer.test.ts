import { describe, expect, it } from 'vitest';
import { InputBuffer } from './inputBuffer';

describe('InputBuffer', () => {
  it('holds a press for the window and consumes it once', () => {
    const b = new InputBuffer(0.15);
    b.push('lightAttack', 1.0);
    expect(b.has('lightAttack', 1.1)).toBe(true);
    expect(b.consume('lightAttack', 1.1)).toBe(true);
    expect(b.consume('lightAttack', 1.1)).toBe(false);
  });

  it('expires after the window', () => {
    const b = new InputBuffer(0.15);
    b.push('dodge', 1.0);
    expect(b.has('dodge', 1.15)).toBe(true);
    expect(b.consume('dodge', 1.16)).toBe(false);
  });

  it('keeps actions independent and supports clear', () => {
    const b = new InputBuffer(0.15);
    b.push('lightAttack', 0);
    b.push('dodge', 0);
    expect(b.consume('dodge', 0.05)).toBe(true);
    expect(b.has('lightAttack', 0.05)).toBe(true);
    b.clear();
    expect(b.has('lightAttack', 0.05)).toBe(false);
  });

  it('refreshes the expiry when pressed again', () => {
    const b = new InputBuffer(0.15);
    b.push('item', 0);
    b.push('item', 0.1);
    expect(b.has('item', 0.2)).toBe(true);
  });

  it('アクション別の保持時間を持てる（指定がなければ既定）', () => {
    const b = new InputBuffer(0.15, { item: 0.05 });
    b.push('item', 1.0);
    b.push('dodge', 1.0);
    expect(b.has('item', 1.04)).toBe(true);
    expect(b.has('item', 1.06)).toBe(false);
    expect(b.has('dodge', 1.14)).toBe(true);
  });
});

describe('InputBuffer.extend（ヒットストップ中の期限延長）', () => {
  it('保持中の入力の期限を延ばし、期限切れ後には効かない', () => {
    const b = new InputBuffer(0.15);
    b.push('lightAttack', 1.0);
    b.extend(0.1);
    expect(b.has('lightAttack', 1.25)).toBe(true);
    expect(b.has('lightAttack', 1.26)).toBe(false);
    b.extend(1);
    expect(b.has('lightAttack', 1.1)).toBe(false);
  });
});

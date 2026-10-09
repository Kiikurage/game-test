import { describe, expect, it } from 'vitest';
import { GamepadInput, PAD_BUTTON, readGamepad, type GamepadLike } from './gamepad';
import { InputCollector } from './inputCollector';

function makePad(
  opts: { axes?: number[]; pressed?: number[]; values?: Record<number, number> } = {},
): GamepadLike {
  const axes = opts.axes ?? [0, 0, 0, 0];
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: opts.pressed?.includes(i) ?? false,
    value: opts.values?.[i] ?? (opts.pressed?.includes(i) ? 1 : 0),
  }));
  return { axes, buttons };
}

describe('readGamepad', () => {
  it('maps the standard layout to actions', () => {
    const r = readGamepad(
      makePad({
        pressed: [
          PAD_BUTTON.rb,
          PAD_BUTTON.lb,
          PAD_BUTTON.b,
          PAD_BUTTON.r3,
          PAD_BUTTON.x,
          PAD_BUTTON.a,
        ],
      }),
    );
    expect(r.buttons).toEqual({
      lightAttack: true,
      heavyAttack: false,
      guard: true,
      dodge: true,
      lockOn: true,
      item: true,
      interact: true,
    });
  });

  it('treats the analog right trigger as heavy attack past the threshold', () => {
    expect(readGamepad(makePad({ values: { [PAD_BUTTON.rt]: 0.3 } })).buttons.heavyAttack).toBe(
      false,
    );
    expect(readGamepad(makePad({ values: { [PAD_BUTTON.rt]: 0.7 } })).buttons.heavyAttack).toBe(
      true,
    );
  });

  it('applies the deadzone and flips stick Y so forward is positive', () => {
    expect(readGamepad(makePad({ axes: [0.1, -0.1, 0, 0] })).move).toEqual({ x: 0, y: 0 });
    const r = readGamepad(makePad({ axes: [0, -1, 1, 0] }));
    expect(r.move.y).toBeCloseTo(1);
    expect(r.look.x).toBeCloseTo(1);
    const down = readGamepad(makePad({ axes: [0, 0, 0, -1] }));
    expect(down.look.y).toBeCloseTo(1); // 右スティックを上に倒すと上を向く
  });
});

describe('GamepadInput', () => {
  it('feeds the collector, scales look by dt and emits dpad target switches on edges', () => {
    const collector = new InputCollector();
    let pad = makePad({ axes: [0, -1, 1, 0], pressed: [PAD_BUTTON.rb, PAD_BUTTON.dpadRight] });
    let activity = 0;
    const input = new GamepadInput(
      collector,
      3,
      () => activity++,
      () => [pad],
    );
    input.poll(0.5);
    const f1 = collector.drain();
    expect(f1.move.y).toBeCloseTo(1);
    expect(f1.look.x).toBeCloseTo(1.5);
    expect(f1.buttons.lightAttack.pressed).toBe(true);
    expect(f1.targetSwitch).toBe(1);
    expect(activity).toBeGreaterThan(0);

    input.poll(0.5); // 押しっぱなし: 切替は再発しない
    expect(collector.drain().targetSwitch).toBe(0);

    pad = makePad();
    input.poll(0.5);
    const f3 = collector.drain();
    expect(f3.buttons.lightAttack.released).toBe(true);
    expect(f3.move).toEqual({ x: 0, y: 0 });
  });

  it('releases everything when the pad disconnects', () => {
    const collector = new InputCollector();
    let pads: (GamepadLike | null)[] = [makePad({ pressed: [PAD_BUTTON.lb] })];
    const input = new GamepadInput(
      collector,
      3,
      () => undefined,
      () => pads,
    );
    input.poll(1 / 60);
    collector.drain();
    pads = [null];
    input.poll(1 / 60);
    expect(collector.drain().buttons.guard.held).toBe(false);
  });

  it('ignores non-standard devices', () => {
    const collector = new InputCollector();
    const weird: GamepadLike = { axes: [1, 1], buttons: [{ pressed: true, value: 1 }] };
    const input = new GamepadInput(
      collector,
      3,
      () => undefined,
      () => [weird],
    );
    input.poll(1 / 60);
    expect(collector.drain().move).toEqual({ x: 0, y: 0 });
  });
});

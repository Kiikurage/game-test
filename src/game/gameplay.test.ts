import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PLAYER_ACTIONS } from './data';
import { Game } from './game';
import { angleDelta } from './player/movement';
import { FakeInput } from './testing/fakeInput';
import { resetTuning, tuning } from './tuning';
import { DUMMIES, PLAYER_SPAWN } from './world/playground';

const DT = 1 / 60;

/** 物理（Rapier）を含む結合テスト。平らな地面・テストシーンの足場・ダミーを使う。 */
describe('gameplay (player controller + camera + lock-on)', () => {
  let game: Game;
  let input: FakeInput;

  beforeAll(async () => {
    // Rapier の WASM 初期化は重いので一度だけ。ゲームは各テストで作り直す。
    await Game.create();
  });

  beforeEach(async () => {
    resetTuning();
    tuning.camera.autoFollow = false; // 決定的にするため（自動回り込みは camera のテストで検証）
    input = new FakeInput();
    game = await Game.create({ input });
  });

  function run(frames: number, each?: (frame: number) => void): void {
    for (let i = 0; i < frames; i++) {
      each?.(i);
      game.update(DT);
      input.endStep();
    }
  }

  const pos = () => game.player.feet;
  const horizontalSpeed = () => game.player.speed;

  it('spawns on the ground facing the dummies', () => {
    run(10);
    expect(game.player.grounded).toBe(true);
    expect(game.player.state).toBe('idle');
    expect(pos().y).toBeCloseTo(0, 1);
    expect(game.player.yaw).toBeCloseTo(PLAYER_SPAWN.yaw, 5);
  });

  describe('free movement', () => {
    it('starts moving on the very first step after the input (zero extra latency)', () => {
      run(10);
      const z0 = pos().z;
      input.setMove(0, 1); // カメラ前方 = -Z
      run(1);
      expect(game.player.state).toBe('move');
      expect(pos().z).toBeLessThan(z0 - 0.005);
    });

    it('moves relative to the camera and reaches run speed in ~8 frames', () => {
      run(10);
      input.setMove(0, 1);
      run(8);
      expect(horizontalSpeed()).toBeCloseTo(4.5, 1);
      // カメラは -Z を向いているので -Z へ進む
      run(30);
      expect(pos().z).toBeLessThan(PLAYER_SPAWN.z - 2);
      expect(Math.abs(pos().x)).toBeLessThan(0.05);
    });

    it('walks with a weak stick input and runs with a strong one (continuous)', () => {
      run(10);
      input.setMove(0, 0.4);
      run(30);
      expect(horizontalSpeed()).toBeCloseTo(1.8, 1);
      input.setMove(0, 1);
      run(30);
      expect(horizontalSpeed()).toBeCloseTo(4.5, 1);
    });

    it('stops within about 6 frames when the input is released', () => {
      run(10);
      input.setMove(0, 1);
      run(20);
      input.setMove(0, 0);
      run(6);
      expect(horizontalSpeed()).toBeLessThan(0.01);
      expect(game.player.state).toBe('idle');
    });

    it('turns toward the movement direction without lagging (<= 720 deg/s)', () => {
      run(10);
      const start = game.player.yaw;
      input.setMove(-1, 0); // 画面左 = カメラ -Z 向きなら -X
      run(1);
      const first = Math.abs(angleDelta(start, game.player.yaw));
      expect(first).toBeGreaterThan(0.05);
      expect(first).toBeLessThanOrEqual((720 * Math.PI) / 180 / 60 + 1e-6);
      run(40);
      // -X を向く = yaw -90°
      expect(game.player.yaw).toBeCloseTo(-Math.PI / 2, 2);
    });

    it('dashes at 6.5 m/s while sprinting and drains 10 stamina per second', () => {
      run(10);
      input.setMove(0, 1);
      input.setSprint(true);
      run(60);
      expect(game.player.state).toBe('dash');
      expect(horizontalSpeed()).toBeCloseTo(6.5, 1);
      expect(game.player.stamina.current).toBeLessThan(100 - 8);
      expect(game.player.stamina.current).toBeGreaterThan(100 - 12);
    });

    it('falls back to running when the stamina runs out and stays there until sprint is released', () => {
      run(10);
      game.player.stamina.current = 0.5;
      input.setMove(0, 1);
      input.setSprint(true);
      run(30);
      expect(game.player.state).toBe('move');
      expect(horizontalSpeed()).toBeLessThanOrEqual(4.51);
      run(120);
      expect(game.player.state).toBe('move'); // 走り中は回復しないので、離すまでダッシュは戻らない
      input.setSprint(false);
      input.setMove(0, 0);
      run(150); // 立ち止まってスタミナを回復
      input.setMove(0, 1);
      input.setSprint(true);
      run(5);
      expect(game.player.state).toBe('dash');
    });
  });

  describe('roll', () => {
    it('moves exactly the roll distance and follows the data frames', () => {
      run(10);
      input.setMove(1, 0); // 画面右（カメラ -Z 向きなら +X）
      run(12);
      input.setMove(1, 0);
      const x0 = pos().x;
      const z0 = pos().z;
      const stamina0 = game.player.stamina.current;
      input.press('dodge');
      const invulnerableFrames: number[] = [];
      let rollFrames = 0;
      for (let i = 0; i < 40; i++) {
        game.update(DT);
        input.endStep();
        if (game.player.state === 'roll') {
          rollFrames++;
          if (game.player.invulnerable) invulnerableFrames.push(game.player.stateFrame);
        }
        if (i === 0) {
          // 入力と同じステップで動き出す
          expect(game.player.state).toBe('roll');
          expect(game.player.stateFrame).toBe(1);
          expect(game.player.stamina.current).toBeCloseTo(stamina0 - 20, 3);
        }
      }
      expect(invulnerableFrames[0]).toBe(PLAYER_ACTIONS.roll.invuln.start);
      expect(invulnerableFrames[invulnerableFrames.length - 1]).toBe(
        PLAYER_ACTIONS.roll.invuln.end,
      );
      expect(invulnerableFrames).toHaveLength(12);
      // 入力を保持しているので F26 で移動へキャンセルされる
      expect(rollFrames).toBeLessThanOrEqual(32);
      expect(rollFrames).toBeGreaterThanOrEqual(25);
      // 走りの速度（4.5 m/s）での移動分を除いたロール距離 ≒ 3.2m（+ 走行の持ち越し）
      const dx = pos().x - x0;
      expect(dx).toBeGreaterThan(3.0);
      expect(Math.abs(pos().z - z0)).toBeLessThan(0.1);
    });

    it('rolls a full 32 frames with no input after the start, covering 3.2m', () => {
      run(10);
      input.setMove(1, 0);
      input.press('dodge');
      run(1);
      input.setMove(0, 0); // 以降は入力なし
      const x0 = pos().x;
      const startX = x0;
      run(40);
      expect(game.player.state).toBe('idle');
      // 開始ステップ分（F1）を含めた総移動量が 3.2m
      expect(pos().x - (startX - 0.2)).toBeGreaterThan(2.9);
      expect(pos().x).toBeGreaterThan(startX);
    });

    it('does a backstep (2.0m backward, invulnerable F1-F8) when there is no movement input', () => {
      run(10);
      const z0 = pos().z;
      input.press('dodge');
      run(1);
      expect(game.player.state).toBe('backstep');
      expect(game.player.invulnerable).toBe(true);
      run(30);
      expect(game.player.state).toBe('idle');
      // プレイヤーは -Z を向いている → 後方は +Z
      expect(pos().z - z0).toBeCloseTo(2.0, 1);
    });

    it('cannot start while stamina is 0, and consumes 20 / 12 when it can', () => {
      run(10);
      game.player.stamina.consume(1000);
      input.setMove(0, 1);
      input.press('dodge');
      run(2);
      expect(game.player.state).not.toBe('roll');

      game.player.stamina.current = 100;
      input.setMove(0, 1);
      input.press('dodge');
      run(1);
      expect(game.player.state).toBe('roll');
      expect(game.player.stamina.current).toBeCloseTo(80, 1);
    });

    it('is triggered by a buffered input right after the previous roll ends', () => {
      run(10);
      input.setMove(0, 1);
      input.press('dodge');
      run(1);
      expect(game.player.state).toBe('roll');
      // ロール中に押した入力は、終了時に先行入力として消費される
      run(20);
      input.press('dodge');
      let rolls = 0;
      for (let i = 0; i < 30; i++) {
        game.update(DT);
        input.endStep();
        rolls += game.player.events.filter((e) => e.type === 'rollStart').length;
      }
      expect(rolls).toBe(1);
    });

    it('continues into a dash when the dodge button is still held at the end of the roll', () => {
      run(10);
      input.setMove(0, 1);
      input.press('dodge');
      run(1);
      input.hold('dodge', true);
      run(40);
      expect(game.player.state).toBe('dash');
    });
  });

  describe('collision', () => {
    it('is stopped by a wall and reports no actual movement speed against it', () => {
      // 壁 wallA: x=-6.5, z=-0.5..5.5。プレイヤーを壁の東側へ置き、西（-X）へ走らせる
      game.player.teleport(pos().clone().set(-3.5, 0.02, 2), -Math.PI / 2);
      run(5);
      input.setMove(-1, 0);
      // カメラはまだ -Z 向き。画面左 = -X
      run(90);
      expect(pos().x).toBeGreaterThan(-6.15 - 0.05);
      expect(pos().x).toBeLessThan(-5.5);
      // 実際に動けた速度（アニメーションが読む値）は 0 に近い。走りモーションが空回りしない。
      expect(game.player.animation.speed).toBeLessThan(0.5);
    });

    it('auto-steps over 0.25m stairs and walks up the 30 degree ramp, but not the 52 degree one', () => {
      // 階段（x=4.75..7.45, z=3.8..6.6）。西から東へ登る
      game.player.teleport(pos().clone().set(3.2, 0.02, 5.2), Math.PI / 2);
      run(5);
      input.setMove(0, 0);
      // 画面右 = +X（カメラ -Z 向き）
      input.setMove(1, 0);
      run(60);
      expect(pos().y).toBeGreaterThan(0.6);
      expect(game.player.grounded).toBe(true);

      // 30° の坂（ramp30: x=7.4, z=0.8、-Z 方向へ登る）
      game.player.teleport(pos().clone().set(7.4, 0.02, 3.5), Math.PI);
      run(5);
      input.setMove(0, 1);
      run(60);
      expect(pos().y).toBeGreaterThan(0.5);

      // 52° の坂（ramp52: x=2.6, z=7.8）は登れない
      game.player.teleport(pos().clone().set(2.6, 0.02, 10.5), Math.PI);
      run(5);
      input.setMove(0, 1);
      run(90);
      expect(pos().y).toBeLessThan(0.6);
    });

    it('falls off a ledge, lands, and recovers', () => {
      game.player.teleport(pos().clone().set(0, 6, 0.5), 0);
      let fell = false;
      let landed = false;
      run(120, () => {
        if (game.player.state === 'fall') fell = true;
        if (game.player.state === 'land') landed = true;
      });
      expect(fell).toBe(true);
      expect(landed).toBe(true);
      expect(game.player.state).toBe('idle');
      expect(pos().y).toBeCloseTo(0, 1);
    });
  });

  describe('lock-on', () => {
    it('locks onto the dummy nearest the screen center with the lock-on button', () => {
      run(10);
      input.press('lockOn');
      run(1);
      expect(game.lockOn.target).not.toBeNull();
      expect(game.lockOn.target?.id).toBe('dummy-a');
    });

    it('faces the target while strafing and keeps a constant distance of 3.8 m/s sideways', () => {
      run(10);
      input.press('lockOn');
      run(10);
      const target = game.lockOn.target;
      expect(target).not.toBeNull();
      if (!target) return;
      input.setMove(1, 0);
      run(60);
      const toTarget = Math.atan2(target.position.x - pos().x, target.position.z - pos().z);
      expect(Math.abs(game.player.yaw - toTarget)).toBeLessThan(0.15);
      expect(horizontalSpeed()).toBeCloseTo(3.8, 1);
      expect(game.player.state).toBe('move');
    });

    it('moves backward at 2.6 m/s and rolls relative to the input while locked on', () => {
      run(10);
      input.press('lockOn');
      run(10);
      input.setMove(0, -1);
      run(30);
      expect(horizontalSpeed()).toBeCloseTo(2.6, 1);
      input.setMove(0, -1);
      input.press('dodge');
      run(1);
      expect(game.player.state).toBe('roll');
    });

    it('releases when the target is toggled off, and the camera resets behind the player', () => {
      run(10);
      input.press('lockOn');
      run(30);
      input.press('lockOn');
      run(1);
      expect(game.lockOn.target).toBeNull();
      expect(game.lastLockOnEvent).toBe('released');
    });

    it('switches to the next dummy when the target switch is flicked', () => {
      run(10);
      input.press('lockOn');
      run(30);
      const first = game.lockOn.target?.id;
      input.switchTarget(1);
      run(1);
      const second = game.lockOn.target?.id;
      expect(second).toBeDefined();
      expect(second).not.toBe(first);
    });

    it('locks onto the tall boss-sized dummy when facing it, and frames it from farther back', () => {
      game.teleportPlayer(4, -10.8, Math.atan2(-4, 2));
      run(10);
      expect(game.lockOnTo('dummy-boss')).toBe(true);
      run(120);
      expect(game.lockOn.target?.id).toBe('dummy-boss');
      expect(game.camera.armLength).toBeGreaterThan(5.5);
    });

    it('lists all dummies as lock-on targets', () => {
      expect(game.lockOnTargets).toHaveLength(DUMMIES.length);
    });
  });

  describe('camera', () => {
    it('follows the look input immediately and keeps the player in the view', () => {
      run(10);
      const yaw = game.camera.yaw;
      input.setLook(0.3, 0);
      run(1);
      expect(game.camera.yaw).toBeCloseTo(yaw - 0.3, 6);
    });

    it('does not enter the wall when the player backs against it', () => {
      // wallA（x=-6.5、厚 0.7）の東面 x=-6.15 に背をつけ、カメラを壁の方（西）へ向けず、壁際に立たせる
      game.player.teleport(pos().clone().set(-5.7, 0.02, 2), Math.PI / 2);
      // カメラをプレイヤーの背後（西 = 壁側）にする
      game.camera.reset(game.player.feet, Math.PI / 2);
      run(120);
      const cam = game.camera.position;
      // カメラは壁の東側（x > -6.15）にとどまる
      expect(cam.x).toBeGreaterThan(-6.15);
      expect(game.camera.armLength).toBeLessThan(1.0);
    });
  });
  describe('state machine and animation events', () => {
    it('fires footstep markers while running, in time with the gait, and forwards them to the event bus', () => {
      const steps: { gait: string; surface: string }[] = [];
      game.events.on('footstep', (e) => steps.push({ gait: e.gait, surface: e.surface }));
      const markers: string[] = [];
      game.events.on('animMarker', (e) => markers.push(`${e.owner}:${e.marker}`));
      run(10);
      expect(steps).toEqual([]); // 立っている間は足音なし
      input.setMove(0, 1);
      run(120); // 2 秒走る（4.5 m/s、約 2.1 サイクル = 4 歩前後）
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.length).toBeLessThanOrEqual(7);
      expect(steps.every((s) => s.gait === 'run' && s.surface === 'grass')).toBe(true);
      expect(markers.every((m) => m === 'player:footstep')).toBe(true);
      expect(game.debugState.markers.footstep).toBe(steps.length);
      input.setMove(0, 0);
      run(30);
      const stopped = steps.length;
      run(60);
      expect(steps.length).toBe(stopped);
    });

    it('fires the roll markers on their frames: invulnStart F4, invulnEnd F15, footstep F18, cancelOpen F26', () => {
      run(10);
      input.setMove(1, 0);
      input.press('dodge');
      const seen: { frame: number; marker: string }[] = [];
      game.events.on('animMarker', (e) => seen.push({ frame: e.frame, marker: e.marker }));
      const gaits: (string | undefined)[] = [];
      game.events.on('footstep', (e) => gaits.push(e.gait));
      run(1);
      input.setMove(0, 0);
      run(40);
      const roll = seen.filter((s) =>
        ['invulnStart', 'invulnEnd', 'footstep', 'cancelOpen'].includes(s.marker),
      );
      expect(roll.map((s) => `${s.marker}@${s.frame}`)).toEqual([
        'invulnStart@4',
        'invulnEnd@15',
        'footstep@18',
        'cancelOpen@26',
      ]);
      expect(gaits).toEqual(['roll']);
    });

    it('freezes state frame, movement and stamina regeneration during hit-stop, then resumes', () => {
      run(10);
      input.setMove(1, 0);
      input.press('dodge');
      run(10);
      expect(game.player.state).toBe('roll');
      const frame = game.player.stateFrame;
      const x = pos().x;
      const stamina = game.player.stamina.current;
      game.player.hitStop(6);
      run(6);
      // 6 ステップ進めても状態フレーム・位置・スタミナは変わらない
      expect(game.player.stateFrame).toBe(frame);
      expect(pos().x).toBeCloseTo(x, 6);
      expect(game.player.stamina.current).toBe(stamina);
      expect(game.player.animation.frozen).toBe(true);
      // 7 ステップ目から再開する
      run(1);
      expect(game.player.stateFrame).toBe(frame + 1);
      expect(game.player.animation.frozen).toBe(false);
      expect(pos().x).toBeGreaterThan(x + 0.01);
    });

    it('stretches the invulnerability window by exactly the hit-stop frames (marker windows freeze too)', () => {
      run(10);
      input.setMove(1, 0);
      input.press('dodge');
      const invulnerableSteps: number[] = [];
      run(1);
      run(5, () => undefined); // roll F2..F6
      expect(game.player.stateFrame).toBe(6);
      game.player.hitStop(5);
      for (let i = 0; i < 40; i++) {
        run(1);
        if (game.player.state !== 'roll') break;
        if (game.player.invulnerable) invulnerableSteps.push(game.player.stateFrame);
      }
      // F6 はすでに窓の中。凍結の 5 ステップは F6 のまま窓が保たれ、その後 F15 まで続く
      expect(invulnerableSteps.filter((f) => f === 6)).toHaveLength(5);
      expect(new Set(invulnerableSteps).size).toBe(PLAYER_ACTIONS.roll.invuln.end - 6 + 1);
      expect(invulnerableSteps.at(-1)).toBe(PLAYER_ACTIONS.roll.invuln.end);
    });

    it('rejects nothing during normal play: every transition the player makes is declared in the graph', () => {
      // 不正遷移は IllegalTransitionError になるので、走る・止まる・ロール・落下・着地を通して例外が出ないこと
      run(10);
      input.setMove(0, 1);
      run(30);
      input.press('dodge');
      run(40);
      input.setMove(0, 0);
      input.press('dodge');
      run(30);
      game.player.teleport(pos().clone().set(0, 6, 0), 0);
      run(120);
      expect(game.player.state).toBe('idle');
    });

    it('exposes the animation state the controller reads (kind, action id, gait phase)', () => {
      run(10);
      expect(game.player.animation.kind).toBe('idle');
      expect(game.player.animation.actionId).toBeNull();
      input.setMove(0, 1);
      run(30);
      expect(game.player.animation.kind).toBe('move');
      expect(game.player.animation.gaitPhase).toBeGreaterThanOrEqual(0);
      expect(game.player.animation.gaitPhase).toBeLessThan(1);
      expect(Math.abs(game.player.animation.gaitPhaseStep)).toBeGreaterThan(0);
      input.press('dodge');
      run(1);
      expect(game.player.animation.kind).toBe('action');
      expect(game.player.animation.actionId).toBe('roll');
    });
  });
});

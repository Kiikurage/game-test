import { describe, expect, it } from 'vitest';
import {
  createHeadlessGame,
  settle,
  walkThrough,
  type HeadlessGame,
} from '../testing/headlessGame';

/**
 * 実レベル「灰の礎」を入力（前進 + 向き）だけで歩く検証（E2E の level / sidePath / waterway / plunge から移した）。
 * 敵は置かない（地形の検証）。メインルート A→F の通しと D の通路でのロールは `levelWalk.test.ts` が見ている。
 */
const boot = async (): Promise<HeadlessGame> => {
  const h = await createHeadlessGame({ enemies: [] });
  settle(h);
  return h;
};

const holdForward = (h: HeadlessGame, steps: number): void => {
  h.input.setMove(0, 1);
  h.run(steps);
  h.input.setMove(0, 0);
};

/** カメラをプレイヤーの向き + offset の背後へ置き直す（前進は常にカメラ前方へ進む）。 */
const aimCamera = (h: HeadlessGame, yawOffset: number): void => {
  h.dev.view(yawOffset, 4.2, 15);
};

describe('main route (level)', () => {
  it('starts at the bonfire in area A on the level terrain', async () => {
    const h = await boot();
    const p = h.sim().player;
    expect(Math.hypot(p.position.x, p.position.z)).toBeLessThan(4);
    expect(Math.abs(p.position.y)).toBeLessThan(0.3);
    expect(p.state).toBe('idle');
  });

  it('walks from the bonfire through B to the chapel C without getting stuck', async () => {
    const h = await boot();
    const route: [number, number][] = [
      [10, 0],
      [22, 6],
      [32, 12],
      [40, 17],
      [50, 17],
      [50, 22],
    ];
    const trail: number[] = [];
    for (const wp of route) {
      walkThrough(h, [wp], 1.5, 40);
      trail.push(h.game.player.feet.y);
    }
    const p = h.game.player;
    // 礼拝堂の床（高さ 3.4m）の上に立っている。壁抜け・落下はしていない
    expect(Math.hypot(p.feet.x - 50, p.feet.z - 22)).toBeLessThan(2);
    expect(p.feet.y).toBeGreaterThan(3.2);
    expect(p.feet.y).toBeLessThan(3.8);
    expect(Math.min(...trail)).toBeGreaterThan(-0.3);
    expect(p.grounded).toBe(true);
  });

  it('the chapel walls block the player (no walking through them)', async () => {
    const h = await boot();
    // 西の壁（x=40、z=22 付近は壁）の外側から東へ向かっても通り抜けられない
    h.game.teleportPlayer(36, 22, Math.PI / 2);
    holdForward(h, 150);
    expect(h.game.player.feet.x).toBeLessThan(39.8);
  });
});

/** 脇道の地形（#110: 霊廟の屋根・北崖の岩棚・北壁の上）。 */
describe('side paths (roof, ledge, wall top)', () => {
  // 岩棚の中心線（崖の足元 → 倒れた柵の隙間 → 礼拝堂の西の外壁沿い → 北壁の上）
  const LEDGE: [number, number][] = [
    [34.9, 18.5],
    [33, 22],
    [33, 25],
    [35.5, 27.5],
    [38, 29.8],
    [39.6, 32],
    [44, 32],
    [50, 32],
    [53, 32],
  ];

  it('runs from B up the mausoleum roof, along the cliff ledge to the chapel wall top, and drops into the chapel at three points', async () => {
    const h = await boot();
    const p = h.game.player;
    h.game.teleportPlayer(33, 14, Math.PI);
    h.run(20);
    const trail: number[] = [];
    walkThrough(h, [
      [33, 17],
      [32, 20.5],
      [31, 22.5],
    ]);
    // 石段は幅 1.2m（カプセルは 0.7m）。中央に合わせてから上る
    walkThrough(h, [[29, 22.5]], 0.25);
    walkThrough(
      h,
      [
        [29, 19.5],
        [29, 16],
      ],
      0.35,
    );
    trail.push(p.feet.y);
    // 屋根の上（約 4.96m）に立っている
    expect(p.feet.y).toBeGreaterThan(4.7);
    expect(p.feet.y).toBeLessThan(5.2);
    expect(p.grounded).toBe(true);

    // 屋根から石段を戻り、崖の足元から岩棚へ。北壁の上の回廊まで
    walkThrough(h, [[29, 19.5]], 0.35);
    walkThrough(h, [[29, 22.5]], 0.35);
    walkThrough(h, [[31, 22.5], [32, 20.5], [34.5, 18], ...LEDGE]);
    expect(Math.hypot(p.feet.x - 53, p.feet.z - 32)).toBeLessThan(1.2);
    // 回廊の床は礼拝堂の床（3.4m）+ 2.8m
    expect(p.feet.y).toBeGreaterThan(6.1);
    expect(p.feet.y).toBeLessThan(6.4);
    expect(p.grounded).toBe(true);

    // 壁上から来た道を戻れる（岩棚の途中まで）
    walkThrough(h, [
      [44, 32],
      [39.6, 32],
      [38, 29.8],
      [35.5, 27.5],
    ]);
    expect(p.feet.y).toBeGreaterThan(4.3);
    expect(p.feet.y).toBeLessThan(5.6);
    trail.push(p.feet.y);

    // 三つの落下ポイント（西・中・東）から礼拝堂内へ降りる。落下ダメージなし
    for (const x of [47, 50, 53]) {
      h.game.teleportPlayer(x, 32, Math.PI, 6.3);
      h.run(20);
      aimCamera(h, 0);
      holdForward(h, 120);
      expect(p.feet.z, `drop at x=${x}`).toBeLessThan(31.3);
      expect(Math.abs(p.feet.y - 3.4), `drop at x=${x}`).toBeLessThan(0.35);
      expect(p.grounded).toBe(true);
      expect(p.state).not.toBe('dead');
    }
    expect(Math.min(...trail)).toBeGreaterThan(2);
  });

  it('the mausoleum roof south edge and the ledge edges do not let the player fall to death', async () => {
    const h = await boot();
    const p = h.game.player;
    // 屋根の南縁から降りる
    h.game.teleportPlayer(29, 14.4, Math.PI, 5);
    h.run(20);
    aimCamera(h, 0);
    holdForward(h, 120);
    expect(p.feet.z).toBeLessThan(13.4);
    expect(p.feet.y).toBeLessThan(3.3);
    expect(p.state).not.toBe('dead');

    // 岩棚の途中（北向きの区間）から横（東）へ押し続けても落ちない（透明壁）
    h.game.teleportPlayer(33, 23.5, Math.PI / 2, 3.9);
    h.run(20);
    aimCamera(h, 0);
    holdForward(h, 150);
    expect(p.feet.y).toBeGreaterThan(3.5);
    expect(p.feet.x).toBeLessThan(34);
    expect(p.state).not.toBe('dead');
  });
});

/** 脇道 side_waterway（#111: 腐った床板 → 地下水路 → 墓室 → 鉄格子 → D の通路）。 */
describe('waterway side path', () => {
  const TUNNEL: [number, number][] = [
    [50, 28],
    [64, 28],
    [66, 30],
    [66, 38],
    [66, 41.5],
    [66, 43.5],
    [68, 44],
    [71, 44],
    [72.2, 44],
    [72.2, 44.5],
  ];
  const WATER_FLOOR = 1.0;
  const EXIT_Y = 5.9;

  it('steps on the rotten floorboard, drops into the waterway, runs to the iron grate, and gets out into the D corridor once it is opened', async () => {
    const h = await boot();
    const p = h.game.player;
    // 礼拝堂の祭壇裏から床板へ歩く。踏むと割れて 2.4m 落ちる（ダメージなし）
    h.game.teleportPlayer(41, 28, Math.PI / 2);
    h.run(20);
    expect(h.dev.waterway()).toEqual({ hatchBroken: false, grateOpen: false });
    const hp0 = h.sim().combat.playerHp;
    walkThrough(h, [[44, 28]], 0.4);
    h.run(90);
    expect(h.dev.waterway().hatchBroken).toBe(true);
    expect(p.feet.y).toBeGreaterThan(WATER_FLOOR - 0.3);
    expect(p.feet.y).toBeLessThan(WATER_FLOOR + 0.3);
    expect(p.grounded).toBe(true);
    expect(h.sim().combat.playerHp).toBe(hp0);

    // 水路を東へ → 北へ → 階段を上って鉄格子の手前まで
    walkThrough(h, TUNNEL);
    expect(Math.abs(p.feet.y - EXIT_Y)).toBeLessThan(0.3);
    expect(p.grounded).toBe(true);

    // 開通前は鉄格子が塞ぐ（北 = +z へ押し当てる）
    walkThrough(h, [[72, 44.5]], 0.5);
    aimCamera(h, 0 - p.yaw);
    holdForward(h, 90);
    expect(p.feet.z).toBeLessThan(45);

    // 開通 → D の通路の側面へ出る
    h.dev.openGrate();
    expect(h.dev.waterway().grateOpen).toBe(true);
    walkThrough(h, [
      [72, 46.5],
      [72, 48.5],
    ]);
    expect(p.feet.z).toBeGreaterThan(47.5);
    expect(Math.abs(p.feet.y - EXIT_Y)).toBeLessThan(0.3);
    expect(p.grounded).toBe(true);
    expect(p.state).not.toBe('dead');
  });

  it('the burial chamber branch can be walked and the way back from D leads into the waterway', async () => {
    const h = await boot();
    const p = h.game.player;
    h.dev.breakHatch();
    h.dev.openGrate();
    // 墓室（60..65, 33..37）へ入って戻る
    h.game.teleportPlayer(66, 32, Math.PI, WATER_FLOOR + 0.02);
    h.run(30);
    walkThrough(h, [
      [66, 35],
      [63, 35],
      [61.5, 36],
      [66, 35],
    ]);
    expect(p.feet.y).toBeLessThan(WATER_FLOOR + 0.3);

    // D の通路から水路へ戻る（開通後の逆行）
    h.game.teleportPlayer(72, 49, Math.PI, EXIT_Y);
    h.run(30);
    walkThrough(h, [
      [72, 46.5],
      [72.2, 44.5],
      [71, 44],
      [68, 44],
      [66, 43.5],
      [66, 38],
    ]);
    expect(p.feet.y).toBeLessThan(WATER_FLOOR + 0.35);
  });
});

/**
 * 霊廟の屋根（高さ 2.2m）の南縁から歩いて降り、落下 → 着地の状態遷移が破綻しないこと（#116）。
 * 敵がいないので、落下中に攻撃を入力しても落下攻撃は出ず通常の着地になる。落下攻撃そのものは `player/plunge.test.ts`。
 */
describe('walking off the mausoleum roof', () => {
  const ROOF_Y = 5.0;

  for (const attack of [false, true]) {
    it(`falls and lands cleanly${attack ? ' with an attack input in the air' : ''}`, async () => {
      const h = await boot();
      const p = h.game.player;
      h.game.teleportPlayer(29, 15.6, Math.PI, ROOF_Y);
      aimCamera(h, 0);
      h.run(30);
      expect(p.grounded).toBe(true);
      const startY = p.feet.y;
      expect(startY).toBeGreaterThan(4.7);
      const hp0 = h.sim().combat.playerHp;
      const landBefore = h.sim().events.land;

      const states: string[] = [];
      let attacked = false;
      let releaseAt = -1;
      let settled = 0;
      h.input.setMove(0, 1);
      for (let i = 0; i < 1200 && settled <= 30; i++) {
        if (states.at(-1) !== p.state) states.push(p.state);
        if (attack && !attacked && p.state === 'fall' && p.feet.y < ROOF_Y - 0.8) {
          attacked = true;
          releaseAt = i + 1;
          h.input.press('lightAttack');
        }
        if (i === releaseAt) h.input.release('lightAttack');
        const onGround = p.grounded && p.feet.y < ROOF_Y - 1.5;
        settled = onGround && (p.state === 'idle' || p.state === 'move') ? settled + 1 : 0;
        h.run(1);
      }
      h.input.setMove(0, 0);
      expect(settled, `did not settle: ${states.join(' > ')}`).toBeGreaterThan(30);
      if (attack) expect(attacked).toBe(true);

      // 並びは 移動 → 落下 → 着地（高さ 2m 以上は硬直あり）→ 移動 / 待機。落下攻撃は出ない
      expect(states).toContain('fall');
      expect(states.indexOf('land')).toBeGreaterThan(states.indexOf('fall'));
      expect(states).not.toContain('plungeFall');
      expect(states).not.toContain('plunge');
      expect(states).not.toContain('dead');
      expect(h.sim().events.land - landBefore).toBe(1);
      expect(p.grounded).toBe(true);
      expect(p.feet.y).toBeLessThan(startY - 1.8);
      expect(h.sim().combat.playerHp).toBe(hp0);
    });
  }
});

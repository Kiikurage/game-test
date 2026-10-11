export default async function (page) {
  const steps = Number(process.env.SHOT_STEPS ?? 12);
  await page.evaluate(async (n) => {
    const pad = {
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    };
    navigator.getGamepads = () => [pad];
    const dev = window.__game.dev;
    dev.pause(true);
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    await frame();
    dev.teleport(0.4, -4.9, 0);
    dev.advance(8);
    if (n === 0) {
      for (let i = 0; i < 6; i++) await frame();
      return;
    }
    pad.buttons[5] = { pressed: true, value: 1 }; // RB = 軽攻撃
    dev.advance(1);
    pad.buttons[5] = { pressed: false, value: 0 };
    dev.advance(n - 1);
    for (let i = 0; i < 6; i++) await frame();
    console.log('state', JSON.stringify(window.__game.sim.player.state), JSON.stringify(window.__game.sim.enemies));
  }, steps);
}

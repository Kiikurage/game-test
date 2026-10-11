export default async function (page) {
  await page.evaluate(async () => {
    const dev = window.__game.dev;
    dev.pause(true);
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    await frame();
    const e = window.__game.sim.enemies[0];
    // 敵の背後 5m（敵の向きの反対側）から敵の方を向く
    const bx = e.x - Math.sin(e.yaw) * 5;
    const bz = e.z - Math.cos(e.yaw) * 5;
    dev.teleport(bx, bz, e.yaw);
    dev.advance(5);
    dev.noise(e.x - Math.sin(e.yaw) * 4, 0, e.z - Math.cos(e.yaw) * 4, 'dash');
    dev.advance(28);
    for (let i = 0; i < 8; i++) await frame();
  });
}

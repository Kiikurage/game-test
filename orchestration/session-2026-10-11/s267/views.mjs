const V = (process.env.VIEWS ?? 'bonfire').split(',');
const P = {
  start: null,
  bonfire: [0, 3.5, Math.PI],
  graveyard: [14, 6, Math.PI / 2],
  gate: [34, 17, Math.PI / 2],
  west: [-4, 0, -Math.PI / 2 + 0.6],
};
export default async (page, { index }) => {
  const v = P[V[index]];
  if (v) {
    await page.evaluate(([x, z, yaw]) => window.__game.dev.teleport(x, z, yaw), v);
  }
  await page.evaluate(
    () =>
      new Promise((r) => {
        let n = 0;
        const f = () => (++n > 40 ? r() : requestAnimationFrame(f));
        f();
      }),
  );
};

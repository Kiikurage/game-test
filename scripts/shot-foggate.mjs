// 霧の門の撮影用（SHOT_SCRIPT）。SHOT_QUERY を '|' で並べ、連番ごとに視点を変える（SHOT_VIEWS）。
//   SHOT_VIEWS（JSON の配列。連番に対応）: { pos: [x, z, yawDeg], view: [yawOffsetDeg, distance, pitchDeg], enter?: 進めるステップ数 }
//   既定: 0 遠景（中庭の西から柱を見る）/ 1 門の前 / 2 入場演出の途中（enter: 50）
//   例: SHOT_SCRIPT=scripts/shot-foggate.mjs SHOT_QUERY='?quality=medium|?quality=medium' npm run shot -- shots/fog
const DEFAULT_VIEWS = [
  { pos: [84, 52, 40], view: [0, 7, 14] },
  { pos: [101.6, 64.6, 45], view: [0, 4.5, 10] },
  { pos: [101.6, 64.6, 45], view: [0, 4.5, 10], enter: 50 },
];

export default async function (page, { index }) {
  const views = process.env.SHOT_VIEWS ? JSON.parse(process.env.SHOT_VIEWS) : DEFAULT_VIEWS;
  const spec = views[index] ?? views[views.length - 1];
  await page.evaluate(async (s) => {
    const dev = window.__game.dev;
    dev.pause(true);
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    await frame();
    const rad = (deg) => (deg * Math.PI) / 180;
    dev.teleport(s.pos[0], s.pos[1], rad(s.pos[2]));
    dev.view(rad(s.view[0]), s.view[1], s.view[2]);
    if (s.enter !== undefined) {
      dev.advance(4);
      dev.fogGateControl('enter');
      dev.advance(s.enter);
    }
    dev.advance(3);
    for (let k = 0; k < 12; k++) await frame();
  }, spec);
}

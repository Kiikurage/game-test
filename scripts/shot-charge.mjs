// 強攻撃の溜めの撮影用（SHOT_SCRIPT）。偽のゲームパッドの RT を押し、`dev.pause` / `dev.advance` で
// 溜め F10 / F29 / F30 を狙って撮る。使い方:
//   SHOT_SCRIPT=scripts/shot-charge.mjs SHOT_CHARGE=10 npm run shot -- shots/charge-10
// SHOT_WAIT: 溜めを進めたあとに待つ描画フレーム数（既定 6。閃きの火花を撮るなら 1〜2）。
export default async function (page) {
  const frames = Number(process.env.SHOT_CHARGE ?? 10);
  const wait = Number(process.env.SHOT_WAIT ?? 6);
  await page.evaluate(
    async ([n, waitFrames]) => {
      const pad = {
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
      };
      navigator.getGamepads = () => [pad];
      const dev = window.__game.dev;
      dev.pause(true);
      const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
      await frame();
      dev.advance(5); // 起動直後の落ち着き
      pad.buttons[7] = { pressed: true, value: 1 }; // RT = 強攻撃
      // 入力の取り込み（gamepad.poll）は input.step の中。1 ステップ目が溜めの F1
      dev.advance(n);
      for (let i = 0; i < waitFrames; i++) await frame();
    },
    [frames, wait],
  );
}

// ヒーローショット視点（scripts/heroShots.json）の解決と、ページ内での視点の組み立て。
// npm run heroshots と npm run dbg（shot --view <名前>）で共有する。

const DEG = Math.PI / 180;

/** JSON の視点を、ページ内で実行する形（ラジアン・既定値の解決済み）にする。 */
export function resolveShot(shot, defaults = {}) {
  const camera = { ...(defaults.camera ?? {}), ...(shot.camera ?? {}) };
  const player = shot.player && {
    x: shot.player.x,
    z: shot.player.z,
    y: shot.player.y,
    yaw:
      shot.player.face !== undefined
        ? Math.atan2(shot.player.face[0] - shot.player.x, shot.player.face[1] - shot.player.z)
        : (shot.player.yawDeg ?? 0) * DEG,
  };
  return {
    player,
    camera: {
      yawOffset: (camera.yawOffsetDeg ?? 0) * DEG,
      distance: camera.distance,
      pitchDeg: camera.pitchDeg,
    },
    freeCam: shot.freeCam ?? null,
    dev: shot.dev ?? [],
    steps: shot.steps ?? defaults.steps ?? 60,
    frames: shot.frames ?? defaults.frames ?? 12,
  };
}

/** 視点が要求する URL クエリ（敵の有無・追加パラメータ）。品質などの基本パラメータは `base` で渡す。 */
export function shotQuery(shot, defaults = {}, base = {}) {
  const params = new URLSearchParams(base);
  const enemies = shot.enemies ?? defaults.enemies ?? true;
  if (!enemies) params.set('enemies', '0');
  for (const [k, v] of Object.entries(shot.query ?? {})) params.set(k, String(v));
  return `?${params.toString()}`;
}

/** ページ内: シミュレーションを止め、視点の状態を作ってからステップ数だけ進める。 */
export function stage(spec) {
  const dev = window.__game.dev;
  dev.pause(true);
  dev.freeCam(null);
  // 前の視点のボスを残さない（出す視点は dev で bossSpawn / arenaEnter を呼ぶ）
  dev.bossRemove();
  for (const [name, ...args] of spec.dev) {
    if (typeof dev[name] !== 'function') throw new Error(`unknown dev hook: ${name}`);
    dev[name](...args);
  }
  if (spec.player) dev.teleport(spec.player.x, spec.player.z, spec.player.yaw, spec.player.y);
  dev.view(spec.camera.yawOffset, spec.camera.distance, spec.camera.pitchDeg);
  // 物理の接地・アニメーション・カメラの追従・敵の反応を落ち着かせる（シミュレーション基準の待ち）
  dev.advance(spec.steps);
  if (spec.freeCam) dev.freeCam(spec.freeCam.position, spec.freeCam.target);
}

/** HUD・タッチ操作の UI を隠し、キャンバスだけを写す CSS。 */
export const HIDE_HUD_CSS =
  'body > :not(#app), #app > :not(canvas) { visibility: hidden !important; }';

/** 起動前に localStorage へ入れる値（値がオブジェクトなら JSON 文字列にする）。 */
export function localStorageEntries(defaults = {}) {
  return Object.entries(defaults.localStorage ?? {}).map(([k, v]) => [
    k,
    typeof v === 'string' ? v : JSON.stringify(v),
  ]);
}

/**
 * 動作確認用の足場（テストシーン）。段差・坂・壁・ロックオン用ダミーを平らな広場（原点から半径 9m）に置く。
 * 物理（Game）と描画（render/playground）が同じデータから作るので、見た目と当たりがずれない。
 * レベルデータ（#24）が入ったら置き換える想定。
 */

/** 傾きのある直方体。中心座標・半サイズ（m）、ヨー（Y 軸回り）→ ピッチ（ローカル X 軸回り）の順で回す。 */
export interface BoxSpec {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly hx: number;
  readonly hy: number;
  readonly hz: number;
  readonly yawDeg?: number;
  readonly pitchDeg?: number;
  /** false なら最初は無効（門など。`Game.setBoxEnabled` で切り替える）。既定は有効。 */
  readonly enabled?: boolean;
}

export interface DummySpec {
  readonly id: string;
  readonly x: number;
  readonly z: number;
  readonly height: number;
  readonly radius: number;
}

const STEP_RISE = 0.25;
const STEP_RUN = 0.9;

/** 階段（1 段 0.25m ×3）。自動で乗り越えられる段差の確認用。 */
const stairs: BoxSpec[] = [0, 1, 2].map((i) => ({
  id: `stair${i}`,
  x: 5.2 + i * STEP_RUN + STEP_RUN / 2 - 0.45,
  y: ((i + 1) * STEP_RISE) / 2,
  z: 5.2,
  hx: STEP_RUN / 2,
  hy: ((i + 1) * STEP_RISE) / 2,
  hz: 1.4,
}));

/** 傾斜 30°（登れる）と 52°（急すぎて登れず滑る）の坂。 */
function ramp(id: string, x: number, z: number, deg: number): BoxSpec {
  const length = 4;
  const rad = (deg * Math.PI) / 180;
  const half = length / 2;
  return {
    id,
    x,
    // 板の厚み 0.2 を考慮して、低い側の端が地面（y=0）に接するように持ち上げる
    y: Math.sin(rad) * half + 0.1 * Math.cos(rad) - 0.02,
    z,
    hx: 1.5,
    hy: 0.1,
    hz: half,
    yawDeg: 0,
    pitchDeg: deg,
  };
}

export const PLAYGROUND_BOXES: readonly BoxSpec[] = [
  // 北西の石壁（背を向けてカメラが壁に近づく状況を作る）
  { id: 'wallA', x: -6.5, y: 1.6, z: 2.5, hx: 0.35, hy: 1.6, hz: 3 },
  { id: 'wallB', x: -4.4, y: 1.6, z: 5.7, hx: 2.4, hy: 1.6, hz: 0.35 },
  ...stairs,
  ramp('ramp30', 7.4, 0.8, 30),
  ramp('ramp52', 2.6, 7.8, 52),
];

/** ロックオン用のダミー。背の高い 1 体はボス級（身長 4.0m）の構図確認用。 */
export const DUMMIES: readonly DummySpec[] = [
  { id: 'dummy-a', x: 0, z: -6, height: 1.8, radius: 0.4 },
  { id: 'dummy-b', x: -4.5, z: -5.2, height: 1.8, radius: 0.4 },
  { id: 'dummy-c', x: 4.8, z: -6.5, height: 1.8, radius: 0.4 },
  { id: 'dummy-far', x: 0.5, z: -13.5, height: 1.8, radius: 0.4 },
  { id: 'dummy-boss', x: 0, z: -8.8, height: 4, radius: 0.9 },
];

/** プレイヤーの初期位置と向き（ヨー）。広場の南から北（-Z）のダミー群を向く。 */
export const PLAYER_SPAWN = { x: 0, z: 3.5, yaw: Math.PI } as const;

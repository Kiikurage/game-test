/** 「タップで開始」時の没入化（フルスクリーン + 横向きロック）と、一時停止の判定。DOM 非依存。 */

export interface ImmersiveEnv {
  /** `document.fullscreenEnabled` 相当。 */
  readonly fullscreenSupported: boolean;
  requestFullscreen(): Promise<void>;
  lockLandscape(): Promise<void>;
}

export interface ImmersiveResult {
  readonly fullscreen: boolean;
  readonly orientationLocked: boolean;
}

/**
 * ユーザー操作のハンドラ内で呼ぶ。フルスクリーン → 向きロックの順（向きロックはフルスクリーン後でないと
 * 多くのブラウザで拒否される）。非対応・失敗は握りつぶし、成否だけ返す（呼び出し側はどちらでもゲームを開始する）。
 */
export async function enterImmersive(env: ImmersiveEnv): Promise<ImmersiveResult> {
  let fullscreen = false;
  if (env.fullscreenSupported) {
    try {
      await env.requestFullscreen();
      fullscreen = true;
    } catch {
      // iPhone Safari など要素のフルスクリーン非対応、または拒否された
    }
  }
  let orientationLocked = false;
  try {
    await env.lockLandscape();
    orientationLocked = true;
  } catch {
    // 非対応・フルスクリーンでない・拒否
  }
  return { fullscreen, orientationLocked };
}

export interface PauseInputs {
  readonly touch: boolean;
  readonly portrait: boolean;
  /** 開始時にフルスクリーンへ入れたか（入れた場合のみ、解除を一時停止の理由にする）。 */
  readonly fullscreenEntered: boolean;
  readonly isFullscreen: boolean;
}

/** 開始後に一時停止してタップ待ち（再開画面）にすべきか。PC（タッチ非主体）は止めない。 */
export function shouldPause(i: PauseInputs): boolean {
  if (!i.touch) return false;
  return i.portrait || (i.fullscreenEntered && !i.isFullscreen);
}

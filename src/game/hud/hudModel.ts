import { Afterimage } from './afterimage';

/** HUD が読むゲーム状態（`Health` / `Stamina` / `Flask` がそのまま満たす）。 */
export interface HudSource {
  readonly hp: { readonly current: number; readonly max: number };
  readonly stamina: { readonly current: number; readonly max: number };
  readonly flask: { readonly count: number; readonly max: number };
}

/** スタミナ 0 の点滅（赤く 2 回）。`period` F ごとに前半 `on` F が点灯。 */
export const STAMINA_BLINK = { count: 2, period: 20, on: 10 } as const;
/** 回復瓶を使った直後に光る長さ（F）。 */
export const FLASK_GLOW_FRAMES = 30;
/** HUD のフェード（F）。仕様書 9.1 節。 */
export const HUD_FADE_FRAMES = 30;

/** スタミナが 0 に達してから `frames` F 後に、点滅が点灯中か。点滅が終わった後は false。 */
export function isStaminaBlinkOn(frames: number): boolean {
  if (frames < 0 || frames >= STAMINA_BLINK.count * STAMINA_BLINK.period) return false;
  return frames % STAMINA_BLINK.period < STAMINA_BLINK.on;
}

/** スタミナ点滅を始める条件: 前ステップは 0 超で、今ステップで 0 になった（0 のまま居続けても再点滅しない）。 */
export function shouldStartStaminaBlink(prev: number, now: number): boolean {
  return prev > 0 && now <= 0;
}

/**
 * HUD の表示用状態。固定ステップごとに `step()` を呼ぶ（`hud.system.ts`）。描画（DOM）はこの値を読むだけ。
 * 残像・点滅・光り・フェードのフレーム計算はすべてここに閉じる（DOM 非依存でテストできる）。
 */
export class HudModel {
  private readonly hpGhost: Afterimage;
  private staminaPrev: number;
  private flaskPrev: number;
  private blinkFrames = Infinity;
  private glowFrames = Infinity;
  private visible_ = true;

  /** 0..1。HP の割合。 */
  hpRatio: number;
  /** 0..1。HP バーの残像の上端（`hpRatio` 以上）。 */
  hpGhostRatio: number;
  staminaRatio: number;
  /** スタミナが回復中（このステップで増えた）か。バーを少し明るくする。 */
  staminaRegenerating = false;
  /** スタミナ 0 の点滅の点灯中か。 */
  staminaBlinkOn = false;
  flaskCount: number;
  flaskMax: number;
  /** 回復瓶の光り 0..1（使用直後 1 → 30F で 0）。 */
  flaskGlow = 0;
  /** HUD 全体の不透明度 0..1（`setVisible` で 30F かけて遷移）。 */
  opacity = 1;

  constructor(private readonly source: HudSource) {
    this.hpRatio = ratio(source.hp.current, source.hp.max);
    this.hpGhostRatio = this.hpRatio;
    this.hpGhost = new Afterimage(this.hpRatio);
    this.staminaPrev = source.stamina.current;
    this.staminaRatio = ratio(source.stamina.current, source.stamina.max);
    this.flaskCount = source.flask.count;
    this.flaskPrev = source.flask.count;
    this.flaskMax = source.flask.max;
  }

  /** HP の最大値（バー幅 = 最大 HP × 0.8px）。 */
  get hpMax(): number {
    return this.source.hp.max;
  }

  /** 戦闘 UI 以外（篝火の休憩中・演出中）は false にしてフェードアウトさせる。 */
  setVisible(visible: boolean): void {
    this.visible_ = visible;
  }

  get visible(): boolean {
    return this.visible_;
  }

  /** 1 ステップ（1F）進める。 */
  step(): void {
    const { hp, stamina, flask } = this.source;
    this.hpRatio = ratio(hp.current, hp.max);
    this.hpGhost.step(this.hpRatio);
    this.hpGhostRatio = this.hpGhost.ghost;

    this.staminaRatio = ratio(stamina.current, stamina.max);
    this.staminaRegenerating = stamina.current > this.staminaPrev;
    if (shouldStartStaminaBlink(this.staminaPrev, stamina.current)) this.blinkFrames = 0;
    else if (this.blinkFrames !== Infinity) this.blinkFrames++;
    this.staminaBlinkOn = isStaminaBlinkOn(this.blinkFrames);
    this.staminaPrev = stamina.current;

    this.flaskCount = flask.count;
    this.flaskMax = flask.max;
    if (flask.count < this.flaskPrev) this.glowFrames = 0;
    else if (this.glowFrames !== Infinity) this.glowFrames++;
    this.flaskGlow = Math.max(0, 1 - this.glowFrames / FLASK_GLOW_FRAMES);
    this.flaskPrev = flask.count;

    const target = this.visible_ ? 1 : 0;
    const d = 1 / HUD_FADE_FRAMES;
    this.opacity =
      this.opacity < target
        ? Math.min(target, this.opacity + d)
        : Math.max(target, this.opacity - d);
  }
}

function ratio(current: number, max: number): number {
  return max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
}

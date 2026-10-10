import { capsuleShape, type HitShape } from '../../combat';
import { registerBossMove, type BossMoveContext, type BossStageDef } from '../bossMove';

/**
 * 技 7 灰の波（フェーズ 2 のみ。仕様書 6.3 節）。斧を地面へ叩き込み、地面から灰の棘が前方へ走る。中・遠距離。
 *
 * 発生 50・持続 36（3 本の発生 + 走る時間）・硬直 54・ダメージ 90・強靭度 40・ガード時スタミナ 55。
 * 棘は前方 12m を **0.2s（12F）** で走る（1 m/F）。幅 1.5m の直線 3 本（正面・+25°・−25°）が **12F 間隔で順に**発生する。
 *
 * - **判定は線分上の時間差判定**（スイープではない）: 段 F`f` の判定は、その本の先端が前フレームに居た位置から現在の位置までの
 *   線分（長さ 1m）を芯にした幅 1.5m（半径 0.75m）のカプセル。1 本目は F51〜F62、2 本目は F63〜F74、3 本目は F75〜F86。
 *   本が切り替わる F は前フレームの判定と繋がないよう `discontinuous` を返す（遠い端から次の本の根元へ判定が飛ぶため）。
 *   判定は 1 回の命中で終わる（同じ技で 2 本に当たらない）。
 * - **隙間**: 隣り合う線の間は、根元から離れるほど広がる（中心間 0.433 × 距離）。隙間（縁と縁の間）は距離 5.8m で約 1.0m、
 *   プレイヤーのハートボックス（半径 0.35m）が通れるのは距離 約 5.2m 以降。真横へ走れば線の外へ出る。
 * - **向き**: 追尾は F38 まで（向き固定の猶予 12F）。3 本とも固定後のボスの向きを基準にする。
 * - **予告**: 地面の予告線（E5-0 `GroundTelegraphs`）を発生 F18（`ASH_TELEGRAPH_FRAME`）から出す（3 本とも）。
 *   各本は走り終えたら消す。描画は `render/boss/bossAshWave.view.ts` が `ashWaveStateOf(boss)` を毎フレーム読んで行う。
 *
 * テレグラフ: `heavy`（強攻撃。ガードは可能なので `unblockable` ではない）。
 * クリップ: `Sword_Heavy_Combo` の 1 打目で斧を地面へ（マーカー表: `anim/data/bossClips.json`）。
 */

/** 発生（斧が地面へ入る F）。1 本目はこの次のフレームから走り出す。 */
export const ASH_STARTUP = 50;
/** 棘が走る長さ（m）と、その所要（F）= 0.2s。 */
export const ASH_LENGTH = 12;
export const ASH_RUN_FRAMES = 12;
/** 棘の走る速さ（m/F）= 12m / 0.2s。 */
export const ASH_SPEED = ASH_LENGTH / ASH_RUN_FRAMES;
/** 棘の線の幅（m）。判定カプセルの半径はこの半分。 */
export const ASH_WIDTH = 1.5;
/** 3 本の発生間隔（F）。 */
export const ASH_LINE_INTERVAL = 12;
/** 3 本の向き（正面と左右 ±25°。発生順）。 */
export const ASH_LINE_ANGLES_DEG = [0, 25, -25] as const;
/** 地面予告を出し始める F（発生 F18）。 */
export const ASH_TELEGRAPH_FRAME = 18;
/** 判定の高さ（足元から。m）: カプセルの芯の高さ。 */
export const ASH_HIT_HEIGHT = 0.9;
/** 向きの追尾を終える F（発生の 12F 前）。 */
export const ASH_TRACK_END = ASH_STARTUP - 12;

const DEG = Math.PI / 180;

/** 持続 = 最後の本が走り終えるまで。 */
const ACTIVE = ASH_LINE_INTERVAL * (ASH_LINE_ANGLES_DEG.length - 1) + ASH_RUN_FRAMES;

export const ASH_WAVE: BossStageDef = {
  id: 'ashWave.1',
  startup: ASH_STARTUP,
  active: ACTIVE,
  recovery: 54,
  damage: 90,
  poiseDamage: 40,
  guardStaminaCost: 55,
  moveDistance: 0,
  // 扇形としては使わない（`shape` が線分を返す）。デバッグ表示用の目安
  arcDeg: 50,
  range: ASH_LENGTH,
  heavy: true,
  telegraph: 'heavy',
  trackEndFrame: ASH_TRACK_END,
  trackRate: 1,
};

/** `line` 本目（0 始まり）が走り出す直前の段 F（この F の次から走る）。 */
export function ashLineStart(line: number): number {
  return ASH_STARTUP + line * ASH_LINE_INTERVAL;
}

/** 段 F`frame` までに `line` 本目の先端が根元から進んだ距離（m。0〜`ASH_LENGTH`）。 */
export function ashFront(line: number, frame: number): number {
  const d = (frame - ashLineStart(line)) * ASH_SPEED;
  return Math.min(ASH_LENGTH, Math.max(0, d));
}

/** `line` 本目の向き（ボスの向きからの加算。rad）。 */
export function ashLineYaw(line: number, bossYaw: number): number {
  return bossYaw + (ASH_LINE_ANGLES_DEG[line] ?? 0) * DEG;
}

/** 段 F`frame` で走っている本（なければ -1）。判定の持続の間は常に 1 本だけ走っている。 */
export function ashActiveLine(frame: number): number {
  for (let i = 0; i < ASH_LINE_ANGLES_DEG.length; i++) {
    if (frame > ashLineStart(i) && frame <= ashLineStart(i) + ASH_RUN_FRAMES) return i;
  }
  return -1;
}

/** 本が走り出す F（段の F）か。 */
export function ashLineStartsAt(frame: number): boolean {
  const line = ashActiveLine(frame);
  return line >= 0 && frame === ashLineStart(line) + 1;
}

/**
 * 段 F`frame` の判定形状（その F に走る線分を芯にしたカプセル）。走っていない F は根元の大きさ 0 のカプセル。
 * `origin` はボスの足元、`yaw` はボスの向き。
 */
export function ashShape(
  origin: { readonly x: number; readonly y: number; readonly z: number },
  yaw: number,
  frame: number,
): HitShape {
  const line = ashActiveLine(frame);
  const y = origin.y + ASH_HIT_HEIGHT;
  if (line < 0) {
    const p = { x: origin.x, y, z: origin.z };
    return capsuleShape({ a: p, b: { ...p }, radius: 0 }, origin);
  }
  const lineYaw = ashLineYaw(line, yaw);
  const sx = Math.sin(lineYaw);
  const sz = Math.cos(lineYaw);
  const d0 = ashFront(line, frame - 1);
  const d1 = ashFront(line, frame);
  return capsuleShape(
    {
      a: { x: origin.x + sx * d0, y, z: origin.z + sz * d0 },
      b: { x: origin.x + sx * d1, y, z: origin.z + sz * d1 },
      radius: ASH_WIDTH / 2,
    },
    origin,
  );
}

/** 灰の波の状態（描画・演出が読む。技の実行中だけ `ashWaveStateOf` で引ける）。 */
export interface AshWaveState {
  /** 根元（ボスの足元。技の間は動かない）。 */
  readonly origin: { readonly x: number; readonly y: number; readonly z: number };
  /** ボスの向き（追尾が終わる F38 以降は固定）。 */
  yaw: number;
  /** 向きが固定された（予告の線を置き直さなくてよい）。 */
  locked: boolean;
  /** 段の F。 */
  frame: number;
  /** 斧が地面に入った（F51 以降）。 */
  slammed: boolean;
  /** 走り出した本の数（0〜3。SE の起点）。 */
  linesStarted: number;
}

const states = new WeakMap<object, AshWaveState>();

/** `boss` の灰の波の状態（実行中でなければ undefined）。 */
export function ashWaveStateOf(boss: object): Readonly<AshWaveState> | undefined {
  return states.get(boss);
}

/** 地面予告の線を出しているか（発生 F18 から。各本は走り終えるまで）。`line` は 0 始まり。 */
export function ashTelegraphVisible(frame: number, line: number): boolean {
  return frame >= ASH_TELEGRAPH_FRAME && frame <= ashLineStart(line) + ASH_RUN_FRAMES;
}

registerBossMove({
  id: 'ashWave',
  name: '灰の波',
  phases: [2],
  stages: [ASH_WAVE],
  // 中・遠距離の技。その場から斧を叩き込む（接近しない）
  hooks: {
    onStageStart(ctx) {
      const { boss } = ctx;
      states.set(boss, {
        origin: { x: boss.position.x, y: boss.position.y, z: boss.position.z },
        yaw: boss.yaw,
        locked: false,
        frame: 0,
        slammed: false,
        linesStarted: 0,
      });
    },
    onStep(ctx) {
      const state = states.get(ctx.boss);
      if (!state) return;
      state.frame = ctx.frame;
      state.yaw = ctx.boss.yaw;
      state.locked = ctx.frame > ASH_TRACK_END;
      state.slammed = ctx.frame > ASH_STARTUP;
      if (ashLineStartsAt(ctx.frame)) state.linesStarted++;
    },
    onEnd(ctx) {
      states.delete(ctx.boss);
    },
    discontinuous: (ctx: BossMoveContext) => ashLineStartsAt(ctx.frame),
    shape: (ctx: BossMoveContext) => ashShape(ctx.boss.position, ctx.boss.yaw, ctx.frame),
  },
});

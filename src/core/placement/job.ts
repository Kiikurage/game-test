// 仕事（job）: 読む・書く状態と頻度を宣言した単位（#383 spike）。
// `run` は配列だけを受け取り、自分がメインスレッド・Worker のどこで動いているかを知らない。
// GPU で動かせる仕事は `gpu` にコンピュートの組み立てを持つ（three 非依存にするため型は executor 側が決める）。
import type { StateArrays, StateDef, StateSchema } from './state';

export type JobRate = 'step' | 'frame';

export interface JobParams {
  /** この実行で進める時間（秒）。step なら固定ステップ、frame ならフレーム間隔。 */
  readonly dt: number;
  /** 仕事が始まってからの累計時間（秒）。 */
  readonly time: number;
}

export interface JobDef<S extends StateSchema, Ctx = undefined> {
  readonly id: string;
  readonly state: StateDef<S>;
  readonly reads: readonly (keyof S & string)[];
  readonly writes: readonly (keyof S & string)[];
  readonly rate: JobRate;
  /** 実行場所での初期化（Rapier の world を作るなど）。状態の初期値もここで書く。 */
  init?(arrays: StateArrays<S>): Ctx | Promise<Ctx>;
  run(arrays: StateArrays<S>, params: JobParams, ctx: Ctx): void;
  /**
   * GPU コンピュート版の組み立て（任意）。`fields` はフィールド名 → ストレージバッファのノード、
   * `params` は dt / time の uniform ノード。戻り値は GPU executor が dispatch するもの。
   */
  gpu?(fields: Readonly<Record<keyof S & string, unknown>>, params: GpuParams): unknown;
}

export interface GpuParams {
  readonly dt: unknown;
  readonly time: unknown;
}

// Ctx は init と run の間だけで使う型。宣言をそのまま返し、推論を効かせるためだけの関数
export function defineJob<const S extends StateSchema, Ctx = undefined>(
  def: JobDef<S, Ctx>,
): JobDef<S, Ctx> {
  for (const f of [...def.reads, ...def.writes]) {
    if (!(f in def.state.schema)) throw new Error(`job ${def.id}: unknown field ${f}`);
  }
  return def;
}

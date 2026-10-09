import type { FrameWindow } from './frameWindow';

/**
 * 攻撃・動作のフレームデータ（仕様書 2.3 節の表の 1 行）。プレイヤーの動作・敵の攻撃で共通の形。
 * 単位: フレームは 60Hz シミュレーション、距離は m。
 */
export interface FrameData {
  /** 発生（動作開始から最初の判定フレームの直前まで）。判定を持たない動作では「効果が出る直前まで」。 */
  readonly startup: number;
  /** 持続（攻撃判定が出ているフレーム数）。判定がなければ 0。 */
  readonly active: number;
  /** 硬直（持続終了から行動可能になるまで）。 */
  readonly recovery: number;
}

/** 全体 = 発生 + 持続 + 硬直。表の「全体」列はこの派生値と一致させる（テストで保証）。 */
export function totalFrames(data: FrameData): number {
  return data.startup + data.active + data.recovery;
}

/** 攻撃判定の窓（持続）。持続 0 なら null。F(発生+1)–F(発生+持続)。 */
export function activeWindow(data: FrameData): FrameWindow | null {
  if (data.active === 0) return null;
  return { start: data.startup + 1, end: data.startup + data.active };
}

/**
 * 攻撃定義スキーマ。プレイヤー・敵・ボスの攻撃はすべてこの形で書く（敵の個別数値は各チケットで追加する）。
 * ダメージは `damage`（整数、敵の表の値）または `damageMultiplier` × 攻撃力から求める。
 */
export interface AttackDef extends FrameData {
  readonly id: string;
  /** ダメージ倍率（プレイヤー用。ダメージ = 基本攻撃力 × 倍率の四捨五入）。敵は `damage` を直接持つ。 */
  readonly damageMultiplier?: number;
  /** ダメージ値（敵用の整数）。 */
  readonly damage?: number;
  /** 強靭度削り。 */
  readonly poiseDamage: number;
  /** 動作開始時のスタミナ消費（プレイヤー）。 */
  readonly staminaCost?: number;
  /** ガードされたときに防御側が失うスタミナ（敵の攻撃の「ガード時スタミナ消費」）。 */
  readonly guardStaminaCost?: number;
  /** 前進・突進距離（m）。 */
  readonly moveDistance: number;
  /** 判定の扇形（度）。 */
  readonly arcDeg?: number;
  /** 判定の射程（m）。 */
  readonly range?: number;
}

/** 敵の攻撃定義（ダメージ・ガード時スタミナ・判定が必須）。 */
export interface EnemyAttackDef extends AttackDef {
  readonly damage: number;
  readonly guardStaminaCost: number;
  readonly arcDeg: number;
  readonly range: number;
  /** 強い攻撃（予備動作 34F 以上が必要。5.1 節）。 */
  readonly heavy?: boolean;
}

// ---- プレイヤー動作 ----

/** キャンセル先の分類。`attack` は軽・強どちらも。 */
export type CancelTarget =
  'lightAttack' | 'heavyAttack' | 'attack' | 'dodge' | 'guard' | 'heal' | 'move';

/** キャンセル窓（F`start`–F`end`、両端含む）。`end` が全体を超える場合は動作終了後も受け付ける（コンボ窓）。 */
export interface CancelWindow extends FrameWindow {
  readonly to: CancelTarget;
}

export type PlayerActionId =
  | 'light1'
  | 'light2'
  | 'light3'
  | 'heavy'
  | 'heavyCharged'
  | 'runAttack'
  | 'guardCounter'
  | 'backstab'
  | 'plunge'
  | 'roll'
  | 'backstep'
  | 'heal';

export interface PlayerActionData extends AttackDef {
  readonly id: PlayerActionId;
  /** 溜め時間（フレーム）。全体には含めない。 */
  readonly chargeFrames?: number;
  /** 被ダメージ判定が消える窓（ガード・強靭度判定も無効）。 */
  readonly invuln?: FrameWindow;
  /** スーパーアーマー: この窓の間、強靭度に `poiseBonus` を加える。 */
  readonly superArmor?: FrameWindow & { readonly poiseBonus: number };
  /** 効果（HP 加算など）が出るフレーム（`healApply` マーカーと対応）。 */
  readonly applyFrame?: number;
  /** 回復量（HP）。 */
  readonly healAmount?: number;
  readonly cancels: readonly CancelWindow[];
  /** 仕様書上の補足（出典の備考列）。 */
  readonly note?: string;
}

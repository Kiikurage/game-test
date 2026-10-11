// インタラクト対象・効果の型（仕様書 14.8 節）。描画・DOM 非依存。コードに文面・座標・数値を埋め込まず、データで表す。
import type { InteractVerb } from '../texts';

/** 文面データ（`texts.ja.ts`）のキー。 */
export type TextId = string;
/** セーブの `flags` に入る文字列（`read.<id>` / `loot.<id>` / `pray.gate` / `world.wallG1Broken` など）。`boss.<id>` は撃破済みのボス。 */
export type Flag = string;

/** パッシブ効果の数値の上書き（E11-2 が適用する。ここでは型だけ）。 */
export interface StatMod {
  readonly stat:
    | 'staminaRegenDelayF'
    | 'staminaRegenPerSec'
    | 'guardRegenPerSec'
    | 'zeroStaminaDelayF'
    | 'healAmount';
  readonly set: number;
}

export type Effect =
  | { readonly type: 'showText'; readonly textId: TextId; readonly seconds?: number }
  | { readonly type: 'giveItem'; readonly itemId: string; readonly count?: number }
  | { readonly type: 'setFlag'; readonly flag: Flag }
  | { readonly type: 'emitSound'; readonly radiusM: number; readonly kind: 'bell' | 'crash' }
  | { readonly type: 'playClip'; readonly clip: string; readonly durationF: number }
  | { readonly type: 'ambientDuck'; readonly db: number; readonly frames: number }
  | {
      readonly type: 'dialogue';
      readonly lines: readonly TextId[];
      readonly onEnd?: readonly Effect[];
    };

export type InteractableKind =
  'read' | 'loot' | 'bell' | 'pray' | 'talk' | 'push' | 'breakable' | 'floorHatch';

/**
 * 置かれる場所の種類。`main` はメインルート。それ以外は、レベルにその地形（脇道の足場・水路）が存在するときだけ置かれる
 * （存在しなければ配置されない。プレイヤーが近づけない場所に状況ボタンを出さないため）。
 */
export type InteractableSite = 'main' | 'side_roof' | 'side_ledge' | 'side_wall' | 'side_waterway';

export interface Interactable {
  readonly id: string;
  readonly kind: InteractableKind;
  /** 水平位置（高さは地形）。 */
  readonly x: number;
  readonly z: number;
  readonly site: InteractableSite;
  /** 反応半径（m）。既定は `INTERACT.defaultRadiusM`（1.5）。 */
  readonly radiusM?: number;
  /** 状況ボタンの動詞（`INTERACT_VERBS` のキー）。`null` は状況ボタンに出さない（攻撃で壊す対象など）。 */
  readonly prompt: InteractVerb | null;
  readonly requires?: { readonly flagSet?: Flag; readonly flagUnset?: Flag };
  /** 2 回目以降は文を出さない / 取得済み（loot）なら非表示。 */
  readonly once?: boolean;
  readonly cooldownF?: number;
  readonly effects: readonly Effect[];
  /** breakable の HP。 */
  readonly hp?: number;
}

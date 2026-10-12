// インタラクト対象・効果の型（仕様書 14.8 節）。描画・DOM 非依存。コードに文面・座標・数値を埋め込まず、データで表す。
import type { InteractVerb } from '../texts';

/** 文面データ（`texts.json` の `texts`）のキー。 */
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
  | {
      readonly type: 'showText';
      readonly textId: TextId;
      readonly seconds?: number;
      /** 初回だけ出す（2 回目以降は省略。鐘の `bell_first`）。出したら `shown.<textId>` をセーブする。 */
      readonly firstOnly?: boolean;
    }
  | { readonly type: 'giveItem'; readonly itemId: string; readonly count?: number }
  | { readonly type: 'setFlag'; readonly flag: Flag }
  | { readonly type: 'emitSound'; readonly radiusM: number; readonly kind: 'bell' | 'crash' }
  /** 効果音（SFX のキュー名。素材の接続は別チケット）。位置は対象の位置。 */
  | { readonly type: 'playSound'; readonly cue: string }
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

/** 遺体（と、もたれて座る瀕死の騎士）として描く対象。描画は `render/item/corpse.view.ts`。 */
export interface CorpseLook {
  /** 姿勢（`core/corpses` の `CorpsePose`）。 */
  readonly pose: 'sitting' | 'prone' | 'praying' | 'leaning';
  /** 見た目（`CorpseVariant`）。 */
  readonly variant: 'traveler' | 'pilgrim' | 'warrior' | 'broad';
  /** 向き（度。three の `rotation.y`。ローカル +Z が (sin, cos) を向く）。 */
  readonly yawDeg: number;
}

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
  /** 状況アクションの動作の長さ（フレーム。bell / pray / push。省略時は loot と同じ）。この間は無防備。 */
  readonly actionF?: number;
  /** 動作の開始からこのフレームで効果が出る（bell は F20 で鳴る）。省略時は loot と同じ。途中で被弾して中断されたら出ない。 */
  readonly effectF?: number;
  /** floorHatch の板の半幅（m）。接触の判定は `FLOOR_HATCH.contactMarginM` だけ内側。 */
  readonly halfM?: number;
  /** 開閉・崩壊で衝突を無効にする静的な箱の ID（`BoxSpec.id`。鉄格子・崩れる壁）。 */
  readonly colliderId?: string;
  /** 遺体として描く（仮の遺体。未指定なら目印だけ）。 */
  readonly corpse?: CorpseLook;
}

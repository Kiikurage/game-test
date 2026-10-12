/**
 * フィールド「灰の礎（Ashen Foundation）」のレベルデータ（仕様書 7 章）。
 * 本体は `levels/ashenFoundation.json`（スキーマと読み込みは `levelLoader.ts`）。
 * 座標は篝火を原点・+x 東・+z 北（m）。
 */
import type { LevelData } from './level';
import { loadLevelData } from './levelLoader';
import json from './levels/ashenFoundation.json';

export const ASHEN_FOUNDATION: LevelData = loadLevelData(json, 'levels/ashenFoundation.json');

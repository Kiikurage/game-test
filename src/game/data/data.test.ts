import { describe, expect, it } from 'vitest';
import { SchemaError } from '../../core/schema';
import { loadData, loadedDataSources } from './loadData';
import {
  INPUT_BUFFER_FRAMES,
  MOVEMENT,
  PLAYER_STATS,
  PlayerStatsDataSchema,
  STAMINA,
} from './playerStats';
import json from './playerStats.json';

// data 配下の全モジュールを読み込む（各モジュールが読み込み時に loadData で JSON を検証する。違反ならここで落ちる）。
const modules = import.meta.glob(['./**/*.ts', '!./**/*.test.ts'], { eager: true });
const jsonFiles = Object.keys(import.meta.glob('./**/*.json')).map((p) => p.slice(2));

describe('game data', () => {
  it('検証されていない JSON が data 配下に無い', () => {
    expect(Object.keys(modules).length).toBeGreaterThan(0);
    expect(jsonFiles).toContain('playerStats.json');
    const loaded = loadedDataSources();
    expect(jsonFiles.filter((f) => !loaded.has(f))).toEqual([]);
  });

  it('playerStats を型付きで読める（凍結済み）', () => {
    expect(PLAYER_STATS.hp).toBe(300);
    expect(PLAYER_STATS.flask).toEqual({ initial: 3, max: 4 });
    expect(STAMINA.regenPerSecond).toBe(40);
    expect(MOVEMENT.lockOn.back).toBe(2.6);
    expect(INPUT_BUFFER_FRAMES.roll).toBe(8);
    expect(Object.isFrozen(MOVEMENT.lockOn)).toBe(true);
  });

  it('スキーマ違反はファイル名とパス付きの SchemaError', () => {
    const bad = structuredClone(json) as { movement: { walk: unknown } };
    bad.movement.walk = '1.8';
    expect(() => loadData(PlayerStatsDataSchema, bad, 'bad.json')).toThrow(
      new SchemaError('$.movement.walk', 'expected number, got string', 'bad.json'),
    );
    const overFull = structuredClone(json);
    overFull.player.flask.initial = 5;
    expect(() => loadData(PlayerStatsDataSchema, overFull, 'bad.json')).toThrow(
      /initial \(5\) > max/,
    );
  });
});

import { ARENA_BONFIRE_ID } from '../data/bonfire';
import { BOSS_ENTRY } from '../data/bossEntry';
import { FOG_GATE } from '../data/fogGate';
import type { Game } from '../game';
import { fogGateOf } from '../fogGate/fogGate.system';
import { registerGameSystem } from '../systems';
import { bossSystemOf } from './boss.system';

/**
 * ボスの入場と戦闘開始・リセット（#85 / 仕様書 6.2・6.5・6.6 節）。
 *
 *   霧の門 `onEntered`（闘技場へ着いた）→ `bossIntro` と `bgmChange: bgm.boss` を発行し、ボスが入場演出（90F・無敵）を始める
 *   → 終わると `Boss.engage()`（`bossEngaged` = HP バー表示）。封鎖は霧の門が入場演出の完了で行い、撃破で `unseal()` される。
 *   プレイヤーの死亡 / 休憩 → ボスは HP 満タン・フェーズ 1・待機位置へ（`BossSystem.reset`）、入場演出も打ち切り、霧の門は閉じ直し、
 *   `bgmChange: bgm.area`。撃破済みのセーブではボスを出さない（霧の門は開いていて通れる）。
 *
 * ボスの待機位置・闘技場の円・柱は、闘技場の篝火（`bonfire-arena` = 闘技場の中心）と霧の門の入場位置から決める
 * （`game` は `Level` を持たないため。寸法は `data/bossEntry.ts`）。ライティングは位置で決まる闘技場のムード（`arenaMoodWeight`）に従う。
 * 霧の門・闘技場の篝火のないシーン（テスト・確認シーン）では何もしない。
 */
registerGameSystem('boss-entry', (game) => {
  // 霧の門・ボスのシステムの登録順に依らないよう、最初の更新で組み立てる
  let started = false;
  return {
    update: () => {
      if (started) return;
      started = true;
      setup(game);
    },
  };
});

function setup(game: Game): void {
  const gate = fogGateOf(game);
  const center = game.interactableSpawns.find((i) => i.id === ARENA_BONFIRE_ID);
  const gateSpawn = game.interactableSpawns.find((i) => i.id === FOG_GATE.id);
  if (!gate || !center || !gateSpawn?.target) return;
  const system = bossSystemOf(game);

  // 入口（入場位置）から中心へ向かう向きの先に、入口の方を向いて待つ
  const dx = center.x - gateSpawn.target.x;
  const dz = center.z - gateSpawn.target.z;
  const len = Math.hypot(dx, dz) || 1;
  const home = {
    x: center.x + (dx / len) * BOSS_ENTRY.homeOffsetM,
    z: center.z + (dz / len) * BOSS_ENTRY.homeOffsetM,
    yaw: Math.atan2(-dx, -dz),
  };
  const pillars = [0, 90, 180, 270].map((deg) => ({
    x: center.x + Math.cos((deg * Math.PI) / 180) * BOSS_ENTRY.pillarRingM,
    z: center.z + Math.sin((deg * Math.PI) / 180) * BOSS_ENTRY.pillarRingM,
    radius: BOSS_ENTRY.pillarRadiusM,
  }));

  // 確認用・テストが先にボスを出していれば置き換えない
  if (!system.boss)
    system.spawnUnlessDefeated({
      x: home.x,
      z: home.z,
      y: game.heightAt(center.x, center.z),
      yaw: home.yaw,
      engage: false,
      arena: { x: center.x, z: center.z, radius: BOSS_ENTRY.arenaRadius },
      pillars,
    });

  gate.onEntered(() => {
    const boss = system.boss;
    if (!boss?.beginIntro(BOSS_ENTRY.introFrames)) return;
    game.events.emit('bossIntro', { id: boss.id, frames: BOSS_ENTRY.introFrames });
    game.events.emit('bgmChange', { track: 'bgm.boss', frames: BOSS_ENTRY.bgmFrames });
  });
  const back = (): void => {
    if (system.boss?.alive) {
      game.events.emit('bgmChange', { track: 'bgm.area', frames: BOSS_ENTRY.bgmFrames });
    }
  };
  game.events.on('death', (e) => {
    if (e.phase === 'start') back();
  });
  game.events.on('rest', (e) => {
    if (e.cause === 'respawn') back();
  });
}

import BloomNode from 'three/addons/tsl/display/BloomNode.js';
import { Vector3, type Object3D } from 'three/webgpu';
import { PERF_VIEWPOINTS } from '../../../scripts/perfViewpoints.mjs';
import type { Game } from '../../game/game';
import type { Enemy } from '../../game/enemy/enemy';
import type { EmberField } from '../particles';
import { FlatMaterials } from '../flatMaterials';
import { perfProbe } from '../perfProbe';
import type { GameRenderer } from '../renderer';
import type { GameView } from '../gameView';
import { registerViewPlugin } from '../viewPlugins';
import type { ViewServices } from '../viewServices';
import {
  BenchSectionRun,
  benchStatus,
  benchTimingFor,
  formatBenchReport,
  summarize,
  type BenchRow,
} from './bench';
import { mountBenchProgress, mountBenchResult } from './benchPanel';

// ベンチマークモード（`?bench`。#261）: 開始画面のタップ後、決められたシナリオを自動で再生して区間ごとに計測し、
// 結果の表とコピー用テキストを出す。使い方と結果の読み方は docs/performance.md。
//
// シナリオ:
//  1. 計測視点（scripts/perfViewpoints.mjs の篝火・墓地・礼拝堂の門・内部）
//  2. 切り分け: 墓地視点で各トグルを実行時に 1 つずつ切り替える
//  3. 戦闘負荷: 礼拝堂の敵 3 体のそばで、死亡ディゾルブ・ヒットエフェクト・火の粉を出す（敵を倒すので最後）
// 計測中は敵を拘束（知覚・行動を止める）し、プレイヤーの HP を毎フレーム戻す（死亡演出で計測が崩れないように）。

const MEASURED_VIEWPOINTS = ['bonfire', 'graveyard', 'chapel-gate', 'chapel-interior'];
/** 戦闘区間で倒す敵を選ぶ基準点（礼拝堂。亡者兵 2・盾持ち 1 がいる）。 */
const COMBAT_CENTER = { x: 48, z: 22 };

interface Section {
  readonly name: string;
  /** 省略する理由（あれば計測しない）。 */
  readonly skip?: string;
  enter?(): void;
  /** 毎フレーム（計測の進み具合 0..1 とウォームアップ中か）。 */
  frame?(progress: number, warm: boolean): void;
  exit?(): void;
}

interface Ctx {
  readonly game: Game;
  readonly view: GameView;
  readonly gameRenderer: GameRenderer;
  readonly services: ViewServices;
}

registerViewPlugin('bench', ({ game, view, gameRenderer, services }) => {
  if (!gameRenderer.quality.toggles.bench) return {};
  const ctx: Ctx = { game, view, gameRenderer, services };
  const sections = buildSections(ctx);
  const timing = benchTimingFor(location.search);
  const rows: BenchRow[] = [];
  const progress = mountBenchProgress();
  benchStatus.state = 'running';
  benchStatus.total = sections.length;

  let index = -1;
  let run: BenchSectionRun | null = null;
  let current: Section | null = null;

  const next = (): void => {
    current?.exit?.();
    index++;
    current = sections[index] ?? null;
    benchStatus.index = index;
    if (!current) {
      finish();
      return;
    }
    benchStatus.current = current.name;
    progress.set(`bench ${index + 1}/${sections.length}: ${current.name}`);
    if (current.skip !== undefined) {
      rows.push({ name: current.name, skipped: current.skip });
      next();
      return;
    }
    current.enter?.();
    run = new BenchSectionRun(timing);
  };

  const finish = (): void => {
    run = null;
    progress.remove();
    for (const e of game.enemies.enemies) e.restrained = false;
    const header = deviceHeader(gameRenderer);
    const text = formatBenchReport(header, rows);
    benchStatus.rows = rows;
    benchStatus.text = text;
    benchStatus.state = 'done';
    // PC: 結果パネルを操作できるようにポインタロックを外す
    if (document.pointerLockElement) document.exitPointerLock();
    mountBenchResult(header, rows, text);
    console.info(text);
  };

  return {
    update: (dt) => {
      // dt = 0 はロード中の warmUp の描画（ゲーム開始前）。開始画面のタップ後から進める
      if (benchStatus.state !== 'running' || dt <= 0) return;
      // 計測を崩さない: 敵は動かさず、プレイヤーは死なせない
      for (const e of game.enemies.enemies) e.restrained = true;
      game.playerTarget.health.refill();
      if (!run) {
        next();
        return;
      }
      const { stats } = gameRenderer;
      // 区間の経過時間は 1 フレーム 0.25 秒までに丸める（開始画面で待った時間などで区間が飛ばないように）
      const phase = run.step(Math.min(dt, 0.25), perfProbe.pipelineCreations, {
        frameMs: dt * 1000,
        gpuMs: stats.gpuMs,
        cpuMs: perfProbe.frameCpuMs,
        draws: stats.drawCalls,
        tris: stats.triangles,
      });
      current?.frame?.(run.progress, phase === 'warm');
      if (phase === 'done' && current) {
        rows.push(
          summarize(
            current.name,
            run.samples,
            { width: stats.width, height: stats.height, scale: stats.scale },
            run.pipelinesDuringMeasure,
          ),
        );
        next();
      }
    },
  };
});

function viewpoint(name: string): { x: number; z: number; yaw: number } {
  const vp = PERF_VIEWPOINTS.find((v) => v.name === name);
  if (!vp) throw new Error(`unknown perf viewpoint: ${name}`);
  return vp;
}

/** 視点へ移ってカメラをプレイヤーの背後に固定する区間（`frame` で毎フレーム置き直す）。 */
function placeAt(game: Game, name: string): Pick<Section, 'enter' | 'frame'> {
  const vp = viewpoint(name);
  return {
    enter: () => {
      game.teleportPlayer(vp.x, vp.z, vp.yaw);
    },
    frame: () => {
      game.camera.reset(game.player.feet, vp.yaw);
    },
  };
}

function buildSections(ctx: Ctx): Section[] {
  const { game } = ctx;
  return [
    ...MEASURED_VIEWPOINTS.map((name) => ({ name, ...placeAt(game, name) })),
    ...isolationSections(ctx),
    combatSection(ctx),
  ];
}

/** 墓地視点で 1 つずつ切り替える区間。基準（graveyard:base）と比べて差を読む。 */
function isolationSections(ctx: Ctx): Section[] {
  const { game, view, gameRenderer, services } = ctx;
  const { renderer, quality } = gameRenderer;
  const { preset, toggles } = quality;
  const base = placeAt(game, 'graveyard');
  const toggle = (id: string, apply: () => void, restore: () => void, skip?: string): Section => ({
    name: `graveyard:${id}`,
    ...(skip !== undefined && { skip }),
    enter: () => {
      base.enter?.();
      apply();
    },
    frame: base.frame,
    exit: restore,
  });

  const hidden: Object3D[] = [];
  const hide = (match: (o: Object3D) => boolean): void => {
    view.scene.traverse((o) => {
      if (o.visible && match(o)) {
        o.visible = false;
        hidden.push(o);
      }
    });
  };
  const unhide = (): void => {
    for (const o of hidden) o.visible = true;
    hidden.length = 0;
  };

  const flat = new FlatMaterials(null);
  const bloomProto = BloomNode.prototype as unknown as {
    updateBefore: (this: unknown, frame: unknown) => unknown;
  };
  const bloomUpdate = bloomProto.updateBefore;

  return [
    { name: 'graveyard:base', ...base },
    toggle(
      'noshadow',
      () => {
        renderer.shadowMap.enabled = false;
      },
      () => {
        renderer.shadowMap.enabled = !toggles.noShadow;
      },
      toggles.noShadow ? 'already off (?noshadow)' : undefined,
    ),
    // ブルームのノードはポストエフェクトの中にあり外から外せないので、ぼかしパス（updateBefore）だけ止める。
    // 合成の 1 回のテクスチャ参照は残るが、ブルームのコストのほぼすべて（縮小・ぼかしの数パス）が消える
    toggle(
      'nobloom',
      () => {
        bloomProto.updateBefore = () => undefined;
      },
      () => {
        bloomProto.updateBefore = bloomUpdate;
      },
      preset.bloom ? undefined : 'bloom is off in this preset',
    ),
    toggle(
      'nomsaa',
      () => undefined,
      () => undefined,
      preset.msaa
        ? 'MSAA is fixed at renderer creation; compare with ?bench&nomsaa'
        : 'msaa is off in this preset',
    ),
    toggle(
      'nograss',
      () => {
        hide((o) => o.name.startsWith('grass:'));
      },
      unhide,
      preset.grassCount > 0 ? undefined : 'no grass in this preset',
    ),
    toggle(
      'noparticles',
      () => {
        hide((o) => o === services.fx.root);
      },
      unhide,
    ),
    toggle(
      'nolights',
      () => {
        // 太陽（平行光源）と環境光以外の光源（篝火・たいまつの点光源）
        hide((o) => (o as { isPointLight?: boolean }).isPointLight === true);
      },
      unhide,
    ),
    toggle(
      'flatmat',
      () => {
        flat.apply(view.scene);
      },
      () => {
        flat.restore(view.scene);
      },
    ),
    toggle(
      'scale=0.5',
      () => {
        gameRenderer.setFixedScale(0.5);
      },
      () => {
        gameRenderer.setFixedScale(quality.fixedScale);
      },
    ),
  ];
}

/** 礼拝堂の敵 3 体のそばで、死亡ディゾルブ・ヒットエフェクト・火の粉を出す。 */
function combatSection(ctx: Ctx): Section {
  const { game, services } = ctx;
  let targets: Enemy[] = [];
  let embers: EmberField | null = null;
  let frame = 0;
  let killed = 0;
  let yaw = 0;
  const pos = new Vector3();
  const normal = new Vector3();
  const kill = (n: number): void => {
    while (killed < n && killed < targets.length) targets[killed++]?.kill();
  };
  return {
    name: 'combat',
    enter: () => {
      const d = (e: Enemy): number =>
        Math.hypot(e.position.x - COMBAT_CENTER.x, e.position.z - COMBAT_CENTER.z);
      targets = game.enemies.enemies
        .filter((e) => e.alive)
        .sort((a, b) => d(a) - d(b))
        .slice(0, 3);
      const first = targets[0];
      // 最寄りの敵の 4m 手前から敵の方を向く（enemy.dev.ts の killEnemy と同じ置き方）
      if (first) game.teleportPlayer(first.position.x, first.position.z - 4, 0, first.position.y);
      yaw = game.player.yaw;
      const p = game.player.feet;
      embers = services.fx.acquireEmberField(p.x, p.y, p.z + 2, 3, 2.5);
      embers.setActive(true);
      frame = 0;
      killed = 0;
      kill(1); // ウォームアップ中に倒れ始め、計測中にディゾルブする
    },
    frame: (progress, warm) => {
      game.camera.reset(game.player.feet, yaw);
      if (!warm) kill(progress >= 0.5 ? 3 : 2);
      // 4 フレームごとに、敵の胸の高さへヒットエフェクト（プレイヤーの方へ飛び散る）
      if (frame++ % 4 === 0 && targets.length > 0) {
        const e = targets[(frame >> 2) % targets.length];
        if (e) {
          pos.set(e.position.x, e.position.y + 1.2, e.position.z);
          normal.copy(game.player.feet).sub(e.position).setY(0).normalize();
          services.fx.hit(pos, normal, 1);
        }
      }
    },
    exit: () => {
      if (embers) services.fx.releaseEmberField(embers);
      embers = null;
    },
  };
}

/** 結果テキストの先頭（端末・GPU・解像度・品質）。 */
function deviceHeader(gameRenderer: GameRenderer): string[] {
  const { quality, stats } = gameRenderer;
  const device = (gameRenderer.renderer.backend as { device?: GPUDevice }).device;
  const info = (device as { adapterInfo?: GPUAdapterInfo } | undefined)?.adapterInfo;
  const gpu = info
    ? [info.vendor, info.architecture, info.device, info.description].filter(Boolean).join(' / ')
    : 'n/a';
  const p = quality.preset;
  return [
    `ua: ${navigator.userAgent}`,
    `gpu: ${gpu || 'n/a'} | timestamp-query: ${stats.gpuMs !== null ? 'yes' : 'no'}`,
    `screen: ${window.innerWidth}x${window.innerHeight} css px, dpr ${window.devicePixelRatio}`,
    `quality: ${p.level}${quality.isMobile ? ' (mobile)' : ''} | msaa ${p.msaa ? 'on' : 'off'}` +
      ` | bloom ${p.bloom ? 'on' : 'off'} | shadow ${quality.toggles.noShadow ? 'off' : 'on'}` +
      ` | grass ${p.grassCount} | target ${quality.targetFps} fps | scale ${stats.scale.toFixed(2)} (fixed)`,
  ];
}

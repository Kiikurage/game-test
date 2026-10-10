import {
  BufferGeometry,
  Group,
  Float32BufferAttribute,
  LineBasicNodeMaterial,
  LineSegments,
  Matrix4,
  Vector3,
  type Mesh,
  type Object3D,
} from 'three/webgpu';
import { GaitClock } from '../../game/anim/locomotion';
import { BossCharacter } from '../assets/bossCharacter';
import { CharacterAssets } from '../assets/characterAssets';
import { CLIP_NAMES } from '../assets/clips';
import { EquipmentAssets } from '../assets/equipment';
import { registerViewPlugin } from '../viewPlugins';
import { BossAnimator, bossMoveState } from './bossAnimator';
import { BOSS_GAIT_TABLE, BOSS_LOCOMOTION, BOSS_SPEED, toModelSpeed } from './bossGait';
import { ThrownShield } from './thrownShield';
import { BOSS_GLOW_STYLE, BOSS_WEAPON_TELEGRAPH } from './bossWeaponGlow';

/**
 * ボスのモデルの確認表示（`?bossmodel=1|2&scene=test`。フェーズ 1 / 2）。撮影・E2E 用。
 * ボスは原点に +Z 向きで立ち、横に等身大の騎士（showcase の騎士 = プレイヤー相当、身長 1.8m）を並べる。
 *
 *   `&cam=combat|up|front|three|side|top|back|wide`  カメラ（combat: 戦闘距離の目線 / up: プレイヤーの目線で見上げる）、`&dist=<m>`（既定 6）
 *   `&gait=walk|run1|run2|<m/s>`  その速度で歩行アニメーション（足の接地速度を `window.__bossGait` に出す）
 *   `&clip=<クリップ名>&t=<秒>`  任意のクリップを固定表示（Sword_Heavy_Combo など）
 *   `&grip=shield|twoHand`  フェーズに関わらず斧の持ち方を上書き
 *   `&throw=1`  フェーズ 2 への移行で盾を投げ捨てる（盾が飛んで地面に刺さるまでを再生）
 *   `&action=<動作 ID>&sf=<段の F>`  マーカー表の動作（例 `boss.overhead.1.p1`）を、実際のアニメーションコントローラで段 F まで進めて固定表示
 *   `&glow=normal|heavy`  予兆の斧の発光（種別のピーク）を点ける（`bossWeaponGlow.ts`）。`&glowon=shield` で盾を光らせる
 *   `&probe=1`  （`action` と併用）段 F1〜sf の各フレームの斧の刃先（頭の頂点のうち、ボスの原点から水平に最も遠い点）と斧の最低の高さを `window.__bossProbe` に出す（射程の照合用）
 *   `&reach=<m>`  ボスの原点から m の位置に判定の射程の目印（地面の円と、柱状の線。±0.4m は細い円）を出す（`probe` と併せて射程の照合に使う）
 *   `&axegrip=<0..1>`  斧の握りの向きを固定（0 = 構え … 1 = 振り。既定は動作ごとの表 `bossAxeGrip.ts`）
 *   `&ember=<0..1>`  熾火の強さを上書き（フェーズ 1 の見た目のまま発光だけ確認）
 */
declare global {
  interface Window {
    /** `&probe=1` の計測結果。dist: ボスの原点からの水平距離（m）、y: 高さ、f: 段 F。 */
    /** `&probe=1` で使える一括計測: 動作 ID・段 F の数・握りごとに、段 F1〜frames の刃先を返す（フェーズは ID の `.p1|.p2` から）。 */
    __bossScan?: (
      jobs: { id: string; frames: number; grip?: number }[],
    ) => { id: string; grip?: number; samples: NonNullable<Window['__bossProbe']> }[];
    __bossProbe?: {
      f: number;
      dist: number;
      y: number;
      x: number;
      z: number;
      angle: number;
      minY: number;
      /** 盾の最も遠い点の、ボスの原点からの水平距離（盾がなければ 0）。 */
      shield: number;
    }[];
    /** `&gait=` の計測結果。 */
    __bossGait?: {
      commanded: number;
      /** 接地している足の後退速度の中央値（m/s）。commanded に近いほど足滑りが小さい。 */
      stanceSpeed: number;
      samples: number;
    };
  }
}

const BOSS_AT = new Vector3(0, 0, 0);
const PLAYER_AT = new Vector3(2.6, 0, 1.6);
const FIXED_DT = 1 / 60;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

registerViewPlugin('bossShowcase', ({ view, gameRenderer }) => {
  const params = new URLSearchParams(location.search);
  const requested = params.get('bossmodel');
  let boss: BossCharacter | undefined;
  let animator: BossAnimator | undefined;
  let thrown: ThrownShield | undefined;
  const gait = new GaitClock();
  const gaitParam = params.get('gait');
  const speed =
    gaitParam === null
      ? 0
      : (BOSS_GAIT_TABLE.find((e) => e.id === gaitParam)?.speed ??
        (Number.isFinite(Number(gaitParam)) ? Number(gaitParam) : BOSS_SPEED.walk));
  const clipParam = params.get('clip');
  const fixedClip = CLIP_NAMES.find((n) => n === clipParam);
  const actionParam = params.get('action');
  const actionFrame = Number(params.get('sf') ?? 1);
  const frozenAt = params.has('t') ? Number(params.get('t')) : NaN;
  const feet: { left?: Object3D; right?: Object3D } = {};
  const prev = { left: new Vector3(), right: new Vector3(), valid: false };
  const samples: { y: number; v: number }[] = [];
  const tmp = new Vector3();

  return {
    async load() {
      if (requested === null) return;
      const phase = requested === '2' ? 2 : 1;
      const { assets, equipment, lod } = await BossCharacter.load(
        await CharacterAssets.load(['knight']),
        await EquipmentAssets.load(),
      );
      boss = BossCharacter.create(assets, equipment, lod);
      const { preset } = gameRenderer.quality;
      boss.lodConfig = {
        nearDistance: preset.characterLod.nearDistance,
        shadowDistance: preset.shadowRadius * 1.4,
      };
      boss.root.position.copy(BOSS_AT);
      view.scene.add(boss.root);
      boss.bindParticles(view.particles);
      animator = new BossAnimator(boss, assets);
      if (params.has('axegrip')) animator.gripOverride = Number(params.get('axegrip'));
      if (params.get('throw') === '1') {
        const shield = boss.detachShield(view.scene);
        boss.setPhase(2);
        if (shield) {
          thrown = new ThrownShield(shield, {
            velocity: new Vector3(4.5, 5.5, 9),
            spin: new Vector3(0, 6, 12),
            radius: 1.2,
          });
        }
      } else {
        boss.setPhase(phase);
      }
      const grip = params.get('grip');
      if (grip === 'shield' || grip === 'twoHand') boss.setGrip(grip);
      if (params.has('ember')) boss.setEmber(Number(params.get('ember')));
      if (fixedClip) {
        const action = boss.character.play(fixedClip, { fade: 0 });
        if (Number.isFinite(frozenAt)) {
          action.time = frozenAt;
          action.paused = true;
          boss.character.mixer.update(0);
        }
      }
      if (actionParam) {
        // 実際の再生経路（BossAnimator + マーカー表）で段の F まで進める
        const probe: NonNullable<Window['__bossProbe']> = [];
        window.__bossProbe = probe;
        for (let f = 1; f <= actionFrame; f++) {
          animator.update(
            FIXED_DT,
            {
              ...bossMoveState(0, gait),
              state: 'attack',
              kind: 'action',
              actionId: actionParam,
              stateFrame: f,
            },
            1,
          );
          boss.lateUpdate(FIXED_DT);
          if (params.has('probe')) {
            probe.push({
              f,
              ...farthestPoint(boss.root),
              shield: farthestPoint(boss.root, 'equip:GreatShield', -Infinity).dist,
            });
          }
        }
      }
      if (params.has('probe')) {
        const scanBoss = boss;
        const scanAnimator = animator;
        window.__bossScan = (jobs) =>
          jobs.map(({ id, frames, grip }) => {
            scanBoss.setPhase(id.endsWith('p2') ? 2 : 1);
            scanAnimator.gripOverride = grip;
            scanAnimator.resetGrip();
            const samples: NonNullable<Window['__bossProbe']> = [];
            for (let f = 1; f <= frames; f++) {
              scanAnimator.update(
                FIXED_DT,
                {
                  ...bossMoveState(0, gait),
                  state: 'attack',
                  kind: 'action',
                  actionId: id,
                  stateFrame: f,
                },
                1,
              );
              scanBoss.lateUpdate(FIXED_DT);
              samples.push({
                f,
                ...farthestPoint(scanBoss.root),
                shield: farthestPoint(scanBoss.root, 'equip:GreatShield', -Infinity).dist,
              });
            }
            return { id, grip, samples };
          });
      }
      const glowParam = params.get('glow');
      if (glowParam === 'normal' || glowParam === 'heavy') {
        const profile = BOSS_WEAPON_TELEGRAPH[glowParam];
        const style = BOSS_GLOW_STYLE[glowParam];
        if (params.get('glowon') === 'shield') {
          boss.look.setShieldTelegraph(profile.peak, profile.color, style);
        } else {
          boss.look.setWeaponTelegraph(profile.peak, profile.color, style);
        }
      }
      if (params.has('reach')) view.scene.add(reachMarker(Number(params.get('reach'))));
      feet.left = boss.root.getObjectByName('foot_l') ?? undefined;
      feet.right = boss.root.getObjectByName('foot_r') ?? undefined;

      // 並べる等身大の騎士（showcase が置いたもの）
      const knight = view.shadowFocusTarget;
      if (knight) {
        knight.position.copy(PLAYER_AT);
        knight.rotation.y = 0;
      }
      placeCamera(view.camera, params.get('cam') ?? 'combat', Number(params.get('dist')));
    },
    update(dt) {
      if (!boss || !animator) return;
      thrown?.update(dt);
      boss.updateLod(view.camera, view.shadowFocusTarget?.position);
      if (actionParam) {
        boss.lateUpdate(FIXED_DT);
      } else if (!fixedClip) {
        // 歩行位相はモデル空間の速度で進める（拡大後の歩幅。bossGait.ts）。計測のため固定刻みで進める
        const step = gaitParam === null ? Math.min(dt, 0.1) : FIXED_DT;
        gait.advance(toModelSpeed(speed), step, { profile: BOSS_LOCOMOTION });
        animator.update(step, bossMoveState(speed, gait), 1);
        boss.lateUpdate(step);
        if (gaitParam !== null) measureStance(step);
      } else {
        if (!Number.isFinite(frozenAt)) boss.character.update(dt);
        boss.lateUpdate(dt);
      }
    },
  };

  function measureStance(dt: number): void {
    const { left, right } = feet;
    if (!left || !right) return;
    boss?.root.updateMatrixWorld(true);
    left.getWorldPosition(tmp);
    const l = tmp.clone();
    right.getWorldPosition(tmp);
    const r = tmp.clone();
    if (prev.valid) {
      // 低い方の足が接地している。後退速度 = -(前進方向の変位) / dt（ボスは +Z 向き）
      const lowIsLeft = l.y < r.y;
      const low = lowIsLeft ? l : r;
      const was = lowIsLeft ? prev.left : prev.right;
      if (samples.length >= 600) samples.shift();
      samples.push({ y: Math.min(l.y, r.y), v: -(low.z - was.z) / dt });
    }
    prev.left.copy(l);
    prev.right.copy(r);
    prev.valid = true;
    // 接地中 = 足の高さがこのサイクルの最低点に近いサンプル。その後退速度の中央値
    const minY = Math.min(...samples.map((x) => x.y));
    const grounded = samples.filter((x) => x.y < minY + 0.05);
    window.__bossGait = {
      commanded: speed,
      stanceSpeed: median(grounded.map((x) => x.v)),
      samples: samples.length,
    };
  }
});

/** 判定の射程の目印: 半径 `radius` の円（明るい）と、±0.4m の円（暗い）を地面の高さに。 */
function reachMarker(radius: number): Object3D {
  const ring = (r: number, color: number): LineSegments => {
    const points: number[] = [];
    const steps = 96;
    for (let i = 0; i < steps; i++) {
      for (const k of [i, i + 1]) {
        const a = (k / steps) * Math.PI * 2;
        points.push(Math.sin(a) * r, 0.05, Math.cos(a) * r);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
    const material = new LineBasicNodeMaterial({ color });
    material.depthTest = false;
    material.transparent = true;
    const lines = new LineSegments(geometry, material);
    lines.renderOrder = 20;
    lines.frustumCulled = false;
    return lines;
  };
  const group = new Group();
  group.add(ring(radius, 0xffe14a), ring(radius - 0.4, 0x7a6a20), ring(radius + 0.4, 0x7a6a20));
  // 正面（+Z）に、射程の位置の細い柱（高さ 5m）
  const post = new LineSegments(
    new BufferGeometry().setFromPoints([new Vector3(0, 0, radius), new Vector3(0, 5, radius)]),
    new LineBasicNodeMaterial({ color: 0xffe14a }),
  );
  post.renderOrder = 20;
  post.frustumCulled = false;
  group.add(post);
  return group;
}

const probeVertex = new Vector3();
const probeInverse = new Matrix4();
/** 斧の頭（刃・先端）とみなす、斧のローカルの高さ（m）。柄の延長（`GREAT_AXE_REACH`）+ 刃の根元（0.58）の少し下。 */
const AXE_HEAD_MIN_Y = 1.5;

/** 斧の頭の頂点のうち、ボスの原点（ルート）から水平に最も遠い点（刃先）と、斧全体の最低の高さ。 */
function farthestPoint(
  root: Object3D,
  name = 'equip:GreatAxe',
  minLocalY = AXE_HEAD_MIN_Y,
): {
  dist: number;
  y: number;
  x: number;
  z: number;
  /** 正面（+Z）からの角度（度。左右は符号違い）。 */
  angle: number;
  minY: number;
} {
  root.updateMatrixWorld(true);
  const axe = root.getObjectByName(name);
  const best = { dist: 0, y: 0, x: 0, z: 0, angle: 0, minY: Infinity };
  if (!axe) return { ...best, minY: 0 };
  probeInverse.copy(axe.matrixWorld).invert();
  axe.traverse((o) => {
    const mesh = o as Partial<Mesh>;
    const position = mesh.geometry?.getAttribute('position');
    if (!position || !mesh.matrixWorld) return;
    for (let i = 0; i < position.count; i++) {
      probeVertex.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      best.minY = Math.min(best.minY, probeVertex.y);
      const local = probeVertex.clone().applyMatrix4(probeInverse);
      if (local.y < minLocalY) continue;
      const dist = Math.hypot(probeVertex.x - root.position.x, probeVertex.z - root.position.z);
      if (dist > best.dist) {
        best.dist = dist;
        best.y = probeVertex.y;
        best.x = probeVertex.x;
        best.z = probeVertex.z;
        best.angle =
          (Math.atan2(probeVertex.x - root.position.x, probeVertex.z - root.position.z) * 180) /
          Math.PI;
      }
    }
  });
  return best;
}

function placeCamera(
  camera: { position: Vector3; lookAt(x: number, y: number, z: number): void },
  mode: string,
  distParam: number,
): void {
  const d = Number.isFinite(distParam) && distParam > 0 ? distParam : 6;
  switch (mode) {
    case 'up': // プレイヤーの目線（高さ 1.5m）で見上げる
      camera.position.set(0.9, 1.5, d);
      camera.lookAt(0, 3.0, 0);
      break;
    case 'front':
      camera.position.set(1.2, 2.0, d + 4);
      camera.lookAt(1.2, 1.9, 0);
      break;
    case 'three': {
      const a = (35 * Math.PI) / 180;
      camera.position.set(Math.sin(a) * d, 2.4, Math.cos(a) * d);
      camera.lookAt(0, 2.2, 0);
      break;
    }
    case 'top': // 真上から（射程の円と刃先の位置の確認）
      camera.position.set(0, d * 1.5, 0.01);
      camera.lookAt(0, 0, 1.5);
      break;
    case 'side':
      camera.position.set(d, 2.0, 0);
      camera.lookAt(0, 2.0, 0);
      break;
    case 'back':
      camera.position.set(0.8, 2.6, -d);
      camera.lookAt(0, 2.4, 0);
      break;
    case 'wide':
      camera.position.set(4, 3.2, d + 8);
      camera.lookAt(0.8, 1.8, 0);
      break;
    default: // combat: 戦闘距離（4〜8m）の、プレイヤーの肩越し
      camera.position.set(1.4, 2.2, d);
      camera.lookAt(0, 2.5, 0);
  }
}

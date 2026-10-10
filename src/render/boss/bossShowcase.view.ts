import { Vector3, type Object3D } from 'three/webgpu';
import { GaitClock } from '../../game/anim/locomotion';
import { BossCharacter } from '../assets/bossCharacter';
import { CharacterAssets } from '../assets/characterAssets';
import { CLIP_NAMES } from '../assets/clips';
import { EquipmentAssets } from '../assets/equipment';
import { registerViewPlugin } from '../viewPlugins';
import { BossAnimator, bossMoveState } from './bossAnimator';
import { BOSS_GAIT_TABLE, BOSS_LOCOMOTION, BOSS_SPEED, toModelSpeed } from './bossGait';
import { ThrownShield } from './thrownShield';
import { BOSS_WEAPON_TELEGRAPH } from './bossWeaponGlow';

/**
 * ボスのモデルの確認表示（`?bossmodel=1|2&scene=test`。フェーズ 1 / 2）。撮影・E2E 用。
 * ボスは原点に +Z 向きで立ち、横に等身大の騎士（showcase の騎士 = プレイヤー相当、身長 1.8m）を並べる。
 *
 *   `&cam=combat|up|front|three|side|back|wide`  カメラ（combat: 戦闘距離の目線 / up: プレイヤーの目線で見上げる）、`&dist=<m>`（既定 6）
 *   `&gait=walk|run1|run2|<m/s>`  その速度で歩行アニメーション（足の接地速度を `window.__bossGait` に出す）
 *   `&clip=<クリップ名>&t=<秒>`  任意のクリップを固定表示（Sword_Heavy_Combo など）
 *   `&grip=shield|twoHand`  フェーズに関わらず斧の持ち方を上書き
 *   `&throw=1`  フェーズ 2 への移行で盾を投げ捨てる（盾が飛んで地面に刺さるまでを再生）
 *   `&action=<動作 ID>&sf=<段の F>`  マーカー表の動作（例 `boss.overhead.1.p1`）を、実際のアニメーションコントローラで段 F まで進めて固定表示
 *   `&glow=normal|heavy`  予兆の斧の発光（種別のピーク）を点ける（`bossWeaponGlow.ts`）
 *   `&ember=<0..1>`  熾火の強さを上書き（フェーズ 1 の見た目のまま発光だけ確認）
 */
declare global {
  interface Window {
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
        }
      }
      const glowParam = params.get('glow');
      if (glowParam === 'normal' || glowParam === 'heavy') {
        const profile = BOSS_WEAPON_TELEGRAPH[glowParam];
        boss.look.setWeaponTelegraph(profile.peak, profile.color);
      }
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

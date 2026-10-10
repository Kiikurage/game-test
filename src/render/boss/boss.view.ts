import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicNodeMaterial,
  LineSegments,
  Mesh,
  MeshStandardNodeMaterial,
  Vector3,
} from 'three/webgpu';
import type { CharacterAnimState } from '../anim/characterAnimator';
import { GaitClock } from '../../game/anim/locomotion';
import { BossCharacter } from '../assets/bossCharacter';
import { findBossClipEvents } from '../../game/anim/bossClips';
import { leapStateOf } from '../../game/boss/moves/leap.move';
import { spinStateOf } from '../../game/boss/moves/spin.move';
import { BOSS_MOVES, stagesOf } from '../../game/boss/bossMove';
import { BossAnimator, bossMoveState } from './bossAnimator';
import { bossWeaponGlow } from './bossWeaponGlow';
import { BossTransitionFx } from './bossTransitionFx';
import { BossDefeatFx } from './bossDefeatFx';
import { toModelSpeed, BOSS_LOCOMOTION } from './bossGait';
import type { Boss } from '../../game/boss/boss';
import { bossSystemOf } from '../../game/boss/boss.system';
import { BOSS_BANDS, BOSS_STATS } from '../../game/boss/bossData';
import { isDebugEnabled } from '../../ui/debugHud';
import { registerViewPlugin } from '../viewPlugins';

/** 床から少し浮かせる（地形に埋まらないように）。 */
const LIFT = 0.12;

function ring(radius: number, steps = 64): BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const b = ((i + 1) / steps) * Math.PI * 2;
    pts.push(Math.sin(a) * radius, LIFT, Math.cos(a) * radius);
    pts.push(Math.sin(b) * radius, LIFT, Math.cos(b) * radius);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return g;
}

/**
 * ボスの見た目: `BossCharacter`（E5-1。2.2 倍の亡者の騎士）。読み込みに失敗したときだけ、
 * 身長 4.0m・半径 0.9m のカプセルと正面を示す箱の仮の見た目にする。
 * 移動のアニメーションは位置の変化から速度を求めて再生する（技のモーションは E5-2 以降）。
 * `?debug` では距離帯（3.5m / 8m）の円と、状態・距離帯・直前の技・選択重みの表示を出す。
 */
/**
 * アニメーションの状態。技の実行中は、マーカー表（`bossClips.json`）に動作 ID（`boss.<段 ID>.p1|p2`）があればその動作を
 * 段のフレームに合わせて再生する（表のない技・スタブは移動のまま）。
 */
function bossAnimState(
  boss: Boss,
  speed: number,
  gait: { readonly phase: number; readonly lastDelta: number },
): CharacterAnimState {
  const base = bossMoveState(speed, gait);
  const info = boss.debugInfo;
  if (boss.state !== 'attack' || !info.move) return base;
  const def = BOSS_MOVES.get(info.move);
  const stage = def ? stagesOf(def, boss.phase)[info.stage - 1] : undefined;
  if (!stage) return base;
  const actionId = `boss.${stage.id}.p${boss.phase}`;
  if (!findBossClipEvents(actionId)) return base;
  return {
    ...base,
    state: 'attack',
    kind: 'action',
    actionId,
    stateFrame: Math.max(1, info.stageFrame),
  };
}

registerViewPlugin('boss', ({ game, view, gameRenderer }) => {
  const system = bossSystemOf(game);
  const debug = isDebugEnabled(location.search);
  const root = new Group();
  root.visible = false;
  view.scene.add(root);

  const body = new Mesh(
    new CapsuleGeometry(BOSS_STATS.radius, BOSS_STATS.height - BOSS_STATS.radius * 2, 4, 16),
    new MeshStandardNodeMaterial({ color: 0x5b5650, roughness: 0.9 }),
  );
  body.position.y = BOSS_STATS.height / 2;
  body.castShadow = true;
  // 正面（+z）を示す箱（盾の代わり）
  const front = new Mesh(
    new BoxGeometry(1.6, 2.2, 0.35),
    new MeshStandardNodeMaterial({ color: 0x8a5a32, roughness: 0.8 }),
  );
  front.position.set(0, BOSS_STATS.height * 0.55, BOSS_STATS.radius + 0.2);
  front.castShadow = true;
  const eye = new Mesh(
    new BoxGeometry(0.5, 0.12, 0.1),
    new MeshStandardNodeMaterial({ color: 0xffb060, emissive: 0xffb060 }),
  );
  eye.position.set(0, BOSS_STATS.height * 0.88, BOSS_STATS.radius - 0.05);
  root.add(body, front, eye);

  // 本物のモデル（読み込めたら仮の見た目を隠す）
  let model: BossCharacter | undefined;
  let animator: BossAnimator | undefined;
  let transitionFx: BossTransitionFx | undefined;
  let defeatFx: BossDefeatFx | undefined;
  const gait = new GaitClock();
  const last = new Vector3();
  let lastValid = false;

  const bands = new Group();
  if (debug) {
    for (const r of [BOSS_BANDS.closeBelow, BOSS_BANDS.farAbove]) {
      const mat = new LineBasicNodeMaterial({ color: r < 5 ? 0xff5a3a : 0xf2d24a });
      mat.depthTest = false;
      mat.transparent = true;
      const lines = new LineSegments(ring(r), mat);
      lines.renderOrder = 10;
      lines.frustumCulled = false;
      bands.add(lines);
    }
    view.scene.add(bands);
  }

  let overlay: HTMLPreElement | null = null;
  if (debug) {
    overlay = document.createElement('pre');
    overlay.className = 'boss-debug';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '44px',
      right: '8px',
      margin: '0',
      padding: '6px 8px',
      font: '11px/1.35 monospace',
      color: '#fff',
      background: 'rgba(0,0,0,0.55)',
      pointerEvents: 'none',
      zIndex: '15',
      display: 'none',
    });
    document.body.appendChild(overlay);
  }

  const text = (boss: Boss): string => {
    const d = boss.debugInfo;
    const lines = [
      `boss P${d.phase} ${d.state}${d.move ? ` ${d.move}#${d.stage} F${d.stageFrame}` : ''}`,
      `hp ${Math.round(d.hp)}  dist ${d.distance.toFixed(1)}m  band ${d.band}`,
      `prev ${d.previousMove ?? '-'}  [${d.history.join(' > ')}]`,
      `beat ${d.beatLeft}  behind ${d.player.behindFrames}F  roll x${d.player.rollStreak}${d.player.healing ? '  healing' : ''}`,
    ];
    for (const e of d.weights?.entries ?? []) {
      if (e.base <= 0) continue;
      const note = e.excluded ? ` (${e.excluded})` : '';
      lines.push(
        `  ${e.id.padEnd(10)} ${e.base.toString().padStart(3)} -> ${e.weight.toFixed(1).padStart(5)} ${(e.probability * 100).toFixed(0).padStart(3)}%${note}`,
      );
    }
    if (d.weights?.rollBonus) lines.push('  roll x3: combo3 +20%');
    return lines.join('\n');
  };

  return {
    async load() {
      const { assets, equipment, lod } = await BossCharacter.load();
      model = BossCharacter.create(assets, equipment, lod);
      const { preset } = gameRenderer.quality;
      model.lodConfig = {
        nearDistance: preset.characterLod.nearDistance,
        shadowDistance: preset.shadowRadius * 1.4,
      };
      model.root.visible = false;
      view.scene.add(model.root);
      model.bindParticles(view.particles);
      animator = new BossAnimator(model, assets);
      transitionFx = new BossTransitionFx(game, view, model);
      defeatFx = new BossDefeatFx(game, view, model);
      body.visible = false;
      front.visible = false;
      eye.visible = false;
    },
    update: (dt) => {
      const boss = system.boss;
      // 撃破後も、灰になって消え切るまで体を見せる（#86）
      root.visible = boss !== null && (boss.alive || (defeatFx?.visible ?? false));
      bands.visible = root.visible;
      if (model) model.root.visible = root.visible;
      if (!boss) {
        if (overlay) overlay.style.display = 'none';
        return;
      }
      const p = boss.position;
      root.position.copy(p);
      root.rotation.y = boss.yaw;
      bands.position.copy(p);
      if (model && animator && root.visible) {
        // 跳躍（技 5）の滞空中は位置が飛ぶので、歩行の速度としては数えない
        const leap = leapStateOf(boss);
        const speed =
          lastValid && dt > 0 && !leap?.airborne ? Math.hypot(p.x - last.x, p.z - last.z) / dt : 0;
        last.copy(p);
        lastValid = true;
        model.root.position.copy(p);
        model.root.position.y += leap?.height ?? 0;
        // 回転斬り（技 6）はヨーに回転を足す
        model.root.rotation.y = boss.yaw + (spinStateOf(boss)?.angle ?? 0);
        defeatFx?.update(dt, boss); // 撃破の崩壊・ディゾルブ・熾火（#86）
        const visible = model.updateLod(
          view.camera,
          view.shadowFocusTarget?.position ?? game.player.feet,
        );
        transitionFx?.update(dt, boss); // フェーズ移行の演出（盾投げ・咆哮・熾火。#84）
        if (model.phase !== boss.phase) model.setPhase(boss.phase);
        gait.advance(toModelSpeed(speed), dt, { profile: BOSS_LOCOMOTION });
        // 画面にも影にも出ないときはアニメーションを省く
        if (visible) {
          const base = bossAnimState(boss, speed, gait);
          animator.update(dt, defeatFx?.animState(base) ?? base);
        }
        transitionFx?.applyPose();
        model.lateUpdate(dt);
        // 予兆中は斧（盾打ちの 1 段目は盾）の縁が光る（種別で色・強さが違う。技の最中でなければ消す）
        const glow = boss.state === 'attack' ? bossWeaponGlow(boss.debugInfo, boss.phase) : null;
        const onAxe = glow && glow.target === 'axe' && glow.amount > 0;
        const onShield = glow && glow.target === 'shield' && glow.amount > 0;
        if (onAxe) model.look.setWeaponTelegraph(glow.amount, glow.color, glow.style);
        else if (model.look.weaponTelegraph !== 0) model.look.setWeaponTelegraph(0);
        if (onShield) model.look.setShieldTelegraph(glow.amount, glow.color, glow.style);
        else if (model.look.shieldTelegraph !== 0) model.look.setShieldTelegraph(0);
      }
      if (overlay) {
        overlay.style.display = 'block';
        overlay.textContent = text(boss);
      }
    },
  };
});

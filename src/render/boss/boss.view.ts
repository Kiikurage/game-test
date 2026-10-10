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
} from 'three/webgpu';
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
 * ボスの仮の見た目（E5-1 のモデルが入るまで）: 身長 4.0m・半径 0.9m のカプセルと、正面を示す箱。
 * `?debug` では距離帯（3.5m / 8m）の円と、状態・距離帯・直前の技・選択重みの表示を出す。
 */
registerViewPlugin('boss', ({ game, view }) => {
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
    update: () => {
      const boss = system.boss;
      root.visible = boss !== null && boss.alive;
      bands.visible = root.visible;
      if (!boss) {
        if (overlay) overlay.style.display = 'none';
        return;
      }
      const p = boss.position;
      root.position.copy(p);
      root.rotation.y = boss.yaw;
      bands.position.copy(p);
      if (overlay) {
        overlay.style.display = 'block';
        overlay.textContent = text(boss);
      }
    },
  };
});

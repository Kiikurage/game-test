import { type PerspectiveCamera } from 'three/webgpu';
import type { GroundTelegraphs, Telegraph } from './index';

/** `?telegraph` で確認用ビューを有効にする。 */
export function isTelegraphDemoEnabled(search: string): boolean {
  return new URLSearchParams(search).has('telegraph');
}

interface Scene {
  circle: { x: number; z: number; r: number };
  shadow: { x: number; z: number; r: number };
  /** 灰の波: 起点と基準方向（+z = 0）。 */
  wave: { x: number; z: number; yaw: number; length: number };
  camera: readonly number[];
}

/** ?tview= の配置。flat: 平地（広場）、slope: 傾斜地（勾配 約 0.6）。 */
const SCENES: Record<string, Scene> = {
  flat: {
    circle: { x: -6, z: -8, r: 3.5 },
    shadow: { x: 5.2, z: -9.5, r: 3.5 },
    wave: { x: 0, z: -2.5, yaw: Math.PI, length: 12 },
    camera: [0, 5.2, 6.5, 0, 0, -6.5, 62],
  },
  slope: {
    circle: { x: 13.5, z: 16, r: 3.5 },
    shadow: { x: 18, z: 11, r: 3 },
    wave: { x: 9.5, z: 9.5, yaw: 0.69, length: 12 },
    camera: [6.2, 3.2, 5.6, 14, 2.2, 14, 64],
  },
};

/**
 * 確認用デモ: 円・影の円・灰の波（正面と ±25° の直線 3 本、12F 間隔で順に出現）を繰り返し出す。
 * `&tframe=N` で全予告を表示開始から N フレームの状態に固定する（撮影用）。
 */
export class TelegraphDemo {
  private t = 0;
  private readonly circle: Telegraph;
  private readonly shadow: Telegraph;
  private readonly lines: Telegraph[] = [];
  private readonly frozen: number | null;
  private readonly cycle = 4.2;

  constructor(telegraphs: GroundTelegraphs, camera: PerspectiveCamera) {
    const params = new URLSearchParams(window.location.search);
    const scene = SCENES[params.get('tview') ?? 'flat'] ?? SCENES['flat'];
    if (!scene) throw new Error('telegraph demo scene missing');
    const tf = params.get('tframe');
    this.frozen = tf === null || !Number.isFinite(Number(tf)) ? null : Number(tf);

    this.circle = telegraphs.circle(scene.circle.x, scene.circle.z, scene.circle.r);
    this.shadow = telegraphs.shadowCircle(scene.shadow.x, scene.shadow.z, scene.shadow.r);
    this.shadow.setProgress(0.6);
    const spread = (25 * Math.PI) / 180;
    for (const d of [0, -spread, spread]) {
      this.lines.push(
        telegraphs.line(scene.wave.x, scene.wave.z, scene.wave.yaw + d, scene.wave.length),
      );
    }

    const c = scene.camera;
    camera.position.set(c[0] ?? 0, c[1] ?? 0, c[2] ?? 0);
    camera.fov = c[6] ?? 60;
    camera.updateProjectionMatrix();
    camera.lookAt(c[3] ?? 0, c[4] ?? 0, c[5] ?? 0);

    if (this.frozen !== null) {
      telegraphs.paused = true;
      const f = this.frozen;
      this.circle.clock.setFrame(f);
      this.shadow.clock.setFrame(f);
      // 直線は 12F 間隔で順に発生する
      this.lines.forEach((l, i) => {
        l.clock.setFrame(f - i * 12);
      });
      for (const t of this.all()) t.sync();
    } else {
      this.circle.show();
      this.shadow.show();
    }
  }

  private all(): Telegraph[] {
    return [this.circle, this.shadow, ...this.lines];
  }

  update(dt: number): void {
    if (this.frozen !== null) return;
    const before = this.t % this.cycle;
    this.t += dt;
    const now = this.t % this.cycle;
    if (now < before) {
      // 新しい周期の開始: 円・影は同時、直線は 12F おきに show
      this.circle.show();
      this.shadow.show();
    }
    if (before < 0.2 && now >= 0.2) this.lines[0]?.show();
    if (before < 0.4 && now >= 0.4) this.lines[1]?.show();
    if (before < 0.6 && now >= 0.6) this.lines[2]?.show();
    if (before < 3.3 && now >= 3.3) for (const t of this.all()) t.hide();
  }
}

import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  Quaternion,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Group,
  type Object3D,
} from 'three/webgpu';
import { isLoopingClip, type ClipName } from './clips';

export type PropName = 'sword' | 'shield';

/** 小物の取り付け位置（ボーンのローカル座標）。ボーンは +Y が指先/先端方向（Quaternius 共通リグ）。 */
interface Socket {
  readonly bone: string;
  readonly position: readonly [number, number, number];
  /** クォータニオン (x, y, z, w) */
  readonly quaternion: readonly [number, number, number, number];
}

const SOCKETS: Readonly<Record<PropName, Socket>> = {
  // 剣: 握りを手のひらに通し、刃(+Y) を手の +Z（親指・人差し指側）へ向ける。指先方向（+Y）へ 15° 倒す。
  sword: {
    bone: 'hand_r',
    position: [0, 0.06, 0],
    quaternion: [0.4304, 0.561, 0.4304, 0.561],
  },
  // 盾: 前腕の外側（手の甲側 = ボーンの -X）に装着し、表面(+Z) をその向きへ向ける。
  shield: {
    bone: 'lowerarm_l',
    position: [-0.07, 0.11, 0],
    quaternion: [0, -Math.SQRT1_2, 0, Math.SQRT1_2],
  },
};

export interface PlayOptions {
  /** クロスフェード秒数。既定 0.15。 */
  fade?: number;
  /** 再生速度の倍率。既定 1。 */
  timeScale?: number;
  /** true で終端ポーズを保持する（非ループのクリップ向け）。既定 true。 */
  clampWhenFinished?: boolean;
}

/**
 * アニメーション付きキャラクターのインスタンス。`root` をシーンへ追加し、毎フレーム `update(dt)` を呼ぶ。
 * キャラクターは +Z 向き、足元が原点、身長は約 1.8m。クリップはその場で動く（ルートモーション無し）。
 */
export class Character {
  readonly mixer: AnimationMixer;
  private current: AnimationAction | undefined;
  private currentName: ClipName | undefined;

  constructor(
    readonly root: Group,
    private readonly resolveClip: (name: ClipName) => AnimationClip,
  ) {
    this.mixer = new AnimationMixer(root);
  }

  /** 現在再生中のクリップ名。 */
  get clipName(): ClipName | undefined {
    return this.currentName;
  }

  /** 現在のクリップのアクション。 */
  get action(): AnimationAction | undefined {
    return this.current;
  }

  /**
   * クリップを再生する。再生中のクリップがあればクロスフェードする。
   * `_Loop` で終わるクリップ（と Sword_Idle）はループ、それ以外は 1 回再生して終端で停止する。
   */
  play(name: ClipName, options: PlayOptions = {}): AnimationAction {
    const { fade = 0.15, timeScale = 1, clampWhenFinished = true } = options;
    const next = this.mixer.clipAction(this.resolveClip(name));
    next.reset();
    next.setLoop(isLoopingClip(name) ? LoopRepeat : LoopOnce, Infinity);
    next.clampWhenFinished = clampWhenFinished;
    next.timeScale = timeScale;
    next.enabled = true;
    next.play();

    const prev = this.current;
    if (prev && prev !== next) {
      if (fade > 0) {
        prev.crossFadeTo(next, fade, false);
        next.fadeIn(fade);
      } else {
        prev.stop();
      }
    }
    this.current = next;
    this.currentName = name;
    return next;
  }

  update(dt: number): void {
    this.mixer.update(dt);
  }

  /** 小物を手/腕のボーンに取り付ける（既に付いていれば置き換える）。 */
  attach(prop: PropName, object: Object3D): void {
    const socket = SOCKETS[prop];
    const bone = this.root.getObjectByName(socket.bone);
    if (!bone) throw new Error(`bone not found: ${socket.bone}`);
    const existing = bone.getObjectByName(`attach:${prop}`);
    if (existing) bone.remove(existing);
    object.name = `attach:${prop}`;
    object.position.fromArray(socket.position);
    object.quaternion.fromArray(socket.quaternion);
    bone.add(object);
  }

  /** 小物を外す。 */
  detach(prop: PropName): void {
    const bone = this.root.getObjectByName(SOCKETS[prop].bone);
    const object = bone?.getObjectByName(`attach:${prop}`);
    if (object) bone?.remove(object);
  }

  /** ボーンのワールド座標を取得する（エフェクト・当たり判定の基準点用）。 */
  getBoneWorldPosition(boneName: string, target = new Vector3()): Vector3 {
    const bone = this.root.getObjectByName(boneName);
    if (!bone) throw new Error(`bone not found: ${boneName}`);
    return bone.getWorldPosition(target);
  }

  /** ボーンのワールド回転を取得する。 */
  getBoneWorldQuaternion(boneName: string, target = new Quaternion()): Quaternion {
    const bone = this.root.getObjectByName(boneName);
    if (!bone) throw new Error(`bone not found: ${boneName}`);
    return bone.getWorldQuaternion(target);
  }

  /** ミキサーのキャッシュを解放する。シーンからの除去は呼び出し側で行う。 */
  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
  }
}

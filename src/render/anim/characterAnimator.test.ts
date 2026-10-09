import { describe, expect, it } from 'vitest';
import { AnimationClip, Bone, Group, VectorKeyframeTrack, type Object3D } from 'three/webgpu';
import { CLIP_NAMES, type ClipName } from '../assets/clips';
import { Character } from '../assets/character';
import { PLAYER_ANIMATOR_CONFIG } from '../assets/playerAnimator';
import { getPlayerClipEvents } from '../../game/anim/playerClips';
import { simFrameToClipTime } from '../../game/anim/eventMarkers';
import { upperBodyBoneNames } from './boneMask';
import {
  CharacterAnimator,
  type CharacterAnimatorConfig,
  type CharacterAnimState,
} from './characterAnimator';
import { LayeredAnimation } from './layeredAnimation';
import { AnimationMixer } from 'three/webgpu';

/**
 * 合成スケルトンで検証する。クリップ毎に
 *  - thigh_l.position.x = クリップ時刻（下半身が「いまのクリップ時刻」を表す）
 *  - spine_01.position.x = クリップの番号（上半身が「どのクリップか」を表す）
 * を持たせ、ミキサーの結果からウェイトと時刻を読む。
 */
function skeleton(): Group {
  const root = new Group();
  const mk = (name: string, parent: Object3D): Bone => {
    const b = new Bone();
    b.name = name;
    parent.add(b);
    return b;
  };
  const rootBone = mk('root', root);
  const pelvis = mk('pelvis', rootBone);
  const spine1 = mk('spine_01', pelvis);
  const spine2 = mk('spine_02', spine1);
  mk('spine_03', spine2);
  mk('thigh_l', pelvis);
  mk('hand_r', spine2);
  return root;
}

const INDEX = new Map<string, number>(CLIP_NAMES.map((n, i) => [n, i + 1]));

function fakeClip(name: string, duration = 2): AnimationClip {
  const idx = INDEX.get(name) ?? 0;
  return new AnimationClip(name, duration, [
    new VectorKeyframeTrack('thigh_l.position', [0, duration], [0, 0, 0, duration, 0, 0]),
    new VectorKeyframeTrack('spine_01.position', [0, duration], [idx, 0, 0, idx, 0, 0]),
  ]);
}

function makeCharacter(): Character {
  return new Character(skeleton(), (n: ClipName) => fakeClip(n));
}

const resolve = (n: ClipName) => fakeClip(n);

function state(patch: Partial<CharacterAnimState> = {}): CharacterAnimState {
  return {
    state: 'idle',
    kind: 'idle',
    actionId: null,
    stateFrame: 1,
    totalFrames: 0,
    speed: 0,
    localVelocity: { x: 0, z: 0 },
    lockedOn: false,
    gaitPhase: 0,
    gaitPhaseStep: 0,
    frozen: false,
    ...patch,
  };
}

const bone = (c: Character, name: string) => {
  const b = c.root.getObjectByName(name);
  if (!b) throw new Error(name);
  return b;
};

/** 1/60 秒ごとに `frames` 回更新する。 */
function tick(a: CharacterAnimator, frames: number, s: CharacterAnimState, alpha = 1): void {
  for (let i = 0; i < frames; i++) a.update(1 / 60, s, alpha);
}

describe('boneMask / 上半身・下半身', () => {
  it('upperBodyBoneNames は spine_01 とその子孫（腕・手）だけ', () => {
    const names = upperBodyBoneNames(skeleton());
    expect([...names].sort()).toEqual(['hand_r', 'spine_01', 'spine_02', 'spine_03']);
  });
});

describe('LayeredAnimation', () => {
  function make() {
    const root = skeleton();
    const mixer = new AnimationMixer(root);
    const layers = new LayeredAnimation(mixer, root, upperBodyBoneNames(root));
    layers.addLayer('a', fakeClip('Idle_Loop'), { fadeIn: 0.5, fadeOut: 0.5 });
    layers.addLayer('b', fakeClip('Walk_Loop'), { fadeIn: 0.5, fadeOut: 0.5 });
    return { root, layers };
  }
  const upperX = (root: Group) => root.getObjectByName('spine_01')?.position.x ?? NaN;
  const idle = INDEX.get('Idle_Loop') ?? 0;
  const walk = INDEX.get('Walk_Loop') ?? 0;

  it('クロスフェードはフェード時間で線形に進み、ウェイトは合計 1 に正規化される', () => {
    const { root, layers } = make();
    layers.setTarget('a', 1);
    layers.snapToTargets();
    layers.update(0);
    expect(upperX(root)).toBeCloseTo(idle, 5);
    layers.clearTargets();
    layers.setTarget('b', 1);
    // 0.25s = フェード時間の半分 → 半々
    layers.update(0.25);
    expect(upperX(root)).toBeCloseTo((idle + walk) / 2, 5);
    layers.update(0.25);
    expect(upperX(root)).toBeCloseTo(walk, 5);
  });

  it('fadeIn 0 は即時', () => {
    const root = skeleton();
    const layers = new LayeredAnimation(new AnimationMixer(root), root, upperBodyBoneNames(root));
    layers.addLayer('a', fakeClip('Idle_Loop'), { fadeIn: 0, fadeOut: 0 });
    layers.setTarget('a', 1);
    layers.update(0.001);
    expect(layers.weightOf('a', 'upper')).toBe(1);
  });

  it('上半身だけ別の目標を与えると、下半身は元のまま', () => {
    const { root, layers } = make();
    layers.setTarget('a', 1);
    layers.snapToTargets();
    layers.clearTargets();
    layers.setTarget('a', 1, 'lower');
    layers.setTarget('b', 1, 'upper');
    layers.setTime('a', 0.7);
    layers.update(1);
    // 下半身（thigh_l）は a の時刻、上半身（spine_01）は b
    expect(root.getObjectByName('thigh_l')?.position.x).toBeCloseTo(0.7, 5);
    expect(upperX(root)).toBeCloseTo(walk, 5);
  });

  it('setTime は両チャンネルのクリップ時刻を指定する', () => {
    const { root, layers } = make();
    layers.setTarget('a', 1);
    layers.snapToTargets();
    layers.setTime('a', 1.25);
    layers.update(0);
    expect(root.getObjectByName('thigh_l')?.position.x).toBeCloseTo(1.25, 5);
  });

  it('dominantClip は最もウェイトの大きいレイヤのクリップ名', () => {
    const { layers } = make();
    layers.setTarget('b', 1);
    layers.snapToTargets();
    expect(layers.dominantClip('lower')).toBe('Walk_Loop');
  });
});

describe('CharacterAnimator（プレイヤー設定）', () => {
  function make(config: CharacterAnimatorConfig = PLAYER_ANIMATOR_CONFIG) {
    const character = makeCharacter();
    return { character, animator: new CharacterAnimator(character, resolve, config) };
  }
  const upperIs = (c: Character, clip: string): void => {
    expect(bone(c, 'spine_01').position.x).toBeCloseTo(INDEX.get(clip) ?? -1, 2);
  };

  it('立っている間は Idle_Loop、ロックオン中は戦闘待機 Sword_Idle', () => {
    const { character, animator } = make();
    tick(animator, 30, state());
    expect(animator.dominantClip).toBe('Idle_Loop');
    upperIs(character, 'Idle_Loop');
    tick(animator, 30, state({ lockedOn: true }));
    expect(animator.dominantClip).toBe('Sword_Idle');
    upperIs(character, 'Sword_Idle');
  });

  it('速度で 立ち → 歩き → 走り → ダッシュ とブレンドされる', () => {
    const { animator } = make();
    const clipAt = (speed: number) => {
      tick(animator, 30, state({ state: 'move', kind: 'move', speed }));
      return animator.dominantClip;
    };
    expect(clipAt(1.8)).toBe('Walk_Loop');
    expect(clipAt(4.5)).toBe('Jog_Fwd_Loop');
    expect(clipAt(6.5)).toBe('Sprint_Loop');
    expect(clipAt(0)).toBe('Idle_Loop');
  });

  it('歩行クリップの時刻は game の歩行位相に同期し、補間係数で滑らかに進む', () => {
    const { character, animator } = make();
    const s = state({
      state: 'move',
      kind: 'move',
      speed: 4.5,
      gaitPhase: 0.5,
      gaitPhaseStep: 0.1,
    });
    tick(animator, 30, s, 1);
    // Jog の位相 = 0.5 + オフセット 0.967（% 1）、クリップ長 2s（合成）
    const at1 = bone(character, 'thigh_l').position.x;
    tick(animator, 1, s, 0);
    const at0 = bone(character, 'thigh_l').position.x;
    // alpha 0 は 1 ステップ前（位相 -0.1 ぶん）= クリップ長 × 0.1 だけ手前（巻き戻りの折り返しは除く）
    const diff = ((at1 - at0 + 2) % 2) / 2;
    expect(diff).toBeCloseTo(0.1, 3);
  });

  it('ロール: マーカー表の再生範囲と速度で状態フレームに同期する（描画は 1 ステップ遅れの補間）', () => {
    const { character, animator } = make();
    const entry = getPlayerClipEvents('player.roll');
    const roll = (stateFrame: number) =>
      state({ state: 'roll', kind: 'action', actionId: 'roll', stateFrame });
    // 十分フェードインさせてから確認（時刻は、ウェイトが 1 になっても変わらない）
    tick(animator, 30, roll(10), 1);
    expect(animator.dominantClip).toBe('Roll');
    // 本物の Roll は 1.47s だが合成クリップは 2s。トラック値は時刻そのもの
    expect(bone(character, 'thigh_l').position.x).toBeCloseTo(simFrameToClipTime(entry, 10), 5);
    tick(animator, 1, roll(10), 0.5);
    expect(bone(character, 'thigh_l').position.x).toBeCloseTo(simFrameToClipTime(entry, 9.5), 5);
    // F1 は先頭（負の経過は 0 に丸める）
    tick(animator, 1, roll(1), 0);
    expect(bone(character, 'thigh_l').position.x).toBeCloseTo(0, 5);
  });

  it('バックステップは逆再生（終端から先頭へ）', () => {
    const { character, animator } = make();
    const bs = (stateFrame: number) =>
      state({ state: 'backstep', kind: 'action', actionId: 'backstep', stateFrame });
    tick(animator, 30, bs(2), 1);
    const t2 = bone(character, 'thigh_l').position.x;
    tick(animator, 30, bs(12), 1);
    const t12 = bone(character, 'thigh_l').position.x;
    expect(t12).toBeLessThan(t2);
    expect(t2).toBeCloseTo(0.4 - (1 / 60) * (0.4 / (22 / 60)), 4);
  });

  it('着地はクリップ範囲を状態の全体フレームに合わせる（10F / 22F）', () => {
    const run = (totalFrames: number) => {
      const { character, animator } = make();
      tick(
        animator,
        30,
        state({ state: 'land', kind: 'action', actionId: 'land', stateFrame: 6, totalFrames }),
        1,
      );
      return bone(character, 'thigh_l').position.x;
    };
    // F6 の描画時刻 = 経過 5F。範囲 [0, 1.0s] を total に合わせる
    expect(run(10)).toBeCloseTo((5 / 10) * 1.0, 5);
    expect(run(22)).toBeCloseTo((5 / 22) * 1.0, 5);
  });

  it('落下は少し落ち続けてから切り替わる（段差の乗り降りでちらつかない）', () => {
    const { animator } = make();
    tick(animator, 30, state({ state: 'fall', kind: 'move', stateFrame: 5 }));
    expect(animator.dominantClip).toBe('Idle_Loop');
    tick(animator, 30, state({ state: 'fall', kind: 'move', stateFrame: 12 }));
    expect(animator.dominantClip).toBe('Jump_Loop');
  });

  it('ヒットストップ中は時刻もブレンドも止まる（alpha・dt に関係なく最新ステップの姿勢）', () => {
    const { character, animator } = make();
    const f = (frozen: boolean, stateFrame = 10) =>
      state({ state: 'roll', kind: 'action', actionId: 'roll', stateFrame, frozen });
    tick(animator, 30, f(false), 1);
    const before = bone(character, 'thigh_l').position.x;
    tick(animator, 20, f(true), 0.3);
    expect(bone(character, 'thigh_l').position.x).toBeCloseTo(before, 6);
    expect(animator.dominantClip).toBe('Roll');
  });

  it('上半身だけ別クリップを載せられる（下半身は走りのまま）', () => {
    const { character, animator } = make();
    const run = state({ state: 'move', kind: 'move', speed: 4.5, gaitPhase: 0.25 });
    animator.setUpperBody('Sword_Block', 1, 0.3);
    tick(animator, 60, run);
    upperIs(character, 'Sword_Block');
    expect(animator.dominantClip).toBe('Jog_Fwd_Loop');
    // 解除すると上半身も走りへ戻る
    animator.setUpperBody(null);
    tick(animator, 60, run);
    upperIs(character, 'Jog_Fwd_Loop');
  });

  it('ロール中は上半身レイヤを載せない（全身が動作）', () => {
    const { character, animator } = make();
    animator.setUpperBody('Sword_Block', 1, 0);
    tick(animator, 60, state({ state: 'roll', kind: 'action', actionId: 'roll', stateFrame: 10 }));
    upperIs(character, 'Roll');
  });

  it('表にも指定にもない Action 状態は警告して移動ポーズのまま（落ちない）', () => {
    const { animator } = make();
    expect(() => {
      tick(animator, 3, state({ state: 'unknown', kind: 'action', actionId: 'unknown' }));
    }).not.toThrow();
    expect(animator.dominantClip).toBe('Idle_Loop');
  });

  it('新しい動作は、マーカー表に足すだけで再生される（light1: 当たりのある攻撃）', () => {
    const { character, animator } = make();
    const entry = getPlayerClipEvents('player.light1');
    // 発生 12F の経過後（F13 の描画）= 振り抜きのクリップ時刻
    tick(
      animator,
      40,
      state({ state: 'light1', kind: 'action', actionId: 'light1', stateFrame: 13 }),
      1,
    );
    expect(animator.dominantClip).toBe('Sword_Regular_A');
    expect(bone(character, 'thigh_l').position.x).toBeCloseTo(simFrameToClipTime(entry, 13), 5);
    expect(simFrameToClipTime(entry, 13)).toBeCloseTo(8 / 30, 5);
  });

  it('デバッグ用の固定ポーズ: 状態 ID と時刻を指定できる', () => {
    const { character, animator } = make();
    animator.debugPose = { layer: 'roll', time: 0.9 };
    animator.update(1 / 60, state(), 1);
    expect(bone(character, 'thigh_l').position.x).toBeCloseTo(0.9, 5);
  });

  it('回復（54F）は Consume 全体を状態フレームに合わせて再生し、空振り（20F）は前半だけを使う', () => {
    const { character, animator } = make();
    const heal = getPlayerClipEvents('player.heal');
    tick(
      animator,
      40,
      state({ state: 'heal', kind: 'action', actionId: 'heal', stateFrame: 26 }),
      1,
    );
    expect(animator.dominantClip).toBe('Consume');
    // F26（HP 加算）の時刻 = 25F 分の経過
    expect(bone(character, 'thigh_l').position.x).toBeCloseTo(simFrameToClipTime(heal, 26), 5);
    expect(simFrameToClipTime(heal, 26)).toBeCloseTo((25 / 60) * (40 / 30 / (54 / 60)), 5);
    const empty = getPlayerClipEvents('player.healEmpty');
    expect(simFrameToClipTime(empty, 21)).toBeLessThanOrEqual(14 / 30 + 1e-9);
  });
});

import {
  AnimationClip,
  Color,
  type ColorRepresentation,
  type Group,
  type Material,
  type Mesh,
  type Object3D,
} from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { Character } from './character';
import { buildThrustClip, THRUST_CLIP_NAME, THRUST_SOURCE_CLIP } from '../anim/thrustClip';
import { CLIP_NAMES, type ClipName } from './clips';

/** public/assets/characters/ に置かれているキャラクター名（`npm run assets:build` で生成）。 */
export type CharacterName = 'knight';

export interface CharacterOptions {
  /** 指定すると全マテリアルのベースカラーにこの色を乗算する（敵の色違い等）。マテリアルは複製される。 */
  tint?: ColorRepresentation;
  /** 剣・盾を手に装着するか。既定は両方 true。 */
  sword?: boolean;
  shield?: boolean;
}

/**
 * キャラクター・アニメーション・小物の読み込み済みアセット。
 * ジオメトリ・テクスチャ・アニメーションクリップは全インスタンスで共有される
 * （インスタンスごとに増えるのはスケルトンとマテリアルの参照のみ）。
 */
export class CharacterAssets {
  private constructor(
    private readonly characters: ReadonlyMap<CharacterName, Group>,
    private readonly clips: ReadonlyMap<ClipName, AnimationClip>,
    private readonly props: { readonly sword: Object3D; readonly shield: Object3D },
  ) {}

  /**
   * アセットを読み込む。baseUrl は public/assets/ の URL（既定は Vite の BASE_URL 配下）。
   * 読み込む名前を絞りたい場合は characters を指定する。
   */
  static async load(
    characters: readonly CharacterName[] = ['knight'],
    baseUrl = `${import.meta.env.BASE_URL}assets/`,
  ): Promise<CharacterAssets> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const [charGltfs, animGltf, propsGltf] = await Promise.all([
      Promise.all(characters.map((name) => loader.loadAsync(`${baseUrl}characters/${name}.glb`))),
      loader.loadAsync(`${baseUrl}animations.glb`),
      loader.loadAsync(`${baseUrl}props.glb`),
    ]);

    const characterMap = new Map<CharacterName, Group>();
    characters.forEach((name, i) => {
      const gltf = charGltfs[i];
      if (!gltf) throw new Error(`character failed to load: ${name}`);
      characterMap.set(name, gltf.scene);
    });

    const clipMap = new Map<ClipName, AnimationClip>();
    for (const name of CLIP_NAMES) {
      const clip = AnimationClip.findByName(animGltf.animations, name);
      if (!clip) throw new Error(`animation clip missing in animations.glb: ${name}`);
      clipMap.set(name, clip);
    }
    // 派生クリップ（軽 3 の突き。UAL に突きが無いので Sword_Regular_C の姿勢から作る）
    const thrustSource = clipMap.get(THRUST_SOURCE_CLIP);
    if (thrustSource) clipMap.set(THRUST_CLIP_NAME, buildThrustClip(thrustSource));

    const sword = propsGltf.scene.getObjectByName('Sword');
    const shield = propsGltf.scene.getObjectByName('Shield');
    if (!sword || !shield) throw new Error('props.glb must contain Sword and Shield nodes');

    return new CharacterAssets(characterMap, clipMap, { sword, shield });
  }

  /** 読み込み済みのクリップ（共有。変更しないこと）。 */
  getClip(name: ClipName): AnimationClip {
    const clip = this.clips.get(name);
    if (!clip) throw new Error(`unknown clip: ${name}`);
    return clip;
  }

  /** キャラクターのインスタンスを作る。`character.root` をシーンへ追加して使う。 */
  createCharacter(name: CharacterName, options: CharacterOptions = {}): Character {
    const source = this.characters.get(name);
    if (!source) throw new Error(`character not loaded: ${name}`);
    const root = cloneSkinned(source) as Group;

    root.traverse((obj) => {
      if (!(obj as { isMesh?: boolean }).isMesh) return;
      const mesh = obj as Mesh;
      // スキンメッシュの視錐台カリングは静的なバウンディング球で行われ、アニメーションで外れると消える
      mesh.frustumCulled = false;
      if (options.tint !== undefined) {
        mesh.material = tintMaterial(mesh.material, options.tint);
      }
    });

    const character = new Character(root, (clipName) => this.getClip(clipName));
    if (options.sword ?? true) character.attach('sword', this.props.sword.clone());
    if (options.shield ?? true) character.attach('shield', this.props.shield.clone());
    return character;
  }
}

function tintMaterial(
  material: Material | Material[],
  tint: ColorRepresentation,
): Material | Material[] {
  const multiplier = new Color(tint);
  const apply = (m: Material): Material => {
    const copy = m.clone();
    if ('color' in copy && copy.color instanceof Color) copy.color.multiply(multiplier);
    return copy;
  };
  return Array.isArray(material) ? material.map(apply) : apply(material);
}

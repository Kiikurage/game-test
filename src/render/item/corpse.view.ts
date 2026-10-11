import type { Group } from 'three/webgpu';
import { corpsePlacement } from '../../core/corpses';
import { WORLD_INTERACTABLES } from '../../game/data/world/interactables';
import { applyCharacterLight } from '../characterLight';
import { CharacterAssets } from '../assets/characterAssets';
import { EquipmentAssets } from '../assets/equipment';
import { CorpseFactory } from '../corpses/corpseFactory';
import { registerViewPlugin } from '../viewPlugins';
import { standHeight } from './standHeight';

/** この距離（m）より遠いプレイヤーからは描かない（描画予算。遺体は小さく暗く、遠目には見えない）。 */
export const CORPSE_FAR = 13;
/** 遺体のメッシュの簡略化率（三角形数の割合。十数体並べても負荷が増えないようにする）。 */
const SIMPLIFY = 0.1;
/** 簡略化の許容誤差（既定 0.02 では目標に届かない。遠目の仮モデルなので緩める）。 */
const SIMPLIFY_ERROR = 0.08;

// 調べる対象の遺体（#248）の仮モデル。配置データ（`Interactable.corpse`）がある対象に、既存の騎士モデルを
// 倒れた姿勢で焼き込んだ静的メッシュ（`CorpseFactory`。スケルトン・ミキサーなし）を置く。新規アセットなし。
// 影は落とさない・遠くは描かない。遺体は取得後も残る（調べ終えても体は消えない）。本番モデルは E8-4。
registerViewPlugin('corpse', ({ game, view, level }) => {
  if (!level) return {};
  const placed = new Set(level.data.interactables.map((i) => i.id));
  const defs = WORLD_INTERACTABLES.filter((d) => d.corpse && placed.has(d.id));
  if (defs.length === 0) return {};
  const bodies: { id: string; x: number; z: number; group: Group }[] = [];
  /** 最初の更新は全部を描く（ウォームアップでマテリアルのパイプラインを作る）。 */
  let warm = true;
  return {
    load: async () => {
      const [characters, equipment] = await Promise.all([
        CharacterAssets.load(['knight']),
        EquipmentAssets.load(),
      ]);
      const factory = await CorpseFactory.create(characters, equipment, SIMPLIFY, SIMPLIFY_ERROR);
      defs.forEach((d, i) => {
        const look = d.corpse;
        if (!look) return;
        const y = standHeight(level, { x: d.x, z: d.z, site: d.site });
        const group = factory.create(
          corpsePlacement(
            {
              pose: look.pose,
              variant: look.variant,
              x: d.x,
              y,
              z: d.z,
              yaw: (look.yawDeg * Math.PI) / 180,
            },
            i,
          ),
        );
        group.name = `corpse:${d.id}`;
        applyCharacterLight(group); // 影・逆光でも輪郭が読めるように、キャラクターと同じ補助光（暗部の持ち上げ・リム）
        group.traverse((o) => {
          o.castShadow = false;
        });
        view.scene.add(group);
        bodies.push({ id: d.id, x: d.x, z: d.z, group });
      });
    },
    update: () => {
      const { x, z } = game.player.feet;
      if (bodies.length === 0) return;
      for (const b of bodies) {
        b.group.visible = warm || Math.hypot(b.x - x, b.z - z) < CORPSE_FAR;
        if (warm) b.group.traverse((o) => (o.frustumCulled = false));
      }
      if (warm) {
        // 初回（ウォームアップ）の描画のあとで、通常の視錐台カリングへ戻す
        warm = false;
        queueMicrotask(() => {
          for (const b of bodies) b.group.traverse((o) => (o.frustumCulled = true));
        });
      }
    },
  };
});

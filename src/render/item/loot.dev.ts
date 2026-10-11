import { registerDevHooks } from '../../devHooks';

declare module '../../devHooks' {
  interface DevHooks {
    /** 拾得物・調べる対象の目印（見えているもの）と、置かれた遺体の仮モデル（#248）。 */
    lootMarks(): {
      marks: string[];
      corpses: { id: string; visible: boolean; triangles: number; meshes: number }[];
    };
  }
}

registerDevHooks('lootMarks', ({ view }) => ({
  lootMarks: () => {
    const marks: string[] = [];
    const corpses: { id: string; visible: boolean; triangles: number; meshes: number }[] = [];
    view.scene.traverse((o) => {
      if (o.name.startsWith('lootmark:') && o.visible) marks.push(o.name.slice('lootmark:'.length));
      if (o.name.startsWith('corpse:') && o.name.split(':').length === 2) {
        let triangles = 0;
        let meshes = 0;
        o.traverse((m) => {
          const geo = (m as { geometry?: { index?: { count: number } | null } }).geometry;
          if (geo) meshes++;
          triangles += (geo?.index?.count ?? 0) / 3;
        });
        corpses.push({ id: o.name.slice('corpse:'.length), visible: o.visible, triangles, meshes });
      }
    });
    return { marks: marks.sort(), corpses };
  },
}));

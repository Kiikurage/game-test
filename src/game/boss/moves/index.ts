// ボスの技モジュールの自動読み込み。`moves/<名前>.move.ts` を作って `registerBossMove` を呼ぶだけでよい
// （このファイルを編集しない。複数チケットが並行して技を足しても競合しない）。
//
//   // moves/overhead.move.ts
//   import { registerBossMove } from '../bossMove';
//   registerBossMove({ id: 'overhead', name: '大上段斬り', phases: [1, 2], stages: [...], hooks: {...} });
import.meta.glob('./*.move.ts', { eager: true });

export {};

// models.mjs の型（src/render/assets/blenderModels.test.ts が読む）
export declare const BLENDER_MODELS: readonly {
  name: string;
  script?: string;
  input?: string;
  seed: number;
  lods: readonly { ratio: number; error: number; distance: number }[];
}[];

export * from './noiseLayout.mjs';
export declare function bakePerlin(size?: number, lattice?: number): Uint16Array;
export declare function buildNoiseAtlas(volume: Uint16Array, size?: number): Uint16Array;
export declare function bakeCells(size?: number, cells?: number): Uint8Array;

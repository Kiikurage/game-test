export declare const HASHED_PREFIX: string;
export declare const HASH_LENGTH: number;
export declare function listFiles(dir: string, rel?: string): string[];
export declare function hashedName(path: string, content: Uint8Array): string;
export declare function isHashedName(path: string): boolean;
export interface PublicOutput {
  readonly source: string;
  readonly output: string;
}
export declare function publicOutputs(publicDir: string): PublicOutput[];
export declare function assetHashMap(outputs: readonly PublicOutput[]): Record<string, string>;

import { Color } from 'three/webgpu';
import { uniform } from 'three/tsl';

/**
 * 空・フォグ・遠景（skyline）が共有する色の uniform。
 * 闘技場のライティング切り替え（`Environment.setMood`）が値を書き換えると、すべてが同時に動く。
 * 値の初期は黄昏（`ATMOSPHERE`）。ここに in-place で書くので、シェーダの再コンパイルは起きない。
 */
const FAR = 0x9ca5a4;
const SUN = 0xf0b877;
const SUN_TINT = 0xffc27a;

export const sharedHazeFar = uniform(new Color(FAR));
export const sharedHazeSun = uniform(new Color(SUN));
export const sharedSunTint = uniform(new Color(SUN_TINT));

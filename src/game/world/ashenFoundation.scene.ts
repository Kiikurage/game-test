import { registerScene } from '../scenes';
import { ASHEN_FOUNDATION } from './ashenFoundation';
import { createLevel, levelGameOptions } from './level';

/** 既定のシーン: レベル「灰の礎」。 */
registerScene(
  'ashen-foundation',
  () => {
    const level = createLevel(ASHEN_FOUNDATION);
    return { level, options: levelGameOptions(level), cylinders: level.cylinders };
  },
  { default: true },
);

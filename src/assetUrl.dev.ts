import { assetUrl } from './core/assetUrl';
import { registerDevHooks } from './devHooks';

declare module './devHooks' {
  interface DevHooks {
    /** `public/` からの相対パス（例: `assets/audio/manifest.json`）の配信 URL（本番ビルドでは内容ハッシュ名。#331）。 */
    assetUrl(path: string): string;
  }
}

registerDevHooks('assetUrl', () => ({ assetUrl: (path) => assetUrl(path) }));

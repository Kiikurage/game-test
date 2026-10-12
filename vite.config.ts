import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { assetHashMap, publicOutputs, type PublicOutput } from './scripts/assets/hashedAssets.mjs';

const BASE = '/game-test/';

/**
 * three 同梱の Basis トランスコーダ（KTX2Loader が Worker で読む js / wasm）を `<base>basis/` に配る（#328）。
 * 既定の CDN を使わず自前で配信する。dev ではミドルウェアで返し、build では dist/basis/ に書き出す。
 */
function basisTranscoder(): Plugin {
  const dir = fileURLToPath(
    new URL('./node_modules/three/examples/jsm/libs/basis/', import.meta.url),
  );
  const files: Record<string, string> = {
    'basis_transcoder.js': 'text/javascript',
    'basis_transcoder.wasm': 'application/wasm',
  };
  return {
    name: 'basis-transcoder',
    configureServer(server) {
      server.middlewares.use(`${BASE}basis/`, (req, res, next) => {
        const name = (req.url ?? '').replace(/^\//, '').split('?')[0] ?? '';
        const type = files[name];
        if (!type) {
          next();
          return;
        }
        res.setHeader('Content-Type', type);
        res.end(readFileSync(join(dir, name)));
      });
    },
    generateBundle() {
      for (const name of Object.keys(files)) {
        this.emitFile({
          type: 'asset',
          fileName: `basis/${name}`,
          source: readFileSync(join(dir, name)),
        });
      }
    },
  };
}

/**
 * `public/assets/` を内容ハッシュ名（`<名前>.<hash>.<拡張子>`）で dist に書き出す（tech-direction §4.4、#331）。
 * 元の名前は出さない（キャッシュの効かない名前で読まれていれば 404 で気付ける）。対応表は `__ASSET_HASHES__` として
 * 埋め込み、`src/core/assetUrl.ts` が引く。dev では public/ をそのまま配る（対応表なし）。
 */
function hashedPublicAssets(): Plugin {
  const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
  let outputs: PublicOutput[] = [];
  return {
    name: 'hashed-public-assets',
    apply: 'build',
    config() {
      outputs = publicOutputs(publicDir);
      return {
        define: { __ASSET_HASHES__: JSON.stringify(assetHashMap(outputs)) },
        build: { copyPublicDir: false },
      };
    },
    generateBundle() {
      for (const { source, output } of outputs) {
        this.emitFile({
          type: 'asset',
          fileName: output,
          source: readFileSync(join(publicDir, source)),
        });
      }
    },
  };
}

// GitHub Pages では https://<user>.github.io/game-test/ で配信される。
export default defineConfig({
  base: BASE,
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 6000,
  },
  plugins: [basisTranscoder(), hashedPublicAssets()],
  server: { host: '127.0.0.1' },
});

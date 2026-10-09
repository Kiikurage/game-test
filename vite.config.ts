import { defineConfig } from 'vite';

// GitHub Pages では https://<user>.github.io/game-test/ で配信される。
export default defineConfig({
  base: '/game-test/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 6000,
  },
  server: { host: '127.0.0.1' },
});

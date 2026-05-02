import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'baseline-widely-available',
    sourcemap: false,
    modulePreload: {
      polyfill: false
    }
  }
});


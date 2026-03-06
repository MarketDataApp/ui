import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'https://www.marketdata.app/',
      },
    },
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
  },
});

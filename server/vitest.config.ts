import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    sequence: {
      shuffle: false,
    },
    fileParallelism: false,
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/**/*.test.ts'],
    },
  },
});

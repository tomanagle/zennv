import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [],
    include: ['./test/**/*.test.ts'],
  },
});

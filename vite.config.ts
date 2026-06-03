import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/frozen_rabbit_tome/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['.claude/**', 'dist/**', 'node_modules/**']
  },
});

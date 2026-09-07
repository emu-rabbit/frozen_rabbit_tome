import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { rmSync, writeFileSync } from 'node:fs';

const base = process.env.VITE_BASE_PATH || '/';
let outputDir = '';

export default defineConfig({
  base,
  plugins: [vue(), {
    name: 'staging-search-metadata',
    apply: 'build',
    configResolved(config) {
      outputDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      return base === '/staging/'
        ? html.replace('content="index, follow"', 'content="noindex, follow"')
        : html;
    },
    closeBundle() {
      if (base !== '/staging/') return;
      // 測試站不另發佈 sitemap；canonical 保持指向正式站。
      writeFileSync(path.join(outputDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
      rmSync(path.join(outputDir, 'sitemap.xml'), { force: true });
    }
  }],
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

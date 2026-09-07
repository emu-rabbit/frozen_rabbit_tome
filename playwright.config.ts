import { defineConfig } from '@playwright/test';
const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  testDir: './tests',
  testMatch: ['migration.spec.ts', 'deployment.spec.ts'],
  outputDir: './scratch/migration-playwright',
  use: { baseURL: `http://127.0.0.1:4178${basePath}`, browserName: 'chromium' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } }
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4178 --strictPort',
    url: `http://127.0.0.1:4178${basePath}`,
    reuseExistingServer: false
  }
});

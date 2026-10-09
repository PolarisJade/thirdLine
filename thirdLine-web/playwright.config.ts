import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', fullyParallel: true, workers: 2, use: { baseURL: 'http://localhost:3000', browserName: 'chromium', channel: process.env.PLAYWRIGHT_CHANNEL || undefined }, webServer: { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 60000 }, reporter: 'list' });

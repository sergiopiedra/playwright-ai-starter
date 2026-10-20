import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

const isCI = !!process.env.CI;

/** Functional UI specs run on every browser/device project. */
const UI_SPECS = 'ui/**/*.spec.ts';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? '50%' : undefined,
  timeout: 30_000,

  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  // Baselines are OS-specific; `{platform}` keeps linux (CI) and darwin/win32 (local) apart.
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}',

  // CI emits blob reports that the workflow merges into a single HTML report.
  reporter: isCI ? [['blob'], ['github'], ['list']] : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // Logs in once and saves storage state for authenticated specs.
    { name: 'setup', testMatch: /.*\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },

    // API tests don't need a browser.
    { name: 'api', testMatch: 'api/**/*.spec.ts' },

    // Cross-browser + mobile functional coverage.
    {
      name: 'chromium',
      testMatch: UI_SPECS,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testMatch: UI_SPECS,
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testMatch: UI_SPECS,
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      testMatch: UI_SPECS,
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      testMatch: UI_SPECS,
      use: { ...devices['iPhone 15'] },
      dependencies: ['setup'],
    },

    // Accessibility and visual checks are browser-agnostic enough to run once.
    {
      name: 'a11y',
      testMatch: 'a11y/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'visual',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});

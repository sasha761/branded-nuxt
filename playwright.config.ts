import { defineConfig, devices } from '@playwright/test'

/**
 * E2E-смоук против production-сборки (`npm run build`). WP по умолчанию локальный (branded.loc),
 * staging — через E2E_WP_URL. Не запускать против прода как регулярную проверку: тест кладёт
 * товар в корзину и отправляет checkout (с ошибкой в поле, заказ не создаётся).
 *
 * - E2E_WP_URL — адрес WP для запущенного Nuxt (по умолчанию http://branded.loc);
 * - E2E_BASE_URL — проверить уже запущенный сайт (staging), без локального сервера;
 * - E2E_CHANNEL=chrome — установленный Chrome вместо скачанного Chromium (`npx playwright install chromium`).
 */
const port = Number(process.env.E2E_PORT || 3100)
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    channel: process.env.E2E_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'node .output/server/index.mjs',
        url: `${baseURL}/robots.txt`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: {
          PORT: String(port),
          NUXT_WP_SITE_URL: process.env.E2E_WP_URL || 'http://branded.loc',
        },
      },
})

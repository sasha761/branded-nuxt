import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

// Два проекта:
// - unit: чистые функции (shared/, server/utils/, app/utils/) в Node, без запуска Nuxt — быстро;
// - nuxt: composables и стор, которым нужны авто-импорты Nuxt (ref, computed, defineStore…).
// E2E — отдельно, Playwright (playwright.config.ts).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
          // Каждый файл поднимает приложение Nuxt; на холодном кеше трансформаций это дольше 10 с
          hookTimeout: 60_000,
        },
      }),
    ],
  },
})

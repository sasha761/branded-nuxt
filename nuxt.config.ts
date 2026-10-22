import { fileURLToPath } from 'node:url'

// Кеш ответов BFF (ключ включает query). Хранилище: server/plugins/cache-storage.ts (Redis или LRU).
// Сбрасывается вебхуком WP: server/api/_revalidate.post.ts
// Только GET-маршруты: кешированный обработчик Nitro не передаёт тело запроса, POST под таким правилом ломается.
const apiCache = (maxAge: number) => ({ cache: { maxAge, staleMaxAge: 3600 } })

// Служебные маршруты фронта: в поиске им делать нечего.
const noindex = { headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
const noindexFollow = { headers: { 'X-Robots-Tag': 'noindex, follow' } }

export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  alias: {
    '@fonts': fileURLToPath(new URL('./app/assets/fonts', import.meta.url)),
  },

  modules: ['@nuxtjs/i18n', '@pinia/nuxt'],

  i18n: {
    locales: [
      {
        code: 'ru',
        language: 'ru-RU',
        name: 'Русский',
        file: 'ru.json',
      },
      {
        code: 'uk',
        language: 'uk-UA',
        name: 'Українська',
        file: 'uk.json',
      },
    ],
    defaultLocale: 'ru',
    strategy: 'prefix_except_default',
    // URL как в WordPress: /uk/, /cart/, /product/x/
    trailingSlash: true,
    // Словари грузятся лениво (в i18n v10 всегда, опции lazy больше нет)
    langDir: '../i18n/locales',
    // Google не советует редирект по языку браузера, а с кешем HTML он ещё и закешируется.
    detectBrowserLanguage: false,
  },

  runtimeConfig: {
    // Только сервер. На VPS — внутренний адрес WP (NUXT_WP_SITE_URL=http://127.0.0.1:8081).
    wpSiteUrl: process.env.WP_SITE_URL || 'https://branded.com.ua',
    wpTimeout: 8000,
    // = BRANDED_BFF_SECRET в wp-config.php: WP доверяет IP клиента из X-Branded-Client-IP
    bffSecret: '',
    // = BRANDED_REVALIDATE_SECRET в wp-config.php
    revalidateSecret: '',
    // Кеш Nitro в Redis (server/plugins/cache-storage.ts). Пусто — LRU в памяти процесса.
    redisUrl: '',
    public: {
      // Домен сайта для canonical, hreflang и og:url
      siteUrl: 'https://branded.com.ua',
      gtmId: '',
      fbPixelId: '',
    },
  },

  css: ['~/assets/scss/main.scss'],

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'swiper',
        'swiper/modules',
        'vue-select',
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['import', 'global-builtin'],
          additionalData: '@import "~/assets/scss/utility/mq.scss";',
        },
      },
    },
  },

  hooks: {
    // Кеш API — только в production-сборке. В dev кеш Nitro лежит на диске (.nuxt/cache) и переживает
    // перезапуск: после смены NUXT_WP_SITE_URL или правки в админке отдавались бы старые ответы.
    // ($production в конфиге не подходит: nuxi build читает конфиг до установки NODE_ENV.)
    'nitro:config'(nitroConfig) {
      if (nitroConfig.dev) {
        return
      }

      nitroConfig.routeRules = {
        '/api/menus': { cache: { maxAge: 3600, staleMaxAge: 86400 } },
        '/api/route': apiCache(300),
        '/api/archive/**': apiCache(300),
        '/api/product/get_single_product': apiCache(300),
        '/api/home/**': apiCache(300),
        '/api/page/**': apiCache(600),
        '/api/reviews/**': apiCache(600),
        '/api/search/**': apiCache(120),
        ...nitroConfig.routeRules,
      }
    },
  },

  routeRules: {
    '/cart/**': noindex,
    '/uk/cart/**': noindex,
    '/checkout/**': noindex,
    '/uk/checkout/**': noindex,
    '/order-received/**': noindex,
    '/uk/order-received/**': noindex,
    '/search/**': noindexFollow,
    '/uk/search/**': noindexFollow,
  },

  nitro: {
    compressPublicAssets: true,
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },
})

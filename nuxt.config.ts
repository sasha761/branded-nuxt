import { fileURLToPath } from 'node:url'

const wpSiteUrl = process.env.WP_SITE_URL || 'https://branded.com.ua'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',

  future: {
    compatibilityVersion: 4,
  },

  alias: {
    '@fonts': fileURLToPath(new URL('./app/assets/fonts', import.meta.url)),
    // '@layout': fileURLToPath(new URL('./app/components/layout', import.meta.url)),
  },

  modules: ['@nuxtjs/i18n', '@pinia/nuxt'],

  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
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
    lazy: true,
    langDir: '../i18n/locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },

  runtimeConfig: {
    wpSiteUrl,
    public: {
      wpSiteUrl,
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
        'v-pagination-3', // CJS
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

  routeRules: {
    '/api/menu/**': { cache: { maxAge: 3600, staleMaxAge: 86400 } },
    '/api/archive/get_sidebar': { cache: { maxAge: 600 } },
    '/api/archive/get_filters': { cache: { maxAge: 600 } },
    '/api/home/get_home_info': { cache: { maxAge: 300 } },
    // '/api/seo/**': { cache: { maxAge: 600 } },
  },

  nitro: {
    compressPublicAssets: true,
  },

  experimental: {
    inlineSSRStyles: false,
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'preconnect', href: wpSiteUrl },
        { rel: 'dns-prefetch', href: wpSiteUrl },
      ],
    },
  },
})

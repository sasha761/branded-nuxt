<template>
  <LayoutLArchivePage v-if="view === 'archive'" :page-route="pageRoute" />

  <LayoutLArchivePage
    v-else-if="view === 'sales'"
    :page-route="pageRoute"
    :on-sale="true"
    :title="pageTitle"
    :show-sidebar="false"
    :show-filters="false"
  />

  <LayoutLReviewsPage v-else-if="view === 'reviews'" :page-route="pageRoute" :title="pageTitle" />

  <main v-else class="p-page">
    <div class="u-container" v-if="content">
      <div class="row">
        <div class="col-lg-3 col-md-3 col-12 u-col">
          <div class="l-sidebar">
            <ul>
              <li
                v-for="page in content.related_pages"
                :key="page.ID"
                >
                <NuxtLink
                  :to="page.path"
                  exact-active-class="is-active"
                >
                  {{ page.title }}
                </NuxtLink>
              </li>
            </ul>
            <div class="l-sidebar__contact">
              <p>{{ t('contact.question') }} <br> {{ t('contact.write_us') }}</p>
              <a href="mailto:branded.own@gmail.com">branded.own@gmail.com</a>
              <p>{{ t('contact.hours_weekdays') }} <br> {{ t('contact.hours_weekend') }}</p>
            </div>
          </div>
        </div>
        <div class="col-lg-9 col-md-9 col-12 u-col">
          <div class="p-page__content">
            <h1 class="p-page__title u-h2">{{ content.page?.title }}</h1>
            <div class="p-page__content-text" v-html="content.page?.content"></div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
/**
 * Всё, что не поймали явные маршруты: CMS-страницы и архивы любых таксономий
 * (/бренд/…, /color/…, /product-tag/…). Тип объекта определяет api/route.
 */

// Страницы WP с особой вёрсткой — по ID в языке по умолчанию (слаги в языках разные)
const SPECIAL_VIEWS = {
  540: 'reviews',
  27: 'sales',
}

// WP-страницы корзины и checkout: на фронте это свои маршруты.
// Личного кабинета (7320) на фронте нет — главная; основной редирект по пути в server/middleware/01.redirects.ts
const APP_PAGES = {
  7318: '/cart/',
  7319: '/checkout/',
  7320: '/',
}

const { locale, t } = useI18n()
const localePath = useLocalePath()
const path = useCurrentPath().value

const { data, error } = await useAsyncData(`page:${path}`, async (_nuxtApp, { signal }) => {
  const [routeResult, pageResult] = await Promise.allSettled([
    fetchPageRoute(path, signal),
    $fetch('/api/page/page', { params: { url: path, lang: locale.value }, signal }),
  ])

  if (routeResult.status === 'rejected') {
    throw routeResult.reason
  }

  return {
    route: routeResult.value,
    page: pageResult.status === 'fulfilled' ? pageResult.value : null,
    // только статус: объект ошибки не сериализуется в payload
    pageError: pageResult.status === 'rejected'
      ? { statusCode: Number(pageResult.reason?.statusCode ?? pageResult.reason?.status) || 503 }
      : null,
  }
})

await guardPageRoute(data.value?.route, error.value)

const pageRoute = computed(() => data.value?.route ?? null)
const content = computed(() => data.value?.page ?? null)
const pageTitle = computed(() => content.value?.page?.title || '')

const appPath = pageRoute.value?.type === 'page' ? APP_PAGES[pageRoute.value.default_id] : null
if (appPath) {
  await navigateTo(localePath(appPath), { redirectCode: 301, replace: true })
}

const view = computed(() => {
  const info = pageRoute.value
  if (info && info.type !== 'page') return 'archive'
  return SPECIAL_VIEWS[info?.default_id] || 'content'
})

if (view.value === 'content') {
  if (!content.value) {
    throwPageError(data.value?.pageError ?? { statusCode: 404 })
  }

  usePageSeo(pageRoute)
}
</script>

<style lang="scss">
  @import "~/assets/scss/layout/sidebar.scss";
  @import "~/assets/scss/page/page.scss";
</style>

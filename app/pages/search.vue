<template>
  <main class="p-shop">
    <UiCPageLoader v-if="status === 'pending'" />
    <div class="u-container">
      <UiCBreadcrumbs :title="pageTitle" />

      <section class="l-shop">
        <h1 class="u-h2">{{ pageTitle }}</h1>

        <UiCProductList :products="products" :list-context="{ listName: 'Search results' }" />

        <h2 v-if="showEmptyState" class="u-h3 is-center">
          {{ t('no_results') }}
        </h2>

        <UiCPagination :page="currentPage" :total-pages="totalPages" />
      </section>
    </div>
    <LayoutLSubscribe />
  </main>
</template>

<script setup>
const route = useRoute()
const { locale, t } = useI18n()
const analytics = useAnalytics()
const currentPage = useCurrentPage()
const productsPerPage = 16

const searchQuery = computed(() => {
  const rawValue = Array.isArray(route.query.s) ? route.query.s[0] : route.query.s
  return typeof rawValue === 'string' ? rawValue.trim() : ''
})

const { data: searchData, status } = await useAsyncData(
  () => `search:${locale.value}:${searchQuery.value}:${currentPage.value}`,
  async (_nuxtApp, { signal }) => {
    // WP ищет от 3 символов
    if (searchQuery.value.length < 3) {
      return { products: [], productsCount: 0, totalPages: 0 }
    }

    const result = await $fetch('/api/search/search', {
      params: {
        lang: locale.value,
        query: searchQuery.value,
        page: currentPage.value,
        posts_per_page: productsPerPage,
      },
      signal,
    })

    return {
      products: result?.products || [],
      productsCount: result?.products_count || 0,
      totalPages: result?.total_pages || 0,
    }
  },
  {
    default: () => ({ products: [], productsCount: 0, totalPages: 0 }),
  }
)

const products = computed(() => searchData.value?.products || [])
const totalPages = computed(() => searchData.value?.totalPages || 0)

const pageTitle = computed(() => (searchQuery.value ? `${t('search')}: ${searchQuery.value}` : t('search')))

const showEmptyState = computed(() => Boolean(searchQuery.value) && status.value !== 'pending' && !products.value.length)

// Результаты поиска не индексируются, ссылки на товары — да (как Disallow /search в robots.txt)
useServicePageHead(pageTitle, 'noindex, follow')

onMounted(() => analytics.viewSearchResults(products.value))
watch(products, value => analytics.viewSearchResults(value))
</script>

<style lang="scss">
  @import "~/assets/scss/page/shop.scss";
  @import "~/assets/scss/layout/shop.scss";
</style>

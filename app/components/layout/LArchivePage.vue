<template>
  <main class="p-shop">
    <UiCPageLoader v-if="productsStatus === 'pending'" />
    <div class="u-container">
      <UiCBreadcrumbs :items="pageRoute?.breadcrumbs" :title="archiveTitle" />
      <div class="p-shop__flex">
        <div v-if="showSidebar" class="p-shop__sidebar">
          <LayoutLSidebar :items="sidebar" />
        </div>
        <div class="p-shop__catalog">
          <section class="l-shop" :data-categories="archiveTitle" :data-cat-id="term?.id">
            <h1 class="u-h2">{{ archiveTitle }}</h1>

            <div v-if="description" class="l-shop__text js-read-more">
              <div
                class="js-read-more-text"
                :class="isReadMoreOpen ? 'is-open' : 'is-close'"
                v-html="description"
              ></div>
              <button type="button" class="u-read-more js-read-more-btn" :class="{ 'is-open': isReadMoreOpen }" @click="isReadMoreOpen = !isReadMoreOpen">
                {{ isReadMoreOpen ? t('Read less') : t('Read completely') }}
              </button>
            </div>

            <LayoutLFilterBlock
              v-if="showFilters && (products.length || hasFilters)"
              :slug="term?.slug"
              :taxonomy="term?.taxonomy"
              :products="products"
              :products-count="productsCount"
              :page="currentPage"
              :per-page="perPage"
              @filtering="filterCallback"
            />

            <UiCProductList :products="products" :list-context="listContext" />

            <h2 v-if="!products.length && productsStatus !== 'pending'" class="u-h3 is-center">
              {{ productsError ? t('page_unavailable') : t('no_products') }}
            </h2>

            <UiCPagination :page="currentPage" :total-pages="totalPages" />
          </section>
        </div>
      </div>
    </div>
    <LayoutLSubscribe />
  </main>
</template>

<script setup>
/**
 * Архив товаров: категории, бренды, сезоны, /бренд/, распродажа.
 * Таксономию и термин WP определяет по пути (get_products?url=…).
 * Если pageRoute передан (catch-all уже загрузил api/route), повторно не запрашивается.
 */
const props = defineProps({
  pageRoute: { type: Object, default: null },
  onSale: { type: Boolean, default: false },
  title: { type: String, default: '' },
  showSidebar: { type: Boolean, default: true },
  showFilters: { type: Boolean, default: true },
})

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const currentPath = useCurrentPath()
const currentPage = useCurrentPage()

const path = currentPath.value
const sidebarSlug = path.split('/').filter(Boolean).pop() || ''

function decodedFullPath() {
  try {
    return decodeURI(route.fullPath)
  } catch {
    return route.fullPath
  }
}

const routeRequest = props.pageRoute ? null : useRouteData(path)

// Ключ меняется вместе с query: фильтры, сортировка и ?page= перезагружают товары.
const productsRequest = useAsyncData(
  () => `products:${props.onSale ? 'sale:' : ''}${route.fullPath}`,
  ({ signal }) => $fetch('/api/archive/get_products', {
    params: {
      url: decodedFullPath(),
      lang: locale.value,
      on_sale: props.onSale ? 1 : undefined,
    },
    signal,
  }),
)

const sidebarRequest = props.showSidebar
  ? useAsyncData(`sidebar:${locale.value}:${sidebarSlug}`, () => $fetch('/api/archive/get_sidebar', {
      params: { lang: locale.value, slug: sidebarSlug },
    }))
  : null

await Promise.all([routeRequest, productsRequest, sidebarRequest].filter(Boolean))

if (routeRequest) {
  await guardPageRoute(routeRequest.data.value, routeRequest.error.value, productsRequest.error.value)
} else if (productsRequest.error.value) {
  throwPageError(productsRequest.error.value)
}

const pageRoute = computed(() => props.pageRoute || routeRequest?.data.value || null)
const productsData = productsRequest.data
const productsStatus = productsRequest.status
const productsError = productsRequest.error

const products = computed(() => productsData.value?.products ?? [])
const productsCount = computed(() => productsData.value?.products_count ?? 0)
const totalPages = computed(() => productsData.value?.total_pages ?? 0)
const perPage = computed(() => productsData.value?.per_page ?? 16)
const term = computed(() => productsData.value?.term ?? null)
const sidebar = computed(() => sidebarRequest?.data.value ?? [])

const archiveTitle = computed(() => {
  if (props.title) return props.title

  const category = productsData.value?.product_cat
  if (category?.name) {
    return category.parent ? `${category.parent}. ${category.name}` : category.name
  }

  return term.value?.name ?? ''
})

const description = computed(() => (
  productsData.value?.product_cat?.description || term.value?.description || ''
))

// Как в теме: GA4 получает название архива как категорию списка и ID термина
const listContext = computed(() => ({
  listName: 'Product category',
  listId: term.value?.id ?? '',
  categories: archiveTitle.value ? archiveTitle.value.split(', ') : [],
}))

const hasFilters = computed(() => Object.keys(route.query).some(key => key !== 'page'))
const isReadMoreOpen = ref(false)

usePageSeo(pageRoute, { totalPages })

function filterCallback(selectedOption) {
  if (!selectedOption) return

  const query = { ...route.query }
  delete query.page

  if (selectedOption.key === 'all') {
    delete query[selectedOption.type]
  } else {
    query[selectedOption.type] = selectedOption.key
  }

  router.push({ query })
}
</script>

<style lang="scss">
  @import "~/assets/scss/page/shop.scss";
  @import "~/assets/scss/layout/shop.scss";
</style>

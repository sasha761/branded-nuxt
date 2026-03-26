<template>
  <main class="p-shop">
    <UiCPageLoader v-if="pending" />
    <div class="u-container">
      <UiCBreadcrumbs :items="breadcrumbs" />

      <section class="l-shop">
        <h1 class="u-h2">{{ pageTitle }}</h1>

        <UiCProductList :products="products" />

        <h2 v-if="showEmptyState" class="u-h3 is-center">
          {{ t('no_results') }}
        </h2>

        <div v-if="showPagination" class="c-pagination">
          <Pagination
            v-model="page"
            :records="productsCount"
            :per-page="productsPerPage"
            :options="{ texts: null }"
            @paginate="paginationCallback"
          />
        </div>
      </section>
    </div>
    <LayoutLSubscribe />
  </main>
</template>

<script setup>
import Pagination from 'v-pagination-3'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const productsPerPage = 16

const searchQuery = computed(() => {
  const rawValue = Array.isArray(route.query.s) ? route.query.s[0] : route.query.s
  return typeof rawValue === 'string' ? rawValue.trim() : ''
})

const currentPage = computed(() => {
  const rawPage = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const parsedPage = Number(rawPage)
  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
})

const page = ref(currentPage.value)

watch(
  currentPage,
  (value) => {
    page.value = value
  },
  { immediate: true }
)

const searchKey = computed(() => `search:${locale.value}:${searchQuery.value}:${currentPage.value}`)

const { data: searchData, pending } = await useAsyncData(
  searchKey,
  async ({ signal }) => {
    if (!searchQuery.value) {
      return {
        products: [],
        productsCount: 0,
        totalPages: 0,
        perPage: productsPerPage,
      }
    }

    const result = await $fetch('/api/search/search', {
      method: 'POST',
      body: {
        lang: locale.value,
        query: searchQuery.value,
        page: currentPage.value,
        offset: productsPerPage * (currentPage.value - 1),
        posts_per_page: productsPerPage,
      },
      signal,
    })

    return {
      products: result?.products || [],
      productsCount: result?.products_count || 0,
      totalPages: result?.total_pages || 0,
      perPage: result?.per_page || productsPerPage,
    }
  },
  {
    default: () => ({
      products: [],
      productsCount: 0,
      totalPages: 0,
      perPage: productsPerPage,
    }),
  }
)

const products = computed(() => searchData.value?.products || [])
const productsCount = computed(() => searchData.value?.productsCount || 0)
const totalPages = computed(() => searchData.value?.totalPages || 0)
const showPagination = computed(() => totalPages.value > 1)

const pageTitle = computed(() => {
  if (!searchQuery.value) {
    return t('search')
  }

  return `${t('search')}: ${searchQuery.value}`
})

const breadcrumbs = computed(() => [
  { text: t('main'), url: '/' },
  { text: pageTitle.value },
])

const showEmptyState = computed(() => {
  return Boolean(searchQuery.value) && !pending.value && !products.value.length
})

async function pushQuery(nextQuery) {
  const query = { ...nextQuery }

  Object.keys(query).forEach((key) => {
    const value = query[key]
    if (value === undefined || value === null || value === '' || value === '1') {
      delete query[key]
    }
  })

  await router.push({ query })
}

function paginationCallback(changedPage) {
  pushQuery({
    ...route.query,
    page: String(changedPage),
  })
}

useHead(() => ({
  title: pageTitle.value,
  meta: [
    {
      name: 'description',
      content: pageTitle.value,
      key: 'description',
    },
  ],
}))
</script>

<style lang="scss">
  @import "~/assets/scss/page/shop.scss";
  @import "~/assets/scss/layout/shop.scss";
  @import "~/assets/scss/components/pagination.scss";
</style>

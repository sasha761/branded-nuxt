<template>
  <main class="p-shop">
    <UiCPageLoader v-if="pending" />
    <div class="u-container">
      <UiCBreadcrumbs type="category" :url="categorySlugFromRoute" :items="breadcrumbs" />
      <div class="p-shop__flex">
        <div class="p-shop__sidebar">
          <LayoutLSidebar :slug="categorySlugFromRoute" :items="sidebarData" />
        </div>
        <div class="p-shop__catalog">
          <section class="l-shop" :data-categories="categoryTitle">
            <h1 class="u-h2">{{ categoryTitle }}</h1>

            <div v-if="description" class="l-shop__text js-read-more">
              <div
                class="js-read-more-text"
                :class="isReadMoreOpen ? 'is-open' : 'is-close'"
                v-html="description"
              ></div>
              <button type="button" class="u-read-more js-read-more-btn" :class="{ 'is-open': isReadMoreOpen }" @click="isReadMoreOpen = !isReadMoreOpen">
                {{ te('Read completely') ? t('Read completely') : 'Читать полностью' }}
              </button>
            </div>
            <LayoutLFilterBlock
              :slug="categorySlugFromRoute"
              :products="products"
              :products-count="productsCount"
              @filtering="filterCallback"
            />

            <UiCProductList :products="products" />

            <div v-if="showPagination" class="c-pagination">
              <Pagination
                v-model="page"
                :records="productsCount"
                :per-page="16"
                @paginate="paginationCallback"
                :options="{ texts: null }"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
    <LayoutLSubscribe />
  </main>
</template>

<script setup>
import Pagination from 'v-pagination-3'

const route = useRoute()
const router = useRouter()
const { locale, t, te } = useI18n()

const categorySlugFromRoute = computed(() => {
  const slugs = route.params.slug
  if (Array.isArray(slugs)) {
    const filtered = slugs.filter(Boolean)
    return filtered[filtered.length - 1] || ''
  }
  return slugs || ''
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


const { data: pageData, pending } = await useAsyncData(
  `page-data:${categorySlugFromRoute.value}:${locale.value}`,
  async ( {signal} ) => {
    const slug = categorySlugFromRoute.value
    const page = currentPage.value

    const [
      productsResult, 
      seoResult, 
      breadcrumbsResult, 
      sidebarResult
    ] = await Promise.all([
      $fetch('/api/archive/get_products', {
        params: {
          url: route.fullPath,
          page,
          slug,
          offset: 16 * (page - 1),
          lang: locale.value,
        },
        signal,
      }),
      $fetch('/api/seo/get_seo', {
        method: 'POST',
        body: {
          url: slug,
          type: 'category',
          lang: locale.value,
        },
        signal,
      }),
      $fetch('/api/seo/get_breadcrumbs', {
        method: 'POST',
        body: {
          url: slug,
          type: 'category',
          lang: locale.value,
        },
        signal,
      }),
      $fetch('/api/archive/get_sidebar', {
        params: {
          lang: locale.value,
          slug,
        },
        signal,
      }),
    ])

    return {
      products: productsResult,
      seo: seoResult,
      breadcrumbs: breadcrumbsResult?.breadcrumbs || [],
      sidebar: sidebarResult,
    }
  },
  {
    default: () => ({
      products: { products: [], products_count: 0, product_cat: null },
      seo: null,
      breadcrumbs: [],
      sidebar: [],
    }),
  }
)

const productsData = computed(() => pageData.value?.products ?? { products: [], products_count: 0, product_cat: null })
const seoData = computed(() => pageData.value?.seo ?? null)
const breadcrumbs = computed(() => pageData.value?.breadcrumbs ?? [])
const sidebarData = computed(() => pageData.value?.sidebar ?? [])

useSeo(seoData)

const products = computed(() => productsData.value?.products ?? [])
const productsCount = computed(() => productsData.value?.products_count ?? 0)
const categoryInfo = computed(() => productsData.value?.product_cat ?? null)
const showPagination = computed(() => productsCount.value > 16)

const categoryTitle = computed(() => {
  const info = categoryInfo.value
  if (!info?.name) return ''
  if (info.parent) {
    return info.parent + '. ' + info.name
  }
  return info.name
})

const description = computed(() => categoryInfo.value?.description ?? '')
const isReadMoreOpen = ref(false)

async function fetchProducts() {
  const result = await $fetch('/api/archive/get_products', {
    params: {
      url: route.fullPath,
      page: currentPage.value,
      slug: categorySlugFromRoute.value,
      offset: 16 * (currentPage.value - 1),
      lang: locale.value,
    },
  })

  pageData.value = { ...pageData.value, products: result }
}

async function pushQuery(nextQuery) {
  const query = { ...nextQuery }

  Object.keys(query).forEach((key) => {
    const value = query[key]
    if (value === undefined || value === null || value === '' || value === 'all') {
      delete query[key]
    }
  })

  await router.push({ query })
  await fetchProducts()
}

function paginationCallback(changedPage) {
  pushQuery({
    ...route.query,
    page: String(changedPage),
  })
}

function filterCallback(selectedOption) {
  if (!selectedOption) return

  const nextQuery = {
    ...route.query,
    page: undefined,
  }

  if (selectedOption.key !== 'all') {
    nextQuery[selectedOption.type] = selectedOption.key
  } else {
    delete nextQuery[selectedOption.type]
  }

  pushQuery(nextQuery)
}
</script>

<style lang="scss">
  @import "~/assets/scss/page/shop.scss";
  @import "~/assets/scss/layout/shop.scss";
  @import "~/assets/scss/components/pagination.scss";

  .VuePagination .VuePagination__count {
    display: none;
  }

  .VuePagination button {
    color: white;
  }
</style>

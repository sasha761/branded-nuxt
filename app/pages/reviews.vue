<template>
  <main class="p-reviews">
    <UiCPageLoader v-if="pending" />
    <div class="u-container">
      <UiCBreadcrumbs :items="breadcrumbs" />

      <section class="l-shop">
        <h1 class="u-h2">{{ pageTitle }}</h1>
      </section>

      <section class="l-reviews">
        <div v-if="reviews.length" class="row">
          <div
            v-for="review in reviews"
            :key="review.id"
            class="col-lg-4 col-md-6 col-12 u-col"
          >
            <article class="c-reviews">
              <span class="c-date">{{ formatReviewDate(review.date) }}</span>

              <div
                class="star-rating"
                role="img"
                :aria-label="`${normalizedRating(review.rating)} / 5`"
              >
                <span :style="{ width: getRatingWidth(review.rating) }"></span>
              </div>

              <NuxtLink
                v-if="review.product_link"
                :to="getProductLink(review.product_link)"
                class="u-h6"
              >
                {{ review.product_title }}
              </NuxtLink>
              <span v-else class="u-h6">{{ review.product_title }}</span>

              <p>{{ review.content }}</p>

              <div class="c-reviews__user">
                <div class="c-reviews__user-img">
                  {{ getAuthorInitial(review.author) }}
                </div>
                <div class="c-reviews__user-meta">
                  <div class="c-reviews__user-name">{{ review.author }}</div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <h2 v-else-if="!pending" class="u-h3 is-center">
          {{ emptyStateText }}
        </h2>

        <div v-if="showPagination" class="c-pagination">
          <Pagination
            v-model="page"
            :records="totalReviews"
            :per-page="reviewsPerPage"
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
const { stripDomain } = useProductUtils()
const reviewsPerPage = 12

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

const pageTitle = computed(() => t('reviews'))
const emptyStateText = computed(() => (
  locale.value === 'uk' ? 'Відгуків поки немає' : 'Отзывов пока нет'
))

const breadcrumbs = computed(() => [
  { text: t('main'), url: '/' },
  { text: pageTitle.value },
])

const reviewsKey = computed(() => `reviews:${route.path}:${locale.value}:${currentPage.value}`)

const { data: reviewsPageData, pending } = await useAsyncData(
  reviewsKey,
  async ({ signal }) => {
    const [reviewsResult, seoResult] = await Promise.all([
      $fetch('/api/reviews/reviews', {
        method: 'POST',
        body: {
          lang: locale.value,
          page: currentPage.value,
          per_page: reviewsPerPage,
        },
        signal,
      }),
      $fetch('/api/seo/get_seo', {
        method: 'POST',
        body: {
          url: route.path,
          type: 'page',
          lang: locale.value,
        },
        signal,
      }),
    ])

    return {
      content: {
        reviews: reviewsResult?.reviews || [],
        total: reviewsResult?.total || 0,
        totalPages: reviewsResult?.total_pages || 0,
        currentPage: reviewsResult?.current_page || currentPage.value,
        perPage: reviewsResult?.per_page || reviewsPerPage,
      },
      seo: seoResult ?? null,
    }
  },
  {
    watch: [currentPage, locale, () => route.path],
    default: () => ({
      content: {
        reviews: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
        perPage: reviewsPerPage,
      },
      seo: null,
    }),
  }
)

const reviewsContent = computed(() => reviewsPageData.value?.content ?? null)
const reviews = computed(() => reviewsContent.value?.reviews || [])
const totalReviews = computed(() => Number(reviewsContent.value?.total || 0))
const totalPages = computed(() => Number(reviewsContent.value?.totalPages || 0))
const showPagination = computed(() => totalPages.value > 1)
const seoRef = computed(() => reviewsPageData.value?.seo ?? null)

function normalizedRating(rating) {
  const value = Number(rating) || 0
  return Math.min(5, Math.max(0, value))
}

function getRatingWidth(rating) {
  return `${(normalizedRating(rating) / 5) * 100}%`
}

function getAuthorInitial(author) {
  if (typeof author !== 'string' || !author.trim()) {
    return '?'
  }

  return author.trim().charAt(0).toUpperCase()
}

function formatReviewDate(value) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(String(value).replace(' ', 'T'))

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat(
    locale.value === 'uk' ? 'uk-UA' : 'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  ).format(parsedDate)
}

function getProductLink(link) {
  return stripDomain(link) || '/'
}

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

useSeo(seoRef)

useHead(() => {
  if (seoRef.value) {
    return {}
  }

  return {
    title: currentPage.value > 1 ? `${pageTitle.value} - ${currentPage.value}` : pageTitle.value,
    meta: [
      {
        name: 'description',
        content: pageTitle.value,
        key: 'description',
      },
    ],
  }
})
</script>

<style lang="scss">
  @import "~/assets/scss/page/reviews.scss";
  @import "~/assets/scss/layout/shop.scss";
  @import "~/assets/scss/components/reviews.scss";
  @import "~/assets/scss/components/stars.scss";
  @import "~/assets/scss/components/pagination.scss";

  .l-reviews {
    margin-bottom: 40px;
  }
</style>

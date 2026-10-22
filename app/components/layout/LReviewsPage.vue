<template>
  <main class="p-reviews">
    <UiCPageLoader v-if="status === 'pending'" />
    <div class="u-container">
      <UiCBreadcrumbs :items="pageRoute?.breadcrumbs" :title="pageTitle" />

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
                v-if="review.product_path"
                :to="review.product_path"
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

        <h2 v-else-if="status !== 'pending'" class="u-h3 is-center">
          {{ t('reviews_empty') }}
        </h2>

        <UiCPagination :page="currentPage" :total-pages="totalPages" />
      </section>
    </div>

    <LayoutLSubscribe />
  </main>
</template>

<script setup>
// Страница «Отзывы» (WP-страница 540: /reviews/, /uk/vidguky/). api/route загружает catch-all.
const props = defineProps({
  pageRoute: { type: Object, required: true },
  title: { type: String, default: '' },
})

const { locale, t } = useI18n()
const currentPage = useCurrentPage()
const reviewsPerPage = 12

const pageTitle = computed(() => props.title || t('reviews'))

const { data, status, error } = await useAsyncData(
  () => `reviews:${locale.value}:${currentPage.value}`,
  (_nuxtApp, { signal }) => $fetch('/api/reviews/reviews', {
    params: {
      lang: locale.value,
      page: currentPage.value,
      per_page: reviewsPerPage,
    },
    signal,
  }),
)

if (error.value) {
  throwPageError(error.value)
}

const reviews = computed(() => data.value?.reviews || [])
const totalPages = computed(() => Number(data.value?.total_pages || 0))

usePageSeo(() => props.pageRoute, { totalPages })

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
</script>

<style lang="scss">
  @import "~/assets/scss/page/reviews.scss";
  @import "~/assets/scss/layout/shop.scss";
  @import "~/assets/scss/components/reviews.scss";
  @import "~/assets/scss/components/stars.scss";

  .l-reviews {
    margin-bottom: 40px;
  }
</style>

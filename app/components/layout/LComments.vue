<template>
  <section class="l-comments">
    <div class="u-container">
      <div class="row">
        <div class="col-lg-8">
          <div class="c-comments comment-respond" id="respond">
            <h3 class="u-h4">{{ t('reviews_count', { count: comments.length }) }}</h3>
            <div class="c-comments__box" :class="{ 'is-scroll': comments.length > 3 }">
              <div
                v-for="comment in comments"
                :key="comment.comment_ID"
                class="c-comments__user"
              >
                <div class="c-comments__user-rating">
                  <div class="star-rating" role="img" :aria-label="`${normalizedRating(comment.rating)} / 5`">
                    <span :style="{ width: `${(normalizedRating(comment.rating) / 5) * 100}%` }"></span>
                  </div>
                </div>
                <div class="c-comments__user-content">
                  <div class="c-comments__name">
                    <span class="c-name">{{ comment.comment_author }}</span>
                    <span class="c-time">{{ formatDate(comment.comment_date) }}</span>
                  </div>
                  <div class="c-comments__text">
                    <p v-for="(paragraph, index) in paragraphs(comment.comment_content)" :key="index">{{ paragraph }}</p>
                  </div>
                </div>
              </div>
            </div>

            <FormsReviewForm v-if="productId" :product-id="productId" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  comments: { type: Array, default: () => [] },
  productId: { type: Number, default: 0 },
})

const { t, locale } = useI18n()

function normalizedRating(rating) {
  const value = Number(rating) || 0
  return Math.min(5, Math.max(0, value))
}

function paragraphs(content) {
  return String(content || '').split(/\n{2,}/).map(part => part.trim()).filter(Boolean)
}

function formatDate(value) {
  const date = new Date(String(value || '').replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return String(value || '')

  return new Intl.DateTimeFormat(locale.value === 'uk' ? 'uk-UA' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
</script>

<style lang="scss">
@import "~/assets/scss/components/comments.scss";
@import "~/assets/scss/components/stars.scss";
</style>

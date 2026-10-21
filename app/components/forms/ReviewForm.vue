<template>
  <p v-if="sentStatus" class="c-comments__notice">
    {{ sentStatus === 'approved' ? t('review.thanks') : t('review.pending') }}
  </p>

  <form v-else class="comment-form" id="commentform" @submit.prevent="submit">
    <h3 class="u-h3">{{ t('review.title') }}</h3>
    <p>{{ t('review.notice') }}</p>

    <div class="c-comments__registration">
      <label>Email* <br>
        <input v-model.trim="form.email" required name="email" type="email" autocomplete="email">
        <span v-if="errors.email" class="error-msg">{{ errorText(errors.email) }}</span>
      </label>
      <label>{{ t('review.name') }}* <br>
        <input v-model.trim="form.author" required name="author" type="text" autocomplete="name" maxlength="60">
        <span v-if="errors.author" class="error-msg">{{ errorText(errors.author) }}</span>
      </label>
      <div class="c-comments__registration-label">{{ t('review.rating') }}* <br>
        <div class="comment-form-rating">
          <select v-model.number="form.rating" name="rating" required>
            <option :value="0">{{ t('review.rating_placeholder') }}</option>
            <option v-for="value in [5, 4, 3, 2, 1]" :key="value" :value="value">{{ t(`review.rating_${value}`) }}</option>
          </select>
        </div>
        <span v-if="errors.rating" class="error-msg">{{ errorText(errors.rating) }}</span>
      </div>
    </div>

    <!-- Поле-ловушка: человек его не видит, бот заполняет -->
    <input v-model="form.website" class="u-honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">

    <div class="c-comments__submit">
      <input v-model.trim="form.content" type="text" name="comment" required maxlength="2000" :placeholder="t('review.comment')">
      <button class="u-btn is-medium is-black" type="submit" :disabled="requestInProgress">{{ t('send') }}</button>
    </div>
    <span v-if="errors.content" class="error-msg">{{ errorText(errors.content) }}</span>
    <p v-if="formError" class="error-msg">{{ formError }}</p>
  </form>
</template>

<script setup>
const props = defineProps({
  productId: { type: Number, required: true },
})

const { t, te } = useI18n()
const { requestInProgress, waitRequest } = useWaitRequest()

const form = reactive({ author: '', email: '', rating: 0, content: '', website: '' })
const errors = ref({})
const formError = ref('')
const sentStatus = ref('')

function errorText(code) {
  const key = `review.errors.${code}`
  return te(key) ? t(key) : t('review.errors.invalid')
}

function submit() {
  errors.value = {}
  formError.value = ''

  if (!form.rating) {
    errors.value = { rating: 'required' }
    return
  }

  waitRequest(async () => {
    try {
      const result = await $fetch('/api/product/review', {
        method: 'POST',
        body: { id: props.productId, ...form },
      })
      sentStatus.value = result?.status || 'pending'
    } catch (error) {
      const status = Number(error?.statusCode ?? error?.response?.status)
      const fieldErrors = error?.data?.data?.errors

      if (status === 422 && fieldErrors) {
        const { form: formCode, ...rest } = fieldErrors
        errors.value = rest
        formError.value = formCode ? errorText(formCode) : ''
      } else {
        formError.value = status === 429 ? t('review.errors.rate_limited') : t('review.errors.failed')
      }
    }
  })
}
</script>

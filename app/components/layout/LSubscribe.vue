<template>
  <section class="l-subs">
    <img
      class="is-img"
      src="~/assets/img/subs.jpg"
      :alt="t('subscribe.image_alt')"
      width="1920"
      height="647"
      loading="lazy"
    />
    <div class="u-container">
      <form class="c-form js-form-register" novalidate @submit.prevent="submit">
        <div class="c-form__title"><div class="u-h3">{{ t('subscribe.title') }}</div></div>
        <div class="c-form__checkbox">
          <div class="c-checkbox">
            <input v-model="form.gender" type="checkbox" value="man" name="gender" />
            <p>{{ t('subscribe.men') }}</p>
          </div>
          <div class="c-checkbox">
            <input v-model="form.gender" type="checkbox" value="wooman" name="gender" />
            <p>{{ t('subscribe.women') }}</p>
          </div>
        </div>
        <input v-model="form.website" class="u-honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="c-form__bottom">
          <input v-model.trim="form.email" type="email" placeholder="Email" name="email" autocomplete="email" required />
          <button type="submit" class="u-btn is-black" :disabled="requestInProgress">{{ t('subscribe.submit') }}</button>
          <div class="js-form-answer" :class="{ 'c-form-error': isError }">{{ message }}</div>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
const { t } = useI18n()
const { requestInProgress, waitRequest } = useWaitRequest()

const form = reactive({ email: '', gender: [], website: '' })
const message = ref('')
const isError = ref(false)

function submit() {
  message.value = ''
  isError.value = false

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    isError.value = true
    message.value = t('form.email')
    return
  }

  waitRequest(async () => {
    try {
      await $fetch('/api/subscribe', { method: 'POST', body: form })
      message.value = t('subscribe.thanks')
      form.email = ''
      form.gender = []
    } catch (error) {
      const status = Number(error?.statusCode ?? error?.response?.status)
      isError.value = true
      message.value = status === 422 ? t('form.email') : status === 429 ? t('subscribe.rate_limited') : t('subscribe.failed')
    }
  })
}
</script>

<style lang="scss">
@import "~/assets/scss/components/form.scss";
@import "~/assets/scss/layout/subs.scss";

</style>

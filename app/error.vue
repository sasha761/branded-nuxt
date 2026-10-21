<template>
  <div>
    <PartialIconsSvg />
    <NuxtLayout>
      <main class="p-error">
        <div class="u-container">
          <template v-if="isNotFound">
            <h1 class="u-h3">{{ t('page_not_found') }}</h1>
            <p>
              <i18n-t keypath="page_not_found_text" tag="span">
                <a href="#" @click.prevent="handleGoHome">{{ t('main') }}</a>
              </i18n-t>
            </p>
          </template>
          <!-- 503: WP недоступен. Роботы получают временную ошибку, а не 404, и не выкидывают страницу из индекса -->
          <template v-else>
            <h1 class="u-h3">{{ t('service_unavailable') }}</h1>
            <p>{{ t('service_unavailable_text') }}</p>
          </template>
          <button class="u-btn is-black is-medium is-border-radius" @click="handleGoHome">
            {{ t('to_main_page') }}
          </button>
        </div>
      </main>
    </NuxtLayout>
  </div>
</template>

<script setup>
const { t } = useI18n()
const localePath = useLocalePath()

const props = defineProps({
  error: Object,
})

const isNotFound = computed(() => Number(props.error?.statusCode) === 404)

useHead(() => ({
  title: isNotFound.value ? t('page_not_found') : t('service_unavailable'),
  meta: [{ name: 'robots', content: 'noindex', key: 'robots' }],
}))

function handleGoHome() {
  clearError({ redirect: localePath('/') })
}
</script>

<style lang="scss">
@import "~/assets/scss/page/error.scss";
</style>

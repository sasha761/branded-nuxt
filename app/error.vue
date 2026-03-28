<template>
  <div>
    <PartialIconsSvg />
    <NuxtLayout>
      <main class="p-error">
        <div class="u-container">
          <h1 class="u-h3">{{ t('page_not_found') }}</h1>
          <p>
            <i18n-t keypath="page_not_found_text" tag="span">
              <a href="#" @click.prevent="handleGoHome">{{ t('main') }}</a>
            </i18n-t>
          </p>
          <button class="u-btn is-black is-medium is-border-radius" @click="handleGoHome">
            {{ t('to_main_page') }}
          </button>
          <!-- <div class="p-error__search">
            <p>{{ t('use_search') }}:</p>
            <UiCSearchForm />
          </div> -->
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

useHead({
  title: '404',
})

function handleGoHome() {
  clearError({ redirect: localePath('/') })
}
</script>

<style lang="scss">
@import "~/assets/scss/page/error.scss";
</style>

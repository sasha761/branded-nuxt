<template>
  <nav class="c-breadcrumbs" :aria-label="t('breadcrumbs')">
    <span>
      <template v-for="(crumb, i) in crumbs" :key="i">
        <NuxtLink v-if="crumb.path && i < crumbs.length - 1" :to="crumb.path">{{ crumb.text }}</NuxtLink>
        <span v-else class="breadcrumb_last" aria-current="page">{{ crumb.text }}</span>
        <span v-if="i < crumbs.length - 1"> - </span>
      </template>
    </span>
  </nav>
</template>

<script setup>
// Крошки Yoast из api/route (основная категория товара); для страниц фронта — «Главная - заголовок».
const props = defineProps({
  items: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const { t } = useI18n()
const localePath = useLocalePath()

const crumbs = computed(() => {
  if (props.items?.length) {
    return props.items
  }

  const fallback = [{ text: t('main'), path: localePath('/') }]
  if (props.title) {
    fallback.push({ text: props.title, path: null })
  }
  return fallback
})
</script>

<style lang="scss">
@import "~/assets/scss/components/breadcrumbs.scss";
</style>

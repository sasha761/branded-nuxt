<template>
  <nav class="c-breadcrumbs">
    <span v-if="breadcrumbs.length">
      <template v-for="(crumb, i) in breadcrumbs" :key="i">
        <NuxtLink v-if="crumb.url" :to="localePath(stripDomain(crumb.url))">{{ crumb.text }}</NuxtLink>
        <span v-else class="breadcrumb_last" aria-current="page">{{ crumb.text }}</span>
        <span v-if="i < breadcrumbs.length - 1"> - </span>
      </template>
    </span>
    <span v-else>
      <NuxtLink :to="localePath('/')">Главная</NuxtLink>
      <span v-if="fallbackTitle"> - <span class="breadcrumb_last" aria-current="page">{{ fallbackTitle }}</span></span>
    </span>
  </nav>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: '' },
  url: { type: String, default: '' },
  items: { type: Array, default: null },
})

const route = useRoute()
const { locale } = useI18n()
const localePath = useLocalePath()
const { stripDomain } = useProductUtils()

const fallbackTitle = computed(() => {
  const slugs = route.params.slug || route.params.brandName || route.params.productName
  if (Array.isArray(slugs)) return slugs[slugs.length - 1]
  return slugs || ''
})

const { data: fetchedBreadcrumbs } = props.items
  ? { data: ref([]) }
  : useAsyncData(
      `breadcrumbs:${props.type}:${props.url}:${locale.value}`,
      async () => {
        if (!props.type || !props.url) {
          return []
        }

        const response = await $fetch('/api/seo/get_breadcrumbs', {
          method: 'POST',
          body: {
            url: props.url,
            type: props.type,
            lang: locale.value,
          },
        })

        return response?.breadcrumbs || []
      },
      {
        default: () => [],
      }
    )

const breadcrumbs = computed(() => props.items || fetchedBreadcrumbs.value || [])
</script>

<style lang="scss">
@import "~/assets/scss/components/breadcrumbs.scss";
</style>
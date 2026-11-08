<template>
  <img
    ref="element"
    :src="ready && src ? src : undefined"
    :srcset="ready ? srcset : undefined"
    :data-src="!ready && src ? src : undefined"
    :data-srcset="!ready ? srcset : undefined"
    :loading="loading"
    decoding="async"
  >
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  src?: string | false
  srcset?: string
  loading?: 'eager' | 'lazy'
}>(), { loading: 'lazy' })

const element = ref<HTMLImageElement | null>(null)
const ready = useImageViewport(element, () => props.loading === 'eager')
</script>

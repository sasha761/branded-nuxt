<template>
  <div>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <PartialIconsSvg />
    <!-- <ClientOnly>
      <DebugPerfPanel />
    </ClientOnly> -->
  </div>
</template>

<script setup>
import montserratLatin from '@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url'
import montserratCyrillic from '@fontsource-variable/montserrat/files/montserrat-cyrillic-wght-normal.woff2?url'

// <html lang="ru-RU|uk-UA">, как в WP
const { localeProperties } = useI18n()

useHead(() => ({
  htmlAttrs: { lang: localeProperties.value.language },
  link: [montserratLatin, montserratCyrillic].map(href => ({
    rel: 'preload', as: 'font', type: 'font/woff2', href, crossorigin: 'anonymous',
  })),
}))
</script>

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
// <html lang="ru-RU|uk-UA">, как в WP
const { localeProperties } = useI18n()

useHead(() => ({
  htmlAttrs: { lang: localeProperties.value.language },
}))
</script>

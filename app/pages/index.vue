<template>
  <main class="p-main">
    <UiCPageLoader v-if="homeStatus === 'pending'"/>
    <LayoutLHeroHome v-if="homeData?.banners_group" :data="homeData.banners_group" />
    <LayoutLAccessory :data="homeData?.accesories" />
    <LayoutLProductRow :data="homeData?.best_offers" />
    <LazyLayoutLBrand :data="homeData?.products_brand" />
    <LazyLayoutLOutlet :data="homeData?.products_sale" />
    <LazyLayoutLBranded />
    <LazyLayoutLSubscribe />
  </main>
</template>

<script setup>
const { locale } = useI18n()
const path = useCurrentPath().value

// SEO главной в её языке (раньше get_seo шёл без lang, и /uk/ получала русские title)
const [routeRequest, homeRequest] = await Promise.all([
  useRouteData(path),
  useAsyncData(`home:${locale.value}`, (_nuxtApp, { signal }) => $fetch('/api/home/get_home_info', {
    params: { lang: locale.value },
    signal,
  })),
])

await guardPageRoute(routeRequest.data.value, routeRequest.error.value, homeRequest.error.value)

const homeData = homeRequest.data
const homeStatus = homeRequest.status

usePageSeo(routeRequest.data)
</script>

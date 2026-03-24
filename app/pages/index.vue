<template>
  <main class="p-main">
    <UiCPageLoader v-if="pending"/>
    <LayoutLHeroHome v-if="homeData?.data?.banners_group" :data="homeData.data.banners_group" />
    <LayoutLAccessory :data="homeData?.data?.accesories" />
    <LayoutLProductRow :data="homeData?.data?.best_offers" />
    <LayoutLBrand :data="homeData?.data?.products_brand" />
    <LayoutLOutlet :data="homeData?.data?.products_sale" />
    <LayoutLBranded />
    <LayoutLSubscribe />
  </main>
</template>

<script setup>
const route = useRoute()
const { locale } = useI18n()

const { data: homeData, pending } = await useAsyncData(
  `home:${locale.value}`,
  async ( {signal} ) => {
    const [
      homeResult, 
      seoResult
    ] = await Promise.all([
      $fetch('/api/home/get_home_info', {
        params: {
          lang: locale.value,
        },
        signal,
      }),
      $fetch('/api/seo/get_seo', {
        method: 'POST',
        body: {
          url: route.path,
          type: 'home',
        },
        signal,
      }),
    ])

    return {
      data: homeResult,
      seo: seoResult,
    }
  },
  {
    default: () => ({
      data: null,
      seo: null,
    }),
  }
)

// console.log('homeData: ', homeData.value);

const seoData = computed(() => homeData.value?.seo ?? null)

useSeo(seoData)

</script>

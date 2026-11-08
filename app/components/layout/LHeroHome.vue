<template>
  <section class="l-hero">
    <div class="u-container">
      <div class="row align-items-stretch">
        <div class="col-lg-9 col-md-12 u-col">
          <div ref="bannerSlider" class="swiper">
            <div class="swiper-wrapper">
              <NuxtLink
                v-for="(item, index) in data.banners"
                :key="index"
                :to="item.path"
                class="c-banner swiper-slide"
              >
                <picture>
                  <img
                    :src="loadedBannerIndexes.has(index) ? item.img : undefined"
                    :data-src="index > 0 ? item.img : undefined"
                    :width="item.image_dimensions?.width || 1280"
                    :height="item.image_dimensions?.height || 720"
                    :alt="$t('home.banner_alt', { n: index + 1 })"
                    :fetchpriority="index === 0 ? 'high' : 'low'"
                    :loading="index === 0 ? 'eager' : 'lazy'"
                    decoding="async"
                  >
                </picture>
                <!-- Как в теме WP: H1 в последнем слайде, текст на языке страницы -->
                <h1 v-if="index === data.banners.length - 1" class="c-banner__title">
                  {{ $t('home_title') }}
                </h1>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="col-lg-3 col-md-12 u-col">
          <div class="l-hero__row-banners">
            <!-- Раньше вели на удалённые товары BeOm (404 и на живом сайте) -->
            <NuxtLink :to="siteLink('brandBeom')" class="c-banner">
              <picture>
                <img
                  :src="data.small_banner_1"
                  :width="data.small_banner_1_dimensions?.width || 965"
                  :height="data.small_banner_1_dimensions?.height || 815"
                  :alt="$t('home.small_banner_1_alt')"
                  loading="lazy"
                  decoding="async"
                >
              </picture>
            </NuxtLink>
            <NuxtLink :to="siteLink('brandBeom')" class="c-banner">
              <picture>
                <img
                  :src="data.small_banner_2"
                  :width="data.small_banner_2_dimensions?.width || 965"
                  :height="data.small_banner_2_dimensions?.height || 620"
                  :alt="$t('home.small_banner_2_alt')"
                  loading="lazy"
                  decoding="async"
                >
              </picture>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Swiper from 'swiper'

const props = defineProps({
  data: { type: Object },
})

const siteLink = useSiteLink()
const bannerSlider = ref(null)
// Одного loading="lazy" недостаточно: браузер заранее загружает соседние слайды.
// Реальный src появляется только у первого и уже открытых баннеров.
const loadedBannerIndexes = ref(new Set([0]))
let swiperInstance = null

const firstBannerImg = computed(() => props.data?.banners?.[0]?.img)
useHead({
  link: computed(() =>
    firstBannerImg.value
      ? [{ rel: 'preload', as: 'image', href: firstBannerImg.value, fetchpriority: 'high' }]
      : []
  ),
})

function loadActiveBanner(swiper) {
  loadedBannerIndexes.value.add(swiper.activeIndex)
}

onMounted(() => {
  if (bannerSlider.value) {
    swiperInstance = new Swiper(bannerSlider.value, {
      on: {
        init: loadActiveBanner,
        slideChange: loadActiveBanner,
      },
    })
  }
})

onBeforeUnmount(() => {
  swiperInstance?.destroy(true, true)
  swiperInstance = null
})
</script>

<style lang="scss">
@import "~/assets/scss/layout/hero.scss";
@import "~/assets/scss/components/banner.scss";
</style>

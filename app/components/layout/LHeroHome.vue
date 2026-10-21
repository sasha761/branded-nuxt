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
                    :src="item.img"
                    width="1400"
                    height="616"
                    :alt="$t('home.banner_alt', { n: index + 1 })"
                    :fetchpriority="index === 0 ? 'high' : 'low'"
                    :loading="index === 0 ? 'eager' : 'lazy'"
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
                  width="360"
                  height="234"
                  :alt="$t('home.small_banner_1_alt')"
                >
              </picture>
            </NuxtLink>
            <NuxtLink :to="siteLink('brandBeom')" class="c-banner">
              <picture>
                <img
                  :src="data.small_banner_2"
                  width="360"
                  height="234"
                  :alt="$t('home.small_banner_2_alt')"
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

const firstBannerImg = computed(() => props.data?.banners?.[0]?.img)
useHead({
  link: computed(() =>
    firstBannerImg.value
      ? [{ rel: 'preload', as: 'image', href: firstBannerImg.value }]
      : []
  ),
})

onMounted(() => {
  if (bannerSlider.value) {
    new Swiper(bannerSlider.value)
  }
})
</script>

<style lang="scss">
@import "~/assets/scss/layout/hero.scss";
@import "~/assets/scss/components/banner.scss";
</style>

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
                :to="localePath(item.link)"
                class="c-banner swiper-slide"
              >
                <picture>
                  <img
                    :src="item.img"
                    width="1400"
                    height="616"
                    :alt="'Branded баннер ' + index"
                  >
                </picture>
                <h1 v-if="index === data.banners.length - 1" class="c-banner__title">
                  Online store brand clothing for men and women
                </h1>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="col-lg-3 col-md-12 u-col">
          <div class="l-hero__row-banners">
            <NuxtLink :to="localePath('/product/steganaya-kurtka-zhenskaya-sinyaya-ot-beom/')" class="c-banner">
              <picture>
                <img
                  :src="data.small_banner_1"
                  width="360"
                  height="234"
                  alt="Куртка женская синяя от BeOm"
                >
              </picture>
            </NuxtLink>
            <NuxtLink :to="localePath('/product/svitshot-zhenskij-s-printami-gorodov-ukrainy-bezhevyj-ot-beom/')" class="c-banner">
              <picture>
                <img
                  :src="data.small_banner_2"
                  width="360"
                  height="234"
                  alt="Свитшот женский с принтами городов Украины"
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
import Swiper from 'swiper/bundle'

const props = defineProps({
  data: { type: Object },
})

const localePath = useLocalePath()
const bannerSlider = ref(null)

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
<template>
  <section class="l-outlet">
    <div class="u-container">
      <h3 class="u-h2">
        <span class="is-title">{{ $t('home.outlet_title') }}</span>
      </h3>
      <div class="l-outlet__content">
        <div class="l-outlet__content-left">
          <div class="row">
            <div class="col-lg-6">
              <NuxtLink :to="siteLink('accessories')" class="c-outlet">
                <UiCImage :src="bagsImage1" alt="bags branded" width="390" height="390" loading="lazy" decoding="async" />
              </NuxtLink>
            </div>
            <div class="col-lg-6">
              <NuxtLink :to="siteLink('accessories')" class="c-outlet">
                <UiCImage :src="bagsImage2" alt="bags branded" width="390" height="390" loading="lazy" decoding="async" />
              </NuxtLink>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between is-title">
            <p class="u-text">{{ $t('home.outlet_collection') }}</p>
            <NuxtLink :to="siteLink('accessories')" class="u-btn is-black">{{ $t('home.all_collection') }}</NuxtLink>
          </div>
        </div>
        <div class="l-outlet__content-right js-slider-container">
          <div class="align-items-center justify-content-between d-none d-lg-flex is-title">
            <p class="u-text">{{ $t('home.outlet_sale') }}</p>
            <div class="l-outlet__arrow">
              <div class="c-arrow is-small">
                <div @click="slidePrev" class="c-arrow__prev js-prev">
                  <svg width="61px" height="19px" class="c-arrow__next is-next">
                    <use xlink:href="#small-arrow"></use>
                  </svg>
                </div>
                <div class="c-arrow__count">
                  <span class="swiper-pagination-current">{{ currentSlideIndex }}</span> /
                  <span class="swiper-pagination-total">{{ allSlideIndex }}</span>
                </div>
                <div @click="slideNext" class="c-arrow__next js-next">
                  <svg width="61px" height="19px" class="c-arrow__next is-next">
                    <use xlink:href="#small-arrow"></use>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div ref="outletSlider" class="js-product-row swiper">
            <div class="swiper-wrapper">
              <div v-for="(outlet, index) in data" :key="index" class="col-6 u-col swiper-slide">
                <NuxtLink
                  :to="outlet.path"
                  class="c-outlet"
                >
                  <picture>
                    <img
                      :src="loadedSlides.has(index) ? outlet.post_img_m : undefined"
                      :data-src="outlet.post_img_m"
                      :alt="outlet.name"
                      :width="outlet.image?.sizes?.archive_md?.width || 420"
                      :height="outlet.image?.sizes?.archive_md?.height || 504"
                      loading="lazy"
                      decoding="async"
                    >
                  </picture>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Swiper from 'swiper'
import { Autoplay } from 'swiper/modules'
import bagsImage1 from '~/assets/img/bags1.jpg'
import bagsImage2 from '~/assets/img/bags2.jpg'

const props = defineProps({
  data: { type: Array },
})

const siteLink = useSiteLink()
const outletSlider = ref(null)
const { loadedSlides, watchCarousel } = useVisibleCarousel()
let swiperInstance = null

const currentSlideIndex = ref(1)
const allSlideIndex = ref(1)

onMounted(() => {
  if (outletSlider.value) {
    swiperInstance = new Swiper(outletSlider.value, {
      modules: [Autoplay],
      slidesPerView: 'auto',
      watchOverflow: true,
      autoplay: {
        enabled: false,
        delay: 2500,
        stopOnLastSlide: false,
        disableOnInteraction: true,
      },
      on: {
        slideChange(swiper) {
          currentSlideIndex.value = swiper.activeIndex + 1
        },
        init(swiper) {
          allSlideIndex.value = swiper.snapGrid.length
        },
      },
    })
    watchCarousel(swiperInstance)
  }
})

onBeforeUnmount(() => {
  swiperInstance?.destroy(true, true)
  swiperInstance = null
})

function slideNext() {
  swiperInstance?.slideNext()
}

function slidePrev() {
  swiperInstance?.slidePrev()
}
</script>

<style lang="scss">
  @import "~/assets/scss/layout/outlet.scss";
</style>

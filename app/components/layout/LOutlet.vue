<template>
  <section class="l-outlet">
    <div class="u-container">
      <h3 class="u-h2">
        <span class="is-sale">-20%</span>
        <span>for the entire summer collection 2023</span>
      </h3>
      <div class="l-outlet__content">
        <div class="l-outlet__content-left">
          <div class="row">
            <div class="col-lg-6">
              <NuxtLink :to="localePath('/product-category/accessories/')" class="c-outlet">
                <img src="~/assets/img/bags1.jpg" alt="bags branded" width="400" height="400">
              </NuxtLink>
            </div>
            <div class="col-lg-6">
              <NuxtLink :to="localePath('/product-category/accessories/')" class="c-outlet">
                <img src="~/assets/img/bags2.jpg" alt="bags branded" width="400" height="400">
              </NuxtLink>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between is-title">
            <p class="u-text">VeroS bags and accessories</p>
            <NuxtLink :to="localePath('/product-category/accessories/')" class="u-btn is-black">The entire collection</NuxtLink>
          </div>
        </div>
        <div class="l-outlet__content-right js-slider-container">
          <div class="align-items-center justify-content-between d-none d-lg-flex is-title">
            <p class="u-text">VeroS brand sales</p>
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
                    <img :src="outlet.post_img_m" :alt="outlet.name" width="400" height="440">
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

const props = defineProps({
  data: { type: Array },
})

const localePath = useLocalePath()
const outletSlider = ref(null)
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
  }
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

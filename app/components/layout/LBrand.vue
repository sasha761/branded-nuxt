<template>
  <section class="l-brand">
    <div class="l-brand__img d-lg-block d-none" :style="{ 'background-image': `url(${brandBgImg})` }"></div>

    <div class="u-container">
      <div class="l-brand__content js-slider-container">
        <div class="l-brand__head">
          <div class="l-brand__title">
            <NuxtLink :to="localePath('/brand/wearme/')" class="u-btn is-black">The entire collection</NuxtLink>
            <h2 class="u-h2">Bodies and kits</h2>
            <p>Ukrainian Underwear Essentials est. MMXX</p>
          </div>
          <div class="l-brand__arrow">
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

        <div ref="productRowSlider" class="row swiper">
          <div class="swiper-wrapper">
            <div v-for="product in data" :key="product.ID" class="col-lg-4 col-md-4 col-sm-6 col-6 u-col swiper-slide">
              <UiCProduct :product="product" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Swiper from 'swiper/bundle'
import brandBgImg from '~/assets/img/sefsdf.jpg'

const props = defineProps({
  data: { type: Array },
})

const localePath = useLocalePath()
const productRowSlider = ref(null)
let swiperInstance = null

const currentSlideIndex = ref(1)
const allSlideIndex = ref(1)

onMounted(() => {
  if (productRowSlider.value) {
    swiperInstance = new Swiper(productRowSlider.value, {
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
@import "~/assets/scss/layout/brand.scss";
</style>
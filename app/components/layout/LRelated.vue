<template>
  <section class="l-related js-slider-container">
    <div class="u-container">
      <h2 class="u-h2">Похожие товары</h2>
      <div class="c-arrow is-big">
        <div @click="slidePrev" class="c-arrow__prev js-prev">
          <svg width="22px" height="13px" class="c-arrow__angle">
            <use xlink:href="#arrow"></use>
          </svg>
          <span class="c-arrow__line"></span>
        </div>
        <div class="c-arrow__count">
          <span class="swiper-pagination-current">{{ currentSlideIndex }}</span> /
          <span class="swiper-pagination-total">{{ allSlideIndex }}</span>
        </div>
        <div @click="slideNext" class="c-arrow__next js-next">
          <span class="c-arrow__line"></span>
          <svg width="22px" height="13px" class="c-arrow__angle">
            <use xlink:href="#arrow"></use>
          </svg>
        </div>
      </div>
      <UiCSpinner v-if="!products.length" />
      <div ref="relatedProductSlider" class="swiper">
        <div class="swiper-wrapper">
          <div
            v-for="product in products"
            :key="product.id"
            class="u-col swiper-slide"
          >
            <UiCProduct :product="product" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Swiper from 'swiper/bundle'

const props = defineProps({
  products: { type: Array, default: () => [] },
})

const relatedProductSlider = ref(null)
let swiperInstance = null

const currentSlideIndex = ref(1)
const allSlideIndex = ref(1)

// onMounted(() => {
//   if (relatedProductSlider.value) {
//     swiperInstance = new Swiper(relatedProductSlider.value, {
//       slidesPerView: 'auto',
//       watchOverflow: true,
//       autoplay: {
//         delay: 2500,
//         stopOnLastSlide: false,
//         disableOnInteraction: true,
//       },
//       on: {
//         slideChange(swiper) {
//           currentSlideIndex.value = swiper.activeIndex + 1
//         },
//         afterInit(swiper) {
//           console.log(swiper.snapGrid.length);
//           allSlideIndex.value = swiper.snapGrid.length
//         },
//       },
//     })
//   }
// })

function updateSlideCounters(swiper) {
  currentSlideIndex.value = (swiper.activeIndex || 0) + 1
  allSlideIndex.value = swiper.snapGrid.length || 1
}

async function initSwiper() {

  if (!relatedProductSlider.value) return;

  if (swiperInstance) {
    swiperInstance.update()
    updateSlideCounters(swiperInstance)
    return
  }

  swiperInstance = new Swiper(relatedProductSlider.value, {
    slidesPerView: 'auto',
    watchOverflow: true,
    autoplay: {
      delay: 2500,
      stopOnLastSlide: false,
      disableOnInteraction: true,
    },
    on: {
      init(swiper) {
        updateSlideCounters(swiper)
      },
      slideChange(swiper) {
        updateSlideCounters(swiper)
      },
    },
  })

  updateSlideCounters(swiperInstance)
}

onMounted(() => {
  if (props.products.length) {
    nextTick(() => initSwiper())
  }
})

onBeforeUnmount(() => {
  swiperInstance?.destroy(true, true)
  swiperInstance = null
})

// watch(
//   () => props.products,
//   (newProducts) => {
//     if (!newProducts.length) return
//     nextTick(() => initSwiper())
//   },
// )

function slideNext() {
  swiperInstance?.slideNext()
}

function slidePrev() {
  swiperInstance?.slidePrev()
}
</script>


<style>
@import "~/assets/scss/layout/related.scss";
</style>
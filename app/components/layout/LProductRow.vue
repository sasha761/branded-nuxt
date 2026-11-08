<template>
  <section class="l-products-row js-slider-container">
    <img
      class="is-img"
      :src="productRowBackground"
      alt="Branded background"
      width="1920"
      height="990"
      loading="eager"
      fetchpriority="high"
      decoding="async"
    >
    <div class="u-container">
      <h2 class="u-h2">{{ $t('home.best_offers') }}</h2>
      <div ref="productRow" class="row js-product-row swiper">
        <div class="swiper-wrapper">
          <div v-for="(product, index) in data" :key="product.id" class="col-lg-3 col-md-4 col-6 u-col swiper-slide">
            <UiCProduct :product="product" :isBrand="true" :load-image="loadedSlides.has(index)" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Swiper from 'swiper'
import { Autoplay } from 'swiper/modules'
import productRowBackground from '~/assets/img/product-row-bg.png'

const props = defineProps({
  data: { type: Array },
})

const productRow = ref(null)
const { loadedSlides, watchCarousel } = useVisibleCarousel()
let swiperInstance = null

// На мобильном этот фон попадает в первый экран и является LCP.
useHead({ link: [{ rel: 'preload', as: 'image', href: productRowBackground, media: '(max-width: 991px)', fetchpriority: 'high' }] })

onMounted(() => {
  if (productRow.value) {
    swiperInstance = new Swiper(productRow.value, {
      modules: [Autoplay],
      slidesPerView: 'auto',
      watchOverflow: true,
      autoplay: {
        enabled: false,
        delay: 2500,
        stopOnLastSlide: false,
        disableOnInteraction: true,
      },
    })
    watchCarousel(swiperInstance)
  }
})

onBeforeUnmount(() => {
  swiperInstance?.destroy(true, true)
  swiperInstance = null
})
</script>

<style lang="scss">
  @import "~/assets/scss/layout/product-row.scss";
</style>

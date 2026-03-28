<template>
  <section class="l-products-row js-slider-container">
    <img
      class="is-img"
      src="~/assets/img/product-row-bg.png"
      alt="Branded background"
      width="1920"
      height="990"
    >
    <div class="u-container">
      <h2 class="u-h2">Best offers</h2>
      <div ref="productRow" class="row js-product-row swiper">
        <div class="swiper-wrapper">
          <div v-for="product in data" :key="product.id" class="col-lg-3 col-md-4 col-6 u-col swiper-slide">
            <UiCProduct :product="product" :isBrand="true" />
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

const productRow = ref(null)

onMounted(() => {
  if (productRow.value) {
    new Swiper(productRow.value, {
      modules: [Autoplay],
      slidesPerView: 'auto',
      watchOverflow: true,
      autoplay: {
        delay: 2500,
        stopOnLastSlide: false,
        disableOnInteraction: true,
      },
    })
  }
})
</script>

<style lang="scss">
  @import "~/assets/scss/layout/product-row.scss";
</style>

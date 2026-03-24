<template>
  <section class="l-products-row js-slider-container">
    <img 
      class="is-img"
      src="@/assets/img/product-row-bg.png" 
      alt="Branded background" 
      width="1920" 
      height="990"
    >
    <div class="u-container">
      <h2 class="u-h2">Best offers</h2>
      <div ref="productRow" class="row js-product-row swiper">
        <div class="swiper-wrapper">
          <div v-for="product in data" :key="product.id" class="col-lg-3 col-md-4 col-6 u-col swiper-slide">
            <C-Product :product="product" :isBrand="true" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>

import CProduct from '@/templates/components/C-Product.vue'
import Swiper from 'swiper/bundle';


export default {
  components: {
    CProduct,
  },

  data() {
    return {
      swiperInstance: null,
    }
  },

  props: {
    data: {
      type: Array
    }
  },

  mounted() {
    this.swiperFn();
  },

  methods: {
    swiperFn() {
      this.swiperInstance = new Swiper(this.$refs.productRow, {
        slidesPerView: 'auto',
        watchOverflow: true,
        autoplay: {
          delay: 2500,
          stopOnLastSlide: false,
          disableOnInteraction: true,
        },
      })
    },
  }
}
</script>
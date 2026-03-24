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
            <span class="swiper-pagination-current">{{currentSlideIndex}}</span> /
            <span class="swiper-pagination-total">{{allSlideIndex}}</span>
          </div>

          <div @click="slideNext" class="c-arrow__next js-next swiper-button-disabled">
            <span class="c-arrow__line"></span>
            <svg width="22px" height="13px" class="c-arrow__angle">
              <use xlink:href="#arrow"></use>
            </svg>
          </div>
        </div>
        <C-Spinner v-if="productsLength"/>
        <div ref="relatedProductSlider" class="swiper">
          <div class="swiper-wrapper">
            <div 
              v-for="product in products"
              :key="product.id" 
              class="u-col swiper-slide"
            >
              <C-Product :product="product" />
            </div>
          </div>
        </div>
      <!-- </div> -->
    </div>
  </section>
</template>

<script>
import Swiper from 'swiper/bundle';
import CSpinner from '@/templates/components/C-Spinner.vue'

import CProduct from '@/templates/components/C-Product.vue'

export default {
  components: {
    CProduct,
    CSpinner
  },

  data() {
    return {
      swiperInstance: null,
    }
  },

  props: {
    products: {
      type: Array,
    }
  },

  computed: {
    currentSlideIndex() {
      return this.swiperInstance?.activeIndex + 1 || 1;
    },
    allSlideIndex() {
      return this.swiperInstance?.snapGrid.length || 1;
    },
    productsLength() {
      return this.products.length == 0;
    }
  },

  mounted() {
    this.swiperFn();
  },

  methods: {
    swiperFn() {
      this.swiperInstance = new Swiper(this.$refs.relatedProductSlider, {
        slidesPerView: 'auto',
        watchOverflow: true,
        autoplay: {
          delay: 2500,
          stopOnLastSlide: false,
          disableOnInteraction: true,
        },
      })
    },

    slideNext() {
      this.swiperInstance.slideNext();
    },

    slidePrev() {
      this.swiperInstance.slidePrev();
    },
  }
}
</script>
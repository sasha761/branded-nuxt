<template>
  <section class="l-brand">
    <div 
      class="l-brand__img d-lg-block d-none"
      :style="{ 'background-image': `url(${require('@/assets/img/sefsdf.jpg')})` }"
    ></div>
    
    <div class="u-container">
      <div class="l-brand__content js-slider-container">
        <div class="l-brand__head">
          <div class="l-brand__title">
            <router-link to="/brand/wearme/" class="u-btn is-black">The entire collection</router-link>
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
                <span class="swiper-pagination-current">{{currentSlideIndex}}</span> /
                <span class="swiper-pagination-total">{{allSlideIndex}}</span>
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
              <C-Product :product="product" />
            </div>
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

   computed: {
    currentSlideIndex() {
      return this.swiperInstance?.activeIndex + 1 || 1;
    },
    allSlideIndex() {
      return this.swiperInstance?.snapGrid.length || 1;
    }
  },

  mounted() {
    this.swiperFn();
  },

  methods: {
    swiperFn() {
      this.swiperInstance = new Swiper(this.$refs.productRowSlider, {
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
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
              <router-link to="/product-category/accessories/" class="c-outlet">
                <img 
                  src="@/assets/img/bags1.jpg"
                  alt="bags branded" 
                  width="400" 
                  height="400"
                >
              </router-link>
            </div>
            <div class="col-lg-6">
              <router-link to="/product-category/accessories/" class="c-outlet">
                <img 
                  src="@/assets/img/bags2.jpg"
                  alt="bags branded" 
                  width="400" 
                  height="400"
                >
              </router-link>
            </div>
          </div>
          <div class="d-flex align-items-center justify-content-between is-title">
            <p class="u-text">VeroS bags and accessories</p>
            <router-link to="/product-category/accessories/" class="u-btn is-black">The entire collection</router-link>
          </div>
        </div>
        <div class="l-outlet__content-right js-slider-container">
          <div class="align-items-center justify-content-between d-none d-lg-flex is-title">
            <p class="u-text">VeroS brand sales</p>
            <div class="l-outlet__arrow">
              <!-- {% include 'templates/partial/arrow.twig' with {'small': true, 'length': 4} %} -->
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
          <div ref="ProductRowSlider" class="js-product-row swiper">
            <div class="swiper-wrapper">
              <div v-for="(outlet, index) in data" :key="index" class="col-6 u-col swiper-slide">
                <router-link 
                  :to="{
                    name: 'product',
                    params: {
                      lang: stripLang(outlet.permalink) || null,
                      productName: stripSlug(outlet.permalink),
                      productData: outlet 
                    }
                  }"
                  class="c-outlet"
                >
                  <picture>
                    <img 
                      :src="outlet.post_img_m" 
                      :alt="outlet.name" 
                      width="400" 
                      height="440"
                    >
                  </picture>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import Swiper from 'swiper/bundle';
import { stripSlug, stripLang } from '@/assets/js/utils.js';

export default {
  props: {
    data: {
      type: Array
    }
  },

  data() {
    return {
      swiperInstance: null,
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
      this.swiperInstance = new Swiper(this.$refs.ProductRowSlider, {
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

    stripSlug, 
    stripLang
  }
}
</script>
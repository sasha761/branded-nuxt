<template>
  <section class="l-hero">
    <div class="u-container">				
      <div class="row align-items-stretch">									
        <div class="col-lg-9 col-md-12 u-col">
          <div ref="bannerSlider" class="swiper">
            <div class="swiper-wrapper">
              <router-link 
                v-for="(item, index) in data.banners" 
                :key="index" 
                :to="item.link"
                class="c-banner swiper-slide"
              >
                <picture>
                  <!-- <source data-srcset="{{item.img|towebp}}" type="image/webp"> -->
                  <!-- <source data-srcset="{{item.img|tojpg}}" type="image/jpeg">  -->
                  <img 
                    
                    :src="item.img" 
                    width="1400" 
                    height="616" 
                    :alt="'Branded баннер' + index"
                  >
                </picture>
                <h1 v-if="index == data.banners.length - 1" class="c-banner__title">Online store brand clothing for men and women</h1>
              </router-link>
            </div>
          </div>
        </div>
          
        <div class="col-lg-3 col-md-12 u-col">	
          <div class="l-hero__row-banners">	
            <router-link to="/product/steganaya-kurtka-zhenskaya-sinyaya-ot-beom/" class="c-banner">
              <picture>
                <!-- <source data-srcset="{{data.small_banner_1|resize(360, 234, 'center')|towebp}}" type="image/webp"> -->
                <!-- <source data-srcset="{{data.small_banner_1|resize(360, 234, 'center')|tojpg}}" type="image/jpeg">  -->
                <img 
                  
                  :src="data.small_banner_1" 
                  width="360" 
                  height="234" 
                  alt="Куртка женская синяя от BeOm"
                >
              </picture>
            </router-link>
            <router-link to="/product/svitshot-zhenskij-s-printami-gorodov-ukrainy-bezhevyj-ot-beom/" class="c-banner">
              <picture>
                <!-- <source data-srcset="{{data.small_banner_2|resize(360, 234, 'bottom')|towebp}}" type="image/webp">
                <source data-srcset="{{data.small_banner_2|resize(360, 234, 'bottom')|tojpg}}" type="image/jpeg">  -->
                <img 
                  
                  :src="data.small_banner_2" 
                  width="360" 
                  height="234" 
                  alt="Свитшот женский с принтами городов Украины"
                >
              </picture>
            </router-link>
          </div>
        </div>
      </div>
    </div>							
  </section>
</template>

<script>
import Swiper from 'swiper/bundle';

export default {
  data() {
    return {
      swiperInstance: null,
      imgPlaceholder: 'data:image/gif;base64,R0lGODlhGQALAIAAAP///wAAACH5BAEAAAEALAAAAAAZAAsAAAIOjI+py+0Po5y02ouz1gUAOw==',
      imgSmallPlaceholder: 'data:image/gif;base64,R0lGODlhFAANAIAAAP///wAAACH5BAEAAAEALAAAAAAUAA0AAAIOjI+py+0Po5y02ouzXgUAOw=='
    }
  },

  props: {
    data: {
      type: Object
    }
  },

  mounted() {
    this.swiperFn();
  },

  methods: {
    swiperFn() {
      this.swiperInstance = new Swiper(this.$refs.bannerSlider)
    },
  }
}
</script>
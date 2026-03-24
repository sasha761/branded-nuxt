<template>
  <div class="c-modal is-quick-buy" id="quick-buy">
    <svg @click="handleCloseClick" width="20px" height="20px" data-modal="close" class="c-modal__close">
      <use xlink:href="#icon-close"></use>
    </svg>

    <div ref="lightboxSlider" class="swiper js-lightbox-image">
      <div class="swiper-wrapper">
        <div v-for="(item, index) in generateTemplateFromFilesArray(data.images)" :key="index" :data-key="index" class="swiper-slide">
          <div class="swiper-zoom-container" v-html="item">
            
          </div>
        </div>
      </div>
      <div @click="slideNext" class="d-none d-sm-block swiper-button-next"></div>
      <div @click="slidePrev" class="d-none d-sm-block swiper-button-prev"></div>
      <div class="swiper-pagination"></div>
    </div>
  </div>
</template>

<script>
import Swiper from 'swiper/bundle';

export default {
  data() {
    return {
      swiperInstance: null,
    }
  },

  props: {
    data: {
      type: Object,
    }
  },

  mounted() {
    this.swiperFn();
  },

  methods: {
    handleCloseClick() {
      this.$popup.close(1, () => {})
    },

    generateTemplateFromFilesArray(array) {
      return array.filter((currentValue) => currentValue).map((src) => {
        return this.checkFile(src)
      });
    },

    checkFile(fileSrc) {
      if (!fileSrc) return;
      const fileFormat = fileSrc.split('.').pop();
      if (fileFormat === 'mp4' || fileFormat === 'mov') {
        return `<video src="${fileSrc}" muted playsinline autoplay loop></video>`;
      } else {
        return `<img src="${fileSrc}">`;
      }
    },

    swiperFn() {
      const self = this;

      this.swiperInstance = new Swiper(this.$refs.lightboxSlider, {
        slidesPerView: 'auto',
        watchOverflow: true,
        autoplay: {
          delay: 2500,
          stopOnLastSlide: false,
          disableOnInteraction: true,
        },
        initialSlide: self.data.slideKey,
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

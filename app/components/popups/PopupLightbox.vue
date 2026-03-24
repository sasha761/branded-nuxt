<template>
  <div class="c-modal is-quick-buy" id="quick-buy">
    <svg @click="handleCloseClick" width="20px" height="20px" data-modal="close" class="c-modal__close">
      <use xlink:href="#icon-close"></use>
    </svg>

    <div ref="lightboxSlider" class="swiper js-lightbox-image">
      <div class="swiper-wrapper">
        <div v-for="item in mediaItems" :key="item.id" class="swiper-slide">
          <div class="swiper-zoom-container" v-html="item.html"></div>
        </div>
      </div>
      <div @click="slideNext" class="d-none d-sm-block swiper-button-next"></div>
      <div @click="slidePrev" class="d-none d-sm-block swiper-button-prev"></div>
      <div class="swiper-pagination"></div>
    </div>
  </div>
</template>

<script setup>
import Swiper from 'swiper/bundle'
import 'swiper/css/bundle'

const props = defineProps({
  data: { type: Object },
})

const { close } = usePopup()
const lightboxSlider = ref(null)
let swiperInstance = null

const mediaItems = (props.data?.images || []).filter(Boolean).map((src) => {
  const ext = src.split('.').pop()
  const html = (ext === 'mp4' || ext === 'mov')
    ? `<video src="${src}" muted playsinline autoplay loop></video>`
    : `<img src="${src}">`
  return { id: crypto.randomUUID(), html }
})

onMounted(() => {
  swiperInstance = new Swiper(lightboxSlider.value, {
    slidesPerView: 'auto',
    watchOverflow: true,
    autoplay: {
      delay: 2500,
      stopOnLastSlide: false,
      disableOnInteraction: true,
    },
    initialSlide: props.data?.slideKey || 0,
  })
})

onBeforeUnmount(() => {
  swiperInstance?.destroy(true, true)
  swiperInstance = null
})

function handleCloseClick() {
  close()
}

function slideNext() {
  swiperInstance?.slideNext()
}

function slidePrev() {
  swiperInstance?.slidePrev()
}
</script>

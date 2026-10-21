<template>
  <!-- Как #lightbox в теме WP (templates/partial/modals.twig + src/js/modules/lightbox.js) -->
  <div class="c-modal is-lightbox js-lightbox-modal" id="lightbox">
    <div ref="sliderEl" class="swiper js-lightbox-image">
      <div class="swiper-wrapper">
        <div v-for="(item, index) in mediaItems" :key="index" class="swiper-slide">
          <!-- Масштаб жестом и двойным тапом (Swiper Zoom) -->
          <div class="swiper-zoom-container">
            <video
              v-if="item.video"
              :src="item.src"
              :poster="poster"
              muted
              playsinline
              autoplay
              loop
            ></video>
            <img v-else :src="item.src" :alt="alt">
          </div>
        </div>
      </div>
      <div ref="nextEl" class="d-none d-sm-block swiper-button-next"></div>
      <div ref="prevEl" class="d-none d-sm-block swiper-button-prev"></div>
      <div ref="paginationEl" class="swiper-pagination"></div>
    </div>

    <p class="d-block d-sm-none is-lightbox-notification">{{ t('lightbox.zoom_hint') }}</p>

    <div data-modal="close" class="c-modal__close" @click="close">
      <svg width="20px" height="20px">
        <use xlink:href="#icon-close"></use>
      </svg>
    </div>
  </div>
</template>

<script setup>
import Swiper from 'swiper'
import { Navigation, Pagination, Zoom } from 'swiper/modules'

const props = defineProps({
  // { images: string[] — оригиналы фото и видео, slideKey — с какого открыть, alt }
  data: { type: Object },
})

const { t } = useI18n()
const { close } = usePopup()

const sliderEl = ref(null)
const nextEl = ref(null)
const prevEl = ref(null)
const paginationEl = ref(null)
let swiperInstance = null

const mediaItems = (props.data?.images || [])
  .filter(src => typeof src === 'string' && src)
  .map(src => ({ src, video: /\.(mp4|mov)$/i.test(src) }))

// Как в теме: обложка видео — фото товара
const poster = mediaItems.find(item => !item.video)?.src
const alt = props.data?.alt || ''

onMounted(() => {
  swiperInstance = new Swiper(sliderEl.value, {
    modules: [Navigation, Pagination, Zoom],
    watchOverflow: true,
    zoom: true,
    initialSlide: props.data?.slideKey || 0,
    // Стрелки видны с 576px (d-sm-block), на телефоне — свайп и точки
    navigation: {
      nextEl: nextEl.value,
      prevEl: prevEl.value,
    },
    pagination: {
      el: paginationEl.value,
      clickable: true,
    },
  })
})

onBeforeUnmount(() => {
  swiperInstance?.destroy(true, true)
  swiperInstance = null
})
</script>

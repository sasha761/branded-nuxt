import type Swiper from 'swiper'
import { useIntersectionObserver } from '@vueuse/core'

/** URL карточек подключаются только при приближении карусели к viewport. */
export function useVisibleCarousel() {
  const loadedSlides = ref(new Set<number>())
  const config = useAppConfig()
  let swiper: Swiper | undefined
  const target = shallowRef<HTMLElement | null>(null)
  let visible = false
  let near = false
  let userStopped = false
  let managingStop = false

  useIntersectionObserver(target, ([entry]) => {
    visible = Boolean(entry?.isIntersecting)
    if (visible) near = true
    loadNearby()
    syncAutoplay()
  })
  useIntersectionObserver(target, ([entry]) => {
    near = Boolean(entry?.isIntersecting)
    loadNearby()
  }, { rootMargin: () => imageViewportMargin(config.imageLoading.viewportOffset) })

  function loadNearby() {
    if (!near || !swiper || swiper.destroyed || !swiper.slides.length) return
    const count = Math.max(1, swiper.slidesPerViewDynamic())
    const neighbors = Math.max(0, Math.floor(config.imageLoading.carouselNeighbors))
    for (let index = Math.max(0, swiper.activeIndex - neighbors); index < Math.min(swiper.slides.length, swiper.activeIndex + count + neighbors); index++) {
      loadedSlides.value.add(index)
    }
  }

  function syncAutoplay() {
    if (!swiper || swiper.destroyed) return
    if (visible && !document.hidden && !userStopped) {
      if (!swiper.autoplay.running) swiper.autoplay.start()
    } else if (swiper.autoplay.running) {
      managingStop = true
      swiper.autoplay.stop()
      managingStop = false
    }
  }

  function onAutoplayStop() {
    // disableOnInteraction сохраняет остановку после свайпа или нажатия стрелки.
    if (!managingStop && visible) userStopped = true
  }

  function watchCarousel(instance: Swiper) {
    swiper = instance
    swiper.on('slideChange', loadNearby)
    swiper.on('resize', loadNearby)
    swiper.on('slidesUpdated', loadNearby)
    swiper.on('autoplayStop', onAutoplayStop)
    document.addEventListener('visibilitychange', syncAutoplay)
    target.value = swiper.el
    if (typeof IntersectionObserver === 'undefined') {
      visible = true
      near = true
      loadNearby()
      syncAutoplay()
      return
    }
  }

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', syncAutoplay)
    if (swiper && !swiper.destroyed) {
      managingStop = true
      swiper.autoplay.stop()
      swiper.off('slideChange', loadNearby)
      swiper.off('resize', loadNearby)
      swiper.off('slidesUpdated', loadNearby)
      swiper.off('autoplayStop', onAutoplayStop)
    }
  })

  return { loadedSlides, watchCarousel }
}

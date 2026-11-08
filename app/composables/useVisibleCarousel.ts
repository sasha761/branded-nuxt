import type Swiper from 'swiper'

/** Первые карточки остаются в SSR, дальние подключаются по мере просмотра карусели. */
export function useVisibleCarousel() {
  const loadedSlides = ref(new Set([0, 1, 2, 3]))
  let swiper: Swiper | undefined
  let observer: IntersectionObserver | undefined
  let visible = false
  let userStopped = false
  let managingStop = false

  function loadNearby() {
    if (!visible || !swiper || swiper.destroyed || !swiper.slides.length) return
    const count = Math.max(1, swiper.slidesPerViewDynamic())
    for (let index = Math.max(0, swiper.activeIndex - 1); index <= Math.min(swiper.slides.length - 1, swiper.activeIndex + count); index++) {
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
    if (typeof IntersectionObserver === 'undefined') {
      visible = true
      loadNearby()
      syncAutoplay()
      return
    }
    observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting)
      loadNearby()
      syncAutoplay()
    })
    observer.observe(swiper.el)
  }

  onBeforeUnmount(() => {
    observer?.disconnect()
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

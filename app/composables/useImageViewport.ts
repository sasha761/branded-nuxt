import type { MaybeRefOrGetter, Ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

export function useImageViewport(element: Ref<HTMLElement | null>, immediate: MaybeRefOrGetter<boolean> = false) {
  const ready = ref(toValue(immediate))
  const config = useAppConfig()
  useIntersectionObserver(
    () => ready.value || toValue(immediate) ? null : element.value,
    ([entry]) => { if (entry?.isIntersecting) ready.value = true },
    { rootMargin: () => imageViewportMargin(config.imageLoading.viewportOffset) },
  )
  watchEffect(() => { if (toValue(immediate)) ready.value = true })
  onMounted(() => { if (typeof IntersectionObserver === 'undefined') ready.value = true })
  return ready
}

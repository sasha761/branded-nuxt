import type { NuxtApp } from '#app'
import type { Menus } from '~/types/wp-api'

// Один обработчик на модуль: шапка и подвал делят запрос по общему ключу.
function fetchMenus(nuxtApp: NuxtApp, { signal }: { signal: AbortSignal }) {
  const lang = (nuxtApp.$i18n as any).locale.value
  return $fetch<Menus>('/api/menus', { params: { lang }, signal })
}

function emptyMenus(): Menus {
  return { header: [], footer: [], mobile: { man: [], woman: [] } }
}

/** Шапка, подвал и мобильное меню одним запросом GET /api/menus. */
export function useMenus() {
  const { locale } = useI18n()
  return useAsyncData(() => `menus:${locale.value}`, fetchMenus, { default: emptyMenus })
}

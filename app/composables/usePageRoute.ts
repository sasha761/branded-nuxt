import { getQuery as getUrlQuery, withQuery } from 'ufo'
import type { Alternate, PageRoute } from '~/types/wp-api'

/** Путь текущей страницы без кодирования и со слешем в конце — в таком виде его ждёт WP. */
export function useCurrentPath() {
  const route = useRoute()
  return computed(() => normalizePath(route.path))
}

export function normalizePath(path: string) {
  let decoded = path

  try {
    decoded = decodeURI(path)
  } catch {
    // оставляем как есть
  }

  return decoded.endsWith('/') ? decoded : `${decoded}/`
}

/** Номер страницы из ?page=N. */
export function useCurrentPage() {
  const route = useRoute()

  return computed(() => {
    const raw = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
    const page = Number(raw)
    return Number.isInteger(page) && page > 0 ? page : 1
  })
}

export function fetchPageRoute(path: string, signal?: AbortSignal) {
  return $fetch<PageRoute>('/api/route', { params: { path }, signal })
}

/** api/route для пути; ключ общий, поэтому повторный вызов для того же пути не делает запрос. */
export function useRouteData(path: string) {
  return useAsyncData(`route:${path}`, (_nuxtApp, { signal }) => fetchPageRoute(path, signal))
}

/** 404 только когда WP ответил 404; любая другая ошибка — 503, чтобы сбой WP не выкидывал страницы из индекса. */
export function pageErrorStatus(error: unknown): 404 | 503 {
  const status = Number((error as any)?.statusCode ?? (error as any)?.status)
  return status === 404 ? 404 : 503
}

export function throwPageError(error: unknown): never {
  const statusCode = pageErrorStatus(error)

  throw createError({
    statusCode,
    statusMessage: statusCode === 404 ? 'Page not found' : 'Service unavailable',
    fatal: true,
  })
}

/**
 * Ошибка → 404/503, `redirect` из api/route → 301 (query сохраняется).
 * Вызывать на верхнем уровне setup: `await guardPageRoute(...)`.
 * `dataError` — ошибка данных страницы; проверяется после редиректа,
 * потому что по старому пути (слаг другого языка) данные могут не найтись.
 */
export function guardPageRoute(pageRoute: PageRoute | null | undefined, routeError: unknown, dataError?: unknown) {
  if (routeError) {
    throwPageError(routeError)
  }

  if (!pageRoute) {
    throwPageError({ statusCode: 404 })
  }

  if (pageRoute.redirect) {
    const route = useRoute()
    const target = withQuery(pageRoute.redirect, { ...route.query, ...getUrlQuery(pageRoute.redirect) })
    return navigateTo(target, { redirectCode: 301, replace: true })
  }

  if (dataError) {
    throwPageError(dataError)
  }
}

/**
 * Переводы страниц для переключателя языка: путь страницы (как в normalizePath) → alternates.
 * Словарь, а не одно значение: при клиентском переходе старая страница не перетирает данные новой.
 */
export function usePageAlternates() {
  return useState<Record<string, Alternate[]>>('page-alternates', () => ({}))
}

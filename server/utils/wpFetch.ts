import type { H3Event } from 'h3'

type WpFetchOptions = NonNullable<Parameters<typeof $fetch>[1]>

/**
 * Запрос к кастомному API WordPress (/wp-json/api/*).
 *
 * Ошибки WP превращаются в ошибки h3 с тем же статусом: 404 остаётся 404,
 * 4xx уходят клиенту вместе с `data` (например, ошибки полей заказа 422).
 * Сбой сети, таймаут и 5xx — 503: страница не должна отдавать 404, если WP просто недоступен.
 */
export async function wpFetch<T = any>(path: string, options: WpFetchOptions = {}): Promise<T> {
  const config = useRuntimeConfig()

  try {
    return await $fetch<T>(`${config.wpSiteUrl}/wp-json/api/${path}`, {
      timeout: Number(config.wpTimeout) || 8000,
      ...options,
    })
  } catch (error: any) {
    const status = Number(error?.response?.status) || 0

    if (status >= 400 && status < 500) {
      const body = error.data || {}

      throw createError({
        statusCode: status,
        statusMessage: typeof body.code === 'string' ? body.code : 'wp_error',
        message: typeof body.message === 'string' ? body.message : undefined,
        data: {
          code: body.code ?? null,
          errors: body.data?.errors ?? null,
        },
      })
    }

    console.error(`[wpFetch] ${path}: ${status || error?.message || 'unknown error'}`)

    throw createError({
      statusCode: 503,
      statusMessage: 'wp_unavailable',
    })
  }
}

/** Язык из запроса: только известные значения, чтобы не плодить записи кеша. */
export function wpLang(value: unknown): 'ru' | 'uk' {
  return value === 'uk' ? 'uk' : 'ru'
}

/** Целое число в диапазоне или undefined (тогда WP подставит своё значение по умолчанию). */
export function wpInt(value: unknown, min = 1, max = 1000): number | undefined {
  const number = Number(Array.isArray(value) ? value[0] : value)

  if (!Number.isInteger(number)) {
    return undefined
  }

  return Math.min(max, Math.max(min, number))
}

export function wpString(value: unknown, maxLength = 500): string {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw.slice(0, maxLength) : ''
}

/**
 * Заголовки, по которым WP узнаёт IP покупателя (rate limit заказов).
 * Без секрета WP заголовку не верит и считает IP сервера Nuxt.
 * На VPS nginx должен передавать `X-Forwarded-For $remote_addr`, иначе адрес подделывается.
 */
export function wpClientHeaders(event: H3Event): Record<string, string> {
  const { bffSecret } = useRuntimeConfig()
  const ip = getRequestIP(event, { xForwardedFor: true })

  if (!bffSecret || !ip) {
    return {}
  }

  return {
    'X-Branded-Client-IP': ip,
    'X-Branded-Secret': String(bffSecret),
  }
}

/**
 * Форма «Будь в теме». Логика подписки остаётся в теме WP (legacy AJAX `subscribe`:
 * пользователь-подписчик и письмо с купоном, Classes/NotificationSystem.class.php).
 * Здесь — проверка email, ловушка для ботов и лимит, чтобы форму не использовали для рассылки писем.
 */
const WINDOW_MS = 60 * 60 * 1000
const LIMIT = 5
const attempts = new Map<string, { count: number; reset: number }>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)

  if (!entry || entry.reset < now) {
    attempts.set(ip, { count: 1, reset: now + WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > LIMIT
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = wpString(body?.email, 200).trim()

  // Бот заполнил скрытое поле: отвечаем как обычно, но ничего не отправляем
  if (wpString(body?.website)) {
    return { ok: true }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 422, statusMessage: 'invalid_email' })
  }

  if (isRateLimited(getRequestIP(event, { xForwardedFor: true }) || 'unknown')) {
    throw createError({ statusCode: 429, statusMessage: 'rate_limited' })
  }

  const gender = (Array.isArray(body?.gender) ? body.gender : [])
    .filter((value: unknown) => value === 'man' || value === 'wooman')
    .join(',')

  const { wpSiteUrl, wpTimeout } = useRuntimeConfig()

  try {
    await $fetch(`${wpSiteUrl}/wp-admin/admin-ajax.php`, {
      method: 'POST',
      body: new URLSearchParams({ action: 'subscribe', email, gender }),
      timeout: Number(wpTimeout) || 8000,
      responseType: 'text',
    })
  } catch (error: any) {
    console.error(`[subscribe] ${error?.response?.status || error?.message}`)
    throw createError({ statusCode: 503, statusMessage: 'wp_unavailable' })
  }

  // Уже подписан или новый — ответ одинаковый, чтобы не раскрывать, есть ли email в базе
  return { ok: true }
})

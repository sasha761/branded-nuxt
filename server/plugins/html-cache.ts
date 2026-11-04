import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { gunzip, gzip } from 'node:zlib'
import type { H3Event } from 'h3'

/**
 * Кеш HTML страниц (P-c): главная, каталог, товары, страницы WP. Хранилище то же, что у кеша API
 * (server/plugins/cache-storage.ts: Redis или LRU), сброс — тот же вебхук WP (server/api/_revalidate.post.ts).
 *
 * Свой, а не правила cache/swr в routeRules:
 * - ключ без меток рекламы. У каждого клика свой gclid/fbclid, и с ним в ключе реклама почти всегда
 *   шла бы мимо кеша. В ключ и в адрес рендера попадают только путь и параметры каталога (splitPageUrl),
 *   поэтому HTML один для всех и в нём нет меток первого посетителя. Метки остаются в адресе браузера
 *   (app/plugins/html-cache.server.ts) и в Location редиректов (хук beforeResponse ниже);
 * - исключения проверяются по пути запроса. Правило '/**' в routeRules при слиянии добавило бы swr
 *   кешу API, а '/cart/**': { cache: false } не срабатывает на сам '/cart/'.
 *
 * Как работает:
 * - запись свежая MAX_AGE_MS; потом её ещё отдают, а новую версию рендерят фоном (stale-while-revalidate).
 *   Хранится до TTL хранилища (2 суток в Redis) или до вытеснения из LRU;
 * - кешируются 200 и 301/308. Ошибки, 404 и 503 — нет: если WP недоступен, отдаётся последняя удачная версия;
 * - в ключе buildId: после деплоя страницы рендерятся заново, со ссылками на новые чанки;
 * - тело хранится в gzip: категория весит ~230 КБ (данные страницы внутри HTML), в Redis — ~80 КБ;
 * - хранилище недоступно (упал Redis) — страницы рендерятся без кеша, ошибка в логе раз в минуту;
 * - заголовок X-Html-Cache: HIT, STALE (отдана устаревшая, идёт обновление) или MISS.
 *
 * Только production-сборка: в dev правки в админке должны быть видны сразу.
 */
const MAX_AGE_MS = 10 * 60 * 1000
const EXCLUDED_PATH = /^\/(?:uk\/)?(?:cart|checkout|order-received|search)(?:[/?]|$)/i
const CACHED_STATUSES = new Set([200, 301, 308])
const REFRESH_HEADER = 'x-html-cache-refresh'
// Фоновое обновление — внутренний запрос с этим токеном: снаружи кеш так не обойти.
const refreshToken = crypto.randomUUID()

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

declare module 'h3' {
  interface H3EventContext {
    /** Страница кешируется: ключ, адрес без меток (как в запросе и декодированный, как event.path) и отброшенные параметры. */
    htmlCache?: { key: string, url: string, path: string, dropped: string, hit?: boolean }
  }
}

interface Entry {
  statusCode: number
  headers: Record<string, string>
  /** gzip, base64 */
  body: string
  mtime: number
}

function cacheablePage(event: H3Event) {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    return null
  }

  // /_… — служебное Nuxt (/__nuxt_error, острова)
  const path = event.path
  if (path.startsWith('/api/') || path.startsWith('/_') || EXCLUDED_PATH.test(path)) {
    return null
  }

  const raw = splitPageUrl(event.node.req.originalUrl || path)
  const { buildId } = useRuntimeConfig().app
  const hash = createHash('sha1').update(`${buildId}\n${raw.url}`).digest('hex')

  return {
    // Имя записи — hex: _revalidate отличает HTML от ответов API по префиксу «api»
    key: `nitro:pages:${hash}`,
    url: raw.url,
    path: splitPageUrl(path).url,
    dropped: raw.dropped,
  }
}

export default defineNitroPlugin((nitroApp) => {
  if (import.meta.dev) {
    return
  }

  const storage = useStorage('cache')
  const refreshing = new Set<string>()

  // Без Redis ошибка была бы на каждой странице; о падении и восстановлении Redis пишет cache-storage.ts
  let lastErrorAt = 0
  function logError(message: string, error: unknown) {
    if (Date.now() - lastErrorAt > 60_000) {
      lastErrorAt = Date.now()
      console.error(`[html-cache] ${message}:`, error instanceof Error ? error.message : error)
    }
  }

  async function refresh(url: string) {
    try {
      const response = await nitroApp.localFetch(url, { headers: { [REFRESH_HEADER]: refreshToken } })
      await response.text()
    } catch (error) {
      logError(`не удалось обновить ${url}`, error)
    }
  }

  nitroApp.hooks.hook('render:before', async (ctx) => {
    const { event } = ctx
    const page = cacheablePage(event)
    if (!page) {
      return
    }

    event.context.htmlCache = page
    // Рендер по адресу без меток
    event._path = page.path

    if (getRequestHeader(event, REFRESH_HEADER) === refreshToken) {
      return
    }

    const entry = await storage.getItem<Entry>(page.key).catch(() => null)
    if (!entry?.body) {
      setResponseHeader(event, 'x-html-cache', 'MISS')
      return
    }

    const stale = Date.now() - entry.mtime > MAX_AGE_MS
    page.hit = true
    setResponseHeader(event, 'x-html-cache', stale ? 'STALE' : 'HIT')
    ctx.response = {
      statusCode: entry.statusCode,
      headers: entry.headers,
      body: (await gunzipAsync(Buffer.from(entry.body, 'base64'))).toString('utf8'),
    }

    if (stale && !refreshing.has(page.key)) {
      refreshing.add(page.key)
      event.waitUntil(refresh(page.url).finally(() => refreshing.delete(page.key)))
    }
  })

  nitroApp.hooks.hook('render:response', (response, { event }) => {
    const page = event.context.htmlCache
    const statusCode = response.statusCode ?? 200

    if (!page || page.hit || !CACHED_STATUSES.has(statusCode) || typeof response.body !== 'string') {
      return
    }

    const headers: Record<string, string> = {}
    for (const [name, value] of Object.entries(response.headers ?? {})) {
      if (value !== undefined && name !== 'set-cookie' && name !== 'x-html-cache') {
        headers[name] = String(value)
      }
    }
    headers['last-modified'] = new Date().toUTCString()

    const body = response.body
    event.waitUntil(gzipAsync(body)
      .then(compressed => storage.setItem<Entry>(page.key, {
        statusCode,
        headers,
        body: compressed.toString('base64'),
        mtime: Date.now(),
      }))
      .catch(error => logError('не удалось сохранить страницу', error)))
  })

  // Редирект страницы (301 на canonical_path из api/route) отрисован без меток: дописываем метки
  // текущего посетителя, иначе gclid и utm_* терялись бы на старых адресах из рекламы.
  nitroApp.hooks.hook('beforeResponse', (event) => {
    const dropped = event.context.htmlCache?.dropped
    const status = event.node.res.statusCode

    if (!dropped || status < 300 || status >= 400) {
      return
    }

    const location = event.node.res.getHeader('location')
    if (typeof location === 'string' && location) {
      event.node.res.setHeader('location', `${location}${location.includes('?') ? '&' : '?'}${dropped}`)
    }
  })
})

import { timingSafeEqual } from 'node:crypto'

/**
 * Вебхук WP (rest_api_send_revalidate): `POST {scopes: ['catalog'|'seo'|'menu'|'home']}`
 * с заголовком X-Branded-Secret. Чистит кеш Nitro из routeRules.
 *
 * Ключ записи кеша: `…:<путь без спецсимволов, 16 знаков>.<hash>.json`,
 * например `apiarchiveget_pr.Xyz.json` для /api/archive/get_products.
 */
const SCOPE_PREFIXES: Record<string, string[]> = {
  catalog: ['apiarchive', 'apiproduct', 'apihome', 'apisearch', 'apireviews', 'apiroute'],
  seo: ['apiroute', 'apipage'],
  menu: ['apimenus'],
  home: ['apihome'],
}

// nitro:pages — кеш HTML страниц (server/plugins/html-cache.ts), имя записи — hex-хеш
const CACHE_BASES = ['nitro:routes', 'nitro:handlers', 'nitro:pages']

function isValidSecret(received: string, expected: string) {
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default defineEventHandler(async (event) => {
  const { revalidateSecret } = useRuntimeConfig()
  const received = getHeader(event, 'x-branded-secret') || ''

  if (!revalidateSecret || !isValidSecret(received, String(revalidateSecret))) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const body = await readBody(event)
  const scopes: string[] = Array.isArray(body?.scopes)
    ? body.scopes.filter((scope: unknown) => typeof scope === 'string' && scope in SCOPE_PREFIXES)
    : []

  if (!scopes.length) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_scopes' })
  }

  const prefixes = scopes.flatMap(scope => SCOPE_PREFIXES[scope] || [])
  const storage = useStorage('cache')
  const apiKeys: string[] = []
  const htmlKeys: string[] = []

  for (const base of CACHE_BASES) {
    for (const key of await storage.getKeys(base)) {
      const name = key.split(':').pop() || ''
      const pathPart = name.split('.')[0] || ''

      if (!pathPart.startsWith('api')) {
        // HTML страниц содержит всё сразу (меню, цены, SEO): сбрасывается при любом scope.
        htmlKeys.push(key)
      } else if (prefixes.some(prefix => pathPart.startsWith(prefix))) {
        apiKeys.push(key)
      }
    }
  }

  // Сначала ответы API, потом HTML: иначе страница, отрисованная в промежутке,
  // снова попала бы в кеш со старыми данными из ещё не удалённого ответа API.
  await Promise.all(apiKeys.map(key => storage.removeItem(key)))
  await Promise.all(htmlKeys.map(key => storage.removeItem(key)))

  return { ok: true, scopes, removed: apiKeys.length + htmlKeys.length }
})

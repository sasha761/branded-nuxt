/**
 * Постоянные редиректы со старых URL WordPress и на канонический вид URL (server/middleware/01.redirects.ts).
 * Чистая функция без h3: путь и query → адрес для 301 или null. Покрыта тестом test/unit/redirects.test.ts.
 */
const SKIP_PREFIXES = ['/api/', '/_', '/@', '/node_modules/']

// Личного кабинета WooCommerce на фронте нет: кабинет и его подстраницы (orders, lost-password…) → главная языка
const ACCOUNT_PREFIXES: [string, string][] = [
  ['/my-account', '/'],
  ['/uk/my-account', '/uk/'],
  ['/uk/mij-akaunt', '/uk/'],
]

export function redirectTarget(path: string, search: string): string | null {
  if (SKIP_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return null
  }

  // Файлы (robots.txt, sitemap, картинки) не трогаем.
  if (/\.[a-z0-9]{2,5}$/i.test(path)) {
    return null
  }

  const account = ACCOUNT_PREFIXES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  if (account) {
    return account[1]
  }

  const params = new URLSearchParams(search)

  // Поиск WordPress: /?s=… и /uk/?s=…
  if (/^\/(uk\/?)?$/.test(path) && params.has('s')) {
    const prefix = path.startsWith('/uk') ? '/uk' : ''
    return `${prefix}/search/?${new URLSearchParams({ s: params.get('s') || '' })}`
  }

  let target = path.replace(/\/{2,}/g, '/')

  // Пагинация WordPress: /…/page/2/ → /…/?page=2, /page/1/ → без номера
  const pagination = target.match(/^(.*?)\/page\/(\d+)\/?$/)
  if (pagination) {
    target = `${pagination[1]}/`
    const page = Number(pagination[2])

    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
  }

  if (!target.endsWith('/')) {
    target += '/'
  }

  if (target === path && !pagination) {
    return null
  }

  const query = params.toString()
  return target + (query ? `?${query}` : '')
}

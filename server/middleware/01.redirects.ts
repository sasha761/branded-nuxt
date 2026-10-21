/**
 * Постоянные редиректы со старых URL WordPress и на канонический вид URL.
 * Редиректы, для которых нужно знать объект (слаг другого языка, лишние родители, /shop/),
 * делают страницы по полю `redirect` из api/route.
 */
const SKIP_PREFIXES = ['/api/', '/_', '/@', '/node_modules/']

// Личного кабинета WooCommerce на фронте нет: кабинет и его подстраницы (orders, lost-password…) → главная языка
const ACCOUNT_PREFIXES: [string, string][] = [
  ['/my-account', '/'],
  ['/uk/my-account', '/uk/'],
  ['/uk/mij-akaunt', '/uk/'],
]

export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    return
  }

  const url = getRequestURL(event)
  const path = url.pathname

  if (SKIP_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return
  }

  // Файлы (robots.txt, sitemap, картинки) не трогаем.
  if (/\.[a-z0-9]{2,5}$/i.test(path)) {
    return
  }

  const account = ACCOUNT_PREFIXES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  if (account) {
    return sendRedirect(event, account[1], 301)
  }

  // Поиск WordPress: /?s=… и /uk/?s=…
  if (/^\/(uk\/?)?$/.test(path) && url.searchParams.has('s')) {
    const prefix = path.startsWith('/uk') ? '/uk' : ''
    const search = new URLSearchParams({ s: url.searchParams.get('s') || '' })
    return sendRedirect(event, `${prefix}/search/?${search}`, 301)
  }

  let target = path.replace(/\/{2,}/g, '/')
  const search = new URLSearchParams(url.search)

  // Пагинация WordPress: /…/page/2/ → /…/?page=2, /page/1/ → без номера
  const pagination = target.match(/^(.*?)\/page\/(\d+)\/?$/)
  if (pagination) {
    target = `${pagination[1]}/`
    const page = Number(pagination[2])

    if (page > 1) {
      search.set('page', String(page))
    } else {
      search.delete('page')
    }
  }

  if (!target.endsWith('/')) {
    target += '/'
  }

  if (target === path && !pagination) {
    return
  }

  const query = search.toString()
  return sendRedirect(event, target + (query ? `?${query}` : ''), 301)
})

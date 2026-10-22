/**
 * Параметры каталога, которые понимает WP (rest_api_catalog_parse_filters и get_products):
 * сортировка, страница, поиск и атрибуты WooCommerce. Остальное (utm_*, gclid, fbclid, srsltid …)
 * на выдачу не влияет, но попадало бы в ключ кеша Nitro: у каждого клика по рекламе свой gclid.
 * Новый атрибут WooCommerce добавить сюда, иначе фильтр по нему работает только как filter_<атрибут>.
 */
const ARCHIVE_PARAMS = new Set(['orderby', 'page', 's', 'brand', 'color', 'size', 'sezon'])

export function isArchiveParam(key: string) {
  // color[]=a&color[]=b — массив в PHP, WP принимает и так
  const name = key.endsWith('[]') ? key.slice(0, -2) : key
  return ARCHIVE_PARAMS.has(name) || name.startsWith('filter_')
}

/**
 * Путь архива с query только из параметров каталога, ключи по алфавиту.
 * Одна выдача — один ключ кеша и один запрос к WP, сколько бы меток ни было в адресе страницы.
 */
export function normalizeArchiveUrl(url: string) {
  const withoutHash = url.split('#')[0] || ''
  const queryStart = withoutHash.indexOf('?')

  if (queryStart === -1) {
    return withoutHash
  }

  const params = [...new URLSearchParams(withoutHash.slice(queryStart + 1))]
    .filter(([key, value]) => value !== '' && isArchiveParam(key))
    // sort стабильный: color=a&color=b сохраняют порядок
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  const path = withoutHash.slice(0, queryStart)
  return params.length ? `${path}?${new URLSearchParams(params)}` : path
}

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const url = normalizeArchiveUrl(wpString(query.url, 2000))

  if (!url.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_url' })
  }

  // Архив, фильтры, сортировка и страница берутся из url. Ключ кеша Nitro строится по запросу
  // к этому маршруту, поэтому метки рекламы убирает и LArchivePage; здесь — чтобы WP их не получал.
  return wpFetch('archive/get_products', {
    params: {
      url,
      lang: wpLang(query.lang),
      page: wpInt(query.page),
      on_sale: query.on_sale ? 1 : undefined,
    },
  })
})

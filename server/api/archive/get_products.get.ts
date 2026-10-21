export default defineEventHandler((event) => {
  const query = getQuery(event)
  const url = wpString(query.url, 2000)

  if (!url.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_url' })
  }

  // Архив, фильтры, сортировка и страница берутся из url.
  return wpFetch('archive/get_products', {
    params: {
      url,
      lang: wpLang(query.lang),
      page: wpInt(query.page),
      on_sale: query.on_sale ? 1 : undefined,
    },
  })
})

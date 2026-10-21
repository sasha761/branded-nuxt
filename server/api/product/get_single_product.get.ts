export default defineEventHandler((event) => {
  const query = getQuery(event)
  const url = wpString(query.url, 300)

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_url' })
  }

  return wpFetch('product/get_single_product', {
    params: { url, lang: wpLang(query.lang) },
  })
})

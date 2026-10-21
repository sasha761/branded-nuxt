export default defineEventHandler((event) => {
  const query = getQuery(event)
  const url = wpString(query.url, 500)

  if (!url.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_url' })
  }

  return wpFetch('page/page', { params: { url, lang: wpLang(query.lang) } })
})

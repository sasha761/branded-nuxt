// Что лежит по пути фронта: тип, canonical, переводы, SEO и крошки Yoast (docs/wp-api.md, раздел 3).
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const path = wpString(query.path)

  if (!path.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_path' })
  }

  // Язык WP берёт из префикса пути.
  return wpFetch('route', { params: { path } })
})

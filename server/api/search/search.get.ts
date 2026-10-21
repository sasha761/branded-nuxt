export default defineEventHandler((event) => {
  const query = getQuery(event)

  return wpFetch('search/search', {
    params: {
      query: wpString(query.query, 100).trim(),
      lang: wpLang(query.lang),
      page: wpInt(query.page),
      posts_per_page: wpInt(query.posts_per_page, 1, 48),
    },
  })
})
